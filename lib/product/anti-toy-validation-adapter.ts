/**
 * lib/product/anti-toy-validation-adapter.ts
 *
 * Product Anti-Toy Validation Adapter
 *
 * Wires real evidence sources for anti_toy_validation:
 *   1. Evidence Ledger v2 — testsRun.antiToy results (if ledger entry exists)
 *   2. Anti-Toy Review Report — reports/product-anti-toy-review.md (if available)
 *   3. Anti-Toy Product Test — lib/product/anti-toy-product-test.ts (requires rendered output samples)
 *
 * A product passes anti-toy validation ONLY if:
 *   - It has a ledger entry with antiToy.passed === true, OR
 *   - It has a real anti-toy review report entry with toyRiskScore <= 5
 *
 * Without either, the check fails closed.
 *
 * This adapter does NOT fabricate results. If no evidence source exists for a
 * product, the check returns false with a clear reason.
 *
 * Uses lazy require() for fs/path so this module can be imported from
 * client-side code without webpack build errors. File system operations
 * are only available server-side.
 */

const ROOT = typeof process !== "undefined" && process.cwd ? process.cwd() : "";

function getFs() {
  try { return require("fs"); } catch { return null; }
}
function getPath() {
  try { return require("path"); } catch { return null; }
}

export interface AntiToyValidationResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "anti_toy_review_report" | "anti_toy_product_test" | "none";
  toyRiskScore?: number;
  reasons: string[];
}

/**
 * Parse the anti-toy review report for a specific product.
 * The report is a Markdown file with sections per product.
 */
function checkAntiToyReviewReport(productCode: string): AntiToyValidationResult | null {
  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return null;

    const reportPath = path.join(ROOT, "reports", "product-anti-toy-review.md");
    if (!fs.existsSync(reportPath)) {
      return null;
    }
    const content = fs.readFileSync(reportPath, "utf8");

    // Find the product section in the report
    // Format: "### product_code" followed by toy risk score
    const productRegex = new RegExp(
      `###\\s+${escapeRegex(productCode)}\\b[\\s\\S]*?(?=\\n###\\s|\\n##\\s|$)`,
      "i"
    );
    const match = content.match(productRegex);
    if (!match) {
      return null; // Product not found in report
    }

    const section = match[0];

    // Extract toy risk score: "Toy risk score: 0/100 — passes" or "- **Toy risk score:** 0/100 — passes"
    const scoreMatch = section.match(/(?:Toy risk score|\*\*Toy risk score\*\*):\s*(\d+)\/100/i);
    if (!scoreMatch) {
      return null;
    }

    const scoreValue = scoreMatch[1];
    if (scoreValue === undefined) {
      return null;
    }
    const toyRiskScore = parseInt(scoreValue, 10);
    const passes = toyRiskScore <= 5; // ANTI_TOY_GOLD_MAXIMUM

    // Extract reasons (handles both "Reasons:" and "- **Reasons:**" formats)
    const reasons: string[] = [];
    const reasonsSection = section.match(/(?:\*\*)?Reasons(?:\*\*)?:\n((?:  - .+\n?)*)/);
    if (reasonsSection && reasonsSection[1]) {
      const reasonLines = reasonsSection[1]
        .split("\n")
        .filter((line: string) => line.trim().startsWith("- "))
        .map((line: string) => line.replace(/^  - /, "").trim());
      reasons.push(...reasonLines);
    }

    if (reasons.length === 0) {
      if (passes) {
        reasons.push("Product passes anti-toy test with score within gold threshold");
      } else {
        reasons.push(`Product fails anti-toy test with score ${toyRiskScore}/100 (threshold: 5)`);
      }
    }

    return {
      productCode,
      passed: passes,
      source: "anti_toy_review_report",
      toyRiskScore,
      reasons,
    };
  } catch {
    return null;
  }
}

/**
 * Check anti-toy validation from the evidence ledger test results.
 * This is called by the resolver when derivedEvidenceState is available.
 */
export function checkAntiToyFromLedger(
  productCode: string,
  ledgerAntiToyPassed: boolean | undefined
): AntiToyValidationResult | null {
  if (ledgerAntiToyPassed === undefined) {
    return null; // No ledger data
  }

  return {
    productCode,
    passed: ledgerAntiToyPassed === true,
    source: "evidence_ledger",
    toyRiskScore: ledgerAntiToyPassed ? 0 : undefined,
    reasons: ledgerAntiToyPassed
      ? ["Evidence ledger antiToy test passed"]
      : ["Evidence ledger antiToy test failed"],
  };
}

/**
 * Resolve anti-toy validation for a product using all available evidence sources.
 *
 * Priority:
 *   1. Evidence Ledger (most authoritative — frozen scenario, recorded test)
 *   2. Anti-Toy Review Report (real review with measured scores)
 *   3. No source — fails closed
 *
 * This function NEVER fabricates a pass. If no source has data for the product,
 * the check returns passed: false with a clear explanation.
 */
export function resolveAntiToyValidation(
  productCode: string,
  ledgerAntiToyPassed?: boolean
): AntiToyValidationResult {
  // Priority 1: Evidence Ledger
  if (ledgerAntiToyPassed !== undefined) {
    return {
      productCode,
      passed: ledgerAntiToyPassed === true,
      source: "evidence_ledger",
      toyRiskScore: ledgerAntiToyPassed ? 0 : undefined,
      reasons: ledgerAntiToyPassed
        ? ["Evidence ledger antiToy test passed"]
        : ["Evidence ledger antiToy test failed"],
    };
  }

  // Priority 2: Anti-Toy Review Report
  const reportResult = checkAntiToyReviewReport(productCode);
  if (reportResult) {
    return reportResult;
  }

  // Priority 3: No source — fail closed
  return {
    productCode,
    passed: false,
    source: "none",
    reasons: [
      "No anti-toy evidence source found for this product. " +
      "Requires either: (a) an evidence ledger entry with antiToy test results, or " +
      "(b) a real anti-toy review in reports/product-anti-toy-review.md. " +
      "Without either, anti-toy validation cannot pass.",
    ],
  };
}

/**
 * Get the set of products that have anti-toy evidence from any source.
 */
export function getProductsWithAntiToyEvidence(): string[] {
  const products = new Set<string>();
  const fs = getFs();
  const path = getPath();
  if (!fs || !path) return [];

  // Check evidence ledger
  try {
    const ledgerPath = path.join(ROOT, "reports", "product-value-evidence-ledger-v2.json");
    if (fs.existsSync(ledgerPath)) {
      const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
      const entries = Array.isArray(ledger) ? ledger : [ledger];
      for (const entry of entries) {
        if (entry.testsRun?.antiToy?.passed !== undefined) {
          products.add(entry.productCode);
        }
      }
    }
  } catch {
    // Ignore
  }

  // Check anti-toy review report
  try {
    const reportPath = path.join(ROOT, "reports", "product-anti-toy-review.md");
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, "utf8");
      const productRegex = /###\s+([a-z_][a-z0-9_]*)\b/gi;
      let m: RegExpExecArray | null;
      while ((m = productRegex.exec(content)) !== null) {
        const code = m[1];
        if (code) {
          products.add(code);
        }
      }
    }
  } catch {
    // Ignore
  }

  return [...products].sort();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}