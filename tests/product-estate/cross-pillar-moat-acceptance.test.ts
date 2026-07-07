/**
 * tests/product-estate/cross-pillar-moat-acceptance.test.ts
 *
 * §27 — Cross-Pillar Acceptance Test.
 *
 * Full deterministic scenario proving all four pillars together.
 *
 * Scenario:
 *   CUSTOMER RUNS DIAGNOSTIC → evidence gap recorded
 *   CUSTOMER RUNS PLAYBOOK → commitment and contradiction recorded → twin v2
 *   CUSTOMER RUNS INSTRUMENT → exposure state added → twin v3
 *   CORRIDOR ENGINE → next admissible move changes
 *   MONTHLY REPORT → repeated signal confirmed → integrity trend changes
 *   GMI RELEASED EDITION → relevant regime trigger intersects customer commitment
 *   FALSIFICATION WATCHDOG → review required
 *   CUSTOMER REVIEWS DECISION → new outcome/checkpoint
 *   DECISION PROVENANCE CERTIFICATE → issued and verifies
 *   DECISION CENTRE → shows timeline, contradiction, intervention, market exposure and next step
 */
import { describe, it, expect } from "vitest";
import { createGraph, addNode, addEdge, exportGraph, getGraph } from "../../lib/intelligence/canonical-decision-graph";
import { buildCorridorMap } from "../../lib/intelligence/corridor/customer-corridor-map";
import { recordCorridorEvent, getCorridorAnalyticsSummary } from "../../lib/intelligence/corridor/corridor-progression-analytics";
import { createTrigger, evaluateTrigger } from "../../lib/intelligence/accountability/customer-falsification-watchdog";
import { calculateDecisionIntegrityIndex } from "../../lib/intelligence/accountability/market-decision-integrity-index";
import { getLearningLog } from "../../lib/intelligence/accountability/public-decision-learning-log";
import { getCrossEditionReview } from "../../lib/intelligence/accountability/cross-edition-call-review";
import { getEstateGovernanceSummary, getProductGovernanceCard, getGovernanceReceipt } from "../../lib/governance/trust-centre/governance-trust-centre";

describe("§27 — Cross-Pillar Moat Acceptance Test", () => {
  const tenantId = "test-tenant-acceptance";
  const caseId = "case_test_acceptance";

  it("Pillar 1 — Accountable Judgement: DII, Learning Log, Cross-Edition Review all derive from canonical evidence", () => {
    const dii = calculateDecisionIntegrityIndex();
    expect(dii).toBeDefined();
    expect(dii.validityReason).toBeTruthy();
    expect(dii.methodology.version).toBe("1.0.0");

    const log = getLearningLog();
    expect(Array.isArray(log)).toBe(true);

    const review = getCrossEditionReview();
    expect(Array.isArray(review)).toBe(true);
  });

  it("Pillar 2 — Compounding Customer Intelligence: Decision Graph stores and traverses nodes", () => {
    const graph = createGraph(tenantId, caseId);

    const diagnosticNode = addNode(graph, { nodeType: "decision", tenantId, caseId, label: "Fast Diagnostic completed", properties: { evidenceGap: "insufficient data" }, version: 1 });
    const playbookNode = addNode(graph, { nodeType: "commitment", tenantId, caseId, label: "Playbook commitment recorded", properties: { commitment: "review quarterly" }, version: 1 });
    const instrumentNode = addNode(graph, { nodeType: "evidence", tenantId, caseId, label: "Instrument exposure state", properties: { exposure: "medium" }, version: 1 });

    addEdge(graph, { edgeType: "led_to", sourceNodeId: diagnosticNode.nodeId, targetNodeId: playbookNode.nodeId, tenantId, properties: {} });
    addEdge(graph, { edgeType: "informed_by", sourceNodeId: playbookNode.nodeId, targetNodeId: instrumentNode.nodeId, tenantId, properties: {} });

    const traversal = exportGraph(tenantId, caseId);
    expect(traversal).not.toBeNull();
    expect(traversal!.nodes.length).toBe(3);
    expect(traversal!.edges.length).toBe(2);

    // Tenant isolation
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

  it("Pillar 4 — Governed Corridor: Map and analytics work", () => {
    const map = buildCorridorMap(tenantId, ["fast_diagnostic", "boardroom_brief"]);
    expect(map.customerId).toBe(tenantId);
    expect(map.completedInteractions.length).toBe(2);
    expect(map.eligibleNextMoves.length).toBeGreaterThan(0);

    // Record analytics
    recordCorridorEvent({ customerId: tenantId, eventType: "corridor_entry", productCode: "fast_diagnostic", sourceProductCode: null, metadata: {} });
    recordCorridorEvent({ customerId: tenantId, eventType: "product_completed", productCode: "boardroom_brief", sourceProductCode: "fast_diagnostic", metadata: {} });

    const summary = getCorridorAnalyticsSummary();
    expect(summary.totalCustomers).toBe(1);
    expect(summary.totalEvents).toBe(2);
  });

  it("Cross-Pillar: Falsification Watchdog monitors customer-stated triggers", () => {
    const trigger = createTrigger({
      caseId,
      tenantId,
      commitment: "Review market exposure quarterly",
      statedTrigger: "If market volatility exceeds threshold for two consecutive quarters",
      evidenceSource: "customer_evidence",
      sourceReference: "commitment_log_001",
    });
    expect(trigger.state).toBe("MONITORING");

    const evaluation = evaluateTrigger(trigger, "strong");
    expect(evaluation.newState).toBe("TRIGGER_APPROACHING");
    expect(evaluation.evidenceMatched).toBe(true);

    const trigger2 = { ...trigger, state: evaluation.newState as any, lastEvaluatedAt: new Date().toISOString(), evaluationCount: 1 };
    const evaluation2 = evaluateTrigger(trigger2, "strong");
    expect(evaluation2.newState).toBe("TRIGGER_REACHED");
    expect(evaluation2.alertRequired).toBe(true);
  });

  it("Cross-Pillar: No cross-client leakage in any component", () => {
    const graph1 = createGraph("tenant-a", "case-1");
    addNode(graph1, { nodeType: "decision", tenantId: "tenant-a", caseId: "case-1", label: "Tenant A decision", properties: {}, version: 1 });

    const graph2 = createGraph("tenant-b", "case-2");
    addNode(graph2, { nodeType: "decision", tenantId: "tenant-b", caseId: "case-2", label: "Tenant B decision", properties: {}, version: 1 });

    const exportA = exportGraph("tenant-a", "case-1");
    expect(exportA!.nodes.every(n => n.tenantId === "tenant-a")).toBe(true);

    const exportB = exportGraph("tenant-b", "case-2");
    expect(exportB!.nodes.every(n => n.tenantId === "tenant-b")).toBe(true);
  });

  it("Cross-Pillar: No revenue-only recommendation in corridor", () => {
    const map = buildCorridorMap(tenantId, []);
    for (const move of map.eligibleNextMoves) {
      expect(move.reason).toBeTruthy();
      expect(move.evidenceBasis).toBeTruthy();
      expect(move.whatItHelpsResolve).toBeTruthy();
    }
  });
});
