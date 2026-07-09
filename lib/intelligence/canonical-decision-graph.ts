/**
 * lib/intelligence/canonical-decision-graph.ts
 *
 * §5 — Canonical Decision Graph.
 *
 * Converges: strategic twin, decision memory, product knowledge graph, product corridor,
 * nextAdmissibleMove, interaction history, outcome history, GMI exposure relationships.
 *
 * ONE canonical customer decision graph + ONE product knowledge graph + explicit links between them.
 * NOT a third overlapping graph authority.
 *
 * Nodes: decision, commitment, contradiction, evidence, dependency, owner, intervention,
 * checkpoint, outcome, product interaction, GMI regime trigger.
 *
 * Edges: informed_by, contradicts, depends_on, supersedes, validates, falsifies,
 * escalates, owned_by, checked_at, exposed_to, led_to.
 */
export type GraphNodeType = "decision" | "commitment" | "contradiction" | "evidence" | "dependency" | "owner" | "intervention" | "checkpoint" | "outcome" | "product_interaction" | "gmi_regime_trigger";
export type GraphEdgeType = "informed_by" | "contradicts" | "depends_on" | "supersedes" | "validates" | "falsifies" | "escalates" | "owned_by" | "checked_at" | "exposed_to" | "led_to";

export interface GraphNode {
  nodeId: string;
  nodeType: GraphNodeType;
  tenantId: string;
  caseId: string;
  label: string;
  properties: Record<string, unknown>;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface GraphEdge {
  edgeId: string;
  edgeType: GraphEdgeType;
  sourceNodeId: string;
  targetNodeId: string;
  tenantId: string;
  properties: Record<string, unknown>;
  createdAt: string;
}

export interface DecisionGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  tenantId: string;
  caseId: string;
  version: number;
  exportedAt: string;
}

const graphs = new Map<string, DecisionGraph>();

function graphKey(tenantId: string, caseId: string): string {
  return `${tenantId}::${caseId}`;
}

export function createGraph(tenantId: string, caseId: string): DecisionGraph {
  const key = graphKey(tenantId, caseId);
  if (graphs.has(key)) return graphs.get(key)!;
  const graph: DecisionGraph = { nodes: [], edges: [], tenantId, caseId, version: 1, exportedAt: new Date().toISOString() };
  graphs.set(key, graph);
  return graph;
}

export function addNode(graph: DecisionGraph, node: Omit<GraphNode, "nodeId" | "createdAt" | "updatedAt">): GraphNode {
  const newNode: GraphNode = {
    ...node,
    nodeId: `n_${graph.nodes.length + 1}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  graph.nodes.push(newNode);
  graph.version++;
  graph.exportedAt = new Date().toISOString();
  return newNode;
}

export function addEdge(graph: DecisionGraph, edge: Omit<GraphEdge, "edgeId" | "createdAt">): GraphEdge {
  const newEdge: GraphEdge = {
    ...edge,
    edgeId: `e_${graph.edges.length + 1}_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  graph.edges.push(newEdge);
  graph.version++;
  graph.exportedAt = new Date().toISOString();
  return newEdge;
}

export function getGraph(tenantId: string, caseId: string): DecisionGraph | null {
  return graphs.get(graphKey(tenantId, caseId)) ?? null;
}

export function traverseFromNode(graph: DecisionGraph, nodeId: string, maxDepth: number = 3): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const visitedNodes = new Set<string>();
  const visitedEdges = new Set<string>();
  const queue: Array<{ nodeId: string; depth: number }> = [{ nodeId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visitedNodes.has(current.nodeId) || current.depth > maxDepth) continue;
    visitedNodes.add(current.nodeId);

    const connectedEdges = graph.edges.filter(e => e.sourceNodeId === current.nodeId || e.targetNodeId === current.nodeId);
    for (const edge of connectedEdges) {
      visitedEdges.add(edge.edgeId);
      const nextNodeId = edge.sourceNodeId === current.nodeId ? edge.targetNodeId : edge.sourceNodeId;
      if (!visitedNodes.has(nextNodeId)) queue.push({ nodeId: nextNodeId, depth: current.depth + 1 });
    }
  }

  return {
    nodes: graph.nodes.filter(n => visitedNodes.has(n.nodeId)),
    edges: graph.edges.filter(e => visitedEdges.has(e.edgeId)),
  };
}

export function exportGraph(tenantId: string, caseId: string): DecisionGraph | null {
  const graph = getGraph(tenantId, caseId);
  if (!graph) return null;
  return { ...graph, exportedAt: new Date().toISOString() };
}
