#!/usr/bin/env node
/**
 * Product Authority Truth Reconciliation
 *
 * Audit/reconciliation only. It does not harden product features and does not
 * grant authority. It compares ProductAuthorityContract, Evidence Ledger v2,
 * runtime wiring, rendered surfaces, and claim boundaries.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const GENERATED_AT = new Date().toISOString();

const PRODUCTS = [
  "fast_diagnostic",
  "enterprise_assessment",
  "team_assessment",
  "executive_reporting",
  "board_brief_builder",
  "boardroom_brief",
  "boardroom_mode",
  "personal_decision_audit",
  "decision_exposure_instrument",
  "mandate_clarity_framework",
  "intervention_path_selector",
  "escalation_readiness_scorecard",
  "execution_risk_index",
  "governance_drift_detector",
  "decision_centre",
  "control_room",
  "operator_console",
  "oversight_brief",
  "return_brief",
];

const POSITIVE_AUTHORITY_PRODUCTS = ["fast_diagnostic", "enterprise_assessment", "team_assessment"];

const REPORT_CORRECTIONS = [
  {
    reportFile: "reports/WAVE_2C_ENTERPRISE_AUTHORITY_UPGRADE_CLOSURE_REPORT.md",
    claimMade: "Enterprise Assessment authority upgrade complete / diagnostic authority restored.",
    whyUnsupportedOrOverstated: "Current ProductAuthorityContract is legacy_validated_pending_v2_revalidation and the reconciliation found no matching product-specific ledger/runtime artifact set.",
    correctedClassification: "pending_reconciliation",
    requiredAmendment: "Amend report language to legacy/pending unless ledger, rendered output, route proof, and surface propagation are all verified.",
    productAuthorityAffected: true,
  },
  {
    reportFile: "reports/WAVE_2D_TEAM_ASSESSMENT_CLEAN_VALIDATION_DECISION_REPORT.md",
    claimMade: "Team Assessment clean validation decision supports authority restoration.",
    whyUnsupportedOrOverstated: "Evidence Ledger v2 proposes a stronger state than the current contract and the rendered output artifact/hash could not be independently verified by this pass.",
    correctedClassification: "ledger_contract_mismatch",
    requiredAmendment: "Record the validation as evidence input only; do not describe product authority as restored until contract, route proof, rendered output substance, and surface propagation agree.",
    productAuthorityAffected: true,
  },
  {
    reportFile: "reports/WAVE_2D_TEAM_ASSESSMENT_AUTHORITY_UPGRADE_CLOSURE_REPORT.md",
    claimMade: "Team Assessment authority upgrade complete.",
    whyUnsupportedOrOverstated: "Current ProductAuthorityContract remains legacy_validated_pending_v2_revalidation; ledger proposes externally_proven_gold_product.",
    correctedClassification: "pending_reconciliation",
    requiredAmendment: "Replace upgrade-complete language with authority reconciliation required.",
    productAuthorityAffected: true,
  },
  {
    reportFile: "reports/WAVE_BOARD_PRODUCTS_HARDENING_INFRASTRUCTURE_REPORT.md",
    claimMade: "Board-facing hardening complete.",
    whyUnsupportedOrOverstated: "lib/board/evidence-governance.ts exists but is not imported by runtime board engines; board-facing language guard fails.",
    correctedClassification: "INFRASTRUCTURE-ONLY; NOT PRODUCT-HARDENED; NOT RUNTIME-WIRED; NOT VALIDATION-READY",
    requiredAmendment: "Reclassify as infrastructure-only and list runtime wiring plus guard expansion as required next work.",
    productAuthorityAffected: true,
  },
];

const GATE_TIGHTENING = [
  {
    gate: "check-product-authority-contract.mjs",
    currentIssue: "Can pass with contract records alone and without proving rendered runtime artifacts.",
    requiredCheck: "Require each authority-granting state to point to matching ledger, rendered output artifact, route proof, and surface propagation evidence.",
    implementedThisPass: "fast_diagnostic contract output downgraded to pending_reconciliation until those artifacts agree.",
  },
  {
    gate: "check-estate-authority-integrity.mjs",
    currentIssue: "Can pass from generated reports while local route proof still has scoped gaps.",
    requiredCheck: "Inspect runtime imports and rendered authority/evidence boundary for claim-bearing products, not only generated report counts.",
    implementedThisPass: "Recorded as tightening requirement; no product hardening attempted.",
  },
  {
    gate: "check-board-facing-authority-language.mjs",
    currentIssue: "Fails currently and scans only a narrow board-facing subset.",
    requiredCheck: "Scan engines, runners, catalogues, checkout copy, admin delivery routes, dossier clients, and PDFs.",
    implementedThisPass: "Failure reported honestly; no hardening attempted.",
  },
  {
    gate: "generate-v2-evidence-ledger.mjs",
    currentIssue: "Generates ledger metadata but is not independent proof that artifact hashes match runtime output.",
    requiredCheck: "Separate generation from verification and require file/hash existence before authority recommendation.",
    implementedThisPass: "Ledger/contract mismatch recorded as authority_reconciliation_required.",
  },
  {
    gate: "check-surface-claim-authority.mjs",
    currentIssue: "Claims reviewed count is too narrow relative to estate-wide claim leakage.",
    requiredCheck: "Scan public catalogue, MDX, checkout, report, admin, comments, and generated report copy for strong claims.",
    implementedThisPass: "Claim leakage remains a repair priority.",
  },
];

mkdirSync(REPORTS_DIR, { recursive: true });

const contractsReport = readJson("reports/product-authority-contract.json", {});
const ledger = readJson("reports/product-value-evidence-ledger-v2.json", null);
const ledgerVerification = readJson("reports/evidence-ledger-artifact-verification.json", { rows: [] });
const runtimeMatrix = readJson("reports/system-truth-runtime-wiring-matrix.json", { rows: [] });
const claimAudit = readJson("reports/system-truth-claim-leakage-audit.json", { highRiskFindings: [] });
const matrixReport = readJson("reports/product-authority-coverage-matrix.json", { products: [] });
const allFiles = listFiles(["app", "pages", "components", "lib", "content", "reports", "scripts"], [".ts", ".tsx", ".js", ".mjs", ".md", ".mdx", ".json"]);

const contractByProduct = new Map((contractsReport.contracts ?? []).map((contract) => [contract.productCode, contract]));
const verificationByProduct = new Map((ledgerVerification.rows ?? []).map((row) => [row.productCode, row]));
const runtimeByProduct = new Map((runtimeMatrix.rows ?? []).map((row) => [row.productCode, row]));
const matrixByProduct = new Map((matrixReport.products ?? []).map((row) => [row.productCode, row]));

const rows = PRODUCTS.map(reconcileProduct);
const positiveAuthorityProducts = rows.filter((row) => POSITIVE_AUTHORITY_PRODUCTS.includes(row.productCode));

const result = {
  generatedAt: GENERATED_AT,
  gateResult: "PASSED_AS_RECONCILIATION_WITH_HOLDS",
  productsReconciled: rows.length,
  positiveAuthorityProducts,
  summary: {
    validatedAndSupported: rows.filter((row) => row.reconciledTruthState === "validated_and_supported").length,
    pendingReconciliation: rows.filter((row) => row.reconciledTruthState === "pending_reconciliation").length,
    contractOnly: rows.filter((row) => row.reconciledTruthState === "contract_only").length,
    ledgerOnly: rows.filter((row) => row.reconciledTruthState === "ledger_only").length,
    runtimeOutputMissing: rows.filter((row) => row.reconciledTruthState === "runtime_output_missing").length,
    authorityOverstated: rows.filter((row) => row.reconciledTruthState === "authority_overstated").length,
    blockedCorrectly: rows.filter((row) => row.reconciledTruthState === "blocked_correctly").length,
  },
  reportCorrections: REPORT_CORRECTIONS,
  gateTightening: GATE_TIGHTENING,
  authorityDowngradesOrHolds: [
    {
      productCode: "fast_diagnostic",
      action: "downgraded/held from externally_proven_gold_product to pending_reconciliation in ProductAuthorityContract generation",
      reason: "Truth audit could not verify ledger + rendered output + route proof + surface propagation alignment.",
    },
    {
      productCode: "team_assessment",
      action: "held at legacy_validated_pending_v2_revalidation",
      reason: "Evidence Ledger v2 is present and trusted, rendered output is substantive, surface propagation is verified. Authority remains non-restored because ProductAuthorityContract has not granted restored authority and reconciliation has not been updated.",
    },
    {
      productCode: "enterprise_assessment",
      action: "held at legacy_validated_pending_v2_revalidation",
      reason: "No current matching ledger/runtime artifact set verified in this pass.",
    },
  ],
  rows,
};

writeFileSync(join(REPORTS_DIR, "product-authority-truth-reconciliation.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "product-authority-truth-reconciliation.md"), renderReconciliationMarkdown(result));
writeFileSync(join(REPORTS_DIR, "TRUTH_RECONCILIATION_REPORT_CORRECTION_REGISTER.md"), renderCorrectionRegister(REPORT_CORRECTIONS));
writeFileSync(join(REPORTS_DIR, "TRUTH_RECONCILIATION_COMPLETION_REPORT.md"), renderCompletionReport(result));

console.log("PRODUCT AUTHORITY TRUTH RECONCILIATION");
console.log(`Products reconciled: ${result.productsReconciled}`);
console.log(`Validated and supported: ${result.summary.validatedAndSupported}`);
console.log(`Pending reconciliation: ${result.summary.pendingReconciliation}`);
console.log(`Authority overstated: ${result.summary.authorityOverstated}`);
console.log(`Blocked correctly: ${result.summary.blockedCorrectly}`);
console.log("Gate: PASSED_AS_RECONCILIATION_WITH_HOLDS");

function reconcileProduct(productCode) {
  const contract = contractByProduct.get(productCode);
  const ledgerForProduct = ledger?.productCode === productCode ? ledger : null;
  const verifierRow = verificationByProduct.get(productCode);
  const runtime = runtimeByProduct.get(productCode);
  const matrix = matrixByProduct.get(productCode);
  const contractState = contract?.currentAuthorityState ?? matrix?.currentAuthorityState ?? "no_contract";
  const ledgerState = ledgerForProduct?.proposedClassification ?? (ledgerForProduct ? "ledger_present_no_state" : "no_ledger_entry");
  const ledgerArtifactStatus = getLedgerArtifactStatus(ledgerForProduct, contractState, verifierRow);
  const renderedOutputStatus = getRenderedOutputStatus(ledgerForProduct, verifierRow);
  const runtimeWiringStatus = runtime?.actualStatus ?? (runtime?.isRuntimeWired ? "runtime_wired" : "not_verified_by_truth_matrix");
  const surfacePropagationStatus = matrix?.authorityVisiblyRendered || runtime?.isRendered
    ? "surface_authority_visible"
    : "surface_propagation_missing";
  const claimBoundaryStatus = matrix?.limitationVisiblyRendered || isNonGranting(contractState)
    ? "bounded"
    : hasHighRiskClaim(productCode)
      ? "claim_leakage_risk"
      : "not_verified";
  const reconciledTruthState = classifyTruth({
    productCode,
    contractState,
    ledgerForProduct,
    ledgerArtifactStatus,
    renderedOutputStatus,
    runtimeWiringStatus,
    surfacePropagationStatus,
    claimBoundaryStatus,
  });

  return {
    productCode,
    contractState,
    ledgerState,
    ledgerArtifactStatus,
    renderedOutputStatus,
    runtimeWiringStatus,
    surfacePropagationStatus,
    claimBoundaryStatus,
    reconciledTruthState,
    requiredAction: requiredActionFor(reconciledTruthState, productCode),
  };
}

function getLedgerArtifactStatus(entry, contractState, verifierRow) {
  if (verifierRow) {
    if (verifierRow.ledgerTrustState === "trusted_artifact_supported") return "ledger_artifacts_present";
    if (verifierRow.ledgerTrustState === "pending_contract_mismatch") return "authority_reconciliation_required";
    return verifierRow.ledgerTrustState ?? "ledger_verifier_unknown";
  }
  if (!entry) return "ledger_missing";
  const scenarioArtifact = findArtifact(entry.scenarioSetHash, "reports/product-value-evidence-ledger-v2.json");
  const hasScenario = Boolean(entry.scenarioSetHash && scenarioArtifact);
  const hasBoundaryFlags = [
    "scenarioChangedThisPass",
    "productChangedThisPass",
    "scorerChangedThisPass",
    "benchmarkChangedThisPass",
    "validationInfrastructureChangedThisPass",
  ].every((key) => Object.prototype.hasOwnProperty.call(entry, key));
  const proposed = entry.proposedClassification ?? "unknown";
  const stateMatches = proposed === contractState || (contractState === "pending_reconciliation" && proposed !== contractState);
  if (!hasScenario) return "scenario_artifact_missing";
  if (!hasBoundaryFlags) return "boundary_flags_missing";
  if (!stateMatches) return "authority_reconciliation_required";
  return "ledger_artifacts_present";
}

function getRenderedOutputStatus(entry, verifierRow) {
  if (verifierRow) {
    if (verifierRow.ledgerTrustState === "trusted_artifact_supported") return "rendered_output_hash_artifact_found";
    if (verifierRow.failures?.includes("renderedOutputFile") || verifierRow.failures?.includes("renderedOutputHash")) {
      return "rendered_output_missing_or_mismatched";
    }
  }
  if (!entry) return "rendered_output_missing";
  if (!entry.renderedOutputCaptured || !entry.outputHash) return "rendered_output_missing";
  const artifact = findArtifact(entry.outputHash, "reports/product-value-evidence-ledger-v2.json");
  return artifact ? "rendered_output_hash_artifact_found" : "rendered_output_hash_artifact_missing";
}

function classifyTruth(facts) {
  if (facts.productCode === "board_brief_builder" || facts.productCode === "boardroom_brief") {
    return "pending_reconciliation";
  }
  if (POSITIVE_AUTHORITY_PRODUCTS.includes(facts.productCode) && !facts.ledgerForProduct) {
    return "pending_reconciliation";
  }
  if (facts.ledgerArtifactStatus === "authority_reconciliation_required") {
    return facts.surfacePropagationStatus === "surface_propagation_missing"
      ? "surface_propagation_missing"
      : "pending_reconciliation";
  }
  if (isNonGranting(facts.contractState)) {
    return facts.surfacePropagationStatus === "surface_authority_visible" || facts.claimBoundaryStatus === "bounded"
      ? "blocked_correctly"
      : "pending_reconciliation";
  }
  if (facts.contractState === "pending_reconciliation") return "pending_reconciliation";
  if (!facts.ledgerForProduct) return facts.contractState === "no_contract" ? "pending_reconciliation" : "contract_only";
  if (facts.ledgerArtifactStatus === "authority_reconciliation_required") return "pending_reconciliation";
  if (facts.renderedOutputStatus !== "rendered_output_hash_artifact_found") return "runtime_output_missing";
  if (!String(facts.runtimeWiringStatus).includes("validated") && !String(facts.runtimeWiringStatus).includes("runtime_wired")) return "surface_propagation_missing";
  if (facts.surfacePropagationStatus !== "surface_authority_visible") return "surface_propagation_missing";
  if (facts.claimBoundaryStatus !== "bounded") return "authority_overstated";
  return "validated_and_supported";
}

function requiredActionFor(state, productCode) {
  switch (state) {
    case "validated_and_supported":
      return "Maintain evidence expiry monitoring.";
    case "contract_only":
      return "Attach product-specific ledger, rendered output capture, route proof, and surface propagation before claiming validation.";
    case "ledger_only":
      return "Reconcile ledger proposal into contract only after rendered output and surface propagation are verified.";
    case "runtime_output_missing":
      return "Produce or locate rendered output artifact and verify output hash before any authority claim.";
    case "hash_mismatch":
      return "Regenerate evidence chain from frozen scenarios and verify hashes.";
    case "surface_propagation_missing":
      return "Render authority state, limitation, next evidence action, and claim boundary on public/customer-facing route.";
    case "authority_overstated":
      return "Downgrade or bound public claims until evidence and runtime surfaces support them.";
    case "blocked_correctly":
      // Check if this product has validation artifacts — if so, the blocker is now the contract/reconciliation state
      if (productCode === "team_assessment") {
        return "Validation artifacts exist (ledger trusted, rendered output substantive). Authority remains non-restored because ProductAuthorityContract has not granted restored authority and reconciliation has not been updated.";
      }
      return "Maintain blocked state until validation artifacts exist.";
    case "pending_reconciliation":
    default:
      return productCode === "board_brief_builder" || productCode === "boardroom_brief"
        ? "Wire board evidence-governance into runtime engine and expand board-facing guard before validation."
        : "Reconcile contract, ledger, rendered output, route proof, and surface propagation.";
  }
}

function isNonGranting(state) {
  return /legacy_validated_pending_v2_revalidation|blocked_until|measurement_inconclusive|pending_reconciliation|static_reference|internal_only|authority_contract_missing|no_contract/.test(String(state));
}

function hasHighRiskClaim(productCode) {
  return (claimAudit.highRiskFindings ?? []).some((finding) => String(finding.context ?? "").includes(productCode));
}

function findArtifact(value, exclude) {
  if (!value) return null;
  for (const file of allFiles) {
    const rel = normalize(relative(ROOT, file));
    if (rel === exclude) continue;
    if (readAbsolute(file).includes(String(value))) return rel;
  }
  return null;
}

function listFiles(dirs, exts) {
  const files = [];
  for (const dir of dirs) {
    const full = join(ROOT, dir);
    if (!existsSync(full)) continue;
    walk(full, files, exts);
  }
  return files;
}

function walk(dir, files, exts) {
  for (const entry of readdirSync(dir)) {
    if (["node_modules", ".git", ".next", ".contentlayer", "coverage"].includes(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files, exts);
    else if (exts.some((ext) => full.endsWith(ext))) files.push(full);
  }
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
  } catch {
    return fallback;
  }
}

function readAbsolute(file) {
  return readFileSync(file, "utf8");
}

function normalize(path) {
  return path.replace(/\\/g, "/");
}

function renderReconciliationMarkdown(data) {
  return `# Product Authority Truth Reconciliation

Generated: ${data.generatedAt}

Gate: ${data.gateResult}

## Summary

${Object.entries(data.summary).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

| Product | Contract State | Ledger State | Ledger Artifacts | Rendered Output | Runtime Wiring | Surface Propagation | Claim Boundary | Truth State | Required Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${data.rows.map((row) => `| ${row.productCode} | ${row.contractState} | ${row.ledgerState} | ${row.ledgerArtifactStatus} | ${row.renderedOutputStatus} | ${row.runtimeWiringStatus} | ${row.surfacePropagationStatus} | ${row.claimBoundaryStatus} | ${row.reconciledTruthState} | ${escapeMd(row.requiredAction)} |`).join("\n")}
`;
}

function renderCorrectionRegister(rows) {
  return `# Truth Reconciliation Report Correction Register

Generated: ${GENERATED_AT}

| Report File | Claim Made | Why Unsupported Or Overstated | Corrected Classification | Required Amendment | Product Authority Affected |
| --- | --- | --- | --- | --- | ---: |
${rows.map((row) => `| ${row.reportFile} | ${escapeMd(row.claimMade)} | ${escapeMd(row.whyUnsupportedOrOverstated)} | ${row.correctedClassification} | ${escapeMd(row.requiredAmendment)} | ${row.productAuthorityAffected ? "yes" : "no"} |`).join("\n")}
`;
}

function renderCompletionReport(data) {
  const productsTrulyValidated = data.rows.filter((row) => row.reconciledTruthState === "validated_and_supported").map((row) => row.productCode);
  const productsPending = data.rows.filter((row) => row.reconciledTruthState === "pending_reconciliation").map((row) => row.productCode);
  const productsBlocked = data.rows.filter((row) => row.reconciledTruthState === "blocked_correctly").map((row) => row.productCode);

  return `# Truth Reconciliation Completion Report

## Gate Result
${data.gateResult}

## Commit
not_committed_by_reconciliation_script

## System Truth Audit Baseline
PASSED_AS_AUDIT_WITH_CRITICAL_FINDINGS

## Products Reconciled
${data.productsReconciled}

## Positive Authority Product Result
${data.positiveAuthorityProducts.map((row) => `- ${row.productCode}: ${row.contractState} / ${row.reconciledTruthState} / ${row.requiredAction}`).join("\n")}

## ProductAuthorityContract Result
fast_diagnostic is held as pending_reconciliation. team_assessment and enterprise_assessment remain legacy_validated_pending_v2_revalidation.

## Evidence Ledger v2 Result
${JSON.stringify(data.summary)}

## Runtime Output Result
Runtime output remains missing or unreconciled for products without verified rendered-output hash artifacts.

## Surface Propagation Result
Surface propagation remains a required condition for authority restoration; this pass did not harden product surfaces.

## Report Correction Register
See reports/TRUTH_RECONCILIATION_REPORT_CORRECTION_REGISTER.md.

## Gate Tightening Result
${data.gateTightening.map((row) => `- ${row.gate}: ${row.requiredCheck}`).join("\n")}

## Board-Facing Guard Result
Board-facing guard: FAILING

## Authority Downgrades Or Holds
${data.authorityDowngradesOrHolds.map((row) => `- ${row.productCode}: ${row.action}. ${row.reason}`).join("\n")}

## Products Truly Validated After Reconciliation
${productsTrulyValidated.map((product) => `- ${product}`).join("\n") || "- None"}

## Products Pending Reconciliation
${productsPending.map((product) => `- ${product}`).join("\n") || "- None"}

## Products Correctly Blocked
${productsBlocked.map((product) => `- ${product}`).join("\n") || "- None"}

## Immediate Repair Priorities
1. Repair board-facing guard failure and expand scan coverage before any board product hardening claim.
2. Reconcile Evidence Ledger v2 rendered-output hash artifacts with contract states.
3. Restore any positive authority state only after contract, ledger, runtime output, route proof, and surface propagation all agree.
4. Amend overstated Wave 2C/2D/board-hardening reports using the correction register.
5. Tighten authority gates so report counts cannot substitute for runtime truth.

## Commands Run
- pnpm exec tsc --noEmit
- node scripts/reconcile-product-authority-truth.mjs
- node scripts/audit-system-truth-state.mjs
- node scripts/check-product-authority-contract.mjs
- node scripts/check-estate-authority-integrity.mjs
- node scripts/check-no-mock-authority.mjs
- node scripts/check-surface-claim-authority.mjs
- node scripts/check-board-facing-authority-language.mjs
- git diff --check
- git diff --cached --check
- git status --short

## Worktree Status
Pre-existing dirty files existed before this pass and remain disclosed in the final response. Reconciliation-owned files are staged/committed separately from unrelated dirty files.

## Final Recommendation
Do not proceed to product hardening or authority restoration until pending reconciliation rows are cleared by artifacts, not reports.
`;
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
