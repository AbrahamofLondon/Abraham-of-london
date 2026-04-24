/**
 * DecisionSimulationEngine — projects what happens if a decision is not enforced.
 *
 * Uses:
 * - Contradiction severity from the graph
 * - Historical degradation patterns
 * - Source count (single vs multi-respondent)
 * - Time since condition identified
 *
 * Outputs 30/60/90 day projections with degradation modelling.
 * These are probabilistic estimates, not predictions.
 */

import type { ContradictionGraph, ActiveConflict, GraphHealth } from "./contradiction-graph";
import { detectActiveConflicts, computeGraphHealth } from "./contradiction-graph";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type SimulationOutcome = {
  label: string;
  probability: number;  // 0-1
  severity: number;     // 0-10
  description: string;
};

export type TrajectoryPoint = {
  daysOut: number;
  degradation: number;        // 0-100 projected degradation from current
  probability: number;        // 0-1 confidence in this projection
  dominantRisk: string;       // which conflict drives this projection
  outcomes: SimulationOutcome[];
};

export type DecisionSimulation = {
  /** Current condition severity (0-10) */
  currentSeverity: number;
  /** Direction of movement */
  trajectory: "improving" | "stable" | "degrading" | "accelerating_degradation";
  /** 30/60/90 day projections */
  projections: [TrajectoryPoint, TrajectoryPoint, TrajectoryPoint];
  /** What drives the degradation */
  primaryDriver: string;
  /** Simple probabilistic outcome at 90 days */
  likelyOutcome: SimulationOutcome;
  /** Confidence in the overall simulation */
  simulationConfidence: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// DEGRADATION MODEL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Model degradation over time based on contradiction graph state.
 *
 * Base degradation rate = average active conflict severity × conflict count.
 * Compounding factor: each unresolved conflict makes others worse.
 * Resolved conflicts slow degradation (evidence of intervention).
 */
function degradationRate(health: GraphHealth): number {
  const activeLoad = health.activeContradictions * health.avgSeverity;
  const resolvedBrake = health.resolvedContradictions * 0.3;
  const blockMultiplier = health.blockedDecisions > 0 ? 1.5 : 1.0;
  const stalenessMultiplier = 1 + health.staleness * 0.5;

  return Math.max(0, (activeLoad - resolvedBrake) * blockMultiplier * stalenessMultiplier);
}

/**
 * Project degradation at a specific time point.
 * Uses compound degradation: each month adds to the previous month's damage.
 */
function projectDegradation(rate: number, months: number): number {
  // Compound: rate × months^1.3 (slightly superlinear — damage accelerates)
  return Math.round(Math.min(100, rate * Math.pow(months, 1.3)));
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION
// ─────────────────────────────────────────────────────────────────────────────

export function simulateDecision(graph: ContradictionGraph): DecisionSimulation {
  const health = computeGraphHealth(graph);
  const conflicts = detectActiveConflicts(graph);
  const rate = degradationRate(health);

  // Primary driver
  const sorted = [...conflicts].sort((a, b) => b.combinedSeverity - a.combinedSeverity);
  const primary = sorted[0];
  const primaryDriver = primary
    ? primary.explanation
    : health.activeContradictions > 0
    ? "Active contradictions producing structural friction."
    : "No active contradictions detected.";

  // Trajectory classification
  const trajectory: DecisionSimulation["trajectory"] =
    rate >= 15 ? "accelerating_degradation"
    : rate >= 5 ? "degrading"
    : rate >= 1 ? "stable"
    : "improving";

  // Build 30/60/90 projections
  const buildPoint = (months: number): TrajectoryPoint => {
    const daysOut = months * 30;
    const degradation = projectDegradation(rate, months);
    const probability = Math.min(0.95, 0.50 + (health.activeContradictions * 0.08) + (months * 0.05));

    // Generate outcomes for this timepoint
    const outcomes: SimulationOutcome[] = [];

    if (degradation > 30) {
      outcomes.push({
        label: "Structural failure",
        probability: Math.min(0.85, degradation / 120),
        severity: 9,
        description: "Active contradictions produce execution failure. Informal authority replaces formal governance.",
      });
    }

    if (degradation > 15) {
      outcomes.push({
        label: "Decision paralysis",
        probability: Math.min(0.80, degradation / 80),
        severity: 7,
        description: "Contested decisions are deferred rather than resolved. Backlog compounds.",
      });
    }

    if (health.blockedDecisions > 0) {
      outcomes.push({
        label: "Blocked execution",
        probability: 0.90,
        severity: 8,
        description: `${health.blockedDecisions} decision${health.blockedDecisions > 1 ? "s" : ""} currently blocked. Each blocking day increases recovery cost.`,
      });
    }

    if (degradation <= 15) {
      outcomes.push({
        label: "Containable drift",
        probability: Math.max(0.20, 1 - degradation / 30),
        severity: 3,
        description: "Current condition is manageable if the primary contradiction is addressed within this window.",
      });
    }

    return {
      daysOut,
      degradation,
      probability,
      dominantRisk: primary?.nodeA.label ?? "Accumulated friction",
      outcomes: outcomes.sort((a, b) => b.probability - a.probability),
    };
  };

  const projections: [TrajectoryPoint, TrajectoryPoint, TrajectoryPoint] = [
    buildPoint(1),
    buildPoint(2),
    buildPoint(3),
  ];

  // Likely outcome at 90 days
  const p90 = projections[2]!;
  const likelyOutcome = p90.outcomes[0] ?? {
    label: "Stable",
    probability: 0.50,
    severity: 2,
    description: "No significant degradation projected.",
  };

  // Simulation confidence
  const simulationConfidence = Math.round(Math.min(0.90,
    0.30 +
    (health.totalNodes * 0.02) +
    (health.activeContradictions * 0.05) +
    (health.resolvedContradictions * 0.03) -
    (health.staleness * 0.15)
  ) * 100) / 100;

  return {
    currentSeverity: health.avgSeverity,
    trajectory,
    projections,
    primaryDriver,
    likelyOutcome,
    simulationConfidence,
  };
}
