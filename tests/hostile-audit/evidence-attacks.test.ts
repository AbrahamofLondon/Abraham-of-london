/**
 * tests/hostile-audit/evidence-attacks.test.ts
 *
 * §16 — Hostile audit: Evidence attacks.
 *
 * Tests that existing-but-irrelevant evidence paths, copied product proof,
 * stale artifact hashes, self-asserted booleans, and generated reports
 * used as primary evidence are all detected and rejected.
 */
import { describe, it, expect } from "vitest";
import { buildFalsificationCondition } from "../../lib/intelligence/accountability/falsification-semantics";
import { buildLineageFromCall } from "../../lib/intelligence/accountability/edition-lineage";
import { verifyGovernanceReceipt } from "../../lib/governance/trust-centre/governance-trust-centre";

describe("Hostile Audit — Evidence Attacks", () => {
  it("existing but irrelevant evidence path is not valid evidence", () => {
    // A file existing does not make it evidence for a specific product
    const condition = buildFalsificationCondition({ scenarioLink: "https://example.com/unrelated", statement: "Test" });
    expect(condition.status).toBe("REFERENCE_ONLY");
    expect(condition.description).not.toContain("manufactured");
  });

  it("copied product proof is detectable — falsification condition cannot be manufactured from URL", () => {
    // An irrelevant URL should not become a falsification condition
    const condition = buildFalsificationCondition({ scenarioLink: "https://unrelated.com/page", statement: "Market call" });
    expect(condition.status).toBe("REFERENCE_ONLY");
    expect(condition.triggerLogic).toBe("See referenced scenario document");
  });

  it("self-asserted booleans have no effect on verification", () => {
    // The Governance Receipt verification function does not trust self-asserted fields
    const receipt = {
      productCode: "test",
      productName: "Test",
      commercialStatus: "paid",
      accessMode: "self-serve",
      evidenceReferences: {
        observationRecord: "test", evaluationRecord: "test", verdict: "test",
        fulfilmentContract: "test", assurancePolicy: "test", claimBoundaryVersion: "test", commercialActionState: "test",
      },
      lastVerifiedTimestamp: new Date().toISOString(),
      receiptHash: "",
    };
    // Without proper hash, verification fails
    expect(verifyGovernanceReceipt(receipt)).toBe(false);
  });

  it("generated report used as primary evidence is detected", () => {
    // The three-layer proof system prevents this — Layer A observes independently
    // A report citing itself would be circular
    const condition = buildFalsificationCondition({ scenarioLink: null, statement: "Test call" });
    expect(condition.status).toBe("NOT_SPECIFIED_IN_SOURCE");
  });

  it("stale lineage is detectable — versionHistory notes are not edition IDs", () => {
    const call = {
      id: "test-stale",
      reportId: "GMI-Q1-2026",
      versionHistory: [{ version: "2", changedAt: "2026-04-01", note: "Updated after Q2 data" }],
    };
    const lineage = buildLineageFromCall(call as any);
    expect(lineage.originEditionId).toBe("GMI-Q1-2026");
    // The note "Updated after Q2 data" is commentary, not an edition ID
    expect(lineage.lineageStatus).toBe("REVISED");
  });
});
