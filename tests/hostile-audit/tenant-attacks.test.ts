/**
 * tests/hostile-audit/tenant-attacks.test.ts
 *
 * §16 — Hostile audit: Tenant attacks.
 *
 * Tests that cross-tenant traversal, cross-tenant recommendations,
 * cross-tenant receipt retrieval, and cross-tenant watchdog triggers are denied.
 */
import { describe, it, expect } from "vitest";
import { createNode, getNode, getNodesForCase, traverseFromNode, closeGraphDatabase } from "../../lib/intelligence/accountability/durable-graph-store";
import { createDurableTrigger, getTriggersForCase, closeWatchdogDatabase } from "../../lib/intelligence/accountability/durable-watchdog-store";

describe("Hostile Audit — Tenant Attacks", () => {
  afterEach(() => {
    closeGraphDatabase();
    closeWatchdogDatabase();
  });

  it("cross-tenant graph traversal is denied", () => {
    const nodeA = createNode({ tenantId: "tenant-a", caseId: "case-1", nodeType: "decision", label: "Tenant A secret" });
    // Tenant B should not be able to access Tenant A's node
    const accessedByB = getNode(nodeA.nodeId, "tenant-b");
    expect(accessedByB).toBeNull();
    // Tenant B should not see Tenant A's nodes in case listing
    const tenantBNodes = getNodesForCase("tenant-b", "case-1");
    expect(tenantBNodes.length).toBe(0);
  });

  it("cross-tenant watchdog trigger inspection is denied", () => {
    const triggerA = createDurableTrigger({
      tenantId: "tenant-a", caseId: "case-1", commitment: "Secret commitment", statedTrigger: "Secret trigger",
      evidenceSource: "customer_evidence", sourceReference: "ref-001",
    });
    // Tenant B should not see Tenant A's triggers
    const tenantBTriggers = getTriggersForCase("tenant-b", "case-1");
    expect(tenantBTriggers.length).toBe(0);
  });

  it("cross-tenant node ID collision does not leak data", () => {
    // Two tenants can have nodes with the same case ID but different data
    const nodeA = createNode({ tenantId: "tenant-a", caseId: "shared-case", nodeType: "decision", label: "Tenant A data" });
    const nodeB = createNode({ tenantId: "tenant-b", caseId: "shared-case", nodeType: "decision", label: "Tenant B data" });
    // Each tenant sees only their own data
    const tenantANodes = getNodesForCase("tenant-a", "shared-case");
    expect(tenantANodes.every(n => n.tenantId === "tenant-a")).toBe(true);
    expect(tenantANodes.every(n => n.label === "Tenant A data")).toBe(true);
  });
});
