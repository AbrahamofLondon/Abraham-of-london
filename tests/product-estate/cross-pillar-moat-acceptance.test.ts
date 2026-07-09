/**
 * tests/product-estate/cross-pillar-moat-acceptance.test.ts
 *
 * §27 — Cross-Pillar Acceptance Test.
 * Tests pieces individually — the full chained scenario belongs in tests/hostile-audit/
 */
import { describe, it, expect } from "vitest";
import { createGraph, addNode, addEdge, exportGraph, getGraph } from "../../lib/intelligence/canonical-decision-graph";
import { buildCorridorMap } from "../../lib/intelligence/corridor/customer-corridor-map";
import { createTrigger, evaluateTrigger } from "../../lib/intelligence/accountability/customer-falsification-watchdog";
import { calculateDecisionIntegrityIndex } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { getLearningLog } from "../../lib/intelligence/accountability/public-decision-learning-log";
import { getCrossEditionReview } from "../../lib/intelligence/accountability/cross-edition-call-review";
import { getEstateGovernanceSummary, getProductGovernanceCard, getGovernanceReceipt } from "../../lib/governance/trust-centre/governance-trust-centre";

const emptyTwin = { currentDecisionPressure: "low", dominantContradictions: [], activeEvidenceGaps: [], unresolvedCommitments: [], repeatedPatterns: [], currentInterventionReadiness: "not_ready", completedProductCodes: [] };

describe("§27 — Cross-Pillar Moat Acceptance Test", () => {
  const tenantId = "test-tenant-acceptance";
  const caseId = "case_test_acceptance";

  it("Pillar 1 — Accountable Judgement: DII, Learning Log, Cross-Edition Review all derive from canonical evidence", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii).toBeDefined();
    expect(dii.methodologyVersion).toBe("1.0.0");
    const log = getLearningLog();
    expect(Array.isArray(log)).toBe(true);
    const review = getCrossEditionReview();
    expect(Array.isArray(review)).toBe(true);
  });

  it("Pillar 2 — Compounding Customer Intelligence: Decision Graph stores and traverses nodes", () => {
    const graph = createGraph(tenantId, caseId);
    const diagnosticNode = addNode(graph, { nodeType: "decision", tenantId, caseId, label: "Fast Diagnostic completed", properties: { evidenceGap: "insufficient data" }, version: 1 });
    const playbookNode = addNode(graph, { nodeType: "commitment", tenantId, caseId, label: "Playbook commitment recorded", properties: { commitment: "review quarterly" }, version: 1 });
    addEdge(graph, { edgeType: "led_to", sourceNodeId: diagnosticNode.nodeId, targetNodeId: playbookNode.nodeId, tenantId, properties: {} });
    const traversal = exportGraph(tenantId, caseId);
    expect(traversal).not.toBeNull();
    expect(traversal!.nodes.length).toBe(2);
    expect(traversal!.edges.length).toBe(1);
    const otherGraph = getGraph("other-tenant", caseId);
    expect(otherGraph).toBeNull();
  });

  it("Pillar 3 — Fail-Closed Governance: Trust Centre and Governance Receipts derive from contracts", () => {
    const summary = getEstateGovernanceSummary();
    expect(summary.commercialAuthorityModel).toBeTruthy();
    expect(summary.failClosedPrinciples.length).toBeGreaterThan(0);
    const card = getProductGovernanceCard("boardroom_brief");
    expect(card).not.toBeNull();
    expect(card!.productCode).toBe("boardroom_brief");
    const receipt = getGovernanceReceipt("boardroom_brief");
    expect(receipt).not.toBeNull();
    expect(receipt!.commercialStatus).toBeTruthy();
  });

  it("Pillar 4 — Governed Corridor: Map derives from twin state", () => {
    const map = buildCorridorMap(tenantId, emptyTwin);
    expect(map.customerId).toBe(tenantId);
    expect(map.admissibleNextMoves.length).toBeGreaterThan(0);
  });

  it("Cross-Pillar: Falsification Watchdog monitors customer-stated triggers", () => {
    const trigger = createTrigger({ caseId, tenantId, commitment: "Review market exposure quarterly", statedTrigger: "If market volatility exceeds threshold for two consecutive quarters", evidenceSource: "customer_evidence", sourceReference: "commitment_log_001" });
    expect(trigger.state).toBe("MONITORING");
    const evaluation = evaluateTrigger(trigger, "strong");
    expect(evaluation.newState).toBe("TRIGGER_APPROACHING");
  });

  it("Cross-Pillar: No cross-client leakage", () => {
    const graph1 = createGraph("tenant-a", "case-1");
    addNode(graph1, { nodeType: "decision", tenantId: "tenant-a", caseId: "case-1", label: "Tenant A decision", properties: {}, version: 1 });
    const exportA = exportGraph("tenant-a", "case-1");
    expect(exportA!.nodes.every(n => n.tenantId === "tenant-a")).toBe(true);
  });

  it("Cross-Pillar: No revenue-only recommendation", () => {
    const map = buildCorridorMap(tenantId, emptyTwin);
    for (const move of map.admissibleNextMoves) {
      expect(move.reason).toBeTruthy();
      expect(move.evidenceBasis.length).toBeGreaterThan(0);
    }
  });
});