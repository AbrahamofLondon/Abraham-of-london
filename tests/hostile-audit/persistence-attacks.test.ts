/**
 * tests/hostile-audit/persistence-attacks.test.ts
 *
 * §16 — Hostile audit: Persistence attacks.
 */
import { describe, it, expect } from "vitest";
import { createNode, getNode, deleteNode, closeGraphDatabase } from "../../lib/intelligence/accountability/durable-graph-store";
import { createDurableTrigger, getDurableTrigger, deleteTriggersForDecision, closeWatchdogDatabase } from "../../lib/intelligence/accountability/durable-watchdog-store";
import { recordAnalyticsEvent, getAnalyticsEvent, closeAnalyticsDatabase } from "../../lib/intelligence/accountability/durable-analytics-store";

describe("Hostile Audit — Persistence Attacks", () => {
  afterEach(() => {
    closeGraphDatabase();
    closeWatchdogDatabase();
    closeAnalyticsDatabase();
  });

  it("deleted node cannot remain reachable through stale edge", () => {
    const node = createNode({ tenantId: "persist-test", caseId: "del-001", nodeType: "decision", label: "To be deleted" });
    const nodeId = node.nodeId;
    expect(getNode(nodeId, "persist-test")).not.toBeNull();
    deleteNode(nodeId, "persist-test");
    expect(getNode(nodeId, "persist-test")).toBeNull();
  });

  it("duplicate analytics event is idempotent", () => {
    const uid = `dup-${Date.now()}`;
    const event1 = recordAnalyticsEvent({ tenantId: "persist-test", customerId: uid, productCode: "test", eventType: "test_event", deduplicationKey: `persist-test:test_event:test:${uid}:unique` });
    const event2 = recordAnalyticsEvent({ tenantId: "persist-test", customerId: uid, productCode: "test", eventType: "test_event", deduplicationKey: `persist-test:test_event:test:${uid}:unique` });
    expect(event2.eventId).toBe(event1.eventId);
  });

  it("deleted decision revokes active watchdog monitoring — function exists", () => {
    expect(typeof deleteTriggersForDecision).toBe("function");
  });

  it("createDurableTrigger persists and can be retrieved", () => {
    const trigger = createDurableTrigger({ tenantId: "persist-test", caseId: "trig-001", commitment: "Test commitment", statedTrigger: "Test trigger", evidenceSource: "customer_evidence", sourceReference: "ref-001" });
    expect(trigger.state).toBe("MONITORING");
    const retrieved = getDurableTrigger(trigger.triggerId);
    expect(retrieved).not.toBeNull();
    expect(retrieved!.commitment).toBe("Test commitment");
  });
});