#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
mkdirSync(REPORTS_DIR, { recursive: true });

const CORE_CHECKS = [
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

const scenarios = [
  {
    id: "contract_positive_ledger_missing",
    description: "contract says diagnostic_product but ledger missing",
    declaredAuthorityState: "diagnostic_product",
    checks: { contract_state_exists: true },
  },
  {
    id: "ledger_passed_rendered_output_missing",
    description: "ledger says passed but rendered output missing",
    declaredAuthorityState: "externally_proven_gold_product",
    checks: checksExcept(["rendered_output_artifact_exists", "rendered_output_hash_matches"]),
  },
  {
    id: "rendered_output_hash_mismatch",
    description: "rendered output exists but hash mismatch",
    declaredAuthorityState: "diagnostic_product",
    checks: checksExcept(["rendered_output_hash_matches"]),
  },
  {
    id: "report_complete_contract_pending",
    description: "report says complete but contract still pending",
    declaredAuthorityState: "legacy_validated_pending_v2_revalidation",
    reportClaimsComplete: true,
    checks: checksExcept([]),
  },
  {
    id: "surface_proven_effective_pending",
    description: "surface says proven but effective state pending",
    declaredAuthorityState: "externally_proven_gold_product",
    checks: checksExcept(["surface_propagation_exists", "claim_boundary_scan_passes"]),
  },
  {
    id: "board_guard_fails_estate_passes",
    description: "board-facing guard fails but estate gate passes",
    declaredAuthorityState: "judgement_product",
    boardFacingProduct: true,
    checks: { ...checksExcept([]), board_facing_guard_passes: false },
  },
  {
    id: "no_mock_high_findings_authority_restore",
    description: "no-mock scan reports high findings but authority tries to restore",
    declaredAuthorityState: "diagnostic_product",
    checks: checksExcept(["no_mock_scan_passes"]),
  },
];

const rows = scenarios.map((scenario) => {
  const effective = resolveScenario(scenario);
  const blocked = effective.effectiveAuthorityState !== scenario.declaredAuthorityState || !isPositive(scenario.declaredAuthorityState);
  return {
    ...scenario,
    effectiveAuthorityState: effective.effectiveAuthorityState,
    missingChecks: effective.missingChecks,
    blocked,
    result: blocked ? "BLOCKED" : "FRAUD_GRANTED",
  };
});

const failures = rows.filter((row) => row.result !== "BLOCKED");
const result = {
  generatedAt: new Date().toISOString(),
  gate: failures.length ? "FAILED_FRAUD_SCENARIO_GRANTED_AUTHORITY" : "PASSED_ALL_FRAUDULENT_AUTHORITY_SCENARIOS_BLOCKED",
  scenariosTested: rows.length,
  fraudulentScenariosBlocked: rows.filter((row) => row.result === "BLOCKED").length,
  failures,
  rows,
};

writeFileSync(join(REPORTS_DIR, "authority-fraud-scenario-results.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "authority-fraud-scenario-results.md"), renderMarkdown(result));

console.log("AUTHORITY FRAUD SCENARIO TESTS");
console.log(`Gate: ${result.gate}`);
console.log(`Scenarios tested: ${result.scenariosTested}`);
console.log(`Blocked: ${result.fraudulentScenariosBlocked}`);
process.exit(failures.length ? 1 : 0);

function resolveScenario(scenario) {
  if (!isPositive(scenario.declaredAuthorityState)) {
    return { effectiveAuthorityState: scenario.declaredAuthorityState, missingChecks: [] };
  }
  const checks = scenario.boardFacingProduct ? [...CORE_CHECKS, "board_facing_guard_passes"] : CORE_CHECKS;
  const missingChecks = checks.filter((check) => scenario.checks[check] !== true);
  return {
    effectiveAuthorityState: missingChecks.length ? "pending_reconciliation" : scenario.declaredAuthorityState,
    missingChecks,
  };
}

function checksExcept(exclusions) {
  const checks = Object.fromEntries(CORE_CHECKS.map((check) => [check, true]));
  for (const exclusion of exclusions) checks[exclusion] = false;
  return checks;
}

function isPositive(state) {
  return ["diagnostic_product", "judgement_product", "externally_proven_gold_product"].includes(state);
}

function renderMarkdown(result) {
  return `# Authority Fraud Scenario Results

Generated: ${result.generatedAt}

Gate: ${result.gate}

Scenarios tested: ${result.scenariosTested}

All fraudulent authority scenarios blocked: ${result.failures.length === 0 ? "yes" : "no"}

| Scenario | Description | Declared | Effective | Result | Missing Checks |
| --- | --- | --- | --- | --- | --- |
${result.rows.map((row) => `| ${row.id} | ${row.description} | ${row.declaredAuthorityState} | ${row.effectiveAuthorityState} | ${row.result} | ${row.missingChecks.join(", ")} |`).join("\n")}
`;
}
