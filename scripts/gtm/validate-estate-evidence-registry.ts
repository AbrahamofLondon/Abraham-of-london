/**
 * scripts/gtm/validate-estate-evidence-registry.ts
 *
 * Validates the governed evidence registry for all 43 products.
 *
 * Run: npx tsx scripts/gtm/validate-estate-evidence-registry.ts
 * Expected exit code: 0
 *
 * Required result:
 *   total estate products: 43
 *   governed evidence records: 43
 *   valid: 43
 *   invalid: 0
 *   missing: 0
 *   duplicate product mappings: 0
 *   orphan packages: 0
 */

import {
  getAllProductEvidence,
  getEvidenceCounts,
  detectBoilerplateEvidence,
  generateDecisionTrace,
} from "../../lib/fulfilment/estate-evidence-registry";
import { PRODUCT_FULFILMENT_CONTRACTS } from "../../lib/product/product-fulfilment-contract";

console.log("═══════════════════════════════════════════════════════════════");
console.log("  ESTATE EVIDENCE REGISTRY VALIDATION");
console.log("═══════════════════════════════════════════════════════════════\n");

const records = getAllProductEvidence();
const contracts = PRODUCT_FULFILMENT_CONTRACTS;
const counts = getEvidenceCounts();

// Check 1: All 43 products have evidence records
const contractCodes = new Set(contracts.map((c) => c.productCode));
const recordCodes = new Set(records.map((r) => r.productCode));

const missing: string[] = [];
for (const code of contractCodes) {
  if (!recordCodes.has(code)) missing.push(code);
}

const orphanPackages: string[] = [];
for (const code of recordCodes) {
  if (!contractCodes.has(code)) orphanPackages.push(code);
}

// Check 2: No duplicate product mappings
const codeCounts = new Map<string, number>();
for (const r of records) {
  codeCounts.set(r.productCode, (codeCounts.get(r.productCode) || 0) + 1);
}
const duplicates = Array.from(codeCounts.entries()).filter(([, count]) => count > 1);

// Check 3: Validate evidence paths
const pathErrors: string[] = [];
for (const r of records) {
  for (const p of r.evidencePaths) {
    // We check path existence in the registry; here we just report
    if (p.startsWith("reports/gtm/estate-evidence-packages/")) {
      pathErrors.push(`Evidence path ${p} for ${r.productCode} is a generated package, not source evidence`);
    }
  }
}

// Check 4: Boilerplate detection
const boilerplateFindings = detectBoilerplateEvidence();
const circularFindings = boilerplateFindings.filter((f) => f.severity === "failure");
const boilerplateWarnings = boilerplateFindings.filter((f) => f.severity === "warning");

// Check 5: Decision traces
const decisionTraces = records.map((r) => generateDecisionTrace(r.productCode));
const opaqueDecisions = decisionTraces.filter((t) => t === null);

// Check 6: Empty evidenceBasis for market-facing products
const emptyBasis: string[] = [];
for (const r of records) {
  if (r.finalDisposition !== "INTERNAL_ONLY_JUSTIFIED" && r.finalDisposition !== "MERGED_OR_RETIRED") {
    if (r.evidenceBasis.length === 0) {
      emptyBasis.push(r.productCode);
    }
  }
}

// ── Report ────────────────────────────────────────────────────────────────

console.log(`Total estate products (contracts): ${contracts.length}`);
console.log(`Governed evidence records: ${records.length}`);
console.log(`Valid: ${counts.valid}`);
console.log(`Invalid: ${counts.invalid}`);
console.log(`Missing: ${missing.length}`);
console.log(`Duplicate product mappings: ${duplicates.length}`);
console.log(`Orphan packages: ${orphanPackages.length}`);
console.log(`Circular evidence findings: ${circularFindings.length}`);
console.log(`Boilerplate warnings: ${boilerplateWarnings.length}`);
console.log(`Opaque decisions (no trace): ${opaqueDecisions.length}`);
console.log(`Empty evidence basis (market-facing): ${emptyBasis.length}`);
console.log("");

let exitCode = 0;

if (missing.length > 0) {
  console.error(`❌ Missing evidence records: ${missing.join(", ")}`);
  exitCode = 1;
}

if (orphanPackages.length > 0) {
  console.error(`❌ Orphan packages (no matching contract): ${orphanPackages.join(", ")}`);
  exitCode = 1;
}

if (duplicates.length > 0) {
  console.error(`❌ Duplicate product mappings: ${duplicates.map(([c]) => c).join(", ")}`);
  exitCode = 1;
}

if (circularFindings.length > 0) {
  for (const f of circularFindings) {
    console.error(`❌ Circular evidence: ${f.productCode} — ${f.issue}`);
  }
  exitCode = 1;
}

if (opaqueDecisions.length > 0) {
  console.error(`❌ Opaque decisions (no trace): ${opaqueDecisions.length}`);
  exitCode = 1;
}

if (emptyBasis.length > 0) {
  console.error(`❌ Empty evidence basis for market-facing products: ${emptyBasis.join(", ")}`);
  exitCode = 1;
}

if (counts.invalid > 0) {
  console.error(`❌ ${counts.invalid} invalid evidence records`);
  exitCode = 1;
}

if (boilerplateWarnings.length > 0) {
  console.log("── Boilerplate Warnings ──");
  for (const w of boilerplateWarnings) {
    console.log(`  ⚠  ${w.productCode}: ${w.issue}`);
  }
  console.log("");
}

if (exitCode === 0) {
  console.log("✅ ALL CHECKS PASSED — Evidence registry is complete and valid.\n");
} else {
  console.error("\n❌ VALIDATION FAILED\n");
}

process.exit(exitCode);
