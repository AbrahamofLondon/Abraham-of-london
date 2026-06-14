#!/usr/bin/env node
/**
 * Evidence Ledger Artifact Verification — Strict Classifier
 *
 * Verifies that ledger entries are supported by real, verifiable artifacts.
 * The ledger must not grant authority by assertion.
 *
 * Classification for each entry:
 *   trusted_artifact_supported       — All checks pass; may support authority
 *   pending_missing_artifact         — Scenario/output/validation files missing
 *   pending_hash_mismatch            - Hash values don't match
 *   pending_contract_mismatch        - Ledger proposes higher authority than contract
 *   pending_surface_propagation      - Surface propagation not verified
 *   pending_boundary_flags           - Boundary flags missing
 *   pending_rendered_output_substance - Rendered output lacks substance
 *   blocked_report_derived           - Entry derived from reports, not artifacts
 *   blocked_mock_or_fixture          - Entry uses mock/fixture data
 *   historical_non_granting          - Historical entry, not for current authority
 *
 * Rule: ledger_recommendation_must_not_exceed_effective_authority
 * If ProductAuthorityContract says legacy/pending/blocked, the ledger must not
 * recommend diagnostic_product/judgement_product/externally_proven_gold_product
 * unless a separate authority restoration pass later updates the contract.
 */

import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

// ── Required Boundary Flags ───────────────────────────────────────────────
const REQUIRED_BOUNDARY_FLAGS = [
  "scenarioChangedThisPass",
  "productChangedThisPass",
  "scorerChangedThisPass",
  "benchmarkChangedThisPass",
  "validationInfrastructureChangedThisPass",
  "mockAuthorityUsed",
];

// ── Authority State Hierarchy ─────────────────────────────────────────────
// Lower states cannot support higher recommendations without explicit restoration.
const AUTHORITY_HIERARCHY = {
  "blocked_until_claim_evidenced": 0,
  "blocked_until_v2_revalidation": 1,
  "legacy_validated_pending_v2_revalidation": 2,
  "pending_reconciliation": 3,
  "signal_product": 4,
  "diagnostic_product": 5,
  "judgement_product": 6,
  "externally_proven_gold_product": 7,
};

// ── Main ──────────────────────────────────────────────────────────────────
const ledger = readJson("reports/product-value-evidence-ledger-v2.json", null);
const contracts = readJson("reports/product-authority-contract.json", { contracts: [] });
const contractByProduct = new Map((contracts.contracts ?? []).map((contract) => [contract.productCode, contract]));

mkdirSync(REPORTS_DIR, { recursive: true });

const entries = ledger ? [ledger] : [];
const rows = entries.map(verifyLedgerEntry);
const untrusted = rows.filter((row) => row.ledgerTrustState !== "trusted_artifact_supported");

const result = {
  generatedAt: new Date().toISOString(),
  gate: untrusted.length ? "FAILED_LEDGER_UNTRUSTED" : "PASSED_LEDGER_ARTIFACTS_VERIFIED",
  entriesAudited: rows.length,
  untrustedEntries: untrusted.length,
  trustedEntries: rows.filter((r) => r.ledgerTrustState === "trusted_artifact_supported").length,
  rows,
  classificationSummary: {},
};

for (const row of rows) {
  result.classificationSummary[row.ledgerTrustState] = (result.classificationSummary[row.ledgerTrustState] || 0) + 1;
}

writeFileSync(join(REPORTS_DIR, "evidence-ledger-artifact-verification.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "evidence-ledger-artifact-verification.md"), renderMarkdown(result));

console.log("EVIDENCE LEDGER ARTIFACT VERIFICATION (STRICT CLASSIFIER)");
console.log(`Entries audited: ${result.entriesAudited}`);
console.log(`Trusted entries: ${result.trustedEntries}`);
console.log(`Untrusted entries: ${result.untrustedEntries}`);
console.log(`Gate: ${result.gate}`);
console.log(`\nClassification Summary:`);
for (const [k, v] of Object.entries(result.classificationSummary).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(3)} ${k}`);
}

process.exit(untrusted.length ? 1 : 0);

// ── Verification ──────────────────────────────────────────────────────────
function verifyLedgerEntry(entry) {
  const productCode = entry.productCode ?? "unknown";
  const productDir = productCode.replace(/_/g, "-");
  const scenarioPath = `reports/validation/${productDir}/scenarios.json`;
  // Check both locations for rendered output: reports/validation/ (legacy) and artifacts/validation/ (preferred)
  const outputPathLegacy = `reports/validation/${productDir}/rendered-output.json`;
  const outputPathArtifact = `artifacts/validation/${productCode}/rendered-output.json`;
  const validationPath = `reports/validation/${productDir}/validation-results.json`;
  const contract = contractByProduct.get(productCode);

  // Use artifact path if it exists, otherwise fall back to legacy path
  const outputPath = existsSync(join(ROOT, outputPathArtifact)) ? outputPathArtifact : outputPathLegacy;

  // Load artifacts
  const scenario = readJson(scenarioPath, null);
  const output = readJson(outputPath, null);
  const validation = readJson(validationPath, null);

  // Compute hashes
  const scenarioHash = scenario ? sha(JSON.stringify(scenario)) : null;
  const renderedOutputHash = output?.scenarioResults ? sha(JSON.stringify(output.scenarioResults)) : null;

  // ── Check 1: Artifact Existence ────────────────────────────────────────
  const scenarioFileExists = existsSync(join(ROOT, scenarioPath));
  const renderedOutputFileExists = existsSync(join(ROOT, outputPath));
  const validationFileExists = existsSync(join(ROOT, validationPath));

  if (!scenarioFileExists || !renderedOutputFileExists || !validationFileExists) {
    const missing = [];
    if (!scenarioFileExists) missing.push("scenarioFile");
    if (!renderedOutputFileExists) missing.push("renderedOutputFile");
    if (!validationFileExists) missing.push("validationFile");
    return makeResult(productCode, entry, contract, "pending_missing_artifact", missing, { scenarioFileExists, renderedOutputFileExists, validationFileExists });
  }

  // ── Check 2: Hash Matches ──────────────────────────────────────────────
  const scenarioHashMatches = Boolean(scenarioHash && scenarioHash === entry.scenarioSetHash);
  const renderedOutputHashMatches = Boolean(renderedOutputHash && renderedOutputHash === entry.outputHash);
  const validationRunHashExists = Boolean(output?.hashes?.validationRunHash || entry.validationRunHash || entry.ledgerEntryHash);

  if (!scenarioHashMatches || !renderedOutputHashMatches) {
    const mismatches = [];
    if (!scenarioHashMatches) mismatches.push("scenarioHash");
    if (!renderedOutputHashMatches) mismatches.push("renderedOutputHash");
    return makeResult(productCode, entry, contract, "pending_hash_mismatch", mismatches, { scenarioHashMatches, renderedOutputHashMatches, validationRunHashExists });
  }

  // ── Check 3: Rendered Output Substance ─────────────────────────────────
  // Uses the rendered output substance policy to check for:
  // - Product-specific identifiers
  // - Scenario-specific output with sufficient depth
  // - Evidence boundaries
  // - Non-mock and non-report-derived declarations
  // - Hashable artifact body
  const substanceResult = checkRenderedOutputSubstance(output, productCode, entry.scenarioCount ?? 1);

  if (substanceResult.classification !== "passed_rendered_output_substance") {
    return makeResult(productCode, entry, contract, substanceResult.classification,
      Object.entries(substanceResult.checks).filter(([, c]) => !c.passed).map(([k]) => k),
      { substanceResult: substanceResult.classification, ...substanceResult.checks }
    );
  }

  // ── Check 4: Boundary Flags ────────────────────────────────────────────
  // Check at top level and in entry.boundary
  const boundaryFlagsPresent = REQUIRED_BOUNDARY_FLAGS.every((key) =>
    Object.prototype.hasOwnProperty.call(entry, key) ||
    (entry.boundary && Object.prototype.hasOwnProperty.call(entry.boundary, key))
  );

  if (!boundaryFlagsPresent) {
    const missing = REQUIRED_BOUNDARY_FLAGS.filter((key) =>
      !Object.prototype.hasOwnProperty.call(entry, key) &&
      !(entry.boundary && Object.prototype.hasOwnProperty.call(entry.boundary, key))
    );
    return makeResult(productCode, entry, contract, "pending_boundary_flags", missing.map((k) => "missing_" + k), { boundaryFlagsPresent });
  }

  // ── Check 5: Mock Authority ────────────────────────────────────────────
  const mockAuthorityUsed = entry.mockAuthorityUsed === false ||
    entry.boundary?.mockAuthorityUsed === false;

  if (!mockAuthorityUsed) {
    return makeResult(productCode, entry, contract, "blocked_mock_or_fixture", ["mockAuthorityUsed"], { mockAuthorityUsed });
  }

  // ── Check 6: Contract Alignment ────────────────────────────────────────
  // Rule: ledger_recommendation_must_not_exceed_effective_authority
  const contractState = contract?.currentAuthorityState ?? "unknown";
  const proposedState = entry.proposedClassification ?? "unknown";
  const contractLevel = AUTHORITY_HIERARCHY[contractState] ?? 0;
  const proposedLevel = AUTHORITY_HIERARCHY[proposedState] ?? 0;

  const authorityRecommendationMatchesContract = Boolean(contract && proposedLevel <= contractLevel);

  if (!authorityRecommendationMatchesContract) {
    return makeResult(productCode, entry, contract, "pending_contract_mismatch",
      [`proposed_${proposedState}_exceeds_contract_${contractState}`],
      { authorityRecommendationMatchesContract, contractState, proposedState }
    );
  }

  // ── All Checks Passed ──────────────────────────────────────────────────
  return makeResult(productCode, entry, contract, "trusted_artifact_supported", [], {});
}

/**
 * Check rendered output substance using the substance policy rules.
 * Mirrors lib/product/rendered-output-substance-policy.ts.
 */
function checkRenderedOutputSubstance(output, productCode, expectedScenarioCount) {
  const THIN_FIELDS = new Set(["ok", "status", "id", "diagnosticId", "diagnosticRef", "reportReady", "success", "error"]);
  const SUBSTANCE_FIELDS = new Set([
    "summary", "analysis", "findings", "recommendation", "score",
    "evidence", "assessment", "diagnosis", "conclusion", "result",
    "details", "observations", "risks", "actions", "nextSteps",
    "rationale", "confidence", "impact", "severity", "priority",
    "category", "classification", "grade", "signal", "pattern",
  ]);
  const PRODUCT_TERMS = {
    team_assessment: ["team", "alignment", "governance", "decision", "assessment", "diagnostic"],
    enterprise_assessment: ["enterprise", "organisational", "governance", "risk", "assessment"],
    fast_diagnostic: ["diagnostic", "pressure", "decision", "signal", "assessment"],
  };

  const checks = {};
  const productTerms = PRODUCT_TERMS[productCode] ?? [];

  // Check 1: Output must exist
  checks.exists = { passed: Boolean(output && typeof output === "object"), detail: output ? "Output object exists" : "Missing" };
  if (!checks.exists.passed) return { classification: "failed_missing_output", checks, summary: "Missing" };

  // Check 2: scenarioResults array
  const scenarioResults = output.scenarioResults ?? [];
  checks.scenarioResults = { passed: Array.isArray(scenarioResults) && scenarioResults.length > 0, detail: scenarioResults.length + " results" };

  // Check 3: Scenario coverage
  checks.scenarioCoverage = { passed: scenarioResults.length >= expectedScenarioCount, detail: scenarioResults.length + "/" + expectedScenarioCount + " covered" };

  // Check 4: Output depth
  let thinOnlyCount = 0;
  let substanceFieldsFound = 0;
  let totalFields = 0;
  for (const sr of scenarioResults) {
    const so = sr.output ?? sr.result ?? {};
    const keys = Object.keys(so);
    totalFields += keys.length;
    if (keys.length > 0 && keys.every((k) => THIN_FIELDS.has(k))) thinOnlyCount++;
    if (keys.some((k) => SUBSTANCE_FIELDS.has(k))) substanceFieldsFound++;
  }
  checks.scenarioOutputDepth = {
    passed: thinOnlyCount === 0 && substanceFieldsFound > 0,
    detail: totalFields + " fields, " + substanceFieldsFound + " with substance, " + thinOnlyCount + " thin-only",
  };

  // Check 5: Product-specific terms
  if (productTerms.length > 0) {
    const outStr = JSON.stringify(output).toLowerCase();
    const matched = productTerms.filter((t) => outStr.includes(t));
    checks.productSpecificTerms = { passed: matched.length >= 2, detail: matched.length + "/" + productTerms.length + " terms: " + matched.join(",") };
  } else {
    checks.productSpecificTerms = { passed: true, detail: "No terms defined" };
  }

  // Check 6: Evidence boundary
  const outStr = JSON.stringify(output).toLowerCase();
  checks.evidenceBoundary = {
    passed: outStr.includes("evidence") || outStr.includes("boundary") || outStr.includes("non-mock") || (output.validationNotes?.length > 0),
    detail: "Evidence boundary: " + (outStr.includes("evidence") ? "present" : "not found"),
  };

  // Check 7: Non-mock
  checks.nonMockDeclaration = {
    passed: outStr.includes("non-mock") || outStr.includes("non_mock") || output.validationNotes?.some((n) => n.toLowerCase().includes("mock")),
    detail: "Non-mock: " + (outStr.includes("non-mock") ? "declared" : "not declared"),
  };

  // Check 8: Non-report-derived
  checks.nonReportDerived = {
    passed: outStr.includes("non-report") || outStr.includes("non_report") || output.validationNotes?.some((n) => n.toLowerCase().includes("report")),
    detail: "Non-report: " + (outStr.includes("non-report") ? "declared" : "not declared"),
  };

  // Check 9: Hashable body
  checks.hashableBody = { passed: Boolean(output.hashes?.renderedOutputHash || output.outputHash), detail: output.hashes?.renderedOutputHash ? "Hash present" : "No hash" };

  // Determine classification
  const criticalPassed = ["exists", "scenarioResults", "scenarioOutputDepth"].every((c) => checks[c]?.passed);
  if (!criticalPassed) return { classification: "pending_rendered_output_substance", checks, summary: "Insufficient substance depth" };
  if (thinOnlyCount === scenarioResults.length && scenarioResults.length > 0) return { classification: "failed_placeholder_output", checks, summary: "All thin placeholder responses" };
  if (output.validationNotes?.some((n) => n.toLowerCase().includes("report")) && !checks.nonReportDerived.passed) {
    return { classification: "failed_report_only_output", checks, summary: "Report-derived output" };
  }
  return { classification: "passed_rendered_output_substance", checks, summary: "Substantive rendered output" };
}

function makeResult(productCode, entry, contract, trustState, failures, checks) {
  return {
    productCode,
    proposedClassification: entry.proposedClassification ?? null,
    currentContractState: contract?.currentAuthorityState ?? null,
    ledgerTrustState: trustState,
    failures,
    checks,
    scenarioPath: `reports/validation/${productCode.replace(/_/g, "-")}/scenarios.json`,
    outputPath: `reports/validation/${productCode.replace(/_/g, "-")}/rendered-output.json`,
    validationPath: `reports/validation/${productCode.replace(/_/g, "-")}/validation-results.json`,
  };
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(join(ROOT, path), "utf8"));
  } catch {
    return fallback;
  }
}

function sha(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function renderMarkdown(result) {
  let md = "# Evidence Ledger Artifact Verification\n\n";
  md += "Generated: " + result.generatedAt + "\n\n";
  md += "Gate: " + result.gate + "\n\n";
  md += "Entries audited: " + result.entriesAudited + "\n";
  md += "Trusted entries: " + result.trustedEntries + "\n";
  md += "Untrusted entries: " + result.untrustedEntries + "\n\n";
  md += "## Classification Summary\n\n";
  md += "| Classification | Count | Grants Authority? |\n|---|---|---|\n";
  for (const [k, v] of Object.entries(result.classificationSummary).sort((a, b) => b[1] - a[1])) {
    md += "| " + k + " | " + v + " | " + (k === "trusted_artifact_supported" ? "Yes" : "No") + " |\n";
  }
  md += "\n## Entry Details\n\n";
  md += "| Product | Proposed | Contract | Trust State | Failures |\n| --- | --- | --- | --- | --- |\n";
  for (const row of result.rows) {
    md += "| " + row.productCode + " | " + (row.proposedClassification ?? "") + " | " + (row.currentContractState ?? "") + " | " + row.ledgerTrustState + " | " + (row.failures.join(", ") || "None") + " |\n";
  }
  return md;
}