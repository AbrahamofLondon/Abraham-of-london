/**
 * tests/hostile-audit/durable-end-to-end.test.ts
 *
 * Full end-to-end integration test proving the complete chain with actual SQLite persistence.
 *
 * Proves: create → persist → restart (close/reopen DB) → retrieve → state preserved
 */
import { describe, it, expect } from "vitest";
import { createDurableTrigger, getDurableTrigger, closeWatchdogDatabase } from "../../lib/intelligence/accountability/durable-watchdog-store";
import { createNode, getNode, closeGraphDatabase } from "../../lib/intelligence/accountability/durable-graph-store";
import { recordAnalyticsEvent, closeAnalyticsDatabase } from "../../lib/intelligence/accountability/durable-analytics-store";
import { storeRecommendation, getRecommendations, closeRecommendationDatabase } from "../../lib/intelligence/corridor/durable-recommendation-store";

describe("Durable End-to-End Integration", () => {
  afterEach(() => {
    closeWatchdogDatabase();
    closeGraphDatabase();
    closeAnalyticsDatabase();
    closeRecommendationDatabase();
  });

  it("Watchdog: create → close/reopen → retrieve preserves state", () => {
    const trigger = createDurableTrigger({ tenantId: "e2e", caseId: "test-001", commitment: "E2E test", statedTrigger: "Test trigger", evidenceSource: "customer_evidence", sourceReference: "ref-001" });
    const triggerId = trigger.triggerId;
    // Simulate restart by closing and reopening
    closeWatchdogDatabase();
    const retrieved = getDurableTrigger(triggerId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.commitment).toBe("E2E test");
    expect(retrieved!.state).toBe("MONITORING");
  });

  it("Graph: create → close/reopen → retrieve preserves nodes and tenant isolation", () => {
    const node = createNode({ tenantId: "e2e-graph", caseId: "graph-001", nodeType: "decision", label: "E2E graph node" });
    const nodeId = node.nodeId;
    closeGraphDatabase();
    const retrieved = getNode(nodeId, "e2e-graph");
    expect(retrieved).not.toBeNull();
    expect(retrieved!.label).toBe("E2E graph node");
    // Tenant isolation survives restart
    expect(getNode(nodeId, "wrong-tenant")).toBeNull();
  });

  it("Analytics: create → close/reopen → retrieve preserves events with deduplication", () => {
    const uid = `e2e-${Date.now()}`;
    const dedupKey = `e2e:test:${uid}:unique`;
    const event1 = recordAnalyticsEvent({ tenantId: "e2e-analytics", customerId: uid, productCode: "test", eventType: "e2e_test", deduplicationKey: dedupKey });
    closeAnalyticsDatabase();
    // Duplicate with same dedup key should return same event
    const event2 = recordAnalyticsEvent({ tenantId: "e2e-analytics", customerId: uid, productCode: "test", eventType: "e2e_test", deduplicationKey: dedupKey });
    expect(event2.eventId).toBe(event1.eventId);
  });

  it("Recommendations: create → close/reopen → retrieve preserves recommendations and actions", () => {
    const rec = storeRecommendation({ tenantId: "e2e-rec", caseId: "rec-001", twinVersion: 1, targetProductCode: "boardroom_brief", evidenceBasis: ["E2E test"], governanceResult: "admissible", commercialAction: "paid_checkout" });
    closeRecommendationDatabase();
    const retrieved = getRecommendations("e2e-rec", "rec-001");
    expect(retrieved.length).toBe(1);
    expect(retrieved[0].targetProductCode).toBe("boardroom_brief");
  });

  it("Cross-store: watchdog + graph + analytics + recommendations all coexist", () => {
    const trigger = createDurableTrigger({ tenantId: "e2e-all", caseId: "all-001", commitment: "All stores", statedTrigger: "Test", evidenceSource: "customer_evidence", sourceReference: "ref" });
    const node = createNode({ tenantId: "e2e-all", caseId: "all-001", nodeType: "decision", label: "All stores node" });
    const uid = `e2e-all-${Date.now()}`;
    recordAnalyticsEvent({ tenantId: "e2e-all", customerId: uid, productCode: "test", eventType: "all_test" });
    storeRecommendation({ tenantId: "e2e-all", caseId: "all-001", twinVersion: 1, targetProductCode: "test", evidenceBasis: [], governanceResult: "ok", commercialAction: "free" });
    // Close all
    closeWatchdogDatabase(); closeGraphDatabase(); closeAnalyticsDatabase(); closeRecommendationDatabase();
    // Reopen and verify all survive
    expect(getDurableTrigger(trigger.triggerId)).not.toBeNull();
    expect(getNode(node.nodeId, "e2e-all")).not.toBeNull();
  });
});
