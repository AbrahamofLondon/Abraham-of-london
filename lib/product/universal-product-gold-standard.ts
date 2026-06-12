/**
 * Universal Product Gold Standard.
 *
 * This is the market-facing standard above internal fulfilment and artifact
 * substance. It asks whether the customer's time, trust, money, and attention
 * are repaid with a clear customer win.
 */

export type ProductGoldStandardDimension =
  | "market_expectation"
  | "time_respect"
  | "clear_customer_win"
  | "clarity_gain"
  | "decision_usefulness"
  | "diagnostic_accuracy"
  | "specificity"
  | "evidence_basis"
  | "commercial_consequence"
  | "actionability"
  | "defensibility"
  | "reuse_value"
  | "trust_and_authority"
  | "experience_quality"
  | "price_value_surplus"
  | "time_value_surplus"
  | "category_distinction"
  | "continuity"
  | "archive_context";

export type ProductGoldScore = 0 | 1 | 2 | 3 | 4;

export const PRODUCT_GOLD_SCORE_LABELS = {
  0: "missing_or_harmful",
  1: "below_market_expectation",
  2: "meets_basic_expectation",
  3: "exceeds_market_expectation",
  4: "category_leading",
} as const satisfies Record<ProductGoldScore, string>;

export type ProductGoldReleaseStatus =
  | "gold_standard"
  | "blocked_from_release"
  | "internal_only";

export type ProductGoldDiagnosticStatus =
  | "gold_standard_candidate"
  | "needs_9_8_upgrade"
  | "blocked_by_hard_rule"
  | "internal_only";

export interface ProductGoldScoreResult {
  productCode: string;
  scoreOutOf100: number;
  scoreOutOf10: number;
  releaseStatus: ProductGoldReleaseStatus;
  blockingReasons: string[];
  upgradeRequired: string[];
}

export const PRODUCT_GOLD_98_THRESHOLD = 98;

export const UNIVERSAL_GOLD_98_DIMENSIONS: ProductGoldStandardDimension[] = [
  "time_respect",
  "clear_customer_win",
  "specificity",
  "decision_usefulness",
  "evidence_basis",
  "actionability",
  "commercial_consequence",
  "trust_and_authority",
  "experience_quality",
  "price_value_surplus",
  "reuse_value",
  "category_distinction",
];

export const FREE_PRODUCT_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "time_respect",
  "time_value_surplus",
  "clear_customer_win",
  "clarity_gain",
  "diagnostic_accuracy",
  "specificity",
  "actionability",
  "trust_and_authority",
];

export const PAID_ENTRY_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "clear_customer_win",
  "decision_usefulness",
  "specificity",
  "evidence_basis",
  "commercial_consequence",
  "actionability",
  "reuse_value",
  "price_value_surplus",
];

export const PREMIUM_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "market_expectation",
  "clear_customer_win",
  "decision_usefulness",
  "diagnostic_accuracy",
  "specificity",
  "evidence_basis",
  "commercial_consequence",
  "actionability",
  "defensibility",
  "trust_and_authority",
  "price_value_surplus",
  "category_distinction",
];

export const SUBSCRIPTION_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "continuity",
  "clear_customer_win",
  "diagnostic_accuracy",
  "specificity",
  "commercial_consequence",
  "actionability",
  "trust_and_authority",
  "reuse_value",
  "price_value_surplus",
];

export const ARCHIVE_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "market_expectation",
  "clear_customer_win",
  "evidence_basis",
  "trust_and_authority",
  "reuse_value",
  "time_respect",
  "archive_context",
];

export const BUNDLE_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "clear_customer_win",
  "clarity_gain",
  "decision_usefulness",
  "actionability",
  "reuse_value",
  "price_value_surplus",
  "experience_quality",
];

export const CUSTOMER_VALUE_DOCTRINE = [
  "a clearer decision",
  "a sharper diagnosis",
  "a useful next action",
  "a risk they had not properly seen",
  "a contradiction they can now confront",
  "an evidence-based judgement",
  "a better execution sequence",
  "a commercially useful perspective",
  "a defensible artefact they can reuse",
  "enough insight to justify the time spent",
] as const;

export function goldScoreLabel(score: ProductGoldScore): string {
  return PRODUCT_GOLD_SCORE_LABELS[score];
}
