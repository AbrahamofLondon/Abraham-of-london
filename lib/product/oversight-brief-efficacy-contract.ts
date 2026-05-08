/**
 * lib/product/oversight-brief-efficacy-contract.ts — Oversight Brief quality grading.
 *
 * Evaluates whether a generated brief is worth sending to a serious
 * executive, sponsor, board adviser, or retainer client.
 *
 * A formidable brief makes non-action harder to justify.
 * A weak brief wastes institutional credibility.
 */

// ─────────────────────────────────────────────────────────────────────────────
// GRADES
// ─────────────────────────────────────────────────────────────────────────────

export type OversightBriefEfficacyGrade =
  | "FORMIDABLE"
  | "STRONG"
  | "ADEQUATE"
  | "WEAK"
  | "WITHHOLD";

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSIONS
// ─────────────────────────────────────────────────────────────────────────────

export type OversightBriefEfficacyDimension =
  | "SIGNAL_DENSITY"
  | "EVIDENCE_STRENGTH"
  | "DECISION_SPECIFICITY"
  | "ACTIONABILITY"
  | "CONSEQUENCE_CLARITY"
  | "CONTINUITY_VALUE"
  | "EXECUTIVE_RELEVANCE"
  | "SUPPRESSION_SAFETY"
  | "RETAINER_VALUE_PROOF";

// ─────────────────────────────────────────────────────────────────────────────
// SCORE
// ─────────────────────────────────────────────────────────────────────────────

export type EfficacyDimensionScore = {
  dimension: OversightBriefEfficacyDimension;
  score: number; // 0-100
  reason: string;
  requiredImprovement?: string;
};

export type OversightBriefEfficacyScore = {
  grade: OversightBriefEfficacyGrade;
  totalScore: number; // 0-100
  dimensions: EfficacyDimensionScore[];
  withholdReasons: string[];
  operatorNotes: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────

export type BriefSuppression = {
  section: string;
  reason: string;
  explanation: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY RULES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * No brief may be delivered unless it reaches at least STRONG
 * or is manually approved with operator justification.
 */
export const DELIVERY_RULES = {
  FORMIDABLE: { autoDelivery: true, operatorReview: false },
  STRONG: { autoDelivery: true, operatorReview: false },
  ADEQUATE: { autoDelivery: false, operatorReview: true },
  WEAK: { autoDelivery: false, operatorReview: true },
  WITHHOLD: { autoDelivery: false, operatorReview: true },
} as const;
