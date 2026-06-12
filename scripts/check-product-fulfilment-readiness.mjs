#!/usr/bin/env node
/**
 * scripts/check-product-fulfilment-readiness.mjs
 *
 * Build gate: validates all product fulfilment contracts and writes reports.
 *
 * Exits 0  — all contracts valid (no not_sellable, no unexpected mismatches)
 * Exits 1  — hard failures found (blocked products)
 *
 * Outputs:
 *   reports/product-fulfilment-readiness.json  — machine-readable full report
 *   reports/product-fulfilment-readiness.md    — human-readable summary
 *
 * Run:  node scripts/check-product-fulfilment-readiness.mjs
 * CI:   add to prebuild-ci-gate or netlify build command
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const require = createRequire(import.meta.url);

// ── Load contracts via tsx/ts-node compatible require ────────────────────────

let PRODUCT_FULFILMENT_CONTRACTS;
let validateAllContracts;

try {
  // Try compiled JS first (production build artifacts)
  const contracts = require(resolve(projectRoot, ".next/server/chunks/product-fulfilment-contract.js"));
  const validator = require(resolve(projectRoot, ".next/server/chunks/fulfilment-readiness-validator.js"));
  PRODUCT_FULFILMENT_CONTRACTS = contracts.PRODUCT_FULFILMENT_CONTRACTS;
  validateAllContracts = validator.validateAllContracts;
} catch {
  // Fall back to dynamic import via tsx
  try {
    const { register } = await import("tsx/esm");
    register();
  } catch {
    // tsx already registered or not available — proceed
  }

  const contractsModule = await import(
    pathToFileURL(resolve(projectRoot, "lib/product/product-fulfilment-contract.ts")).href
  );
  const validatorModule = await import(
    pathToFileURL(resolve(projectRoot, "lib/product/fulfilment-readiness-validator.ts")).href
  );

  PRODUCT_FULFILMENT_CONTRACTS = contractsModule.PRODUCT_FULFILMENT_CONTRACTS;
  validateAllContracts = validatorModule.validateAllContracts;
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log("┌─────────────────────────────────────────────────────┐");
console.log("│  PRODUCT FULFILMENT ASSURANCE GATE                  │");
console.log("└─────────────────────────────────────────────────────┘");
console.log(`  Contracts registered: ${PRODUCT_FULFILMENT_CONTRACTS.length}`);
console.log();

const report = validateAllContracts(PRODUCT_FULFILMENT_CONTRACTS);

// ── Print results ─────────────────────────────────────────────────────────────

const STATUS_ICON = {
  sellable: "✅ SELLABLE   ",
  proof_ready: "🟡 PROOF_READY",
  not_sellable: "🔴 NOT_SELLABLE",
  not_applicable: "⚪ N/A         ",
};

const MISMATCH_ICON = "⚠️  MISMATCH";

for (const r of report.results) {
  const icon = STATUS_ICON[r.computedStatus] ?? "?";
  const mismatch = r.statusMismatch ? `  ${MISMATCH_ICON} (declared: ${r.declaredStatus})` : "";
  console.log(`  ${icon}  ${r.productCode}${mismatch}`);
  for (const f of r.hardFailures) {
    console.log(`             ❌  [${f.rule}] ${f.message}`);
  }
  for (const w of r.warnings) {
    console.log(`             ⚠   [${w.rule}] ${w.message}`);
  }
}

console.log();
console.log("─────────────────────────────────────────────────────");
console.log(`  ${report.summary}`);
console.log("─────────────────────────────────────────────────────");

// ── Write JSON report ─────────────────────────────────────────────────────────

const reportsDir = resolve(projectRoot, "reports");
mkdirSync(reportsDir, { recursive: true });

const jsonPath = resolve(reportsDir, "product-fulfilment-readiness.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");
console.log(`\n  JSON  → reports/product-fulfilment-readiness.json`);

// ── Write Markdown report ─────────────────────────────────────────────────────

const statusBadge = {
  sellable: "🟢 SELLABLE",
  proof_ready: "🟡 PROOF READY",
  not_sellable: "🔴 NOT SELLABLE",
  not_applicable: "⚪ N/A",
};

const mdRows = report.results
  .map((r) => {
    const badge = statusBadge[r.computedStatus] ?? r.computedStatus;
    const failures = r.hardFailures.map((f) => `- ❌ ${f.message}`).join("\n");
    const warnings = r.warnings.map((w) => `- ⚠ ${w.message}`).join("\n");
    const contractWarns = r.contractWarnings.map((w) => `- ℹ ${w}`).join("\n");
    const mismatch = r.statusMismatch
      ? `\n> ⚠️ **Status mismatch**: declared \`${r.declaredStatus}\`, computed \`${r.computedStatus}\``
      : "";
    const issues = [failures, warnings, contractWarns].filter(Boolean).join("\n");
    return `### ${r.displayName} (\`${r.productCode}\`)\n\n**Status:** ${badge}  |  **Type:** \`${r.fulfilmentType}\`${mismatch}\n\n${issues || "_No issues_"}`;
  })
  .join("\n\n---\n\n");

const md = `# Product Fulfilment Readiness Report

Generated: ${report.generatedAt}

## Summary

| Status | Count |
|--------|-------|
| 🟢 Sellable | ${report.sellable} |
| 🟡 Proof Ready | ${report.proofReady} |
| 🔴 Not Sellable | ${report.notSellable} |
| ⚪ N/A | ${report.notApplicable} |
| **Total** | **${report.totalProducts}** |

${report.blocked > 0 ? `> 🔴 **${report.blocked} product(s) blocked from sale.** Fix hard failures before enabling checkout.\n` : "> ✅ No products currently blocked from sale.\n"}
${report.statusMismatches > 0 ? `> ⚠️ **${report.statusMismatches} status mismatch(es).** Declared status does not match computed status.\n` : ""}

---

## Products

${mdRows}
`;

const mdPath = resolve(reportsDir, "product-fulfilment-readiness.md");
writeFileSync(mdPath, md, "utf-8");
console.log(`  MD    → reports/product-fulfilment-readiness.md`);

// ── Exit code ─────────────────────────────────────────────────────────────────

if (report.blocked > 0) {
  console.log(`\n  🔴 GATE FAILED — ${report.blocked} product(s) not sellable.`);
  process.exit(1);
}

if (report.statusMismatches > 0) {
  console.log(`\n  ⚠️  ${report.statusMismatches} status mismatch(es) — review declared vs computed status.`);
  // Warning only, not a hard failure
}

console.log("\n  ✅ GATE PASSED");
process.exit(0);
