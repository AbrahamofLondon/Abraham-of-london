#!/usr/bin/env node

/**
 * Product Claim Recovery Gate
 *
 * For products that are blocked_until_claim_evidenced or legacy_validated_pending_v2_revalidation,
 * this gate validates whether recovery attempts meet constitutional requirements.
 *
 * Hard rules:
 * - Blocked products cannot skip to elevated status without full v2 validation
 * - Target claim must match evidence-supported claim
 * - Measurement-inconclusive results cannot be converted to proof
 * - Recovery path must show full 4-test chain
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  enforceConstitutionRequirement,
  getConstitutionalClassification,
} from "./lib/require-validation-constitution.mjs";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

const failures = [];
const warnings = [];

// Known recovery candidates
const recoveryTargets = [
  {
    productCode: "personal_decision_audit",
    currentClassification: "blocked_until_claim_evidenced",
    recoveryPath: "full_4_test_chain_with_v2_evidence",
    recoveryStatus: "in_progress",
    blockingReasons: [
      "Scorer/product coupling in Wave 2G",
      "Full validation chain incomplete",
      "Decision-force-only upgrade attempted",
    ],
  },
];

const legacyPending = [
  {
    productCode: "fast_diagnostic",
    currentClassification: "legacy_validated_pending_v2_revalidation",
    priorEvidence: "externally_proven_gold_product",
    recoveryPath: "v2_evidence_revalidation",
    recoveryStatus: "pending",
  },
  {
    productCode: "team_assessment",
    currentClassification: "legacy_validated_pending_v2_revalidation",
    priorEvidence: "externally_proven_gold_product",
    recoveryPath: "v2_evidence_revalidation",
    recoveryStatus: "pending",
  },
  {
    productCode: "enterprise_assessment",
    currentClassification: "legacy_validated_pending_v2_revalidation",
    priorEvidence: "externally_proven_gold_product",
    recoveryPath: "v2_evidence_revalidation",
    recoveryStatus: "pending",
  },
];

// Validate recovery targets
console.log("PRODUCT CLAIM RECOVERY GATE");
console.log("\nBlocked Products Recovery:\n");

for (const recovery of recoveryTargets) {
  console.log(`${recovery.productCode}:`);
  console.log(`  Current: ${recovery.currentClassification}`);
  console.log(`  Recovery path: ${recovery.recoveryPath}`);

  // Constitution enforcement: cannot upgrade from blocked without full v2 validation
  const constitutionCheck = enforceConstitutionRequirement(
    recovery.productCode,
    "diagnostic_product",
    join(REPORTS_DIR, "validation-constitution-gate.json"),
    join(REPORTS_DIR, "release-authority-firewall.json")
  );

  if (!constitutionCheck.allowedToGrant) {
    console.log(`  ✗ Recovery blocked: ${constitutionCheck.requirement.blockingReasons[0]}`);
    failures.push(
      `${recovery.productCode}: recovery blocked until full v2 evidence available`
    );
  } else {
    console.log(`  ✓ Recovery path valid`);
  }
}

console.log("\n\nLegacy Products Pending v2:\n");

for (const legacy of legacyPending) {
  console.log(`${legacy.productCode}:`);
  console.log(`  Current: ${legacy.currentClassification}`);
  console.log(`  Prior authority: ${legacy.priorEvidence}`);
  console.log(`  Recovery path: ${legacy.recoveryPath}`);
  console.log(`  Status: ${legacy.recoveryStatus}`);

  // Legacy products must revalidate with v2 before restoring authority
  if (legacy.recoveryStatus === "pending") {
    warnings.push(
      `${legacy.productCode}: ${legacy.currentClassification}, pending v2 revalidation`
    );
    console.log(`  ⏸️  Awaiting v2 revalidation`);
  }
}

// Validate recovery conditions
const result = {
  generatedAt: new Date().toISOString(),
  gate: failures.length === 0 ? "PASSED" : "FAILED",
  recoveryTargets: recoveryTargets.length,
  legacyPending: legacyPending.length,
  recoveryPathsValid: recoveryTargets.filter((r) => {
    const check = enforceConstitutionRequirement(
      r.productCode,
      "diagnostic_product"
    );
    return check.allowedToGrant;
  }).length,
  constitutionEnforcement: {
    required: true,
    blockingReasons: failures,
  },
  failures: failures.length > 0 ? failures : [],
  warnings: warnings.length > 0 ? warnings : [],
};

console.log(`\n${"=".repeat(70)}`);
console.log("RECOVERY GATE RESULT");
console.log(`${"=".repeat(70)}`);
console.log(`Gate: ${result.gate}`);
console.log(`Recovery targets: ${result.recoveryTargets}`);
console.log(`Legacy pending v2: ${result.legacyPending}`);
console.log(`Valid recovery paths: ${result.recoveryPathsValid}`);

if (failures.length > 0) {
  console.log("\nBlocking reasons:");
  failures.forEach((f) => console.log(`  - ${f}`));
}

if (warnings.length > 0) {
  console.log("\nWarnings:");
  warnings.forEach((w) => console.log(`  - ${w}`));
}

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "product-claim-recovery-gate.json"),
  JSON.stringify(result, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "product-claim-recovery-gate.json")}`);

process.exit(result.gate === "PASSED" ? 0 : 1);
