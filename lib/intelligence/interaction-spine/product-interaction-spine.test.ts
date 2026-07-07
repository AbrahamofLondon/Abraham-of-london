/**
 * lib/intelligence/interaction-spine/product-interaction-spine.test.ts
 *
 * Proves the canonical interaction spine (OPP-01/02/03): governed record, tenant +
 * case isolation, idempotency/replay, correction/versioning, deletion/retention,
 * and — the central programme proof (brief §33) — that the strategic twin COMPOUNDS
 * across interactions while preserving contradictions and isolating irrelevant signal.
 */

import { describe, it, expect } from "vitest";
import {
  createInMemoryInteractionStore,
  recordProductInteraction,
  getStrategicTwin,
  listCaseInteractions,
  deleteCaseData,
  SpineError,
  type ProductInteractionInput,
  type SpineDeps,
} from "./product-interaction-spine";

const CANON = new Set(["execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework"]);
function deps(overrides: Partial<SpineDeps> = {}): SpineDeps {
  return { store: createInMemoryInteractionStore(), isCanonicalProduct: (p) => CANON.has(p), now: () => "2026-07-07T00:00:00Z", ...overrides };
}
function input(o: Partial<ProductInteractionInput> = {}): ProductInteractionInput {
  return {
    tenantId: "tenantA", caseId: "case1", productCode: "execution_integrity_protocol", interactionType: "playbook_run",
    actorType: "organisation", structuredResult: { summary: "run", contradictions: [{ key: "mandate_without_owner", severity: "HIGH" }] },
    provenance: { sourceSurface: "/playbooks/execution-integrity-protocol/run", sourceRunId: "run1" }, ...o,
  };
}

describe("interaction spine — governed record + fail-closed", () => {
  it("valid record creates an interaction + twin v1 with provenance + schema version", () => {
    const d = deps();
    const r = recordProductInteraction(d, input());
    expect(r.deduplicated).toBe(false);
    expect(r.record.schemaVersion).toBe("1.0.0");
    expect(r.record.provenance.sourceRunId).toBe("run1");
    expect(r.twin.version).toBe(1);
  });
  it("unknown product is rejected (fail-closed)", () => {
    expect(() => recordProductInteraction(deps(), input({ productCode: "not_a_product" }))).toThrow(SpineError);
  });
  it("missing tenant / missing case rejected", () => {
    expect(() => recordProductInteraction(deps(), input({ tenantId: "" }))).toThrow(/MISSING_TENANT/);
    expect(() => recordProductInteraction(deps(), input({ caseId: "" }))).toThrow(/MISSING_CASE/);
  });
  it("withdrawn consent fails closed", () => {
    expect(() => recordProductInteraction(deps(), input({ consentContext: { consentGranted: false } }))).toThrow(/CONSENT_DENIED/);
  });
  it("governance denial fails closed", () => {
    const d = deps({ governanceGate: () => ({ allowed: false, reason: "blocked" }) });
    expect(() => recordProductInteraction(d, input())).toThrow(/GOVERNANCE_DENIED/);
  });
});

describe("interaction spine — idempotency + correction + deletion", () => {
  it("duplicate/replay is idempotent (no new twin version)", () => {
    const d = deps();
    const a = recordProductInteraction(d, input());
    const b = recordProductInteraction(d, input()); // same input → same idempotency key
    expect(b.deduplicated).toBe(true);
    expect(b.record.interactionId).toBe(a.record.interactionId);
    expect(getStrategicTwin(d, "tenantA", "case1")!.version).toBe(1);
  });
  it("correction supersedes prior + preserves history + bumps version", () => {
    const d = deps();
    const a = recordProductInteraction(d, input());
    const c = recordProductInteraction(d, input({ idempotencyKey: "k2", correctsInteractionId: a.record.interactionId, structuredResult: { summary: "corrected", contradictions: [{ key: "mandate_without_owner", severity: "CRITICAL" }] } }));
    expect(c.record.supersedes).toBe(a.record.interactionId);
    const prior = listCaseInteractions(d, "tenantA", "case1").find((x) => x.interactionId === a.record.interactionId)!;
    expect(prior.supersededBy).toBe(c.record.interactionId); // history preserved, not rewritten
    expect(c.twin.version).toBe(2);
  });
  it("deletion removes case data and blocks replay (tombstone)", () => {
    const d = deps();
    recordProductInteraction(d, input());
    deleteCaseData(d, "tenantA", "case1");
    expect(getStrategicTwin(d, "tenantA", "case1")).toBeNull();
    expect(listCaseInteractions(d, "tenantA", "case1")).toHaveLength(0);
    expect(() => recordProductInteraction(d, input())).toThrow(/DELETED_CASE_REPLAY_BLOCKED/);
  });
});

describe("interaction spine — tenant + case isolation", () => {
  it("case bound to tenant A cannot be written or read by tenant B", () => {
    const d = deps();
    recordProductInteraction(d, input({ tenantId: "tenantA", caseId: "shared" }));
    expect(() => recordProductInteraction(d, input({ tenantId: "tenantB", caseId: "shared", idempotencyKey: "kB" }))).toThrow(/CROSS_TENANT_DENIED/);
    expect(getStrategicTwin(d, "tenantB", "shared")).toBeNull();
    expect(listCaseInteractions(d, "tenantB", "shared")).toHaveLength(0);
  });
  it("correction cannot cross cases", () => {
    const d = deps();
    const a = recordProductInteraction(d, input({ caseId: "case1" }));
    expect(() => recordProductInteraction(d, input({ caseId: "case2", idempotencyKey: "k2", correctsInteractionId: a.record.interactionId }))).toThrow(/CROSS_CASE_DENIED/);
  });
  it("tenant A cannot delete tenant B's case", () => {
    const d = deps();
    recordProductInteraction(d, input({ tenantId: "tenantB", caseId: "bCase" }));
    expect(() => deleteCaseData(d, "tenantA", "bCase")).toThrow(/CROSS_TENANT_DENIED/);
  });
});

describe("interaction spine — COMPOUNDING PROOF (central)", () => {
  it("three runs evolve the twin v1→v2→v3; repeated signal grows; contradictions preserved; irrelevant signal isolated", () => {
    const d = deps();
    // Run 1: contradiction X + evidence gap G
    const r1 = recordProductInteraction(d, input({ idempotencyKey: "r1", structuredResult: { summary: "run1", contradictions: [{ key: "X", severity: "HIGH" }], evidenceGaps: [{ key: "G" }], signals: [{ key: "delay", value: 2, trend: "worsening" }] } }));
    expect(r1.twin.version).toBe(1);

    // Run 2: repeats contradiction X + an unrelated signal only
    const r2 = recordProductInteraction(d, input({ idempotencyKey: "r2", structuredResult: { summary: "run2", contradictions: [{ key: "X", severity: "HIGH" }], signals: [{ key: "delay", value: 6, trend: "worsening" }] } }));
    expect(r2.twin.version).toBe(2);
    expect(r2.twin.contradictions["X"]!.count).toBe(2); // repeated → count grows
    expect(r2.twin.signals["delay"]!.count).toBe(2);
    expect(r2.twin.evidenceGaps["G"]!.count).toBe(1); // unrelated dim NOT mutated by run2

    // Run 3: introduces a NEW contradiction Y
    const r3 = recordProductInteraction(d, input({ idempotencyKey: "r3", structuredResult: { summary: "run3", contradictions: [{ key: "Y", severity: "CRITICAL" }] } }));
    expect(r3.twin.version).toBe(3);
    expect(r3.twin.contradictions["Y"]!.count).toBe(1); // new
    expect(r3.twin.contradictions["X"]!.count).toBe(2); // prior preserved, not overwritten
    expect(r3.twin.contradictions["X"]!.status).toBe("active");
    expect(r3.twin.interactionLineage).toHaveLength(3); // full lineage reconstructable
  });
});
