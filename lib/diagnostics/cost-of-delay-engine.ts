/**
 * Cost-of-Delay Engine — deterministic delay exposure calculation.
 *
 * No narrative inflation. No fake precision.
 * Calculates EXPOSURE, not fabricated certainty.
 * Financial estimate only when user provides financial input.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CostBand = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type DelayHorizon = "7_DAYS" | "30_DAYS" | "90_DAYS";

export type CostOfDelayInput = {
  urgencyScore: number;         // 1-4
  ownershipScore: number;       // 1-4
  clarityScore: number;         // 1-4
  accountabilityScore: number;  // 1-4
  stateScore: number;           // 1-4
  revenueExposure?: number | null;
  peopleAffected?: number | null;
  decisionValue?: number | null;
};

export type CostOfDelayResult = {
  exposureScore: number;
  band: CostBand;
  horizon: Record<DelayHorizon, string>;
  estimatedFinancialExposure: number | null;
  disclosure: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// EXPOSURE SCORE
// ─────────────────────────────────────────────────────────────────────────────

export function computeDelayExposureScore(input: CostOfDelayInput): number {
  const base =
    input.urgencyScore * 0.30 +
    input.ownershipScore * 0.25 +
    input.clarityScore * 0.15 +
    input.accountabilityScore * 0.15 +
    input.stateScore * 0.15;

  return Math.round((base / 4) * 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// BAND CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export function classifyCostBand(score: number): CostBand {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 35) return "MODERATE";
  return "LOW";
}

// ─────────────────────────────────────────────────────────────────────────────
// HORIZON PROJECTION
// ─────────────────────────────────────────────────────────────────────────────

export function projectDelayHorizon(score: number): Record<DelayHorizon, string> {
  const band = classifyCostBand(score);

  if (band === "CRITICAL") {
    return {
      "7_DAYS": "Control begins shifting to whoever acts first.",
      "30_DAYS": "The decision becomes harder to recover without escalation.",
      "90_DAYS": "The unresolved condition becomes part of normal operating behaviour.",
    };
  }

  if (band === "HIGH") {
    return {
      "7_DAYS": "Execution slows because ownership is not settled.",
      "30_DAYS": "Stakeholders begin acting from different assumptions.",
      "90_DAYS": "The decision creates recurring friction across related work.",
    };
  }

  if (band === "MODERATE") {
    return {
      "7_DAYS": "Delay creates manageable friction.",
      "30_DAYS": "Unresolved ownership or clarity may begin affecting execution.",
      "90_DAYS": "The issue may become structural if repeated.",
    };
  }

  return {
    "7_DAYS": "Immediate exposure appears limited.",
    "30_DAYS": "Risk remains low unless urgency increases.",
    "90_DAYS": "Monitor for recurrence before escalation.",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL EXPOSURE (only when user provides financial input)
// ─────────────────────────────────────────────────────────────────────────────

export function estimateFinancialExposure(input: CostOfDelayInput): number | null {
  const anchor = input.decisionValue ?? input.revenueExposure ?? null;

  if (!anchor || anchor <= 0) return null;

  const score = computeDelayExposureScore(input);
  const exposureRate = score / 100;

  return Math.round(anchor * exposureRate * 0.1);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export function computeCostOfDelay(input: CostOfDelayInput): CostOfDelayResult {
  const exposureScore = computeDelayExposureScore(input);

  return {
    exposureScore,
    band: classifyCostBand(exposureScore),
    horizon: projectDelayHorizon(exposureScore),
    estimatedFinancialExposure: estimateFinancialExposure(input),
    disclosure: "This estimates exposure created by delay. It is not a confirmed financial loss.",
  };
}
