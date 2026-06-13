#!/usr/bin/env node
/**
 * Estate Authority Integrity Lock.
 *
 * This gate separates selected-route pattern proof from estate readiness. A
 * local pass is allowed to prove a pattern only; it cannot imply market,
 * production, category, or estate readiness while estate coverage has findings.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const REQUIRED_PRODUCTS = 43;
const BANNED_UNSCOPED_STATUSES = [
  "category_demonstrated",
  "production_ready",
  "market_ready",
  "estate_ready",
  "fully_integrated",
  "authority_operational_estatewide",
];

const matrix = readJson("product-authority-coverage-matrix.json", { products: [] });
const checkout = readJson("checkout-authority-coverage.json", { rows: [] });
const report = readJson("report-authority-coverage.json", { rows: [] });
const admin = readJson("admin-authority-coverage.json", { rows: [] });
const routeProof = readJson("category-route-proof.json", { routes: [] });
const categoryReadiness = readJson("category-demonstration-readiness.json", {});
const contract = readJson("product-authority-contract.json", { contracts: [] });
const surfaceClaims = readJson("surface-claim-authority.json", readJson("surface-claim-authority-gate.json", {}));

const products = matrix.products ?? [];
const productsMissingAuthorityContract = products
  .filter((product) => !product.productAuthorityContractExists)
  .map((product) => product.productCode);
const publicProductsMissingAuthorityContract = products
  .filter((product) => !product.productAuthorityContractExists && !product.staticReferenceInternalExemption)
  .map((product) => product.productCode);
const staticReferenceExemptions = products
  .filter((product) => product.currentCoverageClassification === "static_reference_correctly_labelled")
  .map((product) => ({
    productCode: product.productCode,
    explicit: Boolean(product.staticReferenceInternalExemption),
    reason: product.evidenceSupportedClaim || "Static/reference classification recorded in coverage matrix.",
    canClaimIntelligence: false,
    canClaimJudgement: false,
  }));
const internalOnlyExemptions = products
  .filter((product) => product.currentCoverageClassification === "internal_only_exempt")
  .map((product) => ({
    productCode: product.productCode,
    explicit: Boolean(product.staticReferenceInternalExemption),
    reason: product.evidenceSupportedClaim || "Internal-only classification recorded in coverage matrix.",
  }));

const checkoutFailures = failuresFrom(checkout);
const adminSurfaceFailures = failuresFrom(admin);
const reportSurfaceFailures = failuresFrom(report);
const publicClaimFailures = publicClaimFailuresFrom(surfaceClaims);
const localPassesThatCannotImplyEstateReadiness = detectLocalOverstatements({
  matrix,
  routeProof,
  categoryReadiness,
  contract,
  checkout,
  report,
  admin,
});

const result = evaluate({
  totalProducts: REQUIRED_PRODUCTS,
  productsClassified: products.length,
  directAuthorityContracts: products.filter((product) => product.productAuthorityContractExists).length,
  productsMissingAuthorityContract,
  publicProductsMissingAuthorityContract,
  routesAudited: routeProof.routesAudited ?? routeProof.routes?.length ?? 0,
  routesDemonstratingAuthority: routeProof.routesDemonstrating ?? routeProof.routes?.filter((route) => route.demonstrating).length ?? 0,
  checkoutFailures,
  adminSurfaceFailures,
  reportSurfaceFailures,
  publicClaimFailures,
  staticReferenceExemptions,
  internalOnlyExemptions,
  localPassesThatCannotImplyEstateReadiness,
});

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "estate-authority-integrity.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "estate-authority-integrity.md"), renderMarkdown(result));

console.log("ESTATE AUTHORITY INTEGRITY LOCK");
console.log(`Gate: ${result.gatePassed ? "PASSED" : "FAILED_WITH_FINDINGS"}`);
console.log(`Readiness scope: ${result.readinessScope}`);
console.log(`Products classified: ${result.productsClassified}/${result.totalProducts}`);
console.log(`Missing direct authority contract: ${result.productsMissingAuthorityContract.length}`);
console.log(`Checkout failures: ${result.checkoutFailures.length}`);
console.log(`Report failures: ${result.reportSurfaceFailures.length}`);
console.log(`Admin failures: ${result.adminSurfaceFailures.length}`);
console.log(`Local passes contained: ${result.localPassesThatCannotImplyEstateReadiness.length}`);

process.exit(result.gatePassed ? 0 : 1);

function evaluate(input) {
  const blockingReasons = [];
  if (input.productsClassified !== input.totalProducts) {
    blockingReasons.push("43/43 products are not classified.");
  }
  if (input.publicClaimFailures.length > 0) {
    blockingReasons.push(`${input.publicClaimFailures.length} unsupported public claim failure(s).`);
  }
  if (input.checkoutFailures.length > 0) {
    blockingReasons.push(`${input.checkoutFailures.length} checkout / fulfilment authority failure(s).`);
  }
  if (input.adminSurfaceFailures.length > 0) {
    blockingReasons.push(`${input.adminSurfaceFailures.length} admin release authority failure(s).`);
  }
  if (input.reportSurfaceFailures.length > 0) {
    blockingReasons.push(`${input.reportSurfaceFailures.length} report-surface authority failure(s).`);
  }
  if (input.publicProductsMissingAuthorityContract.length > 0) {
    blockingReasons.push(`${input.publicProductsMissingAuthorityContract.length} public/non-exempt product(s) missing direct ProductAuthorityContract coverage.`);
  }
  if (input.staticReferenceExemptions.some((exemption) => !exemption.explicit)) {
    blockingReasons.push("One or more static/reference exemptions are not explicit.");
  }
  if (input.internalOnlyExemptions.some((exemption) => !exemption.explicit)) {
    blockingReasons.push("One or more internal-only exemptions are not explicit.");
  }
  if (input.localPassesThatCannotImplyEstateReadiness.length > 0) {
    blockingReasons.push("One or more local passes must be scope-contained and cannot imply estate readiness.");
  }

  const estateClean = blockingReasons.filter((reason) => !reason.includes("scope-contained")).length === 0;
  return {
    ...input,
    readinessScope: deriveScope(input, estateClean),
    gatePassed: estateClean,
    localPassContainmentPassed: input.localPassesThatCannotImplyEstateReadiness.every((entry) => entry.includes("scope-contained")),
    blockingReasons,
    localGateResult: localGateResult(),
    estateCoverageResult: estateClean ? "estate_coverage_clean" : "estate_coverage_has_findings",
    finalAuthorityPosition: estateClean
      ? "Estate category demonstration may be claimed."
      : "Only scoped local pattern demonstration may be claimed; estate readiness is blocked.",
  };
}

function deriveScope(input, estateClean) {
  if (estateClean) return "estate_category_demonstrated";
  if (input.productsClassified === REQUIRED_PRODUCTS && input.routesDemonstratingAuthority >= 8) return "estate_authority_visible_with_findings";
  if (input.productsClassified === REQUIRED_PRODUCTS) return "estate_partially_governed";
  if (input.routesDemonstratingAuthority >= 6) return "product_group_demonstrated";
  if (input.routesDemonstratingAuthority >= 3) return "pattern_demonstrated_on_selected_routes";
  return "not_category_ready";
}

function localGateResult() {
  return {
    routeProof: routeProof.gateStatus ?? routeProof.gate ?? (routeProof.routesDemonstrating >= 3 ? "PASSED_LOCAL_PATTERN" : "FAILED"),
    categoryReadiness: categoryReadiness.gateStatus ?? categoryReadiness.gate ?? "unknown",
    productAuthorityContract: contract.gateStatus ?? contract.gate ?? "unknown",
    checkout: checkout.gate ?? "unknown",
    report: report.gate ?? "unknown",
    admin: admin.gate ?? "unknown",
  };
}

function detectLocalOverstatements(reports) {
  const entries = [];
  const serialized = {
    "category-route-proof": JSON.stringify(reports.routeProof),
    "category-demonstration-readiness": JSON.stringify(reports.categoryReadiness),
    "product-authority-contract": JSON.stringify(reports.contract),
  };
  for (const [name, text] of Object.entries(serialized)) {
    for (const banned of BANNED_UNSCOPED_STATUSES) {
      if (text.includes(banned)) {
        entries.push(`${name}: contains local ${banned}; scope-contained by estate integrity lock`);
        break;
      }
    }
  }
  if ((reports.routeProof.routesDemonstrating ?? 0) >= 3) {
    entries.push("category-route-proof: selected-route pattern pass cannot imply estate readiness; scope-contained by estate integrity lock");
  }
  if ((reports.contract.contracts?.length ?? 0) < REQUIRED_PRODUCTS && reports.contract.gateStatus === "PASSED") {
    entries.push("product-authority-contract: core contract validity pass cannot imply estate contract coverage; scope-contained by estate integrity lock");
  }
  return [...new Set(entries)];
}

function failuresFrom(report) {
  return (report.rows ?? [])
    .filter((row) => row.result === "FAIL")
    .map((row) => row.productCode ?? row.route ?? row.name)
    .filter(Boolean);
}

function publicClaimFailuresFrom(report) {
  if (Array.isArray(report.unsupportedClaims)) return report.unsupportedClaims.map((claim) => claim.productCode ?? claim.surface ?? JSON.stringify(claim));
  if (Array.isArray(report.findings)) {
    return report.findings
      .filter((finding) => /unsupported|overclaim|exceeds/i.test(JSON.stringify(finding)))
      .map((finding) => finding.productCode ?? finding.surface ?? JSON.stringify(finding).slice(0, 120));
  }
  if (typeof report.unsupportedClaims === "number" && report.unsupportedClaims > 0) return [`${report.unsupportedClaims} unsupported claims`];
  return [];
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(join(REPORTS, file), "utf8"));
  } catch {
    return fallback;
  }
}

function renderMarkdown(data) {
  return `# Estate Authority Integrity Lock

## Mandatory Status Block

- Local Gate Result: ${JSON.stringify(data.localGateResult)}
- Estate Coverage Result: ${data.estateCoverageResult}
- Category Readiness Scope: ${data.readinessScope}
- Products Covered: ${data.productsClassified}/${data.totalProducts}
- Products Missing Coverage: ${data.productsMissingAuthorityContract.length}
- Public Products Missing Coverage: ${data.publicProductsMissingAuthorityContract.length}
- Checkout Failures: ${data.checkoutFailures.length}
- Report Failures: ${data.reportSurfaceFailures.length}
- Admin Failures: ${data.adminSurfaceFailures.length}
- Final Authority Position: ${data.finalAuthorityPosition}

## Gate Result

Gate: ${data.gatePassed ? "PASSED" : "FAILED_WITH_FINDINGS"}

## Blocking Reasons

${data.blockingReasons.length ? data.blockingReasons.map((reason) => `- ${reason}`).join("\n") : "- None"}

## Local Passes That Cannot Imply Estate Readiness

${data.localPassesThatCannotImplyEstateReadiness.length ? data.localPassesThatCannotImplyEstateReadiness.map((entry) => `- ${entry}`).join("\n") : "- None"}

## Missing Direct ProductAuthorityContract Coverage

${data.productsMissingAuthorityContract.length ? data.productsMissingAuthorityContract.map((product) => `- ${product}`).join("\n") : "- None"}

## Public / Non-Exempt Products Missing Direct ProductAuthorityContract Coverage

${data.publicProductsMissingAuthorityContract.length ? data.publicProductsMissingAuthorityContract.map((product) => `- ${product}`).join("\n") : "- None"}

## Checkout / Fulfilment Failures

${data.checkoutFailures.length ? data.checkoutFailures.map((product) => `- ${product}`).join("\n") : "- None"}

## Report Surface Failures

${data.reportSurfaceFailures.length ? data.reportSurfaceFailures.map((product) => `- ${product}`).join("\n") : "- None"}

## Admin Surface Failures

${data.adminSurfaceFailures.length ? data.adminSurfaceFailures.map((product) => `- ${product}`).join("\n") : "- None"}

## Static Reference Exemptions

| Product | Explicit | Can Claim Intelligence | Can Claim Judgement | Reason |
| --- | ---: | ---: | ---: | --- |
${data.staticReferenceExemptions.map((item) => `| ${item.productCode} | ${yes(item.explicit)} | ${yes(item.canClaimIntelligence)} | ${yes(item.canClaimJudgement)} | ${escapeMd(item.reason)} |`).join("\n")}

## Internal-Only Exemptions

| Product | Explicit | Reason |
| --- | ---: | --- |
${data.internalOnlyExemptions.map((item) => `| ${item.productCode} | ${yes(item.explicit)} | ${escapeMd(item.reason)} |`).join("\n")}
`;
}

function yes(value) {
  return value ? "yes" : "no";
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
