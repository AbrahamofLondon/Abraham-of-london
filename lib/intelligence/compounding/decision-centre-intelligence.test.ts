/**
 * lib/intelligence/compounding/decision-centre-intelligence.test.ts
 *
 * Proves OPP-14 (twin read model + ownership), OPP-16 (enterprise portfolio: RBAC,
 * no-cross-client, aggregation threshold), OPP-24 (tenant-scoped export). Twins are
 * built through the real spine so the read models operate on genuine state.
 */

import { describe, it, expect } from "vitest";
import {
  createInMemoryInteractionStore,
  recordProductInteraction,
  getStrategicTwin,
  deleteCaseData,
  type SpineDeps,
} from "@/lib/intelligence/interaction-spine/product-interaction-spine";
import { buildTwinSnapshotView, buildEnterprisePortfolio, exportCaseBundle, AccessError } from "./decision-centre-intelligence";

const CANON = new Set(["execution_integrity_protocol", "alignment_audit_playbook"]);
function newDeps(): SpineDeps { return { store: createInMemoryInteractionStore(), isCanonicalProduct: (p) => CANON.has(p), now: () => "2026-07-07T00:00:00Z" }; }
function seed(d: SpineDeps, tenant: string, caseId: string, key: string, idem: string) {
  return recordProductInteraction(d, { tenantId: tenant, caseId, productCode: "execution_integrity_protocol", interactionType: "playbook_run", actorType: "organisation", idempotencyKey: idem, provenance: { sourceSurface: "s" }, structuredResult: { summary: "r", contradictions: [{ key, severity: "HIGH" }], commitments: [{ key: "commit1", statement: "reduce dependency", owner: "COO", deadline: "2026-09-01" }], evidenceGaps: [{ key: "supplier_exposure" }] } });
}

describe("OPP-14 — Decision Centre twin snapshot view", () => {
  it("builds a customer-visible read model with provenance; no raw internal fields", () => {
    const d = newDeps();
    seed(d, "tA", "c1", "supply_dependency", "i1");
    seed(d, "tA", "c1", "supply_dependency", "i2"); // recur
    const view = buildTwinSnapshotView(getStrategicTwin(d, "tA", "c1")!, "tA");
    expect(view.currentCommitments[0]!.owner).toBe("COO");
    expect(view.activeContradictions[0]!.count).toBe(2);
    expect(view.whatTheSystemNoticed.some((n) => n.includes("recurred"))).toBe(true);
    expect(view.provenance.source).toBe("strategic_twin");
    // structural: the view exposes only evidence-backed fields (no chain-of-thought key)
    expect(Object.keys(view)).not.toContain("reasoning");
  });
  it("denies a viewer from another tenant (ownership)", () => {
    const d = newDeps(); seed(d, "tA", "c1", "x", "i1");
    expect(() => buildTwinSnapshotView(getStrategicTwin(d, "tA", "c1")!, "tB")).toThrow(AccessError);
    expect(() => buildTwinSnapshotView(getStrategicTwin(d, "tA", "c1")!, "tB")).toThrow(/OWNERSHIP_DENIED/);
  });
});

describe("OPP-16 — enterprise portfolio aggregation", () => {
  function orgTwins() {
    const d = newDeps();
    seed(d, "org1-caseA", "caseA", "owner_overload", "a1");
    seed(d, "org1-caseB", "caseB", "owner_overload", "b1"); // same contradiction in 2 cases
    seed(d, "org1-caseC", "caseC", "unique_issue", "c1"); // in only 1 case
    seed(d, "outsider", "caseX", "owner_overload", "x1"); // different client — must NOT aggregate
    const twins = [getStrategicTwin(d, "org1-caseA", "caseA")!, getStrategicTwin(d, "org1-caseB", "caseB")!, getStrategicTwin(d, "org1-caseC", "caseC")!, getStrategicTwin(d, "outsider", "caseX")!];
    return { d, twins };
  }
  const orgIds = ["org1-caseA", "org1-caseB", "org1-caseC"];

  it("aggregates clusters across the org, threshold-suppressed, never crossing clients", () => {
    const { twins } = orgTwins();
    const p = buildEnterprisePortfolio(twins, { orgTenantIds: orgIds, role: "org_admin", aggregationThreshold: 2 });
    expect(p.orgCaseCount).toBe(3); // outsider excluded
    const cluster = p.contradictionClusters.find((c) => c.key === "owner_overload")!;
    expect(cluster.affectedCaseCount).toBe(2); // outsider NOT counted
    expect(p.contradictionClusters.some((c) => c.key === "unique_issue")).toBe(false); // suppressed (1 < threshold 2)
    expect(p.suppressedBelowThreshold).toBeGreaterThan(0);
  });
  it("denies an unauthorised role", () => {
    const { twins } = orgTwins();
    expect(() => buildEnterprisePortfolio(twins, { orgTenantIds: orgIds, role: "unauthorised", aggregationThreshold: 2 })).toThrow(/PORTFOLIO_ROLE_DENIED/);
  });
});

describe("OPP-24 — export / deletion governance", () => {
  it("exports tenant-scoped interactions + twin; denies cross-tenant export; deleted data disappears", () => {
    const d = newDeps();
    seed(d, "tA", "c1", "x", "i1");
    const bundle = exportCaseBundle(d.store, "tA", "c1");
    expect(bundle.interactions.length).toBe(1);
    expect(bundle.twin!.caseId).toBe("c1");
    expect(() => exportCaseBundle(d.store, "tB", "c1")).toThrow(/OWNERSHIP_DENIED/);
    deleteCaseData(d, "tA", "c1");
    const after = exportCaseBundle(d.store, "tA", "c1");
    expect(after.interactions).toHaveLength(0);
    expect(after.twin).toBeNull();
  });
});
