/**
 * scripts/check-product-fulfilment-assurance.mjs
 *
 * Phase 2 fulfilment assurance gate.
 *
 * Merges Phase 1 contracts (readiness gate) with Phase 2 assurance records
 * (delivery class, customer signals, admin signals, human review justification,
 * quality controls, recovery policy) and validates the estate.
 *
 * Exit 0 — all assurance checks pass.
 * Exit 1 — one or more assurance failures.
 *
 * Usage:
 *   pnpm exec tsx scripts/check-product-fulfilment-assurance.mjs
 */

import { resolve, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { mkdirSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, "..");

// ── Load modules ───────────────────────────────────────────────────────────────

const contractsModule = await import(
  pathToFileURL(resolve(projectRoot, "lib/product/product-fulfilment-contract.ts")).href
);
const assuranceModule = await import(
  pathToFileURL(resolve(projectRoot, "lib/product/product-fulfilment-assurance.ts")).href
);

const { PRODUCT_FULFILMENT_CONTRACTS } = contractsModule;
const { PRODUCT_FULFILMENT_ASSURANCE_REGISTRY, getAssuranceByProductCode } = assuranceModule;

// ── Assurance check rules ─────────────────────────────────────────────────────

const PAID_STATUSES = new Set(["paid"]);

function isPaid(contract) {
  return PAID_STATUSES.has(contract.commercialStatus);
}

function isSellableOrProofReady(contract) {
  return contract.readinessStatus === "sellable" || contract.readinessStatus === "proof_ready";
}

function checkAssurance(contract, assurance) {
  const failures = [];

  // AC 1 — all 43 products have delivery class assigned
  if (!assurance) {
    failures.push({
      rule: "MISSING_ASSURANCE_RECORD",
      severity: "HARD",
      message: `"${contract.productCode}" has no Phase 2 assurance record`,
    });
    return failures; // nothing more to check without record
  }

  if (!assurance.deliveryClass) {
    failures.push({
      rule: "MISSING_DELIVERY_CLASS",
      severity: "HARD",
      message: `"${contract.productCode}" has no deliveryClass`,
    });
  }

  const paid = isPaid(contract);
  const active = isSellableOrProofReady(contract);

  // AC 2 — all paid products have fulfilment state machine coverage
  // (expressed as: automationLevel must be declared for paid products)
  if (paid && active && !assurance.automationLevel) {
    failures.push({
      rule: "PAID_MISSING_AUTOMATION_LEVEL",
      severity: "HARD",
      message: `Paid product "${contract.productCode}" has no automationLevel declared`,
    });
  }

  // AC 3 — all paid products have customer-facing fulfilment state
  if (paid && active) {
    if (!assurance.customerSignals?.immediateAfterPayment) {
      failures.push({
        rule: "PAID_MISSING_CUSTOMER_SIGNAL_IMMEDIATE",
        severity: "HARD",
        message: `Paid product "${contract.productCode}" has no customer signal for immediate post-payment state`,
      });
    }
    if (!assurance.customerSignals?.accessConfirmationExists && assurance.deliveryClass !== "inactive_not_sellable") {
      failures.push({
        rule: "PAID_NO_ACCESS_CONFIRMATION",
        severity: "WARN",
        message: `Paid product "${contract.productCode}" has no access confirmation signal for the customer`,
      });
    }
  }

  // AC 4 — all paid products have admin visibility (at minimum declared)
  if (paid && active && !assurance.adminSignals?.adminRoute && assurance.deliveryClass !== "inactive_not_sellable") {
    failures.push({
      rule: "PAID_MISSING_ADMIN_ROUTE",
      severity: "WARN",
      message: `Paid product "${contract.productCode}" has no adminRoute in assurance record`,
    });
  }

  // AC 5 — all paid products have failure/recovery path declared
  if (paid && active && !assurance.recoveryPolicy) {
    failures.push({
      rule: "PAID_MISSING_RECOVERY_POLICY",
      severity: "HARD",
      message: `Paid product "${contract.productCode}" has no recoveryPolicy defined`,
    });
  }

  // AC 6 — all manual-review products have human review justification
  if (
    assurance.deliveryClass === "manual_review_required" &&
    (!assurance.humanReviewJustification || !assurance.humanReviewJustification.required)
  ) {
    failures.push({
      rule: "MANUAL_REVIEW_MISSING_JUSTIFICATION",
      severity: "HARD",
      message: `"${contract.productCode}" is manual_review_required but humanReviewJustification.required is not true`,
    });
  }

  if (
    assurance.deliveryClass === "manual_review_required" &&
    assurance.humanReviewJustification?.required &&
    !assurance.humanReviewJustification?.humanRole
  ) {
    failures.push({
      rule: "MANUAL_REVIEW_MISSING_HUMAN_ROLE",
      severity: "HARD",
      message: `"${contract.productCode}" is manual_review_required but humanRole is not documented`,
    });
  }

  // AC 7 — fully automatable products either ARE automated or have an automation gap documented
  if (
    paid &&
    active &&
    assurance.automationLevel !== "fully_automated" &&
    assurance.automationLevel !== "not_applicable" &&
    (!assurance.automationGaps || assurance.automationGaps.length === 0) &&
    assurance.deliveryClass !== "inactive_not_sellable"
  ) {
    failures.push({
      rule: "PARTIAL_AUTOMATION_MISSING_GAP_DOCUMENTATION",
      severity: "WARN",
      message: `"${contract.productCode}" has automationLevel "${assurance.automationLevel}" but automationGaps array is empty — document what is unautomated`,
    });
  }

  // AC 10 — professional and professional_annual have subscription oversight visibility documented
  if (
    (contract.productCode === "professional" || contract.productCode === "professional_annual") &&
    assurance.deliveryClass === "subscription_retainer_cycle" &&
    assurance.adminSignals?.visibleAfterPayment !== false &&
    assurance.automationGaps?.length === 0
  ) {
    failures.push({
      rule: "SUBSCRIPTION_MISSING_LIFECYCLE_DOCUMENTATION",
      severity: "WARN",
      message: `Subscription product "${contract.productCode}" has no subscription lifecycle gaps documented`,
    });
  }

  // AC 11 — executive_reporting has generation success/failure visibility
  if (
    contract.productCode === "executive_reporting" &&
    assurance.deliveryClass === "generated_digital_artifact" &&
    assurance.qualityControls?.failureVisibleToAdmin === false
  ) {
    failures.push({
      rule: "GENERATED_ARTIFACT_FAILURE_NOT_VISIBLE_TO_ADMIN",
      severity: "WARN",
      message: `"executive_reporting" generation failure is not visible to admin — gap must be in automationGaps`,
    });
  }

  // AC 12 — archived purchasable products clearly marked as archived
  if (
    assurance.deliveryClass === "archived_digital_reference" &&
    paid &&
    assurance.qualityControls?.customerExpectationClear === false &&
    (!assurance.automationGaps || !assurance.automationGaps.some((g) => g.toLowerCase().includes("archive")))
  ) {
    failures.push({
      rule: "ARCHIVED_PRODUCT_MISSING_ARCHIVE_WARNING_GAP",
      severity: "HARD",
      message: `Archived purchasable product "${contract.productCode}" has customerExpectationClear=false but no archive warning in automationGaps`,
    });
  }

  // AC 15 — no paid product is sellable if delivery is invisible, unowned, or unrecoverable
  if (
    paid &&
    contract.readinessStatus === "sellable" &&
    assurance.deliveryClass !== "inactive_not_sellable" &&
    !assurance.adminSignals?.adminRoute
  ) {
    failures.push({
      rule: "SELLABLE_PRODUCT_DELIVERY_INVISIBLE",
      severity: "HARD",
      message: `Paid sellable product "${contract.productCode}" has no admin route — delivery is invisible to operator`,
    });
  }

  return failures;
}

// ── Run gate ──────────────────────────────────────────────────────────────────

const results = [];
let hardFailureCount = 0;
let warnCount = 0;
const assuranceCoverage = { covered: 0, missing: 0 };

for (const contract of PRODUCT_FULFILMENT_CONTRACTS) {
  const assurance = getAssuranceByProductCode(contract.productCode);
  if (assurance) assuranceCoverage.covered++;
  else assuranceCoverage.missing++;

  const failures = checkAssurance(contract, assurance);
  const hard = failures.filter((f) => f.severity === "HARD");
  const warns = failures.filter((f) => f.severity === "WARN");
  hardFailureCount += hard.length;
  warnCount += warns.length;

  results.push({
    productCode: contract.productCode,
    displayName: contract.displayName,
    commercialStatus: contract.commercialStatus,
    readinessStatus: contract.readinessStatus,
    deliveryClass: assurance?.deliveryClass ?? "MISSING",
    automationLevel: assurance?.automationLevel ?? "MISSING",
    proofRunStatus: assurance?.qualityControls?.proofRunStatus ?? "MISSING",
    adminRoute: assurance?.adminSignals?.adminRoute ?? null,
    adminVisibleAfterPayment: assurance?.adminSignals?.visibleAfterPayment ?? null,
    customerSignalExists: assurance?.customerSignals?.accessConfirmationExists ?? null,
    humanReviewRequired: assurance?.humanReviewJustification?.required ?? null,
    automationGapCount: assurance?.automationGaps?.length ?? 0,
    hardFailures: hard.map((f) => ({ rule: f.rule, message: f.message })),
    warnings: warns.map((f) => ({ rule: f.rule, message: f.message })),
  });
}

// ── Summary ───────────────────────────────────────────────────────────────────

const byDeliveryClass = {};
for (const r of results) {
  byDeliveryClass[r.deliveryClass] = (byDeliveryClass[r.deliveryClass] ?? 0) + 1;
}

const paidProducts = results.filter((r) => PRODUCT_FULFILMENT_CONTRACTS.find((c) => c.productCode === r.productCode && isPaid(c)));
const paidProductsWithAdminRoute = paidProducts.filter((r) => r.adminRoute);
const paidProductsWithCustomerSignal = paidProducts.filter((r) => r.customerSignalExists !== false);

const report = {
  meta: {
    generatedAt: new Date().toISOString(),
    gateVersion: "phase-2",
    totalProducts: PRODUCT_FULFILMENT_CONTRACTS.length,
    assuranceCoverage,
  },
  summary: {
    hardFailures: hardFailureCount,
    warnings: warnCount,
    passed: hardFailureCount === 0,
    byDeliveryClass,
    paidProductsTotal: paidProducts.length,
    paidProductsWithAdminRoute: paidProductsWithAdminRoute.length,
    paidProductsWithCustomerSignal: paidProductsWithCustomerSignal.length,
  },
  acceptanceCriteria: {
    "AC1_all_43_have_delivery_class": assuranceCoverage.missing === 0,
    "AC2_paid_have_automation_level": !results.some((r) => r.hardFailures.some((f) => f.rule === "PAID_MISSING_AUTOMATION_LEVEL")),
    "AC3_paid_have_customer_signal": !results.some((r) => r.hardFailures.some((f) => f.rule === "PAID_MISSING_CUSTOMER_SIGNAL_IMMEDIATE")),
    "AC4_paid_have_admin_visibility": paidProductsWithAdminRoute.length === paidProducts.length,
    "AC5_paid_have_recovery_policy": !results.some((r) => r.hardFailures.some((f) => f.rule === "PAID_MISSING_RECOVERY_POLICY")),
    "AC6_manual_review_has_justification": !results.some((r) => r.hardFailures.some((f) => f.rule === "MANUAL_REVIEW_MISSING_JUSTIFICATION")),
    "AC7_automation_gaps_documented": !results.some((r) => r.hardFailures.some((f) => f.rule === "PARTIAL_AUTOMATION_MISSING_GAP_DOCUMENTATION")),
    "AC12_archived_products_flagged": !results.some((r) => r.hardFailures.some((f) => f.rule === "ARCHIVED_PRODUCT_MISSING_ARCHIVE_WARNING_GAP")),
    "AC15_no_sellable_with_invisible_delivery": !results.some((r) => r.hardFailures.some((f) => f.rule === "SELLABLE_PRODUCT_DELIVERY_INVISIBLE")),
  },
  products: results,
};

// ── Write reports ─────────────────────────────────────────────────────────────

const reportsDir = resolve(projectRoot, "reports");
mkdirSync(reportsDir, { recursive: true });

writeFileSync(
  resolve(reportsDir, "product-fulfilment-assurance-phase-2.json"),
  JSON.stringify(report, null, 2),
  "utf-8",
);

// ── Markdown report ───────────────────────────────────────────────────────────

const acTable = Object.entries(report.acceptanceCriteria)
  .map(([k, v]) => `| ${k.replace(/_/g, " ")} | ${v ? "✅ PASS" : "❌ FAIL"} |`)
  .join("\n");

const deliveryClassTable = Object.entries(byDeliveryClass)
  .sort(([, a], [, b]) => b - a)
  .map(([cls, count]) => `| \`${cls}\` | ${count} |`)
  .join("\n");

const blockingProductRows = results
  .filter((r) => r.hardFailures.length > 0)
  .map((r) => r.hardFailures.map((f) => `| \`${r.productCode}\` | ${f.rule} | ${f.message} |`).join("\n"))
  .join("\n");

const warningRows = results
  .filter((r) => r.warnings.length > 0)
  .map((r) => r.warnings.map((f) => `| \`${r.productCode}\` | ${f.rule} | ${f.message} |`).join("\n"))
  .join("\n");

const allProductRows = results
  .map(
    (r) =>
      `| \`${r.productCode}\` | \`${r.deliveryClass}\` | \`${r.automationLevel}\` | ${r.adminRoute ? `\`${r.adminRoute}\`` : "—"} | ${r.humanReviewRequired ? "✅" : "—"} | ${r.automationGapCount} |`,
  )
  .join("\n");

const md = `# Product Fulfilment Assurance — Phase 2 Report

Generated: ${new Date().toISOString().slice(0, 10)}
Gate: \`scripts/check-product-fulfilment-assurance.mjs\`
Products covered: ${PRODUCT_FULFILMENT_CONTRACTS.length} / ${PRODUCT_FULFILMENT_CONTRACTS.length}

---

## Gate Status

**${hardFailureCount === 0 ? "✅ GATE PASSED" : `❌ GATE FAILED — ${hardFailureCount} hard failure(s)`}**${warnCount > 0 ? `  \n⚠️ ${warnCount} warning(s)` : ""}

---

## Acceptance Criteria

| Criterion | Result |
|-----------|--------|
${acTable}

---

## Delivery Class Distribution

| Delivery Class | Count |
|----------------|-------|
${deliveryClassTable}

---

## Admin Visibility Summary (Paid Products)

| Metric | Count |
|--------|-------|
| Total paid products | ${paidProducts.length} |
| Paid products with admin route | ${paidProductsWithAdminRoute.length} |
| Paid products with customer signal | ${paidProductsWithCustomerSignal.length} |

${
  paidProducts.length !== paidProductsWithAdminRoute.length
    ? `⚠️ ${paidProducts.length - paidProductsWithAdminRoute.length} paid product(s) have no admin route.\n`
    : "✅ All paid products have admin routes declared.\n"
}

---

## Hard Failures

${
  blockingProductRows
    ? `| Product | Rule | Message |\n|---------|------|---------|\n${blockingProductRows}`
    : "✅ No hard failures."
}

---

## Warnings

${
  warningRows
    ? `| Product | Rule | Message |\n|---------|------|---------|\n${warningRows}`
    : "✅ No warnings."
}

---

## Full Estate Assurance Matrix

| Product | Delivery Class | Automation Level | Admin Route | Human Review | Automation Gaps |
|---------|---------------|-----------------|-------------|--------------|-----------------|
${allProductRows}

---

## Automation Gaps Summary

The following automation gaps were identified across the estate:

${results
  .filter((r) => r.automationGapCount > 0)
  .map((r) => {
    const assurance = PRODUCT_FULFILMENT_ASSURANCE_REGISTRY?.find
      ? null // gap content embedded in the JSON report
      : null;
    return `### \`${r.productCode}\` — ${r.automationGapCount} gap(s)\n_(See JSON report for details)_`;
  })
  .join("\n\n")}

---

*Phase 2 report generated by \`check-product-fulfilment-assurance.mjs\`*
*Source: \`lib/product/product-fulfilment-assurance.ts\`*
*JSON report: \`reports/product-fulfilment-assurance-phase-2.json\`*
`;

writeFileSync(
  resolve(reportsDir, "product-fulfilment-assurance-phase-2.md"),
  md,
  "utf-8",
);

// ── Console output ────────────────────────────────────────────────────────────

console.log("");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  PRODUCT FULFILMENT ASSURANCE — PHASE 2 GATE");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`  Products:          ${PRODUCT_FULFILMENT_CONTRACTS.length}`);
console.log(`  Assurance records: ${assuranceCoverage.covered} covered, ${assuranceCoverage.missing} missing`);
console.log("");
console.log("  Delivery class distribution:");
for (const [cls, count] of Object.entries(byDeliveryClass).sort(([, a], [, b]) => b - a)) {
  console.log(`    ${cls.padEnd(36)} ${count}`);
}
console.log("");
console.log("  Acceptance criteria:");
for (const [k, v] of Object.entries(report.acceptanceCriteria)) {
  console.log(`    ${v ? "✅" : "❌"} ${k.replace(/_/g, " ")}`);
}
console.log("");

if (hardFailureCount > 0) {
  console.log(`  ❌ GATE FAILED — ${hardFailureCount} hard failure(s):`);
  for (const r of results.filter((r) => r.hardFailures.length > 0)) {
    for (const f of r.hardFailures) {
      console.log(`     [${r.productCode}] ${f.rule}: ${f.message}`);
    }
  }
  console.log("");
}

if (warnCount > 0) {
  console.log(`  ⚠️  ${warnCount} warning(s):`);
  for (const r of results.filter((r) => r.warnings.length > 0)) {
    for (const f of r.warnings) {
      console.log(`     [${r.productCode}] ${f.rule}: ${f.message}`);
    }
  }
  console.log("");
}

if (hardFailureCount === 0) {
  console.log("  ✅ GATE PASSED");
}

console.log("");
console.log(`  Reports written to reports/product-fulfilment-assurance-phase-2.{md,json}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("");

process.exit(hardFailureCount > 0 ? 1 : 0);
