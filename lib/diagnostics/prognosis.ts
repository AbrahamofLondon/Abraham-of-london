/**
 * lib/diagnostics/prognosis.ts — Prognostic layer for diagnostic results
 *
 * Surfaces two capabilities from existing engines onto result surfaces:
 * 1. Trajectory classification (from lib/constitution/trajectory.ts)
 * 2. Engagement readiness assessment (from lib/ai/predictive-deal-engine.ts)
 *
 * Both engines are self-contained and require NO external data sources.
 * All inputs are derived from data already computed by the diagnostic ladder.
 */

import { inferTrajectory, type Trajectory } from "@/lib/constitution/trajectory";
import { predictDealOutcome, type PredictiveDealResult } from "@/lib/ai/predictive-deal-engine";

// ---------------------------------------------------------------------------
// Trajectory
// ---------------------------------------------------------------------------

export type { Trajectory };

export const TRAJECTORY_LABELS: Record<Trajectory, string> = {
  ASCENDING: "Institutional direction is ascending under current conditions.",
  STAGNANT: "Institutional direction is holding but not advancing.",
  FRAGILE: "Institutional direction is fragile under current structural load.",
  DETERIORATING: "Institutional direction is deteriorating under existing conditions.",
};

export const TRAJECTORY_COLORS: Record<Trajectory, string> = {
  ASCENDING: "rgba(110,231,183,0.80)",
  STAGNANT: "rgba(255,255,255,0.45)",
  FRAGILE: "rgba(253,186,116,0.80)",
  DETERIORATING: "rgba(252,165,165,0.80)",
};

export { inferTrajectory };

// ---------------------------------------------------------------------------
// Engagement readiness adapter
// ---------------------------------------------------------------------------

/** Revenue band string → numeric value for the predictive engine */
const REVENUE_MAP: Record<string, number> = {
  MICRO: 30_000,
  SMB: 150_000,
  MID: 500_000,
  ENTERPRISE: 3_000_000,
  WHALE: 15_000_000,
};

/** Urgency window string → deal engine urgency format */
const URGENCY_MAP: Record<string, string> = {
  IMMEDIATE: "this week",
  NEAR_TERM: "this month",
  MID_TERM: "this quarter",
  LONG_HORIZON: "next year",
};

export type EngagementReadiness = {
  readinessPercent: number;
  advisoryValueEstimate: number;
  advisoryValueFormatted: string;
  decisionVelocityDays: number;
  intent: "growth" | "crisis" | "exploration";
  quality: string;
  nextAction: string;
  nextActionLabel: string;
  rationale: string[];
};

const ACTION_LABELS: Record<string, string> = {
  FAST_TRACK_STRATEGY: "Direct strategic engagement warranted",
  SEND_TO_DIAGNOSTIC: "Deeper diagnostic before engagement",
  REJECT_OR_NURTURE: "Not ready for premium engagement",
  MANUAL_REVIEW: "Requires case-specific review",
};

/**
 * Derive engagement readiness from Executive Reporting or Strategy Room intake.
 * Reframes the predictive deal engine output for client-facing use.
 */
export function deriveEngagementReadiness(input: {
  revenueBand?: string;
  problemStatement?: string;
  urgencyWindow?: string;
  authorityScope?: string;
  boardInvolved?: string;
}): EngagementReadiness {
  const revenue = REVENUE_MAP[input.revenueBand?.toUpperCase() ?? ""] ?? 50_000;
  const problem = input.problemStatement ?? "";
  const urgency = URGENCY_MAP[input.urgencyWindow?.toUpperCase() ?? ""] ?? "this quarter";

  // Authority: DIRECT = confirmed decision maker, PROXY/UNCLEAR = not
  const authorityRaw = input.authorityScope?.toUpperCase() ?? "UNCLEAR";
  const authority = authorityRaw === "DIRECT" ? "yes"
    : input.boardInvolved?.toUpperCase() === "YES" ? "yes"
    : "no";

  const result: PredictiveDealResult = predictDealOutcome({
    revenue,
    problem,
    urgency,
    authority,
  });

  return {
    readinessPercent: Math.round(result.winProbability),
    advisoryValueEstimate: result.expectedRevenue,
    advisoryValueFormatted: formatGBP(result.expectedRevenue),
    decisionVelocityDays: result.closeVelocityDays,
    intent: result.intent,
    quality: result.quality,
    nextAction: result.nextBestAction,
    nextActionLabel: ACTION_LABELS[result.nextBestAction] ?? result.nextBestAction,
    rationale: result.rationale,
  };
}

function formatGBP(value: number): string {
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return `£${value.toLocaleString("en-GB")}`;
}
