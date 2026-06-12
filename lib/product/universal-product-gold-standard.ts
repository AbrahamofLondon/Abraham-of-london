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

export type ProductReleaseQualityStatus =
  | "category_leading"
  | "market_exceeding"
  | "market_ready"
  | "owned_upgrade_required"
  | "blocked_from_release"
  | "not_assessed";

export const FREE_PRODUCT_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
  "time_respect",
  "clarity_gain",
  "diagnostic_accuracy",
  "specificity",
  "actionability",
  "trust_and_authority",
];

export const PAID_ENTRY_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
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
  "evidence_basis",
  "trust_and_authority",
  "reuse_value",
  "time_respect",
  "archive_context",
];

export const BUNDLE_GOLD_DIMENSIONS: ProductGoldStandardDimension[] = [
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
