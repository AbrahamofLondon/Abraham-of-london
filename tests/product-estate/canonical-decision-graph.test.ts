/**
 * tests/product-estate/canonical-decision-graph.test.ts
 *
 * §5 — Decision Graph tests: node/edge CRUD, traversal, tenant isolation, export.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createGraph, addNode, addEdge, getGraph, traverseFromNode, exportGraph } from "../../lib/intelligence/canonical-decision-graph";

describe("Canonical Decision Graph", () => {
  beforeEach(() => {
    // Clear all graphs by creating a new one (module-level state)
  });

  it("creates a new graph for a tenant/case pair", () => {
    const graph = createGraph("tenant-1", "case-1");
    expect(graph.tenantId).toBe("tenant-1");
    expect(graph.caseId).toBe("case-1");
    expect(graph.version).toBe(1);
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it("returns existing graph for same tenant/case pair", () => {
    const graph1 = createGraph("tenant-1", "case-1");
    const graph2 = createGraph("tenant-1", "case-1");
    expect(graph1).toBe(graph2);
  });

  it("addNode creates a node with generated ID", () => {
    const graph = createGraph("tenant-1", "case-1");
    const node = addNode(graph, { nodeType: "decision", tenantId: "tenant-1", caseId: "case-1", label: "Test decision", properties: { key: "value" }, version: 1 });
    expect(node.nodeId).toBeTruthy();
    expect(node.nodeType).toBe("decision");
    expect(node.label).toBe("Test decision");
    expect(node.properties.key).toBe("value");
    expect(graph.nodes.length).toBe(1);
    expect(graph.version).toBe(2);
  });

  it("addEdge creates an edge between nodes", () => {
    const graph = createGraph("tenant-edge-test", "case-edge-test");
    const node1 = addNode(graph, { nodeType: "decision", tenantId: "tenant-edge-test", caseId: "case-edge-test", label: "Node 1", properties: {}, version: 1 });
    const node2 = addNode(graph, { nodeType: "commitment", tenantId: "tenant-edge-test", caseId: "case-edge-test", label: "Node 2", properties: {}, version: 1 });
    const edge = addEdge(graph, { edgeType: "led_to", sourceNodeId: node1.nodeId, targetNodeId: node2.nodeId, tenantId: "tenant-edge-test", properties: {} });
    expect(edge.edgeId).toBeTruthy();
    expect(edge.edgeType).toBe("led_to");
    expect(graph.edges.length).toBe(1);
    expect(graph.nodes.length).toBe(2);
    expect(graph.version).toBeGreaterThanOrEqual(3);
  });

  it("getGraph returns null for non-existent tenant/case", () => {
    const graph = getGraph("nonexistent", "nonexistent");
    expect(graph).toBeNull();
  });

  it("traverseFromNode returns connected subgraph", () => {
    const graph = createGraph("tenant-1", "case-1");
    const n1 = addNode(graph, { nodeType: "decision", tenantId: "tenant-1", caseId: "case-1", label: "Root", properties: {}, version: 1 });
    const n2 = addNode(graph, { nodeType: "commitment", tenantId: "tenant-1", caseId: "case-1", label: "Child", properties: {}, version: 1 });
    const n3 = addNode(graph, { nodeType: "evidence", tenantId: "tenant-1", caseId: "case-1", label: "Unconnected", properties: {}, version: 1 });
    addEdge(graph, { edgeType: "led_to", sourceNodeId: n1.nodeId, targetNodeId: n2.nodeId, tenantId: "tenant-1", properties: {} });

    const result = traverseFromNode(graph, n1.nodeId);
    expect(result.nodes.length).toBe(2); // Root + Child
    expect(result.edges.length).toBe(1);
    expect(result.nodes.find(n => n.nodeId === n3.nodeId)).toBeUndefined(); // Unconnected not included
  });

  it("exportGraph returns a copy with updated timestamp", () => {
    const graph = createGraph("tenant-export-test", "case-export-test");
    addNode(graph, { nodeType: "decision", tenantId: "tenant-export-test", caseId: "case-export-test", label: "Test", properties: {}, version: 1 });
    const exported = exportGraph("tenant-export-test", "case-export-test");
    expect(exported).not.toBeNull();
    expect(exported!.nodes.length).toBe(1);
    expect(exported!.exportedAt).toBeTruthy();
  });

  it("exportGraph returns null for non-existent graph", () => {
    const exported = exportGraph("nonexistent", "nonexistent");
    expect(exported).toBeNull();
  });

  it("enforces tenant isolation", () => {
    const graphA = createGraph("tenant-a", "case-1");
    addNode(graphA, { nodeType: "decision", tenantId: "tenant-a", caseId: "case-1", label: "Tenant A data", properties: {}, version: 1 });

    const graphB = getGraph("tenant-b", "case-1");
    expect(graphB).toBeNull();

    const exportA = exportGraph("tenant-a", "case-1");
    expect(exportA!.nodes.every(n => n.tenantId === "tenant-a")).toBe(true);
  });
});
