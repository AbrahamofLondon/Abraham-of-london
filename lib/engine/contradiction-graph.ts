/**
 * ContradictionGraph — the structural backbone of the decision system.
 *
 * Every output must be backed by this graph. It stores:
 * - Nodes: observed signals from assessments, evidence, and decisions
 * - Edges: relationships between nodes (contradicts, depends_on, amplifies, blocks)
 * - Conflict detection: which contradictions are active and unresolved
 * - Dependency mapping: which decisions depend on which conditions
 *
 * The graph gets stronger every time it's used (more evidence = sharper detection)
 * and weaker when ignored (unresolved contradictions compound).
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type NodeKind = "signal" | "contradiction" | "decision" | "outcome" | "constraint";
export type EdgeKind = "contradicts" | "depends_on" | "amplifies" | "blocks" | "resolves";
export type NodeStatus = "active" | "resolved" | "escalated" | "stale";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  label: string;
  summary: string;
  severity: number;       // 0-10
  confidence: number;     // 0-1
  source: string;         // assessment type or stage
  sourceId?: string;      // journey/session/assessment ID
  status: NodeStatus;
  createdAt: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
};

export type GraphEdge = {
  id: string;
  kind: EdgeKind;
  fromId: string;
  toId: string;
  weight: number;         // 0-1: strength of relationship
  explanation: string;
  createdAt: string;
};

export type ContradictionGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

export function createGraph(): ContradictionGraph {
  return { nodes: [], edges: [] };
}

export function addNode(graph: ContradictionGraph, node: GraphNode): ContradictionGraph {
  // Deduplicate: if node with same label+source+kind exists, update it
  const existing = graph.nodes.findIndex(
    (n) => n.label === node.label && n.source === node.source && n.kind === node.kind,
  );
  const nodes = [...graph.nodes];
  if (existing >= 0) {
    nodes[existing] = { ...nodes[existing]!, ...node, id: nodes[existing]!.id };
  } else {
    nodes.push(node);
  }
  return { ...graph, nodes };
}

export function addEdge(graph: ContradictionGraph, edge: GraphEdge): ContradictionGraph {
  // Prevent duplicate edges
  const exists = graph.edges.some(
    (e) => e.fromId === edge.fromId && e.toId === edge.toId && e.kind === edge.kind,
  );
  if (exists) return graph;
  return { ...graph, edges: [...graph.edges, edge] };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export type ActiveConflict = {
  nodeA: GraphNode;
  nodeB: GraphNode;
  edge: GraphEdge;
  /** Combined severity: higher = more urgent */
  combinedSeverity: number;
  /** Whether this conflict blocks a decision */
  blocksDecision: boolean;
  /** Human-readable explanation */
  explanation: string;
};

/**
 * Detect all active contradictions in the graph.
 * An active conflict is a "contradicts" edge between two active nodes.
 */
export function detectActiveConflicts(graph: ContradictionGraph): ActiveConflict[] {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  return graph.edges
    .filter((e) => e.kind === "contradicts")
    .map((edge) => {
      const nodeA = nodeMap.get(edge.fromId);
      const nodeB = nodeMap.get(edge.toId);
      if (!nodeA || !nodeB) return null;
      if (nodeA.status !== "active" || nodeB.status !== "active") return null;

      const combinedSeverity = Math.round(((nodeA.severity + nodeB.severity) / 2) * edge.weight * 10) / 10;

      // Check if this conflict blocks any decision node
      const blocksDecision = graph.edges.some(
        (e2) => e2.kind === "blocks" && (e2.fromId === nodeA.id || e2.fromId === nodeB.id),
      );

      return {
        nodeA,
        nodeB,
        edge,
        combinedSeverity,
        blocksDecision,
        explanation: `${nodeA.label} contradicts ${nodeB.label}. ${edge.explanation}`,
      } as ActiveConflict;
    })
    .filter(Boolean) as ActiveConflict[];
}

// ─────────────────────────────────────────────────────────────────────────────
// DEPENDENCY MAPPING
// ─────────────────────────────────────────────────────────────────────────────

export type DependencyChain = {
  decision: GraphNode;
  dependencies: Array<{
    node: GraphNode;
    relationship: EdgeKind;
    satisfied: boolean;
    blockReason?: string;
  }>;
  canProceed: boolean;
  blockingCount: number;
};

/**
 * Map the dependency chain for a decision node.
 * Returns all nodes that must be satisfied before this decision can proceed.
 */
export function mapDependencies(graph: ContradictionGraph, decisionId: string): DependencyChain | null {
  const decision = graph.nodes.find((n) => n.id === decisionId && n.kind === "decision");
  if (!decision) return null;

  const incomingEdges = graph.edges.filter((e) => e.toId === decisionId);
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

  const dependencies = incomingEdges
    .map((edge) => {
      const node = nodeMap.get(edge.fromId);
      if (!node) return null;

      const satisfied = edge.kind === "blocks"
        ? node.status === "resolved"
        : edge.kind === "depends_on"
        ? node.status === "resolved" || node.status === "active"
        : true;

      return {
        node,
        relationship: edge.kind,
        satisfied,
        blockReason: !satisfied
          ? `${node.label} (${node.kind}) must be resolved before this decision can proceed.`
          : undefined,
      };
    })
    .filter(Boolean) as DependencyChain["dependencies"];

  const blockingCount = dependencies.filter((d) => !d.satisfied).length;

  return {
    decision,
    dependencies,
    canProceed: blockingCount === 0,
    blockingCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH METRICS
// ─────────────────────────────────────────────────────────────────────────────

export type GraphHealth = {
  totalNodes: number;
  activeContradictions: number;
  resolvedContradictions: number;
  blockedDecisions: number;
  avgSeverity: number;
  graphDensity: number;     // edges / possible edges — higher = more connected
  staleness: number;        // fraction of stale nodes
};

export function computeGraphHealth(graph: ContradictionGraph): GraphHealth {
  const active = graph.nodes.filter((n) => n.status === "active");
  const contradictions = graph.edges.filter((e) => e.kind === "contradicts");
  const activeConflicts = detectActiveConflicts(graph);
  const resolvedContradictions = graph.nodes.filter((n) => n.kind === "contradiction" && n.status === "resolved");
  const blockedDecisions = graph.nodes.filter((n) => n.kind === "decision").filter((d) => {
    const chain = mapDependencies(graph, d.id);
    return chain && !chain.canProceed;
  });
  const stale = graph.nodes.filter((n) => n.status === "stale");

  const avgSeverity = active.length > 0
    ? Math.round((active.reduce((s, n) => s + n.severity, 0) / active.length) * 10) / 10
    : 0;

  const possibleEdges = graph.nodes.length * (graph.nodes.length - 1) / 2;
  const graphDensity = possibleEdges > 0
    ? Math.round((graph.edges.length / possibleEdges) * 1000) / 1000
    : 0;

  return {
    totalNodes: graph.nodes.length,
    activeContradictions: activeConflicts.length,
    resolvedContradictions: resolvedContradictions.length,
    blockedDecisions: blockedDecisions.length,
    avgSeverity,
    graphDensity,
    staleness: graph.nodes.length > 0 ? stale.length / graph.nodes.length : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GRAPH FROM ASSESSMENT RESULTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build or extend a contradiction graph from an assessment decision result.
 */
export function extendGraphFromAssessment(
  graph: ContradictionGraph,
  result: {
    assessmentType: string;
    primarySignal: string;
    signalStrength: string;
    evidenceChain: Array<{ inputSource: string; observedPattern: string; weight: number; explanation: string }>;
    internalContradictions: string[];
    scores: Record<string, number>;
  },
): ContradictionGraph {
  let g = { ...graph, nodes: [...graph.nodes], edges: [...graph.edges] };
  const ts = new Date().toISOString();
  const source = result.assessmentType.toLowerCase();

  // Add signal nodes from evidence chain
  for (const link of result.evidenceChain) {
    g = addNode(g, {
      id: `${source}:${link.inputSource.replace(/\s+/g, "_").toLowerCase()}`,
      kind: "signal",
      label: link.inputSource,
      summary: link.observedPattern,
      severity: Math.round(link.weight * 10),
      confidence: link.weight,
      source,
      status: "active",
      createdAt: ts,
    });
  }

  // Add contradiction nodes
  for (let i = 0; i < result.internalContradictions.length; i++) {
    const c = result.internalContradictions[i]!;
    g = addNode(g, {
      id: `${source}:contradiction_${i}`,
      kind: "contradiction",
      label: `Contradiction: ${c.slice(0, 60)}`,
      summary: c,
      severity: 7,
      confidence: result.signalStrength === "STRONG" ? 0.85 : result.signalStrength === "MODERATE" ? 0.65 : 0.40,
      source,
      status: "active",
      createdAt: ts,
    });
  }

  // Add edges between contradictions and signals
  const signalNodes = g.nodes.filter((n) => n.source === source && n.kind === "signal");
  const contradictionNodes = g.nodes.filter((n) => n.source === source && n.kind === "contradiction");

  for (const cn of contradictionNodes) {
    for (const sn of signalNodes) {
      g = addEdge(g, {
        id: `edge:${cn.id}:${sn.id}`,
        kind: "contradicts",
        fromId: cn.id,
        toId: sn.id,
        weight: 0.7,
        explanation: `${cn.label} contradicts the signal from ${sn.label}.`,
        createdAt: ts,
      });
    }
  }

  return g;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — the graph refuses bad input
// ─────────────────────────────────────────────────────────────────────────────

export type GraphValidationError = { element: string; message: string };

/** Validate node before insertion. */
export function validateNode(node: GraphNode): GraphValidationError[] {
  const errors: GraphValidationError[] = [];
  if (!node.id) errors.push({ element: "node.id", message: "Node has no ID" });
  if (!node.kind) errors.push({ element: "node.kind", message: "Node has no kind" });
  if (node.severity < 0 || node.severity > 10) {
    errors.push({ element: "node.severity", message: `Severity ${node.severity} out of bounds (0-10)` });
  }
  if (node.confidence < 0 || node.confidence > 1) {
    errors.push({ element: "node.confidence", message: `Confidence ${node.confidence} out of bounds (0-1)` });
  }
  if (!node.source) errors.push({ element: "node.source", message: "Node has no source stage" });
  return errors;
}

/** Validate edge — ensures referenced nodes exist. */
export function validateEdge(graph: ContradictionGraph, edge: GraphEdge): GraphValidationError[] {
  const errors: GraphValidationError[] = [];
  if (!edge.id) errors.push({ element: "edge.id", message: "Edge has no ID" });
  if (!graph.nodes.some((n) => n.id === edge.fromId)) {
    errors.push({ element: "edge.fromId", message: `Edge references missing node: ${edge.fromId}` });
  }
  if (!graph.nodes.some((n) => n.id === edge.toId)) {
    errors.push({ element: "edge.toId", message: `Edge references missing node: ${edge.toId}` });
  }
  if (edge.weight < 0 || edge.weight > 1) {
    errors.push({ element: "edge.weight", message: `Weight ${edge.weight} out of bounds (0-1)` });
  }
  return errors;
}

/** Export a human-readable audit summary of the graph. */
export function exportGraphAuditSummary(graph: ContradictionGraph): string {
  const health = computeGraphHealth(graph);
  const conflicts = detectActiveConflicts(graph);
  const lines: string[] = [
    `Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`,
    `Active contradictions: ${health.activeContradictions}`,
    `Resolved: ${health.resolvedContradictions}`,
    `Density: ${(health.graphDensity * 100).toFixed(1)}%`,
    `Staleness: ${health.staleness}%`,
  ];
  if (conflicts.length > 0) {
    lines.push("", "Active conflicts:");
    for (const c of conflicts.slice(0, 5)) {
      lines.push(`  [severity=${c.combinedSeverity}] ${c.nodeA.label} ↔ ${c.nodeB.label}${c.blocksDecision ? " (BLOCKS)" : ""}`);
    }
  }
  return lines.join("\n");
}
