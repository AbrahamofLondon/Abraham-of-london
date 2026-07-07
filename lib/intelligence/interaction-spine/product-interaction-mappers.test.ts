/**
 * lib/intelligence/interaction-spine/product-interaction-mappers.test.ts
 *
 * Proves OPP-05/06: product typed outputs map into the canonical spine without
 * flattening, unmapped products fail closed, and — the real integration — a live
 * playbook engine result flows engine → mapper → spine → compounding twin.
 */

import { describe, it, expect } from "vitest";
import {
  mapProductResultToInteraction,
  isMappedProduct,
  MapperError,
} from "./product-interaction-mappers";
import {
  createInMemoryInteractionStore,
  recordProductInteraction,
  getStrategicTwin,
  type SpineDeps,
} from "./product-interaction-spine";
import { runExecutionIntegrityProtocol } from "@/lib/playbooks/execution-integrity-protocol";
import { runAlignmentAuditPlaybook } from "@/lib/playbooks/alignment-audit-playbook";

describe("product interaction mappers (OPP-05/06)", () => {
  it("maps a playbook result to typed canonical dimensions (not flattened prose)", () => {
    const result = runExecutionIntegrityProtocol({
      commitments: [{ id: "c1", statement: "ship node", owner: "COO", status: "complete", blockers: ["vendor hold"] }],
    });
    const mapped = mapProductResultToInteraction("execution_integrity_protocol", result);
    expect(mapped.interactionType).toBe("execution_integrity_run");
    expect(mapped.structuredResult.contradictions!.length).toBeGreaterThan(0); // complete+blocked contradiction preserved
    expect(mapped.structuredResult.signals![0]!.key).toBe("execution_integrity_run_score");
  });

  it("each playbook maps to a distinct interaction type", () => {
    const eip = mapProductResultToInteraction("execution_integrity_protocol", runExecutionIntegrityProtocol({ commitments: [{ id: "a", statement: "x", owner: "o" }] }));
    const aap = mapProductResultToInteraction("alignment_audit_playbook", runAlignmentAuditPlaybook({ statedMandate: "retention and margin", actualIncentives: [{ actor: "Sales", rewardedFor: "raw volume" }] }));
    expect(eip.interactionType).not.toBe(aap.interactionType);
  });

  it("unmapped product fails closed", () => {
    expect(isMappedProduct("boardroom_mode")).toBe(false);
    expect(() => mapProductResultToInteraction("boardroom_mode", {})).toThrow(MapperError);
    expect(() => mapProductResultToInteraction("boardroom_mode", {})).toThrow(/UNMAPPED_PRODUCT/);
  });

  it("INTEGRATION: engine → mapper → spine → compounding twin across two products", () => {
    const d: SpineDeps = { store: createInMemoryInteractionStore(), isCanonicalProduct: (p) => ["execution_integrity_protocol", "alignment_audit_playbook"].includes(p), now: () => "2026-07-07T00:00:00Z" };
    const base = { tenantId: "t", caseId: "c", actorType: "organisation" as const, provenance: { sourceSurface: "s" } };

    // Execution integrity run (complete-but-blocked → contradiction)
    const eip = runExecutionIntegrityProtocol({ commitments: [{ id: "c1", statement: "ship node", owner: "COO", status: "complete", blockers: ["vendor"] }] });
    const m1 = mapProductResultToInteraction("execution_integrity_protocol", eip);
    const r1 = recordProductInteraction(d, { ...base, productCode: "execution_integrity_protocol", idempotencyKey: "e1", ...m1 });
    expect(r1.twin.version).toBe(1);
    expect(Object.keys(r1.twin.contradictions).length).toBeGreaterThan(0);

    // Alignment audit run on the SAME case (mandate contradicted by every incentive → contradiction)
    const aap = runAlignmentAuditPlaybook({ statedMandate: "retention and margin", actualIncentives: [{ actor: "A", rewardedFor: "raw volume" }, { actor: "B", rewardedFor: "speed shipping" }] });
    const m2 = mapProductResultToInteraction("alignment_audit_playbook", aap);
    const r2 = recordProductInteraction(d, { ...base, productCode: "alignment_audit_playbook", idempotencyKey: "a1", ...m2 });
    expect(r2.twin.version).toBe(2); // compounded across two different products on one case
    expect(getStrategicTwin(d, "t", "c")!.interactionLineage).toHaveLength(2);
  });
});
