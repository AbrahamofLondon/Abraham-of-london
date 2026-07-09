/**
 * scripts/gtm/validate-estate-three-layer.ts
 *
 * Independent three-layer estate validation.
 *
 * Layer A: Observation — raw facts, no dispositions
 * Layer B: Evaluation — rules evaluate observations
 * Layer C: Verdict — only after A and B
 *
 * This validator does NOT trust self-asserted fields (pathExists, routeExists, etc.)
 * It independently checks the filesystem, route resolution, catalog, and contracts.
 */

import { evaluateAllProducts } from "../../lib/fulfilment/estate-evaluation-layer";
import { generateAllVerdicts, getVerdictCounts } from "../../lib/fulfilment/estate-verdict-layer";
import { CATALOG } from "../../lib/commercial/catalog";

console.log("═══════════════════════════════════════════════════════════════");
console.log("  THREE-LAYER ESTATE VALIDATION");
console.log("═══════════════════════════════════════════════════════════════\n");

// ── Layer A + B: Observe and evaluate ─────────────────────────────────────

console.log("── Layer A+B: Observation and Evaluation ──\n");

const evaluations = evaluateAllProducts();
const totalEvaluations = evaluations.reduce((sum, e) => sum + e.evaluations.length, 0);
const passedEvaluations = evaluations.reduce((sum, e) => sum + e.evaluations.filter((r) => r.passed).length, 0);
const failedEvaluations = totalEvaluations - passedEvaluations;

console.log(`Products evaluated: ${evaluations.length}`);
console.log(`Total evaluations: ${totalEvaluations}`);
console.log(`Passed: ${passedEvaluations}`);
console.log(`Failed: ${failedEvaluations}\n`);

// Show failed evaluations
const failedEvals = evaluations.flatMap((e) =>
  e.evaluations.filter((r) => !r.passed).map((r) => ({ product: e.productCode, ...r }))
);

if (failedEvals.length > 0) {
  console.log("── Failed Evaluations ──");
  for (const f of failedEvals) {
    console.log(`  ✗ ${f.product}: ${f.rule} — ${f.detail}`);
  }
  console.log("");
}

// ── Layer C: Generate verdicts ────────────────────────────────────────────

console.log("── Layer C: Verdicts ──\n");

const verdicts = generateAllVerdicts();
const counts = getVerdictCounts();

console.log("Final dispositions:");
for (const [disposition, count] of Object.entries(counts)) {
  console.log(`  ${disposition}: ${count}`);
}
console.log("");

// Show products that changed from previous classification
const previousCounts: Record<string, number> = {
  RELEASE_READY_NOW: 17,
  CONTROLLED_RELEASE_READY: 15,
  PUBLIC_REFERENCE_READY: 3,
  INTERNAL_ONLY_JUSTIFIED: 2,
  MERGED_OR_RETIRED: 6,
};

console.log("── Changes from Previous Classification ──\n");
for (const [disposition, count] of Object.entries(counts)) {
  const prev = previousCounts[disposition] ?? 0;
  const diff = count - prev;
  if (diff !== 0) {
    console.log(`  ${disposition}: ${prev} → ${count} (${diff > 0 ? "+" : ""}${diff})`);
  } else {
    console.log(`  ${disposition}: ${prev} → ${count} (unchanged)`);
  }
}
console.log("");

// Show products with evaluation failures
const productsWithFailures = verdicts.filter((v) => v.failedCount > 0);
if (productsWithFailures.length > 0) {
  console.log("── Products with Evaluation Failures ──");
  for (const v of productsWithFailures) {
    console.log(`  ${v.productCode} (${v.disposition}): ${v.failedCount}/${v.evaluationCount} failed`);
  }
  console.log("");
}

// ── Dependency cycle check ────────────────────────────────────────────────

console.log("── Dependency Cycle Check ──\n");

// Verify that verdict files are NOT used as evidence inputs
const verdictFiles = [
  "reports/gtm/estate-market-restoration-final.json",
  "reports/gtm/estate-market-restoration-final.md",
  "reports/gtm/estate-restoration-final-verdict.md",
  "reports/gtm/estate-evidence-packages/",
];

let cycleFound = false;
for (const vf of verdictFiles) {
  // Check that no evaluation references these files
  for (const e of evaluations) {
    for (const r of e.evaluations) {
      if (r.detail.includes(vf)) {
        console.error(`❌ Circular dependency: ${e.productCode} evaluation references verdict file ${vf}`);
        cycleFound = true;
      }
    }
  }
}

if (!cycleFound) {
  console.log("✅ No circular dependencies: verdict files are not used as evaluation inputs.\n");
}

// ── Summary ────────────────────────────────────────────────────────────────

const totalProducts = Object.keys(CATALOG).length;
const resolvedCount = Object.values(counts).reduce((sum, c) => sum + c, 0);
const unresolved = totalProducts - resolvedCount;

console.log("═══════════════════════════════════════════════════════════════");
console.log("  SUMMARY");
console.log("═══════════════════════════════════════════════════════════════\n");
console.log(`Total catalog products: ${totalProducts}`);
console.log(`Products evaluated: ${evaluations.length}`);
console.log(`Products resolved: ${resolvedCount}`);
console.log(`Unresolved: ${unresolved}`);
console.log(`Evaluation pass rate: ${((passedEvaluations / totalEvaluations) * 100).toFixed(1)}%`);
console.log("");

if (failedEvaluations > 0) {
  console.log("⚠  Some evaluations failed. Review failed evaluations above.");
  console.log("   Products with failures may still receive controlled/reference/internal dispositions");
  console.log("   if policy-driven classification applies.\n");
}

// Exit 0 even with failures — this is an observation, not a gate
// The gate is in the fulfilment-architecture-gate.ts
process.exit(0);
