/**
 * lib/product/market-comparison-engine.ts
 *
 * Product-level market comparison resolution.
 *
 * Core doctrine:
 * - Comparator notes are not enough on their own.
 * - Product-specific evidence must be traceable.
 * - Missing rendered output review keeps the result insufficient, not passing.
 */

import {
  getExternalMarketComparisonRows,
  getExternalRenderedOutputReview,
  type ExternalRenderedOutputReview,
} from "./external-product-value-evidence";

const ROOT = typeof process !== "undefined" && process.cwd ? process.cwd() : "";

function getFs() {
  try { return require("fs"); } catch { return null; }
}

function getPath() {
  try { return require("path"); } catch { return null; }
}

export type MarketAlternativeType =
  | "competitor_product"
  | "substitute_methodology"
  | "alternative_approach"
  | "diy_alternative"
  | "status_quo";

export interface MarketComparatorCategory {
  name: string;
  productScore: number;
  alternativeScore: number;
  productDifferentiates: boolean;
  evidence: string;
}

export interface MarketComparisonRun {
  alternativeType: MarketAlternativeType;
  alternativeName: string;
  categories: MarketComparatorCategory[];
  summary: string;
  comparedAt: string;
}

export interface MarketComparisonEvidence {
  productCode: string;
  runs: MarketComparisonRun[];
  passed: boolean;
  overallScore: number;
  reasons: string[];
}

export interface MarketComparisonResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "comparison_engine" | "missing_source";
  score?: number;
  reasons: string[];
}

export type MarketComparisonState =
  | "passed"
  | "failed"
  | "missing_source"
  | "blocked"
  | "insufficient"
  | "not_applicable";

export interface MarketComparisonRecord extends MarketComparisonResult {
  state: MarketComparisonState;
  comparisonEngineExists: true;
  comparisonEvidenceExists: boolean;
  productApplicableEvidence: boolean;
  thresholdPassed: boolean;
  authorityImplication:
    | "supports_comparison_gate"
    | "blocks_comparison_gate"
    | "does_not_support_authority";
  categories: MarketComparatorCategory[];
  traceableSources: string[];
}

export const COMPARATOR_CATEGORIES = [
  "output_depth",
  "specificity",
  "actionability",
  "evidence_transparency",
  "time_to_value",
] as const;

export type ComparatorCategory = typeof COMPARATOR_CATEGORIES[number];

export const PASS_THRESHOLD = 3;
export const MINIMUM_RUNS = 1;

function readLedgerComparison(productCode: string): MarketComparisonEvidence | null {
  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return null;

    const ledgerPath = path.join(ROOT, "reports", "product-value-evidence-ledger-v2.json");
    if (!fs.existsSync(ledgerPath)) return null;

    const raw = fs.readFileSync(ledgerPath, "utf8");
    const ledger = JSON.parse(raw);
    const entries = Array.isArray(ledger) ? ledger : [ledger];
    const entry = entries.find((row: any) => row.productCode === productCode);
    if (!entry?.testsRun?.marketComparison) return null;

    const test = entry.testsRun.marketComparison;
    return {
      productCode,
      runs: [{
        alternativeType: "alternative_approach",
        alternativeName: "validation_system_benchmark",
        categories: COMPARATOR_CATEGORIES.map((name) => ({
          name,
          productScore: test.score || 0,
          alternativeScore: 0,
          productDifferentiates: test.passed === true,
          evidence: `Ledger score: ${test.score}/${test.maxScore}`,
        })),
        summary: test.failureReasons?.length
          ? `Failed: ${test.failureReasons.join("; ")}`
          : `Passed with score ${test.score}/${test.maxScore}`,
        comparedAt: test.timestamp || entry.timestamp || new Date().toISOString(),
      }],
      passed: test.passed === true,
      overallScore: test.score || 0,
      reasons: test.failureReasons || [],
    };
  } catch {
    return null;
  }
}

function toCategory(
  name: ComparatorCategory,
  passed: boolean,
  evidence: string,
): MarketComparatorCategory {
  return {
    name,
    productScore: passed ? 9 : 4,
    alternativeScore: passed ? 4 : 7,
    productDifferentiates: passed,
    evidence,
  };
}

function buildCategories(review: ExternalRenderedOutputReview): MarketComparatorCategory[] {
  const proofs = new Set(review.usefulnessProof.proofsEstablished);

  return [
    toCategory(
      "output_depth",
      proofs.has("evidence_organised_into_judgement"),
      proofs.has("evidence_organised_into_judgement")
        ? "Rendered output organises evidence into judgement."
        : "Rendered output does not establish deeper judgement than alternatives.",
    ),
    toCategory(
      "specificity",
      review.judgementIsCaseDerived === true,
      review.judgementIsCaseDerived === true
        ? "Rendered output is case-derived."
        : "Rendered output is not proven case-derived.",
    ),
    toCategory(
      "actionability",
      proofs.has("next_action_obvious") || proofs.has("execution_sequence_clearer"),
      proofs.has("next_action_obvious") || proofs.has("execution_sequence_clearer")
        ? "Rendered output establishes a clearer next move or execution sequence."
        : "Rendered output does not establish stronger actionability than alternatives.",
    ),
    toCategory(
      "evidence_transparency",
      proofs.has("evidence_organised_into_judgement"),
      proofs.has("evidence_organised_into_judgement")
        ? "Rendered output makes the evidence basis explicit."
        : "Evidence basis is not explicit enough to claim market differentiation.",
    ),
    toCategory(
      "time_to_value",
      review.timeValueSurplusPassed === true,
      review.timeValueSurplusPassed === true
        ? "Rendered output review confirms time-value surplus."
        : "Time-value surplus is not established.",
    ),
  ];
}

function hasWeaknessSignal(productCode: string): boolean {
  return getExternalMarketComparisonRows(productCode).some((row) => {
    const weakness = row.whereWeAreWeaker.toLowerCase();
    return weakness.includes("unproven") || weakness.includes("template-dominant");
  });
}

export function resolveMarketComparisonRecord(
  productCode: string,
  ledgerPassed?: boolean,
): MarketComparisonRecord {
  const ledgerEvidence = readLedgerComparison(productCode);
  const rows = getExternalMarketComparisonRows(productCode);
  const review = getExternalRenderedOutputReview(productCode);
  const traceableSources = [
    ...(rows.length > 0
      ? [`reports/external-product-value-evidence.json#marketComparison:${productCode}`]
      : []),
    ...(review
      ? [`reports/external-product-value-evidence.json#renderedOutputReviews:${productCode}`]
      : []),
    ...(ledgerEvidence ? ["reports/product-value-evidence-ledger-v2.json"] : []),
  ];

  if (ledgerEvidence && ledgerPassed === true) {
    return {
      productCode,
      passed: ledgerEvidence.passed,
      source: "evidence_ledger",
      score: ledgerEvidence.overallScore,
      reasons: ledgerEvidence.passed
        ? [`Evidence ledger market comparison passed (${ledgerEvidence.overallScore}/10).`]
        : ["Evidence ledger market comparison failed.", ...ledgerEvidence.reasons],
      state: ledgerEvidence.passed ? "passed" : "failed",
      comparisonEngineExists: true,
      comparisonEvidenceExists: true,
      productApplicableEvidence: true,
      thresholdPassed: ledgerEvidence.passed,
      authorityImplication: ledgerEvidence.passed
        ? "supports_comparison_gate"
        : "blocks_comparison_gate",
      categories: ledgerEvidence.runs[0]?.categories ?? [],
      traceableSources,
    };
  }

  if (rows.length === 0) {
    return {
      productCode,
      passed: false,
      source: "missing_source",
      reasons: ["No traceable market comparator set exists for this product."],
      state: "missing_source",
      comparisonEngineExists: true,
      comparisonEvidenceExists: false,
      productApplicableEvidence: false,
      thresholdPassed: false,
      authorityImplication: "does_not_support_authority",
      categories: [],
      traceableSources: [],
    };
  }

  if (!review) {
    return {
      productCode,
      passed: false,
      source: "comparison_engine",
      reasons: [
        "Comparator notes exist, but no rendered output review ties the comparison to product output.",
        ...rows.map((row) => row.whereWeAreWeaker),
      ],
      state: "insufficient",
      comparisonEngineExists: true,
      comparisonEvidenceExists: true,
      productApplicableEvidence: true,
      thresholdPassed: false,
      authorityImplication: "does_not_support_authority",
      categories: [],
      traceableSources,
    };
  }

  const categories = buildCategories(review);
  const score = categories.filter((category) => category.productDifferentiates).length;
  const thresholdPassed = score >= PASS_THRESHOLD;
  const customerWouldReturn = rows.some((row) => row.wouldCustomerReturnAfterOneUse === "yes");
  const weaknessSignal = hasWeaknessSignal(productCode);
  const passed = thresholdPassed && customerWouldReturn && !weaknessSignal;

  return {
    productCode,
    passed,
    source: "comparison_engine",
    score,
    reasons: passed
      ? [
          `Scored ${score}/${COMPARATOR_CATEGORIES.length} against market comparison categories with product-applicable rendered output evidence.`,
        ]
      : [
          `Scored ${score}/${COMPARATOR_CATEGORIES.length}; market comparison threshold not met for authority support.`,
          ...(customerWouldReturn ? [] : ["Comparator set does not establish customer return after one use."]),
          ...(weaknessSignal ? ["Comparator evidence explicitly records superiority as unproven or template-dominant."] : []),
        ],
    state: passed ? "passed" : "failed",
    comparisonEngineExists: true,
    comparisonEvidenceExists: true,
    productApplicableEvidence: true,
    thresholdPassed,
    authorityImplication: passed
      ? "supports_comparison_gate"
      : "blocks_comparison_gate",
    categories,
    traceableSources,
  };
}

export function resolveMarketComparison(
  productCode: string,
  ledgerPassed?: boolean,
): MarketComparisonResult {
  const record = resolveMarketComparisonRecord(productCode, ledgerPassed);
  return {
    productCode: record.productCode,
    passed: record.passed,
    source: record.source,
    score: record.score,
    reasons: record.reasons,
  };
}

export function getProductsWithMarketComparison(): string[] {
  const products = new Set<string>();
  const fs = getFs();
  const path = getPath();
  if (fs && path) {
    try {
      const ledgerPath = path.join(ROOT, "reports", "product-value-evidence-ledger-v2.json");
      if (fs.existsSync(ledgerPath)) {
        const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
        const entries = Array.isArray(ledger) ? ledger : [ledger];
        for (const entry of entries) {
          if (entry.testsRun?.marketComparison?.passed !== undefined) {
            products.add(entry.productCode);
          }
        }
      }
    } catch {
      // Ignore and continue with external coverage.
    }
  }

  for (const row of getProductsFromExternalComparison()) {
    products.add(row);
  }

  return [...products].sort();
}

function getProductsFromExternalComparison(): string[] {
  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return [];
    const reportPath = path.join(ROOT, "reports", "external-product-value-evidence.json");
    if (!fs.existsSync(reportPath)) return [];
    const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
    const rows = Array.isArray(report?.marketComparison) ? report.marketComparison : [];
    return rows
      .map((row: any) => row.productCode)
      .filter((value: unknown): value is string => typeof value === "string");
  } catch {
    return [];
  }
}
