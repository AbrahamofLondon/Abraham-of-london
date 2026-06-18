/**
 * lib/product/market-comparison-contract.ts
 *
 * Market Comparison — Source Contract Stub
 *
 * Status: missing_source
 * Blocked until: A real comparison source exists that demonstrates the product
 * has been compared against market alternatives (e.g., competitors, alternative
 * methodologies, substitute approaches).
 *
 * Current state:
 * - The evidence ledger has marketComparison test data for team_assessment
 *   (passed: true, score: 8.3/10), but no standalone comparison module exists.
 * - No other product has been compared against market alternatives.
 * - This stub exists to document the gap and prevent fake passes.
 *
 * A real implementation requires:
 *   1. Identification of relevant market alternatives for the product
 *   2. A structured comparison of output quality, depth, and value
 *   3. Evidence that the product outperforms or differentiates from alternatives
 *   4. The comparison result recorded in the evidence ledger
 *
 * Until then, this check returns: missing_source / blocked_until_market_comparison_source_exists
 */

export const MARKET_COMPARISON_STATUS = "missing_source" as const;
export const MARKET_COMPARISON_BLOCKED_REASON =
  "No market comparison source exists. Requires a real comparison run " +
  "against market alternatives (competitors, substitute methodologies) with " +
  "structured output comparison before this check can pass.";

export interface MarketComparisonResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "missing_source";
  score?: number;
  reasons: string[];
}

/**
 * Resolve market comparison status for a product.
 *
 * Currently only the evidence ledger has data (for team_assessment).
 * All other products return missing_source / blocked.
 */
export function resolveMarketComparison(
  productCode: string,
  ledgerMarketComparisonPassed?: boolean
): MarketComparisonResult {
  // Check evidence ledger first
  if (ledgerMarketComparisonPassed !== undefined) {
    return {
      productCode,
      passed: ledgerMarketComparisonPassed === true,
      source: "evidence_ledger",
      reasons: ledgerMarketComparisonPassed
        ? ["Evidence ledger marketComparison test passed"]
        : ["Evidence ledger marketComparison test failed"],
    };
  }

  // No source — return blocked/missing
  return {
    productCode,
    passed: false,
    source: "missing_source",
    reasons: [MARKET_COMPARISON_BLOCKED_REASON],
  };
}

/**
 * Check if a product has any market comparison evidence.
 */
export function hasMarketComparisonEvidence(productCode: string): boolean {
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
          e.testsRun?.marketComparison?.passed !== undefined
      );
    }
  } catch {
    // Ignore
  }
  return false;
}
