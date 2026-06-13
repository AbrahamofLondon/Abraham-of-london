#!/usr/bin/env node
import crypto from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
const ledger = readJson("reports/product-value-evidence-ledger-v2.json", null);
const contracts = readJson("reports/product-authority-contract.json", { contracts: [] });
const contractByProduct = new Map((contracts.contracts ?? []).map((contract) => [contract.productCode, contract]));

mkdirSync(REPORTS_DIR, { recursive: true });

const rows = ledger ? [verifyLedgerEntry(ledger)] : [];
const untrusted = rows.filter((row) => row.ledgerTrustState === "ledger_untrusted");
const result = {
  generatedAt: new Date().toISOString(),
  gate: untrusted.length ? "FAILED_LEDGER_UNTRUSTED" : "PASSED_LEDGER_ARTIFACTS_VERIFIED",
  entriesAudited: rows.length,
  untrustedEntries: untrusted.length,
  rows,
};

writeFileSync(join(REPORTS_DIR, "evidence-ledger-artifact-verification.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS_DIR, "evidence-ledger-artifact-verification.md"), renderMarkdown(result));

console.log("EVIDENCE LEDGER ARTIFACT VERIFICATION");
console.log(`Entries audited: ${result.entriesAudited}`);
console.log(`Untrusted entries: ${result.untrustedEntries}`);
console.log(`Gate: ${result.gate}`);
process.exit(untrusted.length ? 1 : 0);

function verifyLedgerEntry(entry) {
  const productCode = entry.productCode ?? "unknown";
  const scenarioPath = `reports/validation/${productCode.replace(/_/g, "-")}/scenarios.json`;
  const outputPath = `reports/validation/${productCode.replace(/_/g, "-")}/rendered-output.json`;
  const validationPath = `reports/validation/${productCode.replace(/_/g, "-")}/validation-results.json`;
  const contract = contractByProduct.get(productCode);
  const scenario = readJson(scenarioPath, null);
  const output = readJson(outputPath, null);
  const validation = readJson(validationPath, null);
  const scenarioHash = scenario ? sha(JSON.stringify(scenario)) : null;
  const renderedOutputHash = output?.scenarioResults ? sha(JSON.stringify(output.scenarioResults)) : null;
  const checks = {
    scenarioFileExists: existsSync(join(ROOT, scenarioPath)),
    scenarioHashMatches: Boolean(scenarioHash && scenarioHash === entry.scenarioSetHash),
    renderedOutputFileExists: existsSync(join(ROOT, outputPath)),
    renderedOutputHashMatches: Boolean(renderedOutputHash && renderedOutputHash === entry.outputHash),
    validationRunHashExists: Boolean(output?.hashes?.validationRunHash || entry.validationRunHash || entry.ledgerEntryHash),
    qualityTestArtifactExists: Boolean(validation && Object.keys(validation).length > 0),
    boundaryFlagsPresent: [
      "scenarioChangedThisPass",
      "productChangedThisPass",
      "scorerChangedThisPass",
      "benchmarkChangedThisPass",
      "validationInfrastructureChangedThisPass",
      "mockAuthorityUsed",
    ].every((key) => Object.prototype.hasOwnProperty.call(entry, key)),
    mockAuthorityUsedFalse: entry.mockAuthorityUsed === false || entry.boundary?.mockAuthorityUsed === false || !entry.boundary?.mockAuthorityUsed,
    authorityRecommendationMatchesContract: Boolean(
      contract &&
      (entry.proposedClassification === contract.currentAuthorityState ||
        (contract.currentAuthorityState === "pending_reconciliation" && entry.proposedClassification !== contract.currentAuthorityState))
    ),
    renderedOutputHasSubstance: Boolean(
      output?.scenarioResults?.some((row) => JSON.stringify(row.output ?? {}).length > 250)
    ),
  };
  const failures = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([check]) => check);

  return {
    productCode,
    proposedClassification: entry.proposedClassification ?? null,
    currentContractState: contract?.currentAuthorityState ?? null,
    scenarioPath,
    outputPath,
    validationPath,
    scenarioHash,
    expectedScenarioHash: entry.scenarioSetHash ?? null,
    renderedOutputHash,
    expectedRenderedOutputHash: entry.outputHash ?? null,
    checks,
    ledgerTrustState: failures.length ? "ledger_untrusted" : "ledger_trusted",
    failures,
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
  return `# Evidence Ledger Artifact Verification

Generated: ${result.generatedAt}

Gate: ${result.gate}

Entries audited: ${result.entriesAudited}

Untrusted entries: ${result.untrustedEntries}

| Product | Proposed | Contract | Trust State | Failures |
| --- | --- | --- | --- | --- |
${result.rows.map((row) => `| ${row.productCode} | ${row.proposedClassification ?? ""} | ${row.currentContractState ?? ""} | ${row.ledgerTrustState} | ${row.failures.join(", ") || "None"} |`).join("\n")}
`;
}
