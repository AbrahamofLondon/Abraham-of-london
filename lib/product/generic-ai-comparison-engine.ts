/**
 * lib/product/generic-ai-comparison-engine.ts
 *
 * Product-level generic AI comparison resolution.
 *
 * Core doctrine:
 * - An engine existing is not a pass.
 * - Product-specific comparison notes are not enough on their own.
 * - Pass requires traceable product-applicable evidence plus scored output.
 */

import {
  getExternalMarketComparisonRows,
  getExternalRenderedOutputReview,
  type ExternalMarketComparisonRow,
  type ExternalRenderedOutputReview,
} from "./external-product-value-evidence";

const ROOT = typeof process !== "undefined" && process.cwd ? process.cwd() : "";

function getFs() {
  try { return require("fs"); } catch { return null; }
}

function getPath() {
  try { return require("path"); } catch { return null; }
}

export type GenericAiAlternative = "chatgpt" | "claude" | "gemini" | "other";

export interface GenericAiComparisonDimension {
  name: string;
  productScore: number;
  genericAiScore: number;
  productOutperforms: boolean;
  evidence: string;
}

export interface GenericAiComparisonRun {
  alternative: GenericAiAlternative;
  alternativeLabel: string;
  inputScenario: string;
  dimensions: GenericAiComparisonDimension[];
  summary: string;
  comparedAt: string;
}

export interface GenericAiComparisonEvidence {
  productCode: string;
  runs: GenericAiComparisonRun[];
  passed: boolean;
  overallScore: number;
  reasons: string[];
}

export interface GenericAiComparisonResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "comparison_engine" | "missing_source";
  score?: number;
  reasons: string[];
}

export type GenericAiComparisonState =
  | "passed"
  | "failed"
  | "missing_source"
  | "blocked"
  | "insufficient"
  | "not_applicable";

export interface GenericAiComparisonRecord extends GenericAiComparisonResult {
  state: GenericAiComparisonState;
  comparisonEngineExists: true;
  comparisonEvidenceExists: boolean;
  productApplicableEvidence: boolean;
  thresholdPassed: boolean;
  authorityImplication:
    | "supports_comparison_gate"
    | "blocks_comparison_gate"
    | "does_not_support_authority";
  dimensions: GenericAiComparisonDimension[];
  traceableSources: string[];
}

export const COMPARISON_DIMENSIONS = [
  "specificity",
  "actionability",
  "depth",
  "originality",
  "evidence_basis",
  "reuse_value",
] as const;

export type ComparisonDimension = typeof COMPARISON_DIMENSIONS[number];

export const PASS_THRESHOLD = 4;
export const MINIMUM_RUNS = 1;

function readLedgerComparison(productCode: string): GenericAiComparisonEvidence | null {
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
    if (!entry?.testsRun?.genericAiComparison) return null;

    const test = entry.testsRun.genericAiComparison;
    return {
      productCode,
      runs: [{
        alternative: "other",
        alternativeLabel: "validation_system",
        inputScenario: "standard_validation_scenario",
        dimensions: COMPARISON_DIMENSIONS.map((name) => ({
          name,
          productScore: test.score || 0,
          genericAiScore: 0,
          productOutperforms: test.passed === true,
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

function hasWeaknessSignal(rows: ExternalMarketComparisonRow[]): boolean {
  return rows.some((row) => {
    const weakness = row.whereWeAreWeaker.toLowerCase();
    return weakness.includes("unproven") || weakness.includes("template-dominant");
  });
}

function getGenericAlternativeRows(productCode: string): ExternalMarketComparisonRow[] {
  return getExternalMarketComparisonRows(productCode).filter(
    (row) => row.alternative === "generic_ai_prompt",
  );
}

function toDimension(
  name: ComparisonDimension,
  passed: boolean,
  evidence: string,
): GenericAiComparisonDimension {
  return {
    name,
    productScore: passed ? 9 : 4,
    genericAiScore: passed ? 4 : 7,
    productOutperforms: passed,
    evidence,
  };
}

function buildDimensions(review: ExternalRenderedOutputReview): GenericAiComparisonDimension[] {
  const proofs = new Set(review.usefulnessProof.proofsEstablished);
  const antiToyPass = review.antiToy.failsAntiToyTest !== true;
  const judgementPass = review.judgementIsCaseDerived === true;

  return [
    toDimension(
      "specificity",
      judgementPass,
      judgementPass
        ? "Rendered output review confirms case-derived judgement."
        : "Rendered output review does not confirm case-derived judgement.",
    ),
    toDimension(
      "actionability",
      proofs.has("next_action_obvious"),
      proofs.has("next_action_obvious")
        ? "Usefulness proof shows the next action is obvious."
        : "Usefulness proof does not show an obvious next action.",
    ),
    toDimension(
      "depth",
      proofs.has("evidence_organised_into_judgement"),
      proofs.has("evidence_organised_into_judgement")
        ? "Evidence is organised into an explicit judgement frame."
        : "Evidence is not organised into an explicit judgement frame.",
    ),
    toDimension(
      "originality",
      judgementPass && antiToyPass,
      judgementPass && antiToyPass
        ? "Judgement is case-derived and survives anti-toy review."
        : "Originality is not proven against anti-toy review.",
    ),
    toDimension(
      "evidence_basis",
      proofs.has("evidence_organised_into_judgement"),
      proofs.has("evidence_organised_into_judgement")
        ? "Output shows explicit evidence basis."
        : "Output does not show explicit evidence basis strongly enough.",
    ),
    toDimension(
      "reuse_value",
      proofs.has("reusable_artefact_gained"),
      proofs.has("reusable_artefact_gained")
        ? "Rendered output review confirms reusable artefact value."
        : "Reusable artefact value is not established.",
    ),
  ];
}

export function resolveGenericAiComparisonRecord(
  productCode: string,
  ledgerPassed?: boolean,
): GenericAiComparisonRecord {
  const ledgerEvidence = readLedgerComparison(productCode);
  const genericRows = getGenericAlternativeRows(productCode);
  const review = getExternalRenderedOutputReview(productCode);
  const traceableSources = [
    ...(genericRows.length > 0
      ? [`reports/external-product-value-evidence.json#marketComparison:${productCode}:generic_ai_prompt`]
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
        ? [
            `Evidence ledger generic-AI comparison passed (${ledgerEvidence.overallScore}/10).`,
          ]
        : [
            "Evidence ledger generic-AI comparison failed.",
            ...ledgerEvidence.reasons,
          ],
      state: ledgerEvidence.passed ? "passed" : "failed",
      comparisonEngineExists: true,
      comparisonEvidenceExists: true,
      productApplicableEvidence: true,
      thresholdPassed: ledgerEvidence.passed,
      authorityImplication: ledgerEvidence.passed
        ? "supports_comparison_gate"
        : "blocks_comparison_gate",
      dimensions: ledgerEvidence.runs[0]?.dimensions ?? [],
      traceableSources,
    };
  }

  if (genericRows.length === 0) {
    return {
      productCode,
      passed: false,
      source: "missing_source",
      reasons: [
        "No product-specific generic-AI comparison source exists.",
      ],
      state: "missing_source",
      comparisonEngineExists: true,
      comparisonEvidenceExists: false,
      productApplicableEvidence: false,
      thresholdPassed: false,
      authorityImplication: "does_not_support_authority",
      dimensions: [],
      traceableSources: [],
    };
  }

  if (!review) {
    return {
      productCode,
      passed: false,
      source: "comparison_engine",
      reasons: [
        "Comparison notes exist, but there is no rendered output review tied to the comparison source.",
        ...genericRows.map((row) => row.whereWeAreWeaker),
      ],
      state: "insufficient",
      comparisonEngineExists: true,
      comparisonEvidenceExists: true,
      productApplicableEvidence: true,
      thresholdPassed: false,
      authorityImplication: "does_not_support_authority",
      dimensions: [],
      traceableSources,
    };
  }

  const dimensions = buildDimensions(review);
  const score = dimensions.filter((dimension) => dimension.productOutperforms).length;
  const thresholdPassed = score >= PASS_THRESHOLD;
  const customerWouldReturn = genericRows.some((row) => row.wouldCustomerReturnAfterOneUse === "yes");
  const weaknessSignal = hasWeaknessSignal(genericRows);
  const passed = thresholdPassed && customerWouldReturn && !weaknessSignal;

  return {
    productCode,
    passed,
    source: "comparison_engine",
    score,
    reasons: passed
      ? [
          `Scored ${score}/${COMPARISON_DIMENSIONS.length} against generic-AI dimensions with product-applicable rendered output evidence.`,
        ]
      : [
          `Scored ${score}/${COMPARISON_DIMENSIONS.length}; generic-AI comparison threshold not met for authority support.`,
          ...(customerWouldReturn ? [] : ["Comparison source does not establish customer return after one use."]),
          ...(weaknessSignal ? ["Comparison source explicitly records superiority as unproven or template-dominant."] : []),
        ],
    state: passed ? "passed" : "failed",
    comparisonEngineExists: true,
    comparisonEvidenceExists: true,
    productApplicableEvidence: true,
    thresholdPassed,
    authorityImplication: passed
      ? "supports_comparison_gate"
      : "blocks_comparison_gate",
    dimensions,
    traceableSources,
  };
}

export function resolveGenericAiComparison(
  productCode: string,
  ledgerPassed?: boolean,
): GenericAiComparisonResult {
  const record = resolveGenericAiComparisonRecord(productCode, ledgerPassed);
  return {
    productCode: record.productCode,
    passed: record.passed,
    source: record.source,
    score: record.score,
    reasons: record.reasons,
  };
}

export function getProductsWithGenericAiComparison(): string[] {
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
          if (entry.testsRun?.genericAiComparison?.passed !== undefined) {
            products.add(entry.productCode);
          }
        }
      }
    } catch {
      // Ignore and continue with external evidence coverage.
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
      .filter((row: any) => row?.alternative === "generic_ai_prompt")
      .map((row: any) => row.productCode)
      .filter((value: unknown): value is string => typeof value === "string");
  } catch {
    return [];
  }
}
