/**
 * Conversion Signals — real analytics for decision intelligence.
 *
 * Forget vanity metrics. Track what matters:
 * 1. Contradiction Severity Index
 * 2. "Accurate" response rate
 * 3. Action Gap Score
 * 4. Stage drop-off point
 * 5. High-value user identification
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { CaseObject } from "@/lib/decision/case-object";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ContradictionSeverity = "low" | "medium" | "high" | "critical";

export type ConversionSignals = {
  /** Mismatch between blocker and forced action (0-1) */
  contradictionSeverityIndex: number;
  contradictionSeverity: ContradictionSeverity;
  /** C3 confidence (0-1) */
  c3Confidence: number;
  /** Whether user confirmed accuracy */
  accuracyResponse: "yes" | "partial" | "no" | null;
  /** Difference between declared move and actual follow-up */
  actionGapScore: number;
  /** Where user dropped off */
  lastCompletedStage: string;
  /** High-value flag */
  isHighValue: boolean;
  /** Reasons for high-value flag */
  highValueReasons: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTRADICTION SEVERITY INDEX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute contradiction severity from case material.
 * Higher = stronger mismatch between what user says vs what they'd actually do.
 */
export function computeContradictionSeverity(caseObj: CaseObject): {
  index: number;
  severity: ContradictionSeverity;
} {
  let score = 0;

  // Blocker vs forced action mismatch
  if (caseObj.blocker && caseObj.forcedAction) {
    const blockerWords = new Set(caseObj.blocker.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const forcedWords = new Set(caseObj.forcedAction.toLowerCase().split(/\s+/).filter((w) => w.length > 3));

    // Low overlap = high contradiction (they described different things)
    let overlap = 0;
    for (const w of blockerWords) {
      if (forcedWords.has(w)) overlap++;
    }
    const overlapRatio = blockerWords.size > 0 ? overlap / blockerWords.size : 0;
    // Inverted: low overlap = high contradiction
    score += (1 - overlapRatio) * 0.4;
  }

  // Number of contradictions detected
  if (caseObj.contradiction) score += 0.3;

  // C3 specificity (higher specificity + contradiction = more severe)
  score += caseObj.specificityScore * 0.15;

  // Forced action length (longer = more thought = more real)
  if (caseObj.forcedAction && caseObj.forcedAction.length > 50) score += 0.15;

  const index = Math.min(1, score);
  const severity: ContradictionSeverity =
    index >= 0.7 ? "critical" : index >= 0.5 ? "high" : index >= 0.3 ? "medium" : "low";

  return { index, severity };
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGH-VALUE USER IDENTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Identify high-value users — premium leads who are most likely to convert.
 *
 * Flags users who:
 * - High contradiction severity
 * - High C3 score
 * - Strong cost language
 * - Viewed Strategy Room but didn't enter
 */
export function identifyHighValueUser(spine: IntelligenceSpine, behaviour?: {
  viewedStrategyRoom?: boolean;
  enteredStrategyRoom?: boolean;
  viewedExecutiveReporting?: boolean;
  purchasedExecutiveReporting?: boolean;
  accuracyResponse?: "yes" | "partial" | "no" | null;
}): { isHighValue: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // High contradiction severity
  const { severity } = computeContradictionSeverity(spine.case);
  if (severity === "critical" || severity === "high") {
    reasons.push(`Contradiction severity: ${severity}`);
  }

  // High C3 score
  if (spine.c3.specificityScore >= 0.7) {
    reasons.push("High specificity — detailed, concrete inputs");
  }

  // Strong cost language
  if (spine.case.costOfDelay && /[£$€]|\d{4,}|\bk\b|\bmillion\b|\bthousand\b/i.test(spine.case.costOfDelay)) {
    reasons.push("Quantified cost of delay");
  }

  // Viewed Strategy Room but didn't enter
  if (behaviour?.viewedStrategyRoom && !behaviour.enteredStrategyRoom) {
    reasons.push("Viewed Strategy Room without entering — high intent, hesitation at commitment");
  }

  // Confirmed accuracy
  if (behaviour?.accuracyResponse === "yes") {
    reasons.push("Confirmed diagnostic accuracy — validated problem recognition");
  }

  return {
    isHighValue: reasons.length >= 2,
    reasons,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL SIGNAL COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute all conversion signals for a given spine + behaviour data.
 */
export function computeConversionSignals(
  spine: IntelligenceSpine,
  behaviour?: {
    accuracyResponse?: "yes" | "partial" | "no" | null;
    actionTaken?: boolean;
    viewedStrategyRoom?: boolean;
    enteredStrategyRoom?: boolean;
    viewedExecutiveReporting?: boolean;
    purchasedExecutiveReporting?: boolean;
  },
): ConversionSignals {
  const { index, severity } = computeContradictionSeverity(spine.case);
  const { isHighValue, reasons } = identifyHighValueUser(spine, behaviour);

  // Action gap: 1 = move identified but not taken, 0 = taken
  const actionGapScore = behaviour?.actionTaken ? 0 : spine.case.forcedAction ? 1 : 0.5;

  return {
    contradictionSeverityIndex: index,
    contradictionSeverity: severity,
    c3Confidence: spine.c3.specificityScore,
    accuracyResponse: behaviour?.accuracyResponse ?? null,
    actionGapScore,
    lastCompletedStage: spine.stage,
    isHighValue,
    highValueReasons: reasons,
  };
}
