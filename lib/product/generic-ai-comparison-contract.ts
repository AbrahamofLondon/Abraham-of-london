/**
 * lib/product/generic-ai-comparison-contract.ts
 *
 * Generic AI Comparison — Source Contract Stub
 *
 * Status: missing_source
 * Blocked until: A real comparison source exists that demonstrates the product
 * has been compared against generic AI alternatives (e.g., ChatGPT, Claude,
 * Gemini) and produces materially different, superior judgement.
 *
 * Current state:
 * - The evidence ledger has genericAiComparison test data for team_assessment
 *   (passed: true, score: 8.9/10), but no standalone comparison module exists.
 * - No other product has been compared against generic AI alternatives.
 * - This stub exists to document the gap and prevent fake passes.
 *
 * A real implementation requires:
 *   1. A generic AI (e.g., ChatGPT, Claude) run against the same input
 *   2. A structured comparison of output quality, specificity, actionability
 *   3. Evidence that the product outperforms the generic alternative
 *   4. The comparison result recorded in the evidence ledger
 *
 * Until then, this check returns: missing_source / blocked_until_comparison_source_exists
 */

export const GENERIC_AI_COMPARISON_STATUS = "missing_source" as const;
export const GENERIC_AI_COMPARISON_BLOCKED_REASON =
  "No generic AI comparison source exists. Requires a real comparison run " +
  "against a generic AI alternative (e.g., ChatGPT, Claude) with structured " +
  "output comparison before this check can pass.";

export interface GenericAiComparisonResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "missing_source";
  score?: number;
  reasons: string[];
}

/**
 * Resolve generic AI comparison status for a product.
 *
 * Currently only the evidence ledger has data (for team_assessment).
 * All other products return missing_source / blocked.
 */
export function resolveGenericAiComparison(
  productCode: string,
  ledgerGenericAiPassed?: boolean
): GenericAiComparisonResult {
  // Check evidence ledger first
  if (ledgerGenericAiPassed !== undefined) {
    return {
      productCode,
      passed: ledgerGenericAiPassed === true,
      source: "evidence_ledger",
      reasons: ledgerGenericAiPassed
        ? ["Evidence ledger genericAiComparison test passed"]
        : ["Evidence ledger genericAiComparison test failed"],
    };
  }

  // No source — return blocked/missing
  return {
    productCode,
    passed: false,
    source: "missing_source",
    reasons: [GENERIC_AI_COMPARISON_BLOCKED_REASON],
  };
}

/**
 * Check if a product has any generic AI comparison evidence.
 */
export function hasGenericAiComparisonEvidence(productCode: string): boolean {
  // Currently only checks the evidence ledger
  try {
    const { readFileSync, existsSync } = require("fs");
    const { join } = require("path");
    const ROOT = typeof process !== "undefined" && process.cwd ? process.cwd() : "";
    const ledgerPath = join(ROOT, "reports", "product-value-evidence-ledger-v2.json");
    if (existsSync(ledgerPath)) {
      const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
      const entries = Array.isArray(ledger) ? ledger : [ledger];
      return entries.some(
        (e: any) =>
          e.productCode === productCode &&
          e.testsRun?.genericAiComparison?.passed !== undefined
      );
    }
  } catch {
    // Ignore
  }
  return false;
}
