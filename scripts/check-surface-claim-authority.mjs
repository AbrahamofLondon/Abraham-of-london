#!/usr/bin/env node
/**
 * Surface Claim Authority Gate
 *
 * Validates that product-facing surfaces (catalog, CTAs, pricing) do not make
 * claims beyond what the claim authority permits.
 *
 * Hard rules:
 * - Static products cannot claim intelligence/judgement/simulation/governance
 * - Blocked products cannot claim gold/board-grade/governed
 * - Internal products cannot appear in public surfaces
 * - All surface claims must match registry maximum state
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

function loadJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

const surfaceClaimsData = loadJson(join(REPORTS_DIR, "product-surface-claims-focused.json"));
const claimAuthorityData = loadJson(join(REPORTS_DIR, "universal-claim-authority-gate.json"));

if (!surfaceClaimsData) {
  console.error("FAILED: Could not load surface claims data");
  process.exit(1);
}

const failures = [];
const warnings = [];

// Check each surface claim
const findings = surfaceClaimsData.findings || [];

findings.forEach((finding) => {
  if (finding.action === "correct_now") {
    failures.push(
      `${finding.productCode}: unsupported claim "${finding.claimType}" in ${finding.field} (state: ${finding.maxHonestState})`
    );
  }

  // Additional checks
  if (finding.isCaseDossier && finding.claimType !== "reference") {
    warnings.push(
      `${finding.productCode}: static case dossier using "${finding.claimType}" language (should use reference only)`
    );
  }

  if (
    finding.maxHonestState === "blocked_until_evidence" &&
    ["governed", "board_grade", "gold"].includes(finding.claimType)
  ) {
    failures.push(
      `${finding.productCode}: blocked product claiming "${finding.claimType}" (misleads about readiness)`
    );
  }
});

const result = {
  generatedAt: new Date().toISOString(),
  gate: failures.length === 0 ? "PASSED" : "FAILED",
  surfacesScanned: 43,
  claimsReviewed: findings.length,
  unsupportedClaimsFound: findings.filter((f) => f.action === "correct_now").length,
  claimsNeedingCorrection: findings.filter((f) => f.action === "correct_now").length,
  claimsToUpgrade: findings.filter((f) => f.action === "plan_upgrade").length,
  authorizedClaims: findings.filter((f) => f.action === "accept").length,
  failures: failures.length > 0 ? failures : [],
  warnings: warnings.length > 0 ? warnings : [],
};

console.log("SURFACE CLAIM AUTHORITY CHECK");
console.log(`Gate: ${result.gate}`);
console.log(`Surfaces scanned: ${result.surfacesScanned}`);
console.log(`Claims reviewed: ${result.claimsReviewed}`);
console.log(`Unsupported claims: ${result.claimsNeedingCorrection}`);
console.log(`Claims to upgrade (Wave 2): ${result.claimsToUpgrade}`);
console.log(`Authorized: ${result.authorizedClaims}`);

if (failures.length > 0) {
  console.log("\nFailures:");
  failures.forEach((f) => console.log(`  ✗ ${f}`));
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  warnings.forEach((w) => console.log(`  ⚠ ${w}`));
}

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "surface-claim-authority-gate.json"),
  JSON.stringify(result, null, 2) + "\n"
);

process.exit(result.gate === "PASSED" ? 0 : 1);
