#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const POSITIVE_STATES = new Set(["diagnostic_product", "judgement_product", "externally_proven_gold_product"]);
const BOARD_PRODUCTS = new Set(["board_brief_builder", "boardroom_brief", "boardroom_mode"]);
const REQUIRED_CHECKS = [
  "contract_state_exists",
  "ledger_entry_exists",
  "scenario_artifact_exists",
  "rendered_output_artifact_exists",
  "scenario_hash_matches",
  "rendered_output_hash_matches",
  "validation_run_hash_exists",
  "quality_tests_exist",
  "boundary_flags_clean",
  "route_proof_exists",
  "surface_propagation_exists",
  "claim_boundary_scan_passes",
  "no_mock_scan_passes",
];

mkdirSync(REPORTS_DIR, { recursive: true });

const contractReport = readJson("reports/product-authority-contract.json", { contracts: [] });
const ledgerReport = readJson("reports/evidence-ledger-artifact-verification.json", { rows: [] });
const routeProof = readJson("reports/category-route-proof.json", { routes: [] });
const matrix = readJson("reports/product-authority-coverage-matrix.json", { products: [] });
const surfaceClaim = readJson("reports/surface-claim-authority-gate.json", readJson("reports/surface-claim-authority.json", {}));
const noMock = readJson("reports/no-mock-authority.json", {});

const ledgerByProduct = new Map((ledgerReport.rows ?? []).map((row) => [row.productCode, row]));
const matrixByProduct = new Map((matrix.products ?? []).map((row) => [row.productCode, row]));

const rows = (contractReport.contracts ?? []).map((contract) => {
  const productCode = contract.productCode;
  const ledger = ledgerByProduct.get(productCode);
  const matrixRow = matrixByProduct.get(productCode);
  const checks = {
    contract_state_exists: Boolean(contract.currentAuthorityState),
    ledger_entry_exists: Boolean(ledger),
    scenario_artifact_exists: Boolean(ledger?.checks?.scenarioFileExists),
    rendered_output_artifact_exists: Boolean(ledger?.checks?.renderedOutputFileExists),
    scenario_hash_matches: Boolean(ledger?.checks?.scenarioHashMatches),
    rendered_output_hash_matches: Boolean(ledger?.checks?.renderedOutputHashMatches),
    validation_run_hash_exists: Boolean(ledger?.checks?.validationRunHashExists),
    quality_tests_exist: Boolean(ledger?.checks?.qualityTestArtifactExists),
    boundary_flags_clean: Boolean(ledger?.checks?.boundaryFlagsPresent && ledger?.checks?.mockAuthorityUsedFalse),
    route_proof_exists: hasRouteProof(productCode, routeProof),
    surface_propagation_exists: Boolean(matrixRow?.authorityVisiblyRendered || matrixRow?.limitationVisiblyRendered),
    claim_boundary_scan_passes: surfaceClaim.gate === "PASSED" || surfaceClaim.gateStatus === "PASSED",
    no_mock_scan_passes: noMock.gateStatus === "PASSED" || noMock.gate === "PASSED",
    board_facing_guard_passes: BOARD_PRODUCTS.has(productCode) ? false : true,
  };
  const declaredAuthorityState = contract.currentAuthorityState;
  const positive = POSITIVE_STATES.has(declaredAuthorityState);
  const required = BOARD_PRODUCTS.has(productCode) ? [...REQUIRED_CHECKS, "board_facing_guard_passes"] : REQUIRED_CHECKS;
  const missingChecks = positive ? required.filter((check) => checks[check] !== true) : [];
  const effectiveAuthorityState = positive && missingChecks.length ? "pending_reconciliation" : declaredAuthorityState;
  return {
    productCode,
    declaredAuthorityState,
    effectiveAuthorityState,
    authoritySuppressionReason: missingChecks[0] ?? null,
    evidenceProofStatus: positive ? (missingChecks.length ? "proof_incomplete" : "proof_complete") : "not_positive_authority",
    missingChecks,
    checks,
    positiveAuthorityAllowed: positive && missingChecks.length === 0,
  };
});

const positiveAllowed = rows.filter((row) => row.positiveAuthorityAllowed);
const suppressed = rows.filter((row) => POSITIVE_STATES.has(row.declaredAuthorityState) && row.effectiveAuthorityState === "pending_reconciliation");
const result = {
  generatedAt: new Date().toISOString(),
  gate: positiveAllowed.length > 0 ? "FAILED_POSITIVE_AUTHORITY_ALLOWED" : "PASSED_NO_UNVERIFIED_POSITIVE_AUTHORITY",
  positiveAuthorityAllowed: positiveAllowed.map((row) => row.productCode),
  productsSuppressedToPendingReconciliation: suppressed.map((row) => row.productCode),
  rows,
};

writeFileSync(join(REPORTS_DIR, "authority-grant-firewall-results.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "authority-grant-firewall-results.md"), renderFirewallMarkdown(result));
writeFileSync(join(REPORTS_DIR, "effective-authority-state-matrix.json"), `${JSON.stringify({ generatedAt: result.generatedAt, rows }, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "effective-authority-state-matrix.md"), renderEffectiveMatrix(rows, result.generatedAt));

console.log("AUTHORITY GRANT FIREWALL");
console.log(`Gate: ${result.gate}`);
console.log(`Positive authority allowed: ${result.positiveAuthorityAllowed.length}`);
console.log(`Suppressed to pending reconciliation: ${result.productsSuppressedToPendingReconciliation.length}`);
process.exit(result.positiveAuthorityAllowed.length ? 1 : 0);

function hasRouteProof(productCode, proof) {
  const text = JSON.stringify(proof).toLowerCase();
  return text.includes(productCode.replace(/_/g, "-")) || text.includes(productCode);
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
  } catch {
    return fallback;
  }
}

function renderFirewallMarkdown(result) {
  return `# Authority Grant Firewall Results

Generated: ${result.generatedAt}

Gate: ${result.gate}

Positive authority allowed: ${result.positiveAuthorityAllowed.length}

Suppressed to pending reconciliation: ${result.productsSuppressedToPendingReconciliation.length}

| Product | Declared | Effective | Proof Status | Suppression Reason | Missing Checks |
| --- | --- | --- | --- | --- | --- |
${result.rows.map((row) => `| ${row.productCode} | ${row.declaredAuthorityState} | ${row.effectiveAuthorityState} | ${row.evidenceProofStatus} | ${row.authoritySuppressionReason ?? ""} | ${row.missingChecks.join(", ")} |`).join("\n")}
`;
}

function renderEffectiveMatrix(rows, generatedAt) {
  return `# Effective Authority State Matrix

Generated: ${generatedAt}

| Product | Declared State | Effective State | Proof Status | Suppression Reason |
| --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.productCode} | ${row.declaredAuthorityState} | ${row.effectiveAuthorityState} | ${row.evidenceProofStatus} | ${row.authoritySuppressionReason ?? ""} |`).join("\n")}
`;
}
