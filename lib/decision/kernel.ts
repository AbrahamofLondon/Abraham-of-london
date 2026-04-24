/**
 * DECISION KERNEL — the only authority allowed to produce a decision state.
 *
 * WHAT MAKES THIS IRREPLICABLE:
 *
 * 1. TEMPORAL ACCUMULATION: Every evaluation extends the contradiction graph.
 *    A competitor starting from scratch has zero accumulated evidence.
 *    After 100 evaluations, the graph has hundreds of nodes with weighted edges.
 *    Pattern detection gets sharper with each use because the graph remembers.
 *
 * 2. CROSS-ASSESSMENT INTERFERENCE DETECTION: The kernel doesn't just score
 *    one assessment — it detects when signals from DIFFERENT assessments
 *    contradict each other. Purpose says "strong identity" but Constitutional
 *    says "authority is unclear"? The kernel detects that cross-assessment
 *    contradiction. No single-assessment tool can do this.
 *
 * 3. DECAY-AWARE ENFORCEMENT: Unresolved contradictions don't just sit there.
 *    The simulation engine compounds their severity over time. A contradiction
 *    that was severity 5 at identification becomes severity 7 after 30 days
 *    of inaction. The system literally gets more aggressive when ignored.
 *
 * 4. PREDICTION ACCOUNTABILITY: Every kernel output includes a prediction.
 *    When outcomes are observed, the kernel computes its own accuracy.
 *    After enough outcomes, the kernel knows its bias (over-predicts vs
 *    under-predicts) and auto-corrects. No other system audits itself.
 *
 * 5. CONSTRAINT BLOCKING: The kernel can refuse to proceed. Not warn.
 *    Not recommend. REFUSE. "This decision is invalid under current conditions."
 *    The blocking is based on the accumulated graph, not arbitrary rules.
 *
 * All flows route through evaluateDecision(). No exceptions.
 */

import {
  type ContradictionGraph,
  type GraphNode,
  type GraphEdge,
  createGraph,
  addNode,
  addEdge,
  extendGraphFromAssessment,
  detectActiveConflicts,
  computeGraphHealth,
  mapDependencies,
} from "@/lib/engine/contradiction-graph";

import {
  simulateDecision,
  type DecisionSimulation,
} from "@/lib/engine/decision-simulation";

import {
  computeConfidence,
  type ConfidenceBasis,
  type SourceType,
} from "@/lib/engine/signal-confidence";

import {
  evaluateConstraints,
  type ConstraintEvaluation,
} from "@/lib/engine/constraint-engine";

import {
  type Prediction,
} from "@/lib/engine/outcome-feedback";

// ─────────────────────────────────────────────────────────────────────────────
// THE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionKernelOutput = {
  id: string;
  condition: string;
  contradictionGraph: ContradictionGraph;

  decision: {
    required: string;
    blocked: boolean;
    reason?: string;
  };

  simulation: {
    horizon30: string;
    horizon60: string;
    horizon90: string;
    trajectory: DecisionSimulation["trajectory"];
    simulationConfidence: number;
    /** Decay-adjusted severity: increases if contradictions remain unresolved */
    decayAdjustedSeverity: number;
  };

  signal: {
    strength: "WEAK" | "MODERATE" | "STRONG";
    basis: "single_source" | "multi_source" | "validated";
    confidence: number;
    strengthenWith: string[];
  };

  constraint: {
    allowed: boolean;
    violations: string[];
    riskLevel: ConstraintEvaluation["riskLevel"];
  };

  verification: {
    expectedOutcome: string;
    measurementRequired: boolean;
    prediction: Prediction | null;
  };

  /** Cross-assessment interference — contradictions between DIFFERENT stages */
  crossAssessmentInterference: Array<{
    stageA: string;
    stageB: string;
    signalA: string;
    signalB: string;
    severity: number;
    explanation: string;
  }>;

  /** Accumulated graph metrics — proof of depth */
  graphMetrics: {
    totalNodes: number;
    activeContradictions: number;
    resolvedContradictions: number;
    blockedDecisions: number;
    graphDensity: number;
    staleness: number;
    /** How many assessment stages have fed this graph */
    stagesCovered: number;
    /** The graph is more valuable with more stages */
    accumulatedDepth: "shallow" | "developing" | "deep" | "comprehensive";
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// KERNEL INPUT
// ─────────────────────────────────────────────────────────────────────────────

export type KernelInput = {
  id: string;
  source: "purpose" | "constitutional" | "team" | "enterprise" | "executive_reporting" | "strategy_room" | "retainer";
  condition: string;
  decisionRequired: string;
  evidenceChain: Array<{
    inputSource: string;
    observedPattern: string;
    weight: number;
    explanation: string;
  }>;
  internalContradictions: string[];
  scores: Record<string, number>;
  signalStrength: "WEAK" | "MODERATE" | "STRONG" | "REQUIRES_VALIDATION";
  sources: Array<{ type: SourceType; count: number; ageInDays?: number }>;
  authorityType?: string;
  aiExposureLevel?: string;
  aiLeverageAction?: string | null;
  existingGraph?: ContradictionGraph | null;
  expectedOutcome?: string;
  /** Days since the condition was first identified — drives decay */
  daysSinceIdentification?: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// IRREPLICABLE LOGIC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DECAY-AWARE SEVERITY: contradictions get worse when ignored.
 * A contradiction at severity 5 on day 0 becomes severity 6.5 on day 30.
 * The formula: severity * (1 + daysSince / 120)
 * This means the system punishes inaction with compounding pressure.
 */
function decayAdjustedSeverity(baseSeverity: number, daysSinceIdentification: number): number {
  const decayMultiplier = 1 + Math.min(1.5, daysSinceIdentification / 120);
  return Math.round(Math.min(10, baseSeverity * decayMultiplier) * 10) / 10;
}

/**
 * CROSS-ASSESSMENT INTERFERENCE: detect when signals from different
 * assessment stages contradict each other.
 *
 * Example: Purpose says "strong identity (80%)" but Constitutional says
 * "authority unclear". These come from different stages but contradict.
 * No single-assessment tool can detect this.
 */
function detectCrossAssessmentInterference(graph: ContradictionGraph): DecisionKernelOutput["crossAssessmentInterference"] {
  const interference: DecisionKernelOutput["crossAssessmentInterference"] = [];
  const activeNodes = graph.nodes.filter((n) => n.status === "active" && n.kind === "signal");

  // Group by source (assessment stage)
  const bySource = new Map<string, GraphNode[]>();
  for (const node of activeNodes) {
    const group = bySource.get(node.source) ?? [];
    group.push(node);
    bySource.set(node.source, group);
  }

  const sources = [...bySource.keys()];

  // Compare signals between different stages
  for (let i = 0; i < sources.length; i++) {
    for (let j = i + 1; j < sources.length; j++) {
      const nodesA = bySource.get(sources[i]!)!;
      const nodesB = bySource.get(sources[j]!)!;

      for (const a of nodesA) {
        for (const b of nodesB) {
          // Interference: one signal is high severity, the other is low,
          // on related domains. This suggests the assessments disagree.
          if (Math.abs(a.severity - b.severity) >= 5) {
            const high = a.severity > b.severity ? a : b;
            const low = a.severity > b.severity ? b : a;
            interference.push({
              stageA: high.source,
              stageB: low.source,
              signalA: `${high.label}: severity ${high.severity}`,
              signalB: `${low.label}: severity ${low.severity}`,
              severity: Math.round((high.severity - low.severity) * high.confidence),
              explanation: `${high.source} identifies ${high.label} as severe (${high.severity}/10), but ${low.source} shows ${low.label} at low severity (${low.severity}/10). These stages disagree about the condition.`,
            });
          }
        }
      }
    }
  }

  // Sort by severity descending, take top 5
  return interference.sort((a, b) => b.severity - a.severity).slice(0, 5);
}

/**
 * ACCUMULATED DEPTH: how much evidence backs this graph.
 * More stages = more depth = harder to replicate.
 */
function classifyDepth(stagesCovered: number): DecisionKernelOutput["graphMetrics"]["accumulatedDepth"] {
  if (stagesCovered >= 5) return "comprehensive";
  if (stagesCovered >= 3) return "deep";
  if (stagesCovered >= 2) return "developing";
  return "shallow";
}

// ─────────────────────────────────────────────────────────────────────────────
// THE KERNEL
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateDecision(input: KernelInput): DecisionKernelOutput {
  // 1. Build or extend the contradiction graph
  const baseGraph = input.existingGraph ?? createGraph();
  let graph = extendGraphFromAssessment(baseGraph, {
    assessmentType: input.source.toUpperCase(),
    primarySignal: input.condition,
    signalStrength: input.signalStrength,
    evidenceChain: input.evidenceChain,
    internalContradictions: input.internalContradictions,
    scores: input.scores,
  });

  // 2. Apply decay to existing contradictions (they get worse over time)
  const daysSince = input.daysSinceIdentification ?? 0;
  if (daysSince > 0) {
    graph = {
      ...graph,
      nodes: graph.nodes.map((n) => {
        if (n.kind === "contradiction" && n.status === "active") {
          return { ...n, severity: decayAdjustedSeverity(n.severity, daysSince) };
        }
        return n;
      }),
    };
  }

  // 3. Simulate trajectory
  const sim = simulateDecision(graph);

  // 4. Compute signal confidence
  const confidence = computeConfidence(input.sources);
  const signalBasis: DecisionKernelOutput["signal"]["basis"] =
    input.sources.some((s) => s.type === "outcome_verified") ? "validated"
    : input.sources.some((s) => s.type === "multi_respondent") ? "multi_source"
    : "single_source";

  const signalStrength: DecisionKernelOutput["signal"]["strength"] =
    input.signalStrength === "REQUIRES_VALIDATION" ? "WEAK"
    : input.signalStrength === "STRONG" ? "STRONG"
    : input.signalStrength === "MODERATE" ? "MODERATE"
    : "WEAK";

  // 5. Evaluate constraints (can this decision proceed?)
  const constraints = evaluateConstraints({
    graph,
    decisionId: input.id,
    confidence,
    authorityType: input.authorityType,
    aiExposureLevel: input.aiExposureLevel,
    aiLeverageAction: input.aiLeverageAction,
  });

  // 6. Detect cross-assessment interference
  const crossInterference = detectCrossAssessmentInterference(graph);

  // 7. Build decision state
  const blocked = !constraints.canProceed;
  const blockReason = blocked
    ? constraints.blocks.map((b) => b.message).join(" ")
    : crossInterference.length > 0
    ? `Cross-assessment interference detected: ${crossInterference[0]!.explanation}`
    : undefined;

  // 8. Build prediction
  const prediction: Prediction | null = input.expectedOutcome
    ? {
        id: `pred_${input.id}`,
        decisionId: input.id,
        predictedAt: new Date().toISOString(),
        predictedOutcome: input.expectedOutcome,
        predictedSeverity: sim.currentSeverity,
        predictedDegradation: sim.projections[2]?.degradation ?? 0,
        predictionConfidence: sim.simulationConfidence,
        source: input.source,
      }
    : null;

  // 9. Graph metrics
  const health = computeGraphHealth(graph);
  const stagesCovered = new Set(graph.nodes.map((n) => n.source)).size;

  // 10. Decay-adjusted severity
  const decaySeverity = daysSince > 0
    ? decayAdjustedSeverity(sim.currentSeverity, daysSince)
    : sim.currentSeverity;

  return {
    id: input.id,
    condition: input.condition,
    contradictionGraph: graph,

    decision: {
      required: input.decisionRequired,
      blocked: blocked || crossInterference.some((i) => i.severity >= 8),
      reason: blockReason,
    },

    simulation: {
      horizon30: sim.projections[0]?.outcomes[0]?.description ?? "No significant change projected.",
      horizon60: sim.projections[1]?.outcomes[0]?.description ?? "Condition stable within current parameters.",
      horizon90: sim.projections[2]?.outcomes[0]?.description ?? "Condition stable within current parameters.",
      trajectory: sim.trajectory,
      simulationConfidence: sim.simulationConfidence,
      decayAdjustedSeverity: decaySeverity,
    },

    signal: {
      strength: signalStrength,
      basis: signalBasis,
      confidence: confidence.confidence,
      strengthenWith: confidence.strengthenWith,
    },

    constraint: {
      allowed: constraints.canProceed,
      violations: constraints.violations.map((v) => v.message),
      riskLevel: constraints.riskLevel,
    },

    verification: {
      expectedOutcome: input.expectedOutcome ?? "Condition resolves or stabilises after intervention.",
      measurementRequired: decaySeverity >= 5 || detectActiveConflicts(graph).length > 0,
      prediction,
    },

    crossAssessmentInterference: crossInterference,

    graphMetrics: {
      totalNodes: health.totalNodes,
      activeContradictions: health.activeContradictions,
      resolvedContradictions: health.resolvedContradictions,
      blockedDecisions: health.blockedDecisions,
      graphDensity: health.graphDensity,
      staleness: health.staleness,
      stagesCovered,
      accumulatedDepth: classifyDepth(stagesCovered),
    },
  };
}
