/**
 * lib/product/red-team-validation-adapter.ts
 *
 * Product Red-Team Validation Adapter
 *
 * Wires real evidence sources for red_team_validation:
 *   1. Evidence Ledger v2 — testsRun.redTeam results (if ledger entry exists)
 *   2. Red-Team Review Report — reports/product-red-team-review.md (if available)
 *   3. Red-Team Panel — lib/product/product-red-team-reviewers.ts (requires rendered output samples)
 *
 * A product passes red-team validation ONLY if:
 *   - It has a ledger entry with redTeam.passed === true, OR
 *   - It has a real red-team review report entry where the product survives (no critical rejections)
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

export interface RedTeamValidationResult {
  productCode: string;
  passed: boolean;
  source: "evidence_ledger" | "red_team_review_report" | "red_team_panel" | "none";
  reasons: string[];
  rejectionCount?: number;
}

/**
 * Parse the red-team review report for a specific product.
 * The report is a Markdown file with sections per product.
 */
function checkRedTeamReviewReport(productCode: string): RedTeamValidationResult | null {
  try {
    const fs = getFs();
    const path = getPath();
    if (!fs || !path) return null;

    const reportPath = path.join(ROOT, "reports", "product-red-team-review.md");
    if (!fs.existsSync(reportPath)) {
      return null;
    }
    const content = fs.readFileSync(reportPath, "utf8");

    // Find the product section in the report
    const productRegex = new RegExp(
      `##\\s+${escapeRegex(productCode)}\\b[\\s\\S]*?(?=\\n##\\s|$)`,
      "i"
    );
    const match = content.match(productRegex);
    if (!match) {
      return null; // Product not found in report
    }

    const section = match[0];

    // Extract survival status: "Survives: yes", "Survives: **yes**", or "Survives: NO"
    const survivesMatch = section.match(/Survives:\s*\*{0,2}(yes|no)\*{0,2}/i);
    if (!survivesMatch) {
      return null;
    }

    const survivesValue = survivesMatch[1];
    const survives = survivesValue ? survivesValue.toLowerCase() === "yes" : false;

    // Extract rejection count
    const rejectionsMatch = section.match(/rejections:\s*(none|\d+|[\w,\s]+)/i);
    const rejectionCount = survives
      ? 0
      : rejectionsMatch && rejectionsMatch[1] && rejectionsMatch[1].toLowerCase() !== "none"
        ? 1
        : 0;

    // Extract reasons from rejections
    const reasons: string[] = [];
    const verdictLines = section.match(/\|\s*\w+\s*\|\s*(?:accept|reject)\s*\|[^|]+\|[^|]+\|/gi);
    if (verdictLines) {
      for (const line of verdictLines) {
        if (line.includes("reject")) {
          const parts = line.split("|").map((p: string) => p.trim());
          const reviewer = parts[1] || "unknown";
          const reason = parts[4] || "No reason given";
          reasons.push(`${reviewer}: ${reason}`);
        }
      }
    }

    if (reasons.length === 0) {
      if (survives) {
        reasons.push("Product survives red-team panel review — no critical rejections");
      } else {
        reasons.push("Product fails red-team panel review");
      }
    }

    return {
      productCode,
      passed: survives,
      source: "red_team_review_report",
      rejectionCount,
      reasons,
    };
  } catch {
    return null;
  }
}

/**
 * Check red-team validation from the evidence ledger test results.
 */
export function checkRedTeamFromLedger(
  productCode: string,
  ledgerRedTeamPassed: boolean | undefined
): RedTeamValidationResult | null {
  if (ledgerRedTeamPassed === undefined) {
    return null; // No ledger data
  }

  return {
    productCode,
    passed: ledgerRedTeamPassed === true,
    source: "evidence_ledger",
    rejectionCount: ledgerRedTeamPassed ? 0 : undefined,
    reasons: ledgerRedTeamPassed
      ? ["Evidence ledger redTeam test passed"]
      : ["Evidence ledger redTeam test failed"],
  };
}

/**
 * Resolve red-team validation for a product using all available evidence sources.
 *
 * Priority:
 *   1. Evidence Ledger (most authoritative — frozen scenario, recorded test)
 *   2. Red-Team Review Report (real review with panel scores)
 *   3. No source — fails closed
 *
 * This function NEVER fabricates a pass. If no source has data for the product,
 * the check returns passed: false with a clear explanation.
 */
export function resolveRedTeamValidation(
  productCode: string,
  ledgerRedTeamPassed?: boolean
): RedTeamValidationResult {
  // Priority 1: Evidence Ledger
  if (ledgerRedTeamPassed !== undefined) {
    return {
      productCode,
      passed: ledgerRedTeamPassed === true,
      source: "evidence_ledger",
      rejectionCount: ledgerRedTeamPassed ? 0 : undefined,
      reasons: ledgerRedTeamPassed
        ? ["Evidence ledger redTeam test passed"]
        : ["Evidence ledger redTeam test failed"],
    };
  }

  // Priority 2: Red-Team Review Report
  const reportResult = checkRedTeamReviewReport(productCode);
  if (reportResult) {
    return reportResult;
  }

  // Priority 3: No source — fail closed
  return {
    productCode,
    passed: false,
    source: "none",
    reasons: [
      "No red-team evidence source found for this product. " +
      "Requires either: (a) an evidence ledger entry with redTeam test results, or " +
      "(b) a real red-team review in reports/product-red-team-review.md. " +
      "Without either, red-team validation cannot pass.",
    ],
  };
}

/**
 * Get the set of products that have red-team evidence from any source.
 */
export function getProductsWithRedTeamEvidence(): string[] {
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
        if (entry.testsRun?.redTeam?.passed !== undefined) {
          products.add(entry.productCode);
        }
      }
    }
  } catch {
    // Ignore
  }

  // Check red-team review report
  try {
    const reportPath = path.join(ROOT, "reports", "product-red-team-review.md");
    if (fs.existsSync(reportPath)) {
      const content = fs.readFileSync(reportPath, "utf8");
      const productRegex = /##\s+([a-z_][a-z0-9_]*)\b/gi;
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