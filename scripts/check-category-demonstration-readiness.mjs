#!/usr/bin/env node
/**
 * Scope-aware category demonstration readiness gate.
 *
 * Selected route proof can demonstrate the pattern. It cannot declare estate,
 * market, production, or category readiness unless the 43-product coverage
 * matrix and dependent checkout/report/admin gates are clean.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");

const routeProof = readJson("category-route-proof.json", { routes: [] });
const matrix = readJson("product-authority-coverage-matrix.json", { products: [] });
const checkout = readJson("checkout-authority-coverage.json", { rows: [] });
const report = readJson("report-authority-coverage.json", { rows: [] });
const admin = readJson("admin-authority-coverage.json", { rows: [] });
const contract = readJson("product-authority-contract.json", { contracts: [] });
const surfaceClaims = readJson("surface-claim-authority.json", readJson("surface-claim-authority-gate.json", {}));

const routesAudited = routeProof.routesAudited ?? routeProof.routes?.length ?? 0;
const routesDemonstratingAuthority = routeProof.routesDemonstrating ?? routeProof.routes?.filter((route) => route.demonstrating).length ?? 0;
const productsClassified = matrix.products?.length ?? 0;
const checkoutFailures = failuresFrom(checkout);
const reportFailures = failuresFrom(report);
const adminFailures = failuresFrom(admin);
const publicClaimFailures = publicClaimFailuresFrom(surfaceClaims);
const productsMissingAuthorityContract = (matrix.products ?? [])
  .filter((product) => !product.productAuthorityContractExists && !product.staticReferenceInternalExemption)
  .map((product) => product.productCode);

const estateCoverageClean = productsClassified === 43 &&
  checkoutFailures.length === 0 &&
  reportFailures.length === 0 &&
  adminFailures.length === 0 &&
  publicClaimFailures.length === 0 &&
  productsMissingAuthorityContract.length === 0;

const readinessScope = deriveScope({
  routesDemonstratingAuthority,
  productsClassified,
  estateCoverageClean,
});
const localPatternPassed = routesDemonstratingAuthority >= 3;
const gateStatus = estateCoverageClean
  ? "PASSED_ESTATE"
  : localPatternPassed
    ? "PASSED_LOCAL_PATTERN_ONLY"
    : "FAILED";

const result = {
  generatedAt: new Date().toISOString(),
  gateStatus,
  readinessScope,
  estateReadinessAchieved: estateCoverageClean,
  localPatternDemonstrated: localPatternPassed,
  mandatoryStatusBlock: {
    localGateResult: gateStatus,
    estateCoverageResult: estateCoverageClean ? "estate_coverage_clean" : "estate_coverage_has_findings",
    categoryReadinessScope: readinessScope,
    productsCovered: `${productsClassified}/43`,
    productsMissingCoverage: productsMissingAuthorityContract.length,
    checkoutFailures: checkoutFailures.length,
    reportFailures: reportFailures.length,
    adminFailures: adminFailures.length,
    finalAuthorityPosition: estateCoverageClean
      ? "Estate category demonstration may be claimed."
      : "Only selected-route pattern demonstration may be claimed.",
  },
  routeProofSummary: {
    routesAudited,
    routesDemonstratingAuthority,
    routesWithAuthority: routeProof.routesWithAuthority ?? 0,
    routesWithEvidence: routeProof.routesWithEvidence ?? 0,
    routesWithLimitations: routeProof.routesWithLimitations ?? 0,
    routesWithNextAction: routeProof.routesWithNextAction ?? 0,
    overclaimRisks: routeProof.overclaim_risks ?? 0,
  },
  estateSummary: {
    productsClassified,
    directContractsValidated: contract.contracts?.length ?? 0,
    productsMissingAuthorityContract,
    checkoutFailures,
    reportFailures,
    adminFailures,
    publicClaimFailures,
  },
  blockingReasons: blockingReasons({
    productsClassified,
    checkoutFailures,
    reportFailures,
    adminFailures,
    publicClaimFailures,
    productsMissingAuthorityContract,
  }),
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "category-demonstration-readiness.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "category-demonstration-readiness.md"), renderMarkdown(result));

console.log("CATEGORY DEMONSTRATION READINESS GATE");
console.log(`Local gate result: ${result.mandatoryStatusBlock.localGateResult}`);
console.log(`Estate coverage result: ${result.mandatoryStatusBlock.estateCoverageResult}`);
console.log(`Category readiness scope: ${result.readinessScope}`);
console.log(`Products covered: ${result.mandatoryStatusBlock.productsCovered}`);
console.log(`Checkout failures: ${checkoutFailures.length}`);
console.log(`Report failures: ${reportFailures.length}`);
console.log(`Admin failures: ${adminFailures.length}`);
console.log(`Final authority position: ${result.mandatoryStatusBlock.finalAuthorityPosition}`);

process.exit(gateStatus === "FAILED" ? 1 : 0);

function deriveScope({ routesDemonstratingAuthority, productsClassified, estateCoverageClean }) {
  if (estateCoverageClean) return "estate_category_demonstrated";
  if (productsClassified === 43 && routesDemonstratingAuthority >= 8) return "estate_authority_visible_with_findings";
  if (productsClassified === 43) return "estate_partially_governed";
  if (routesDemonstratingAuthority >= 6) return "product_group_demonstrated";
  if (routesDemonstratingAuthority >= 3) return "pattern_demonstrated_on_selected_routes";
  return "not_category_ready";
}

function blockingReasons(input) {
  const reasons = [];
  if (input.productsClassified !== 43) reasons.push("43/43 products are not classified.");
  if (input.productsMissingAuthorityContract.length > 0) reasons.push(`${input.productsMissingAuthorityContract.length} public/non-exempt product(s) missing ProductAuthorityContract coverage.`);
  if (input.checkoutFailures.length > 0) reasons.push(`${input.checkoutFailures.length} checkout / fulfilment authority failure(s).`);
  if (input.reportFailures.length > 0) reasons.push(`${input.reportFailures.length} report-surface authority failure(s).`);
  if (input.adminFailures.length > 0) reasons.push(`${input.adminFailures.length} admin release authority failure(s).`);
  if (input.publicClaimFailures.length > 0) reasons.push(`${input.publicClaimFailures.length} unsupported public claim failure(s).`);
  return reasons;
}

function failuresFrom(report) {
  return (report.rows ?? [])
    .filter((row) => row.result === "FAIL")
    .map((row) => row.productCode ?? row.route ?? row.name)
    .filter(Boolean);
}

function publicClaimFailuresFrom(report) {
  if (Array.isArray(report.unsupportedClaims)) return report.unsupportedClaims;
  if (typeof report.unsupportedClaims === "number" && report.unsupportedClaims > 0) return [`${report.unsupportedClaims} unsupported claims`];
  if (Array.isArray(report.findings)) {
    return report.findings.filter((finding) => /unsupported|overclaim|exceeds/i.test(JSON.stringify(finding)));
  }
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
  return `# Category Demonstration Readiness

## Mandatory Status Block

- Local Gate Result: ${data.mandatoryStatusBlock.localGateResult}
- Estate Coverage Result: ${data.mandatoryStatusBlock.estateCoverageResult}
- Category Readiness Scope: ${data.mandatoryStatusBlock.categoryReadinessScope}
- Products Covered: ${data.mandatoryStatusBlock.productsCovered}
- Products Missing Coverage: ${data.mandatoryStatusBlock.productsMissingCoverage}
- Checkout Failures: ${data.mandatoryStatusBlock.checkoutFailures}
- Report Failures: ${data.mandatoryStatusBlock.reportFailures}
- Admin Failures: ${data.mandatoryStatusBlock.adminFailures}
- Final Authority Position: ${data.mandatoryStatusBlock.finalAuthorityPosition}

## Route Pattern Proof

- Routes audited: ${data.routeProofSummary.routesAudited}
- Routes demonstrating authority pattern: ${data.routeProofSummary.routesDemonstratingAuthority}
- Routes with authority visible: ${data.routeProofSummary.routesWithAuthority}
- Routes with evidence visible: ${data.routeProofSummary.routesWithEvidence}
- Routes with limitations shown: ${data.routeProofSummary.routesWithLimitations}
- Routes with next action clear: ${data.routeProofSummary.routesWithNextAction}
- Overclaim risks: ${data.routeProofSummary.overclaimRisks}

## Estate Blockers

${data.blockingReasons.length ? data.blockingReasons.map((reason) => `- ${reason}`).join("\n") : "- None"}

## Interpretation

${data.estateReadinessAchieved
  ? "Estate coverage is clean; estate category demonstration may be claimed."
  : "Selected routes demonstrate the pattern only. Estate readiness remains blocked until coverage failures are cleared."}
`;
}
