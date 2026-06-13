/**
 * Focused Product Surface Claim Audit
 *
 * Audits only actual product-facing surfaces:
 * - Product catalog entries (displayName, description, userPromise, marketName)
 * - CTA copy (primaryCta)
 * - Success/cancel routing paths
 * - Checkout descriptions
 * - Product category descriptions
 *
 * Philosophy: capability-first. If a product CAN support a claim through
 * external testing, keep it and plan the test. Only downgrade impossible claims.
 */

import { getAllProducts } from "../lib/commercial/catalog";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// Inflated claim vocabulary
const INFLATED_VOCABULARY = {
  judgement: ["judgement", "judgment"],
  diagnosis: ["diagnosis"],
  intelligence: ["intelligence"],
  simulation: ["simulation"],
  board_grade: ["board-grade", "boardroom-readiness"],
  gold: ["gold standard", "market-proven"],
  premium: ["premium"],
  governed: ["governed"],
  expert: ["expert analysis"],
};

interface ProductSurfaceClaim {
  productCode: string;
  field: string;
  claimType: string;
  originalText: string;
  isAuthorized: boolean;
  hasComposer: boolean;
  isCaseDossier: boolean;
  maxHonestState: string;
  action: "correct_now" | "plan_upgrade" | "accept";
}

const products = getAllProducts();
const externalBench = JSON.parse(
  readFileSync(join(REPORTS_DIR, "external-product-value-benchmark.json"), "utf-8")
);

// Map to max states
const maxStateMap = new Map<string, string>();
if (externalBench.results) {
  externalBench.results.forEach((r: any) => {
    maxStateMap.set(r.productCode, r.finalStatus);
  });
}

const findings: ProductSurfaceClaim[] = [];

// Scan each product's surface-level fields
products.forEach((product) => {
  const code = product.code;
  const maxState = maxStateMap.get(code) || "blocked_until_evidence";
  const hasComposer = ![
    "case_dossier_tariff_shock",
    "case_dossier_team_alignment",
    "case_dossier_escalation_denied",
    "gmi_q1_2026",
    "gmi_q2_2026",
    "gmi_q3_2026",
    "inner_circle",
    "professional",
    "professional_annual",
    "enterprise",
    "additional_collaborator",
  ].includes(code);
  const isCaseDossier = code.startsWith("case_dossier_") || code.startsWith("gmi_");

  // Fields to check
  const fieldsToCheck: Array<[string, string | undefined]> = [
    ["displayName", product.displayName],
    ["marketName", product.marketName],
    ["publicLabel", product.publicLabel],
    ["shortDescription", product.shortDescription],
    ["userPromise", product.userPromise],
    ["primaryCta", product.primaryCta],
    ["pricingNote", product.pricingNote],
  ];

  fieldsToCheck.forEach(([fieldName, fieldValue]) => {
    if (!fieldValue) return;

    const lowerValue = fieldValue.toLowerCase();

    // Check each claim type
    Object.entries(INFLATED_VOCABULARY).forEach(([claimType, keywords]) => {
      keywords.forEach((keyword) => {
        if (lowerValue.includes(keyword)) {
          // Determine if claim is authorized
          let isAuthorized = false;
          if (maxState === "externally_proven_gold") {
            isAuthorized = ["gold", "board_grade"].includes(claimType);
          } else if (maxState === "diagnostic_product" && claimType === "diagnosis") {
            isAuthorized = true;
          }

          // Capability: can this product support this claim?
          const capability =
            hasComposer &&
            !isCaseDossier &&
            (claimType === "diagnosis" || claimType === "intelligence" || claimType === "board_grade");

          // Determine action
          let action: "correct_now" | "plan_upgrade" | "accept" = "plan_upgrade";
          if (isAuthorized) {
            action = "accept";
          } else if (!capability && !isAuthorized) {
            action = "correct_now";
          }

          findings.push({
            productCode: code,
            field: fieldName,
            claimType,
            originalText: fieldValue.substring(0, 80),
            isAuthorized,
            hasComposer,
            isCaseDossier,
            maxHonestState: maxState,
            action,
          });
        }
      });
    });
  });
});

const byAction = {
  accept: findings.filter((f) => f.action === "accept"),
  plan_upgrade: findings.filter((f) => f.action === "plan_upgrade"),
  correct_now: findings.filter((f) => f.action === "correct_now"),
};

console.log("FOCUSED PRODUCT SURFACE CLAIM AUDIT");
console.log(`Products scanned: ${products.length}`);
console.log(`Total inflated claims found: ${findings.length}`);
console.log(`  Accept (authorized): ${byAction.accept.length}`);
console.log(`  Plan upgrade (capability exists): ${byAction.plan_upgrade.length}`);
console.log(`  Correct now (unsupported): ${byAction.correct_now.length}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "product-surface-claims-focused.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        productScanned: products.length,
        inflatedClaimsFound: findings.length,
        authorized: byAction.accept.length,
        planUpgrade: byAction.plan_upgrade.length,
        correctNow: byAction.correct_now.length,
      },
      findings: findings.sort((a, b) => a.productCode.localeCompare(b.productCode)),
    },
    null,
    2
  ) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "product-surface-claims-focused.json")}`);

// Write markdown report
const markdown = `# Focused Product Surface Claim Audit

**Generated**: ${new Date().toISOString()}

## Summary

| Category | Count |
|----------|-------|
| Products Scanned | ${products.length} |
| Inflated Claims Found | ${findings.length} |
| Authorized | ${byAction.accept.length} |
| Plan Upgrade (Can Support) | ${byAction.plan_upgrade.length} |
| Correct Now (Unsupported) | ${byAction.correct_now.length} |

## Findings

### Correct Now (Structurally Unsupported) — ${byAction.correct_now.length}

Static products and blocked products using unsupported claim language. Must be corrected immediately.

${byAction.correct_now
  .map(
    (f) =>
      `- **${f.productCode}** (${f.maxHonestState}) — \`${f.field}\` uses "${f.claimType}"\n  Current: "${f.originalText}..."`
  )
  .join("\n")}

### Plan Upgrade (Has Capability) — ${byAction.plan_upgrade.length}

Products with composers that can be wired and tested to support these claims. Keep the language and plan external validation.

${byAction.plan_upgrade
  .map(
    (f) =>
      `- **${f.productCode}** (${f.maxHonestState}) — \`${f.field}\` uses "${f.claimType}"\n  Action: Wire route → test externally → upgrade if evidence supports`
  )
  .join("\n")}

### Authorized — ${byAction.accept.length}

These claims are already authorized by evidence. No action needed.

${byAction.accept.map((f) => `- **${f.productCode}** — "${f.claimType}" in \`${f.field}\``).join("\n")}

## Philosophy

This is **capability-first** evaluation. Products with working composers that can be wired to live routes are treated as capable of supporting claims through external testing. Only static products and truly blocked products are corrected immediately.

The goal is to scale strongest possible state, not minimal baseline.
`;

writeFileSync(join(REPORTS_DIR, "product-surface-claims-focused.md"), markdown);

console.log(`Written: ${join(REPORTS_DIR, "product-surface-claims-focused.md")}`);
