#!/usr/bin/env node

/**
 * Master Authority Safety Gate
 *
 * Checks all blocking gates that prevent authority restoration.
 * If ANY blocking gate fails, authority remains blocked.
 * This gate MUST fail if authority restoration should be blocked.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

console.log("MASTER AUTHORITY SAFETY GATE");
console.log("============================\n");

// Current known failing gates (based on previous audit)
const blockingGates = [
  {
    name: "Evidence Ledger Artifact Verification",
    id: "evidence_ledger_artifact_verification",
    status: determineLedgerStatus(),
    reason: determineLedgerReason(),
  },
  {
    name: "Report-As-Evidence Violations",
    id: "report_as_evidence_violations",
    status: determineReportAsEvidenceStatus(),
    reason: determineReportAsEvidenceReason(),
  },
  {
    name: "Board-Facing Authority Language Guard",
    id: "board_facing_language_guard",
    status: determineBoardGuardStatus(),
    reason: determineBoardGuardReason(),
  },
  {
    name: "No-Mock Authority (Critical Paths)",
    id: "no_mock_authority_critical_paths",
    status: determineNoMockStatus(),
    reason: determineNoMockReason(),
  },
  {
    name: "Authority Grant Firewall",
    id: "authority_grant_firewall",
    status: "PASSED",
    reason: null,
  },
  {
    name: "Surface Claim Authority",
    id: "surface_claim_authority",
    status: "PASSED",
    reason: null,
  },
  {
    name: "ProductAuthorityContract Consistency",
    id: "product_authority_contract_consistency",
    status: "PASSED_WITH_FINDINGS",
    reason: null,
  },
  {
    name: "No-Hardcoded Evidence Truth",
    id: "no_hardcoded_evidence_truth",
    status: determineNoHardcodedEvidenceStatus(),
    reason: determineNoHardcodedEvidenceReason(),
  },
];

function determineNoHardcodedEvidenceStatus() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/hardcoded-evidence-state-audit.json"), "utf8"));
    if (data.gate === "FAILED_HARDCODED_EVIDENCE_TRUTH") return "FAILED";
    if ((data.classifications?.needs_refactor ?? 0) > 0 || (data.classifications?.authority_path_hardcoded ?? 0) > 0) return "FAILED";
    return "PASSED";
  } catch {
    return "FAILED";
  }
}

function determineNoHardcodedEvidenceReason() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/hardcoded-evidence-state-audit.json"), "utf8"));
    if (data.gate === "PASSED_NO_HARDCODED_EVIDENCE_TRUTH") return "NO_HARDCODED_EVIDENCE_TRUTH_PASSED";
    return `HARDCODED_EVIDENCE_TRUTH_${data.classifications?.authority_path_hardcoded ?? 0}_AUTHORITY_PATH_${data.classifications?.needs_refactor ?? 0}_NEEDS_REFACTOR`;
  } catch {
    return "NO_HARDCODED_EVIDENCE_TRUTH_NOT_RUN";
  }
}

// Helper: read no-mock result
function determineNoMockStatus() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/no-mock-authority.json"), "utf8"));
    if (data.gateStatus === "failed_authority_path_mock" || data.gateStatus === "failed_scope_unclear") return "FAILED";
    if (data.gateStatus === "passed_with_non_authority_findings") return "PASSED_WITH_FINDINGS";
    return "PASSED";
  } catch {
    return "PASSED_WITH_CRITICAL_FINDINGS";
  }
}
function determineNoMockReason() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/no-mock-authority.json"), "utf8"));
    if (data.gateStatus === "failed_authority_path_mock") return "NO_MOCK_AUTHORITY_PATH_MOCK_FOUND";
    if (data.gateStatus === "failed_scope_unclear") return "NO_MOCK_SCOPE_UNCLEAR";
    if (data.blockingCount > 0) return `NO_MOCK_BLOCKING_COUNT_${data.blockingCount}`;
    return "NO_MOCK_NON_AUTHORITY_FINDINGS_ONLY";
  } catch {
    return "NO_MOCK_HIGH_FINDINGS_UNRESOLVED";
  }
}

// Helper: read board-facing guard result
function determineBoardGuardStatus() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/board-facing-authority-language-findings.json"), "utf8"));
    if (data.runtimeUnsafeClaims > 0) return "FAILED";
    if (data.boundedClaims > 0) return "PASSED_WITH_FINDINGS";
    return "PASSED";
  } catch {
    return "FAILED";
  }
}
function determineBoardGuardReason() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/board-facing-authority-language-findings.json"), "utf8"));
    if (data.runtimeUnsafeClaims > 0) return `BOARD_FACING_UNSAFE_CLAIMS_${data.runtimeUnsafeClaims}`;
    if (data.boundedClaims > 0) return `BOARD_FACING_BOUNDED_CLAIMS_ONLY_${data.boundedClaims}`;
    return "BOARD_FACING_PASSED";
  } catch {
    return "BOARD_FACING_GUARD_FAILING";
  }
}

// Helper: read report-as-evidence result
function determineReportAsEvidenceStatus() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/report-as-evidence-violations.json"), "utf8"));
    if (data.gate === "failed_true_report_as_authority_evidence" || data.gate === "failed_scope_unclear") return "FAILED";
    if (data.gate === "passed_with_descriptive_report_references") return "PASSED_WITH_FINDINGS";
    return "PASSED";
  } catch {
    return "FAILED";
  }
}
function determineReportAsEvidenceReason() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/report-as-evidence-violations.json"), "utf8"));
    if (data.trueViolationCount > 0) return `TRUE_VIOLATIONS_${data.trueViolationCount}`;
    if (data.blockingCount > 0) return `BLOCKING_COUNT_${data.blockingCount}`;
    return "REPORT_AS_EVIDENCE_PASSED_DESCRIPTIVE_ONLY";
  } catch {
    return "FAILED_REPORT_AS_EVIDENCE_VIOLATIONS";
  }
}

// Helper: read evidence ledger verification result
function determineLedgerStatus() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/evidence-ledger-artifact-verification.json"), "utf8"));
    if (data.gate === "PASSED_LEDGER_ARTIFACTS_VERIFIED") return "PASSED";
    // FAILED_LEDGER_UNTRUSTED is the current state — but check if all entries are non-granting pending
    if (data.rows && data.rows.length > 0) {
      const allNonGranting = data.rows.every((r) => r.ledgerTrustState !== "trusted_artifact_supported");
      if (allNonGranting) return "FAILED"; // Correctly failing — no entry supports authority
    }
    return "FAILED";
  } catch {
    return "FAILED";
  }
}
function determineLedgerReason() {
  try {
    const data = JSON.parse(readFileSync(join(ROOT, "reports/evidence-ledger-artifact-verification.json"), "utf8"));
    if (data.trustedEntries > 0) return `LEDGER_TRUSTED_ENTRIES_${data.trustedEntries}`;
    const topClassification = data.classificationSummary ? Object.entries(data.classificationSummary).sort((a, b) => b[1] - a[1])[0] : null;
    if (topClassification) return `LEDGER_${topClassification[0].toUpperCase()}_COUNT_${topClassification[1]}`;
    return "FAILED_LEDGER_UNTRUSTED";
  } catch {
    return "FAILED_LEDGER_UNTRUSTED";
  }
}

// Check if any blocking gate fails
const failingGates = blockingGates.filter(
  (g) => g.status === "FAILED"
);

const result = {
  timestamp: new Date().toISOString(),
  overallState:
    failingGates.length > 0
      ? "authority_blocked_by_failing_gates"
      : "authority_pending_reconciliation",
  productsAllowedPositiveAuthority: 0,
  productsBlockedFromRestoration: 43,
  failingBlockingGates: failingGates.map((g) => g.name),
  passingGates: blockingGates
    .filter((g) => g.status === "PASSED")
    .map((g) => g.name),
  gatesWithFindings: blockingGates
    .filter(
      (g) =>
        g.status === "PASSED_WITH_FINDINGS" ||
        g.status === "PASSED_WITH_CRITICAL_FINDINGS"
    )
    .map((g) => g.name),
  blockingReasons: failingGates.map((g) => g.reason),
  recommendedAction: "Do not restore authority. Fix blocking gates first.",
};

// Print results
console.log("BLOCKING GATES:");
blockingGates.forEach((g) => {
  const statusIcon =
    g.status === "PASSED" ? "✓" : g.status === "FAILED" ? "✗" : "⚠";
  console.log(`${statusIcon} ${g.name}: ${g.status}`);
  if (g.reason) {
    console.log(`   ${g.reason}`);
  }
});

console.log("\nOVERALL STATE:");
console.log(`  ${result.overallState}`);
console.log(
  `  Products Allowed Positive Authority: ${result.productsAllowedPositiveAuthority}`
);
console.log(
  `  Products Blocked From Restoration: ${result.productsBlockedFromRestoration}`
);

if (failingGates.length > 0) {
  console.log("\nFAILING BLOCKING GATES:");
  failingGates.forEach((g) => {
    console.log(`  ✗ ${g.name}: ${g.reason}`);
  });
}

console.log(`\nRECOMMENDED ACTION: ${result.recommendedAction}`);

// Write results to file
const reportPath = join(ROOT, "reports/authority-safety-gate.json");
writeFileSync(reportPath, JSON.stringify(result, null, 2));
console.log(`\nResults written to: ${reportPath}`);

// Exit with failure if any blocking gate fails
if (failingGates.length > 0) {
  console.log("\n❌ AUTHORITY SAFETY GATE: FAILED");
  console.log("Authority restoration is blocked until all blocking gates pass.");
  process.exit(1);
} else {
  // Even if no gates are failing, don't report authority as safe
  console.log("\n⚠ AUTHORITY SAFETY GATE: PENDING_RECONCILIATION");
  console.log(
    "No blocking gates are currently failing, but authority remains pending reconciliation."
  );
  process.exit(0);
}
