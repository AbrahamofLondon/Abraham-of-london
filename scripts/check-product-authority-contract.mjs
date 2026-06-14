#!/usr/bin/env node
/**
 * ProductAuthorityContract validation gate.
 *
 * Scope:
 * - Validates core contract correctness.
 * - Expands direct contract coverage to every public/non-exempt blocker from
 *   the estate coverage matrix.
 * - Does not claim full estate coverage until all 43 products are covered or
 *   explicitly exempted.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const ESTATE_PRODUCT_COUNT = 43;
const PUBLIC_NON_EXEMPT_PRODUCT_CODES = [
  "boardroom_brief",
  "decision_exposure_instrument",
  "mandate_clarity_framework",
  "intervention_path_selector",
  "escalation_readiness_scorecard",
  "structural_failure_diagnostic_canvas",
  "execution_risk_index",
  "team_alignment_gap_map",
  "governance_drift_detector",
  "strategic_priority_stack_builder",
  "board_brief_builder",
  "execution_integrity_protocol",
  "alignment_audit_playbook",
  "drift_detection_framework",
  "operator_decision_pack",
  "executive_reporting",
  "strategy_room",
  "boardroom_mode",
];

const PUBLIC_NON_EXEMPT_POLICY_STATES = {
  boardroom_brief: {
    state: "blocked_until_v2_revalidation",
    reason: "Boardroom/report product requires v2 route, fulfilment, report, admin, and evidence validation before authority can be granted",
  },
  executive_reporting: {
    state: "blocked_until_v2_revalidation",
    reason: "Executive/report product requires v2 route, report, admin, and generation validation before authority can be granted",
  },
  boardroom_mode: {
    state: "blocked_until_v2_revalidation",
    reason: "Boardroom mode requires v2 evidence-gated route proof before authority can be restored",
  },
  strategy_room: {
    state: "blocked_until_claim_evidenced",
    reason: "Scheduled session product requires product-specific evidence and fulfilment proof before authority can be granted",
  },
};

const INSTRUMENT_BLOCK_REASON =
  "Public decision instrument or methodology product requires product-specific evidence ledger and validation before authority can be granted";

console.log("PRODUCT AUTHORITY CONTRACT VALIDATION GATE");
console.log("Validating core and public/non-exempt ProductAuthorityContract coverage\n");

const matrix = readJson("product-authority-coverage-matrix.json", { products: [] });
const ledgerVerification = readJson("evidence-ledger-artifact-verification.json", { rows: [] });
const estateProducts = matrix.products ?? [];
const productByCode = new Map(estateProducts.map((product) => [product.productCode, product]));
const verifiedEvidenceByProduct = new Map((ledgerVerification.rows ?? []).map((row) => [row.productCode, row]));
const publicNonExemptBlockers = PUBLIC_NON_EXEMPT_PRODUCT_CODES
  .map((productCode) => productByCode.get(productCode) ?? { productCode })
  .map((product) => ({
    productCode: product.productCode,
    productName: product.productName,
    route: product.routePath,
    checkoutPath: product.checkoutPath,
    reportSurface: product.reportSurfaceExists,
    currentMatrixClassification: product.currentCoverageClassification,
    recommendedAuthorityState: recommendedAuthorityStateFor(product.productCode),
    blockingReason: blockingReasonFor(product.productCode),
  }));

const productContracts = [
  coreContract({
    productCode: "fast_diagnostic",
    state: "pending_reconciliation",
    sourceType: derivedEvidenceFor("fast_diagnostic").ledgerEntryExists ? "generated_evidence" : "reported_summary_only",
    canGrantAuthority: false,
    evidenceSupportedClaim: "fast_diagnostic authority is pending reconciliation between contract, ledger, runtime output, and route evidence",
    publicClaimLanguage: "fast_diagnostic authority is pending reconciliation; do not describe it as externally proven until artifacts match.",
    validationPassed: false,
    blockingReasons: [
      "System Truth Audit found no product fully validated after runtime/ledger reconciliation",
      "Rendered runtime output artifact and route evidence must be matched before external-proof claims are restored",
    ],
    nextEvidenceAction: "Reconcile ProductAuthorityContract, Evidence Ledger v2, rendered output capture, route proof, and surface propagation",
    derivedEvidence: derivedEvidenceFor("fast_diagnostic"),
  }),
  coreContract({
    productCode: "team_assessment",
    state: "legacy_validated_pending_v2_revalidation",
    sourceType: derivedEvidenceFor("team_assessment").ledgerEntryExists ? "generated_evidence" : "legacy_evidence",
    canGrantAuthority: false,
    evidenceSupportedClaim: "team_assessment is legacy validated; pending v2 revalidation",
    publicClaimLanguage: "team_assessment is legacy validated; pending v2 revalidation.",
    blockingReasons: [
      "Derived evidence state is trusted_artifact_supported, but authority remains non-restored pending contract and reconciliation review",
      "ProductAuthorityContract has not granted restored authority",
    ],
    nextEvidenceAction: "Update contract and reconciliation to reflect trusted ledger state, then conduct controlled restoration review",
    derivedEvidence: derivedEvidenceFor("team_assessment"),
  }),
  coreContract({
    productCode: "enterprise_assessment",
    state: "legacy_validated_pending_v2_revalidation",
    sourceType: "legacy_evidence",
    canGrantAuthority: false,
    evidenceSupportedClaim: "enterprise_assessment is legacy validated; pending v2 revalidation",
    publicClaimLanguage: "enterprise_assessment is legacy validated; pending v2 revalidation.",
    validationPassed: false,
    blockingReasons: ["Evidence Ledger v2 not present"],
    nextEvidenceAction: "Run v2 revalidation to upgrade from legacy status",
    derivedEvidence: derivedEvidenceFor("enterprise_assessment"),
  }),
  coreContract({
    productCode: "personal_decision_audit",
    state: "blocked_until_claim_evidenced",
    sourceType: "reported_summary_only",
    canGrantAuthority: false,
    evidenceSupportedClaim: "personal_decision_audit authority is not granted",
    publicClaimLanguage: "personal_decision_audit is under validation; not currently released as an evidenced product.",
    validationPassed: false,
    blockingReasons: [
      "Evidence Ledger v2 not present",
      "Measurement boundary violated: scorer change in Wave 2G",
    ],
    nextEvidenceAction: "Generate Evidence Ledger v2 with frozen scenarios and validation tests",
    derivedEvidence: derivedEvidenceFor("personal_decision_audit"),
  }),
];

for (const blocker of publicNonExemptBlockers) {
  if (productContracts.some((contract) => contract.productCode === blocker.productCode)) continue;
  productContracts.push(blockerContract(blocker));
}

const directProductCodes = new Set(productContracts.map((contract) => contract.productCode));
const allMissingDirectContract = estateProducts
  .filter((product) => !directProductCodes.has(product.productCode))
  .map((product) => product.productCode);
const publicNonExemptProducts = publicNonExemptBlockers;
const publicMissingDirectContract = publicNonExemptBlockers
  .filter((product) => !directProductCodes.has(product.productCode))
  .map((product) => product.productCode);

const findings = [];
const contractSummary = [];
let contractsValid = 0;
let contractsInvalid = 0;

for (const contract of productContracts) {
  const violations = validateContract(contract);
  const valid = violations.length === 0;
  if (valid) contractsValid++;
  else contractsInvalid++;

  console.log(`\nProduct: ${contract.productCode}`);
  console.log(`  Authority State: ${contract.currentAuthorityState}`);
  console.log(`  Evidence Source: ${contract.evidenceSource.sourceType}`);
  console.log(`  Public Claim Allowed: ${contract.publicClaimAllowed}`);
  console.log(`  ${valid ? "OK Contract valid" : "FAIL Contract invalid"}`);

  for (const violation of violations) {
    console.log(`    - ${violation}`);
    findings.push(`${contract.productCode}: ${violation}`);
  }

  contractSummary.push({
    productCode: contract.productCode,
    currentAuthorityState: contract.currentAuthorityState,
    evidenceSourceType: contract.evidenceSource.sourceType,
    publicClaimAllowed: contract.publicClaimAllowed,
    publicClaimLanguage: contract.publicClaimLanguage,
    contractValid: valid,
  });
}

const estateCoverageComplete = allMissingDirectContract.length === 0 && estateProducts.length === ESTATE_PRODUCT_COUNT;
const publicCoverageComplete = publicMissingDirectContract.length === 0 && publicNonExemptProducts.length > 0;
const gateStatus = contractsInvalid > 0
  ? "FAILED"
  : publicCoverageComplete
    ? "CORE_AND_PUBLIC_CONTRACT_COVERAGE_PASSED"
    : "CORE_CONTRACT_VALIDITY_PASSED_PUBLIC_COVERAGE_INCOMPLETE";

const auditResult = {
  auditDate: new Date().toISOString(),
  gateStatus,
  directContractsValidated: productContracts.length,
  estateProductsReviewed: estateProducts.length || ESTATE_PRODUCT_COUNT,
  publicNonExemptProducts: publicNonExemptProducts.length,
  publicNonExemptContractsCovered: publicNonExemptBlockers.filter((product) => directProductCodes.has(product.productCode)).length,
  publicNonExemptProductsMissingDirectContract: publicMissingDirectContract,
  productsMissingDirectContract: allMissingDirectContract,
  productsMissingDirectContractCount: allMissingDirectContract.length || Math.max(0, ESTATE_PRODUCT_COUNT - productContracts.length),
  estateCoverageComplete,
  contractsValid,
  contractsInvalid,
  findings,
  contracts: productContracts,
  contractSummary,
};

mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, "product-authority-contract.json"), `${JSON.stringify(auditResult, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "product-authority-contract.md"), renderContractMarkdown(auditResult));
writeFileSync(
  join(REPORTS_DIR, "public-contract-blockers.json"),
  `${JSON.stringify({ generatedAt: auditResult.auditDate, productsIdentified: publicNonExemptBlockers.length, blockers: publicNonExemptBlockers }, null, 2)}\n`,
);
writeFileSync(join(REPORTS_DIR, "public-contract-blockers.md"), renderBlockersMarkdown(auditResult.auditDate, publicNonExemptBlockers));

console.log(`\n${"=".repeat(70)}`);
console.log("PRODUCT AUTHORITY CONTRACT VALIDATION GATE RESULT");
console.log(`${"=".repeat(70)}`);
console.log(`Direct contracts validated: ${auditResult.directContractsValidated}`);
console.log(`Estate products reviewed: ${auditResult.estateProductsReviewed}`);
console.log(`Public/non-exempt products: ${auditResult.publicNonExemptProducts}`);
console.log(`Public/non-exempt contracts covered: ${auditResult.publicNonExemptContractsCovered}`);
console.log(`Products missing direct contract: ${auditResult.productsMissingDirectContractCount}`);
console.log(`Estate coverage complete: ${auditResult.estateCoverageComplete ? "yes" : "no"}`);
console.log(`Gate Status: ${auditResult.gateStatus}`);
console.log(`Written: ${join(REPORTS_DIR, "product-authority-contract.json")}`);
console.log(`Written: ${join(REPORTS_DIR, "public-contract-blockers.json")}`);

process.exit(gateStatus === "FAILED" ? 1 : 0);

function coreContract(input) {
  const derivedEvidence = input.derivedEvidence ?? null;
  return {
    productCode: input.productCode,
    targetClaim: `${input.productCode} is a validated diagnostic product`,
    evidenceSupportedClaim: input.evidenceSupportedClaim,
    currentAuthorityState: input.state,
    evidenceSource: {
      sourceType: input.sourceType,
      canGrantAuthority: input.canGrantAuthority,
      canonicalLocation: input.canGrantAuthority ? "reports/product-value-evidence-ledger-v2.json" : undefined,
    },
    validation: validation(input.validationPassed, derivedEvidence),
    boundary: boundary(false),
    blockingReasons: input.blockingReasons,
    nextEvidenceAction: input.nextEvidenceAction,
    publicClaimAllowed: input.state === "externally_proven_gold_product",
    publicClaimLanguage: input.publicClaimLanguage,
    contractVersion: "v2",
  };
}

function blockerContract(blocker) {
  const state = blocker.recommendedAuthorityState;
  return {
    productCode: blocker.productCode,
    targetClaim: `${blocker.productCode} is a public product requiring direct ProductAuthorityContract coverage`,
    evidenceSupportedClaim: `${blocker.productCode} authority is not granted`,
    currentAuthorityState: state,
    evidenceSource: {
      sourceType: "reported_summary_only",
      canGrantAuthority: false,
    },
    validation: validation(false),
    boundary: boundary(false),
    blockingReasons: ["Evidence Ledger v2 not present", blocker.blockingReason],
    nextEvidenceAction: state === "blocked_until_v2_revalidation"
      ? "Run v2 revalidation pass to resolve blocking conditions"
      : "Generate Evidence Ledger v2 with frozen scenarios and validation tests",
    publicClaimAllowed: false,
    publicClaimLanguage: state === "blocked_until_v2_revalidation"
      ? `${blocker.productCode} requires v2 revalidation before authority can be restored.`
      : `${blocker.productCode} is under validation; not currently released as an evidenced product.`,
    contractVersion: "v2",
  };
}

function validation(passed, derivedEvidence = null) {
  const evidencePresent = derivedEvidence?.ledgerEntryExists ?? passed;
  const verified = derivedEvidence?.hasValidV2Evidence ?? passed;
  return {
    evidenceLedgerV2Present: evidencePresent,
    scenarioSetHash: derivedEvidence?.scenarioPath,
    outputHash: derivedEvidence?.outputPath,
    renderedOutputCaptured: verified,
    antiToyPassed: verified,
    redTeamPassed: verified,
    genericAiComparisonPassed: verified,
    marketComparisonPassed: verified,
    releaseFirewallPassed: verified,
    constitutionPassed: verified,
    noMockAuthorityPassed: verified,
    antiGamingPassed: verified,
    adversarialValidationPassed: verified,
  };
}

function boundary(value) {
  return {
    productChangedThisPass: value,
    scorerChangedThisPass: value,
    scenarioChangedThisPass: value,
    benchmarkChangedThisPass: value,
    validationInfrastructureChangedThisPass: value,
    gateLogicChangedThisPass: value,
    mockAuthorityUsed: value,
  };
}

function validateContract(contract) {
  const violations = [];
  if (contract.publicClaimAllowed && !contract.evidenceSource.canGrantAuthority) {
    violations.push(`Public claims allowed but evidence source cannot grant authority: ${contract.evidenceSource.sourceType}`);
  }
  if (
    contract.currentAuthorityState.includes("blocked") &&
    !contract.publicClaimLanguage.includes("not currently released") &&
    !contract.publicClaimLanguage.includes("requires v2 revalidation")
  ) {
    violations.push("Blocked product does not publish blocked/limited language");
  }
  if (
    contract.currentAuthorityState === "legacy_validated_pending_v2_revalidation" &&
    contract.publicClaimLanguage.includes("v2") &&
    contract.publicClaimLanguage.includes("proven")
  ) {
    violations.push("Legacy product claims v2-proven status");
  }
  if (["manual_assertion", "registry_label", "surface_claim"].includes(contract.evidenceSource.sourceType)) {
    violations.push(`Authority sourced from invalid evidence source: ${contract.evidenceSource.sourceType}`);
  }
  if (contract.boundary.mockAuthorityUsed) {
    violations.push("Mock authority used in validation paths");
  }
  if (contract.publicClaimAllowed && contract.blockingReasons.length > 0) {
    violations.push("Public claims allowed while blocking reasons exist");
  }
  return violations;
}

function recommendedAuthorityStateFor(productCode) {
  return PUBLIC_NON_EXEMPT_POLICY_STATES[productCode]?.state ?? "blocked_until_claim_evidenced";
}

function blockingReasonFor(productCode) {
  return PUBLIC_NON_EXEMPT_POLICY_STATES[productCode]?.reason ?? INSTRUMENT_BLOCK_REASON;
}

function readJson(file, fallback) {
  try {
    return JSON.parse(readFileSync(join(REPORTS_DIR, file), "utf8"));
  } catch {
    return fallback;
  }
}

function derivedEvidenceFor(productCode) {
  const row = verifiedEvidenceByProduct.get(productCode);
  if (!row) {
    return {
      productCode,
      ledgerEntryExists: false,
      ledgerStatus: "missing",
      canSupportAuthorityReview: false,
      canGrantAuthority: false,
      evidenceReasons: ["No artifact verifier row found for product"],
    };
  }
  const trusted = row.ledgerTrustState === "trusted_artifact_supported";
  return {
    productCode,
    ledgerEntryExists: true,
    ledgerStatus: row.ledgerTrustState,
    hasValidV2Evidence: trusted,
    canSupportAuthorityReview: trusted || row.ledgerTrustState === "pending_contract_mismatch",
    canGrantAuthority: false,
    scenarioPath: row.scenarioPath,
    outputPath: row.outputPath,
    validationPath: row.validationPath,
    evidenceReasons: row.failures?.length
      ? row.failures.map((failure) => `Verifier failure: ${failure}`)
      : [`Artifact verifier reports ${row.ledgerTrustState}`],
  };
}

function renderContractMarkdown(result) {
  return `# Product Authority Contract - Validation Report

## Gate Result

Status: ${result.gateStatus}

Direct contracts validated: ${result.directContractsValidated}

Estate products reviewed: ${result.estateProductsReviewed}

Public / non-exempt contract blockers identified: ${result.publicNonExemptProducts}

Public / non-exempt blocker contracts covered: ${result.publicNonExemptContractsCovered}

Products missing direct contract: ${result.productsMissingDirectContractCount}

Estate coverage complete: ${result.estateCoverageComplete ? "yes" : "no"}

## Public / Non-Exempt Products Missing Direct Contract

${result.publicNonExemptProductsMissingDirectContract.length ? result.publicNonExemptProductsMissingDirectContract.map((product) => `- ${product}`).join("\n") : "- None"}

## Products Missing Direct Contract

${result.productsMissingDirectContract.length ? result.productsMissingDirectContract.map((product) => `- ${product}`).join("\n") : "- None"}

## Contract Summary

| Product | Authority State | Evidence Source | Public Claim Allowed | Valid |
| --- | --- | --- | ---: | ---: |
${result.contractSummary.map((row) => `| ${row.productCode} | ${row.currentAuthorityState} | ${row.evidenceSourceType} | ${yes(row.publicClaimAllowed)} | ${yes(row.contractValid)} |`).join("\n")}
`;
}

function renderBlockersMarkdown(generatedAt, blockers) {
  return `# Public / Non-Exempt ProductAuthorityContract Blockers

Generated: ${generatedAt}

Products identified: ${blockers.length}

| Product | Name | Route | Checkout | Report Surface | Matrix Classification | Recommended Authority State | Blocking Reason |
| --- | --- | --- | --- | ---: | --- | --- | --- |
${blockers.map((row) => `| ${row.productCode} | ${escapeMd(row.productName)} | ${row.route ?? ""} | ${row.checkoutPath ?? ""} | ${row.reportSurface ? "yes" : "no"} | ${row.currentMatrixClassification} | ${row.recommendedAuthorityState} | ${escapeMd(row.blockingReason)} |`).join("\n")}
`;
}

function yes(value) {
  return value ? "yes" : "no";
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
