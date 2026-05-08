/**
 * lib/product/irreversibility-index.ts — Irreversibility Index contract.
 *
 * Measures how close a decision situation is to becoming irreversible.
 * Once a decision crosses the irreversibility threshold, the cost of
 * correction exceeds the cost of the original problem.
 *
 * Sources: cost-of-delay trajectory, option decay, authority window,
 * execution failure count, consequence materialisation.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type IrreversibilityFactor =
  | "OPTION_DECAY"
  | "AUTHORITY_WINDOW_CLOSING"
  | "CONSEQUENCE_MATERIALISING"
  | "TRUST_EROSION"
  | "COMPETITIVE_POSITION_LOSS"
  | "REGULATORY_DEADLINE"
  | "CONTRACT_EXPIRY"
  | "EXECUTION_FAILURE_PATTERN";

export type IrreversibilityLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
  | "IRREVERSIBLE";

export type IrreversibilityIndex = {
  level: IrreversibilityLevel;
  score: number; // 0-100
  factors: Array<{
    factor: IrreversibilityFactor;
    contribution: number; // 0-100
    description: string;
    deadline?: string | null;
  }>;
  windowRemaining?: string | null;
  summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

export type IrreversibilityInput = {
  optionsClosed?: number;
  optionsTotal?: number;
  executionFailures?: number;
  daysWithoutAction?: number;
  consequenceMaterialised?: boolean;
  authorityWindowDays?: number | null;
  costAccumulated?: number;
  costThreshold?: number;
  factors?: Array<{
    factor: IrreversibilityFactor;
    contribution: number;
    description: string;
    deadline?: string | null;
  }>;
};

/**
 * Compute the Irreversibility Index from available signals.
 * Does not invent factors — uses only provided evidence.
 */
export function computeIrreversibilityIndex(
  input: IrreversibilityInput,
): IrreversibilityIndex {
  let score = 0;
  const factors = input.factors ? [...input.factors] : [];

  // Option decay contribution
  if (input.optionsTotal && input.optionsTotal > 0 && input.optionsClosed != null) {
    const decayPercent = (input.optionsClosed / input.optionsTotal) * 100;
    if (decayPercent > 0) {
      score += decayPercent * 0.3;
      factors.push({
        factor: "OPTION_DECAY",
        contribution: Math.round(decayPercent),
        description: `${input.optionsClosed} of ${input.optionsTotal} strategic options have closed.`,
      });
    }
  }

  // Execution failure pattern
  if (input.executionFailures != null && input.executionFailures >= 2) {
    const failureContribution = Math.min(input.executionFailures * 10, 40);
    score += failureContribution;
    factors.push({
      factor: "EXECUTION_FAILURE_PATTERN",
      contribution: failureContribution,
      description: `${input.executionFailures} execution failures recorded. Pattern suggests structural resistance.`,
    });
  }

  // Days without action
  if (input.daysWithoutAction != null && input.daysWithoutAction > 14) {
    const inactionContribution = Math.min(input.daysWithoutAction * 0.5, 25);
    score += inactionContribution;
  }

  // Consequence materialised
  if (input.consequenceMaterialised) {
    score += 30;
    factors.push({
      factor: "CONSEQUENCE_MATERIALISING",
      contribution: 30,
      description: "At least one projected consequence has materialised.",
    });
  }

  // Cost threshold
  if (input.costAccumulated != null && input.costThreshold != null && input.costThreshold > 0) {
    const costRatio = (input.costAccumulated / input.costThreshold) * 100;
    if (costRatio > 50) {
      const costContribution = Math.min(costRatio * 0.2, 20);
      score += costContribution;
    }
  }

  // Authority window
  let windowRemaining: string | null = null;
  if (input.authorityWindowDays != null) {
    if (input.authorityWindowDays <= 0) {
      score += 20;
      factors.push({
        factor: "AUTHORITY_WINDOW_CLOSING",
        contribution: 20,
        description: "Authority window has closed or expired.",
      });
      windowRemaining = "Expired";
    } else if (input.authorityWindowDays <= 14) {
      score += 10;
      windowRemaining = `${input.authorityWindowDays} days`;
    } else {
      windowRemaining = `${input.authorityWindowDays} days`;
    }
  }

  // Add explicit factor contributions
  for (const f of input.factors ?? []) {
    if (!factors.find((existing) => existing.factor === f.factor)) {
      score += f.contribution * 0.15;
    }
  }

  score = Math.min(100, Math.round(score));

  const level: IrreversibilityLevel =
    score >= 90 ? "IRREVERSIBLE"
    : score >= 70 ? "CRITICAL"
    : score >= 45 ? "HIGH"
    : score >= 20 ? "MODERATE"
    : "LOW";

  return {
    level,
    score,
    factors,
    windowRemaining,
    summary: score === 0
      ? "Irreversibility index is low. Decision situation remains fully reversible."
      : `Irreversibility index: ${score}/100 (${level}). ${factors.length} contributing factor${factors.length !== 1 ? "s" : ""}.${windowRemaining ? ` Authority window: ${windowRemaining}.` : ""}`,
  };
}
