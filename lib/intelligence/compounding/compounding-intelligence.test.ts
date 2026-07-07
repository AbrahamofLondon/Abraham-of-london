/**
 * lib/intelligence/compounding/compounding-intelligence.test.ts
 *
 * Proves the compounding loops (cross-moat brief, next-move, outcome loop,
 * integrity trend) and the §29 end-to-end compounding demonstration — a real
 * twin built through the spine, feeding each loop, with state-sensitive change.
 */

import { describe, it, expect } from "vitest";
import {
  createInMemoryInteractionStore,
  recordProductInteraction,
  getStrategicTwin,
  type SpineDeps,
} from "@/lib/intelligence/interaction-spine/product-interaction-spine";
import {
  buildCrossMoatBrief,
  crossMoatBriefStale,
  deriveNextAdmissibleMove,
  recordOutcome,
  computeDecisionIntegrity,
  CompoundingError,
  type GmiEditionView,
  type NextMoveContext,
} from "./compounding-intelligence";

const CANON = new Set(["execution_integrity_protocol", "alignment_audit_playbook", "drift_detection_framework", "reporting_monthly", "execution_risk_index"]);
const deps = (): SpineDeps => ({ store: createInMemoryInteractionStore(), isCanonicalProduct: (p) => CANON.has(p), now: () => "2026-07-07T00:00:00Z" });

function releasedEdition(hash = "hashA"): GmiEditionView {
  return {
    editionId: "GMI-Q1-2026", editionVersion: "2.0.0", artifactHash: hash, lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
    regimeThesis: "Fragmentation under shock", dii: 74, sourceConfidence: "MEDIUM",
    scoredCalls: [{ callId: "CALL-007", statement: "China-US supply chain structurally impaired", score: 4, status: "confirmed", topicKeys: ["supply", "dependency", "china"] }],
    falsificationTriggers: [{ variable: "tariff_effective_rate", threshold: "<50% sustained", consequence: "fragmentation thesis weakens", topicKeys: ["tariff", "supply", "dependency"] }],
  };
}
function draftEdition(): GmiEditionView {
  return { ...releasedEdition(), editionId: "GMI-Q2-2026", lifecycleState: "DRAFT" };
}

describe("cross-moat brief (OPP-11)", () => {
  const twin = { tenantId: "t", caseId: "c", version: 3, updatedAt: "x", contradictions: { supply_dependency_unhedged: { key: "supply_dependency_unhedged", count: 2, firstSeen: "a", lastSeen: "b", status: "active" as const } }, evidenceGaps: { supplier_tariff_exposure: { key: "supplier_tariff_exposure", count: 1, firstSeen: "a", lastSeen: "a", status: "active" as const } }, commitments: { dependency_on_single_supplier: { key: "dependency_on_single_supplier", statement: "reduce single-supplier dependency", owner: "COO", deadline: "2026-09-30", recordedAt: "a" } }, signals: {}, interactionLineage: ["i1"] };

  it("binds edition identity + hash + twin version and stays exposure-only", () => {
    const b = buildCrossMoatBrief(twin, releasedEdition());
    expect(b.exposureOnly).toBe(true);
    expect(b.editionId).toBe("GMI-Q1-2026");
    expect(b.artifactHash).toBe("hashA");
    expect(b.twinVersion).toBe(3);
    expect(b.claimBoundary.toLowerCase()).toContain("not legal");
    expect(b.intersections.length).toBeGreaterThan(0); // commitment exposed to tariff trigger + contradiction vs call
  });
  it("refuses a DRAFT edition as released customer intelligence (GMI Q2 guard)", () => {
    expect(() => buildCrossMoatBrief(twin, draftEdition())).toThrow(CompoundingError);
    expect(() => buildCrossMoatBrief(twin, draftEdition())).toThrow(/DRAFT_EDITION_NOT_RELEASABLE/);
  });
  it("changed artifact hash invalidates a stale brief", () => {
    const b = buildCrossMoatBrief(twin, releasedEdition("hashA"));
    expect(crossMoatBriefStale(b, releasedEdition("hashB"))).toBe(true);
    expect(crossMoatBriefStale(b, releasedEdition("hashA"))).toBe(false);
  });
  it("surfaces uncertainty from evidence gaps + non-high source confidence (no fabricated certainty)", () => {
    const b = buildCrossMoatBrief(twin, releasedEdition());
    expect(b.uncertainty.length).toBeGreaterThan(0);
  });
});

describe("governed next-admissible-move (OPP-13)", () => {
  const base = (over: Partial<NextMoveContext> = {}): NextMoveContext => ({
    tier: "paid", priorProducts: [],
    candidates: [
      { code: "fast_diagnostic", commercialMode: "free", addressesTopics: ["evidence"], eligibleForTier: [], isEvidenceGathering: true },
      { code: "execution_risk_index", commercialMode: "paid_checkout", addressesTopics: ["execution", "owner", "dependency"], eligibleForTier: [] },
      { code: "enterprise", commercialMode: "contracted", addressesTopics: ["execution"], eligibleForTier: [] },
      { code: "diagnostic_report_basic", commercialMode: "retired", addressesTopics: ["execution"], eligibleForTier: [] },
    ],
    ...over,
  });
  const twinWith = (o: { gaps?: string[]; contradiction?: { key: string; sev: any } }) => ({
    tenantId: "t", caseId: "c", version: 1, updatedAt: "x",
    contradictions: o.contradiction ? { [o.contradiction.key]: { key: o.contradiction.key, count: 1, firstSeen: "a", lastSeen: "a", status: "active" as const, lastSeverity: o.contradiction.sev } } : {},
    evidenceGaps: Object.fromEntries((o.gaps ?? []).map((g) => [g, { key: g, count: 1, firstSeen: "a", lastSeen: "a", status: "active" as const }])),
    commitments: {}, signals: {}, interactionLineage: [],
  });

  it("insufficient evidence → evidence-gathering move, never an upsell", () => {
    const m = deriveNextAdmissibleMove(twinWith({ gaps: ["supplier_exposure"] }), base());
    expect(m.action).toBe("gather_evidence");
    expect(m.productCode).toBe("fast_diagnostic");
    expect(m.revenueMaximising).toBe(false);
  });
  it("severe contradiction → matched admissible product, explainable", () => {
    const m = deriveNextAdmissibleMove(twinWith({ contradiction: { key: "execution_owner_missing", sev: "HIGH" } }), base());
    expect(m.action).toBe("recommend_product");
    expect(m.productCode).toBe("execution_risk_index");
    expect(m.recommendedBecause.length).toBeGreaterThan(0);
  });
  it("controlled/contracted product routes to controlled request, not checkout", () => {
    const ctx = base({ candidates: [{ code: "enterprise", commercialMode: "contracted", addressesTopics: ["execution"], eligibleForTier: [] }] });
    const m = deriveNextAdmissibleMove(twinWith({ contradiction: { key: "execution_scale", sev: "CRITICAL" } }), ctx);
    expect(m.route).toBe("controlled_request");
  });
  it("retired product is never recommended", () => {
    const ctx = base({ candidates: [{ code: "diagnostic_report_basic", commercialMode: "retired", addressesTopics: ["execution"], eligibleForTier: [] }] });
    const m = deriveNextAdmissibleMove(twinWith({ contradiction: { key: "execution_gap", sev: "HIGH" } }), ctx);
    expect(m.productCode).toBeNull();
  });
  it("already-completed product is not redundantly recommended", () => {
    const m = deriveNextAdmissibleMove(twinWith({ contradiction: { key: "execution_owner", sev: "HIGH" } }), base({ priorProducts: ["execution_risk_index"] }));
    expect(m.productCode).not.toBe("execution_risk_index");
  });
});

describe("outcome loop (OPP-15)", () => {
  it("high-stakes outcome cannot close on weak proxy evidence", () => {
    const r = recordOutcome({ commitmentKey: "k", result: "success", evidenceClass: "WEAK_PROXY", detail: "calendar", highStakes: true });
    expect(r.accepted).toBe(false);
  });
  it("normal outcome accepted and reasoned", () => {
    const r = recordOutcome({ commitmentKey: "k", result: "success", evidenceClass: "OPERATOR_VERIFIED", detail: "confirmed" });
    expect(r.accepted).toBe(true);
  });
});

describe("decision-integrity trend (OPP-12)", () => {
  const twin = { tenantId: "t", caseId: "c", version: 2, updatedAt: "x", contradictions: {}, evidenceGaps: {}, commitments: { k1: { key: "k1", statement: "x", owner: "COO", deadline: "2026-09-01", recordedAt: "a" }, k2: { key: "k2", statement: "y", owner: null, deadline: null, recordedAt: "a" } }, signals: {}, interactionLineage: [] };
  it("is evidence-backed and never fabricates a score without evidence", () => {
    const s = computeDecisionIntegrity(twin, []);
    expect(s.methodologyVersion).toBe("1.0.0");
    const owner = s.dimensions.find((d) => d.dimension === "owner_clarity")!;
    expect(owner.score).toBe(50); // 1 of 2 owned
    expect(owner.evidence).toContain("1/2");
    const outcome = s.dimensions.find((d) => d.dimension === "outcome_capture")!;
    expect(outcome.score).toBe(0); // no outcomes captured yet
  });
  it("outcome capture improves the relevant dimension only", () => {
    const withOutcome = computeDecisionIntegrity(twin, [recordOutcome({ commitmentKey: "k1", result: "success", evidenceClass: "OPERATOR_VERIFIED", detail: "x" })]);
    expect(withOutcome.dimensions.find((d) => d.dimension === "outcome_capture")!.score).toBe(50);
    expect(withOutcome.dimensions.find((d) => d.dimension === "owner_clarity")!.score).toBe(50); // unchanged
  });
});

// ── §29 END-TO-END COMPOUNDING DEMONSTRATION ─────────────────────────────────
describe("§29 end-to-end compounding demonstration", () => {
  it("twin compounds across products; next-move + cross-moat + outcome + integrity all move with state", () => {
    const d = deps();
    const tenant = "acme", caseId = "acme-case-1";
    const base = { tenantId: tenant, caseId, actorType: "organisation" as const, provenance: { sourceSurface: "s" } };

    // Interaction 1 — playbook: commitment (no deadline) + evidence gap
    const r1 = recordProductInteraction(d, { ...base, productCode: "execution_integrity_protocol", interactionType: "playbook_run", idempotencyKey: "e1", structuredResult: { summary: "run1", commitments: [{ key: "reduce_single_supplier_dependency", statement: "reduce dependency", owner: "COO" }], evidenceGaps: [{ key: "supplier_tariff_exposure" }] } });
    expect(r1.twin.version).toBe(1);
    const move1 = deriveNextAdmissibleMove(r1.twin, { tier: "paid", priorProducts: [], candidates: [{ code: "fast_diagnostic", commercialMode: "free", addressesTopics: ["evidence"], eligibleForTier: [], isEvidenceGathering: true }] });
    expect(move1.action).toBe("gather_evidence"); // evidence gap dominates

    // Interaction 2 — instrument: introduces a HIGH contradiction
    const r2 = recordProductInteraction(d, { ...base, productCode: "execution_risk_index", interactionType: "instrument_run", idempotencyKey: "e2", structuredResult: { summary: "run2", contradictions: [{ key: "execution_owner_and_dependency", severity: "HIGH" }] } });
    expect(r2.twin.version).toBe(2);
    const move2 = deriveNextAdmissibleMove(r2.twin, { tier: "paid", priorProducts: ["execution_risk_index"], candidates: [{ code: "enterprise", commercialMode: "contracted", addressesTopics: ["execution", "dependency", "owner"], eligibleForTier: [] }] });
    expect(move2.route).toBe("controlled_request"); // next move CHANGED with state

    // Interaction 3 — reporting cycle: repeats the signal
    const r3 = recordProductInteraction(d, { ...base, productCode: "reporting_monthly", interactionType: "reporting_cycle", idempotencyKey: "e3", structuredResult: { summary: "cycle", signals: [{ key: "supplier_delay", value: 12, trend: "worsening" }], contradictions: [{ key: "execution_owner_and_dependency", severity: "HIGH" }] } });
    expect(r3.twin.version).toBe(3);
    expect(r3.twin.contradictions["execution_owner_and_dependency"]!.count).toBe(2); // repeated → compounded

    // Cross-moat: exposure of the customer's dependency commitment to the GMI tariff trigger
    const brief = buildCrossMoatBrief(getStrategicTwin(d, tenant, caseId)!, releasedEdition());
    expect(brief.intersections.some((i) => i.kind === "applicable_trigger")).toBe(true);

    // Outcome → integrity moves
    const before = computeDecisionIntegrity(r3.twin, []);
    const after = computeDecisionIntegrity(r3.twin, [recordOutcome({ commitmentKey: "reduce_single_supplier_dependency", result: "partial", evidenceClass: "OPERATOR_VERIFIED", detail: "second node opened" })]);
    expect(after.dimensions.find((x) => x.dimension === "outcome_capture")!.score!).toBeGreaterThan(before.dimensions.find((x) => x.dimension === "outcome_capture")!.score!);
  });
});
