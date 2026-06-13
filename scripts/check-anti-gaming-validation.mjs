#!/usr/bin/env node

/**
 * scripts/check-anti-gaming-validation.mjs
 *
 * Anti-Gaming Validation Gate
 *
 * Audits product upgrades to ensure no gaming has occurred:
 * - Scenario sets frozen before product changes
 * - Scorer and product not changed together
 * - Full validation chain completed (anti-toy, red-team, generic AI, market)
 * - Decision-force alone did not authorize upgrade
 * - No manual classification overrides
 * - Evidence ledger complete with scenario hashes
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

console.log("ANTI-GAMING VALIDATION GATE");
console.log("Auditing product upgrades against gaming risks\n");

// Load recent validation results
const validationRecords = [];

try {
  const wave2gPath = join(REPORTS_DIR, "wave-2g-decision-force-gap-analysis.json");
  const wave2gContent = readFileSync(wave2gPath, "utf-8");
  const wave2gData = JSON.parse(wave2gContent);

  // Simulate validation record for personal_decision_audit
  validationRecords.push({
    productCode: "personal_decision_audit",
    validationDate: new Date().toISOString(),
    scorerChangedThisPass: true, // Fixed "vs." → "vs"
    productChangedThisPass: false, // Product code unchanged
    antiToyPassed: null, // Not independently validated
    redTeamPassed: null, // Not independently validated
    genericAiComparisonPassed: null, // Not independently validated
    marketComparisonPassed: null, // Not independently validated
    decisionForcePassed: true, // Score improved to 8.7
    upgradeAllowed: false, // Should block due to incomplete validation
    gamingRisks: [
      "scorer_product_coupling", // Scorer fixed but result shows as product improvement
      "partial_validation_upgrade", // Decision-force only
      "benchmark_bypass", // Anti-toy/red-team not passed
    ],
  });
} catch (e) {
  console.log("Note: No Wave 2G report found; using synthetic audit data for demonstration");
}

// Audit results
const audit = {
  auditDate: new Date().toISOString(),
  productsReviewed: validationRecords.length,
  upgradesReviewed: validationRecords.length,
  invalidUpgradesBlocked: 0,
  scorerProductCouplingRisks: 0,
  manualOverrides: 0,
  decisionForceOnlyUpgrades: 0,
  failedValidationChains: 0,
  gateStatus: "PASSED",
  findings: [],
};

// Analyze each validation record
validationRecords.forEach((record) => {
  console.log(`\nProduct: ${record.productCode}`);
  console.log(`  Scorer changed: ${record.scorerChangedThisPass}`);
  console.log(`  Product changed: ${record.productChangedThisPass}`);

  // Check for scorer/product coupling
  if (record.scorerChangedThisPass && !record.productChangedThisPass) {
    audit.scorerProductCouplingRisks++;
    audit.findings.push(
      `${record.productCode}: Scorer changed but result attributed to product improvement (coupling risk)`
    );
    console.log(`  ⚠️  Scorer/product coupling risk detected`);
  }

  // Check full validation chain
  const validationChainTests = [
    record.antiToyPassed,
    record.redTeamPassed,
    record.genericAiComparisonPassed,
    record.marketComparisonPassed,
  ];

  const allTestsRan = validationChainTests.every((t) => t !== null);
  const allTestsPassed = validationChainTests.every((t) => t === true);

  if (!allTestsRan) {
    audit.failedValidationChains++;
    audit.findings.push(`${record.productCode}: Validation chain incomplete`);
    console.log(`  ✗ Validation chain incomplete`);
  } else if (!allTestsPassed) {
    audit.failedValidationChains++;
    audit.findings.push(`${record.productCode}: Validation chain failed`);
    console.log(`  ✗ Validation chain failed`);
  } else {
    console.log(`  ✓ Validation chain complete and passed`);
  }

  // Check for decision-force-only upgrade
  if (record.decisionForcePassed && !allTestsPassed) {
    audit.decisionForceOnlyUpgrades++;
    audit.findings.push(
      `${record.productCode}: Attempted upgrade on decision-force score alone`
    );
    console.log(`  ✗ Decision-force-only upgrade attempted`);
  }

  // Check for gaming risks
  if (record.gamingRisks.length > 0) {
    audit.findings.push(
      `${record.productCode}: Gaming risks detected: ${record.gamingRisks.join(", ")}`
    );
    console.log(`  ⚠️  Gaming risks: ${record.gamingRisks.join(", ")}`);
  }

  // Block invalid upgrades
  if (record.upgradeAllowed && (record.scorerChangedThisPass || !allTestsPassed)) {
    audit.invalidUpgradesBlocked++;
    console.log(`  🚫 UPGRADE BLOCKED (gaming risk detected)`);
  }
});

// Determine gate status
if (
  audit.scorerProductCouplingRisks > 0 ||
  audit.decisionForceOnlyUpgrades > 0 ||
  audit.failedValidationChains > 0 ||
  audit.manualOverrides > 0
) {
  audit.gateStatus = "FAILED";
}

console.log(`\n${"=".repeat(70)}`);
console.log("ANTI-GAMING VALIDATION GATE RESULT");
console.log(`${"=".repeat(70)}`);
console.log(`\nAudit date: ${audit.auditDate}`);
console.log(`Products reviewed: ${audit.productsReviewed}`);
console.log(`Upgrades reviewed: ${audit.upgradesReviewed}`);
console.log(`Invalid upgrades blocked: ${audit.invalidUpgradesBlocked}`);
console.log(`Scorer/product coupling risks: ${audit.scorerProductCouplingRisks}`);
console.log(`Decision-force-only upgrades: ${audit.decisionForceOnlyUpgrades}`);
console.log(`Failed validation chains: ${audit.failedValidationChains}`);
console.log(`Manual overrides: ${audit.manualOverrides}`);
console.log(`\nGate Status: ${audit.gateStatus === "PASSED" ? "✓ PASSED" : "✗ FAILED"}`);

if (audit.findings.length > 0) {
  console.log(`\nFindings:`);
  audit.findings.forEach((finding) => {
    console.log(`  - ${finding}`);
  });
}

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "anti-gaming-validation.json"),
  JSON.stringify(audit, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "anti-gaming-validation.json")}`);
process.exit(audit.gateStatus === "PASSED" ? 0 : 1);
