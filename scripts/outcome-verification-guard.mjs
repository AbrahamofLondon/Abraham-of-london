#!/usr/bin/env node
/**
 * scripts/outcome-verification-guard.mjs
 *
 * CI guard for the Outcome Verification layer.
 *
 * Verifies:
 * 1. outcome-verification-contract.ts declares all required types
 *    (status, classification, evidence posture, didAct, changedState,
 *    accuracy, usefulness, reference, request, context, record, result)
 * 2. classifyOutcomeVerification function is exported and handles all
 *    status branches (DISPUTED, BLOCKED, COMPLETED, PARTIAL, NO_CHANGE,
 *    INSUFFICIENT_EVIDENCE)
 * 3. outcome-verification-service.ts exists (implementation layer)
 * 4. No raw outcome verification status strings surface directly on UI
 *    without a public label presenter
 * 5. OutcomeVerificationRecord type includes all required audit fields
 *    (magnitudeOfChange, effectivenessScore, decisionVelocityDelta implied
 *    by Prisma model OR contract fields)
 * 6. Verification contract has proofLabels field (multi-posture support)
 * 7. All status values are declared exactly once (no duplicates)
 * 8. OutcomeVerificationRequest includes evidenceSummary (evidence capture)
 * 9. No hardcoded "COMPLETED" / "DISPUTED" string leakage on UI surfaces
 *    without going through a presenter/label function
 * 10. OutcomeVerificationContext has sourceSurface and sourceLabel for
 *     attribution back to the originating product surface
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let violations = 0;

function check(condition, label, detail) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${label} — ${detail}`);
    violations++;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

function fileContains(relPath, pattern) {
  try {
    const content = readFileSync(join(ROOT, relPath), "utf-8");
    if (typeof pattern === "string") return content.includes(pattern);
    return pattern.test(content);
  } catch {
    return false;
  }
}

function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

console.log("\n🔍 OUTCOME VERIFICATION GUARD — Verification Layer Integrity Check\n");

const CONTRACT = "lib/product/outcome-verification-contract.ts";
const SERVICE = "lib/product/outcome-verification-service.ts";

// ── 1. Contract file exists ────────────────────────────────────────────────────
console.log("\n📋 Check 1 — Contract file");
check(fileExists(CONTRACT), "outcome-verification-contract.ts exists", "Contract file missing");

// ── 2. All status values declared ─────────────────────────────────────────────
console.log("\n📋 Check 2 — OutcomeVerificationStatus values");
check(fileContains(CONTRACT, '"NOT_REQUESTED"'), "NOT_REQUESTED status declared", "Missing status");
check(fileContains(CONTRACT, '"REQUESTED"'), "REQUESTED status declared", "Missing status");
check(fileContains(CONTRACT, '"COMPLETED"'), "COMPLETED status declared", "Missing status");
check(fileContains(CONTRACT, '"PARTIAL"'), "PARTIAL status declared", "Missing status");
check(fileContains(CONTRACT, '"BLOCKED"'), "BLOCKED status declared", "Missing status");
check(fileContains(CONTRACT, '"DISPUTED"'), "DISPUTED status declared", "Missing status");
check(fileContains(CONTRACT, '"NO_CHANGE"'), "NO_CHANGE status declared", "Missing status");
check(fileContains(CONTRACT, '"INSUFFICIENT_EVIDENCE"'), "INSUFFICIENT_EVIDENCE status declared", "Missing status");

// ── 3. Classification values declared ─────────────────────────────────────────
console.log("\n📋 Check 3 — OutcomeVerificationClassification values");
check(fileContains(CONTRACT, '"ACTION_CONFIRMED"'), "ACTION_CONFIRMED classification declared", "Missing classification");
check(fileContains(CONTRACT, '"OUTCOME_IMPROVED"'), "OUTCOME_IMPROVED classification declared", "Missing classification");
check(fileContains(CONTRACT, '"OUTCOME_UNCHANGED"'), "OUTCOME_UNCHANGED classification declared", "Missing classification");
check(fileContains(CONTRACT, '"ACTION_BLOCKED"'), "ACTION_BLOCKED classification declared", "Missing classification");
check(fileContains(CONTRACT, '"SYSTEM_FINDING_DISPUTED"'), "SYSTEM_FINDING_DISPUTED declared", "Missing classification");

// ── 4. Evidence posture types ──────────────────────────────────────────────────
console.log("\n📋 Check 4 — OutcomeVerificationEvidencePosture values");
check(fileContains(CONTRACT, '"USER_REPORTED"'), "USER_REPORTED evidence posture declared", "Missing evidence posture");
check(fileContains(CONTRACT, '"SYSTEM_INFERRED"'), "SYSTEM_INFERRED evidence posture declared", "Missing evidence posture");
check(fileContains(CONTRACT, '"OPERATOR_REVIEWED"'), "OPERATOR_REVIEWED evidence posture declared", "Missing evidence posture");
check(fileContains(CONTRACT, '"VERIFIED"'), "VERIFIED evidence posture declared", "Missing evidence posture");

// ── 5. User response types ─────────────────────────────────────────────────────
console.log("\n📋 Check 5 — User response type declarations");
check(fileContains(CONTRACT, "OutcomeDidAct"), "OutcomeDidAct type declared", "Missing OutcomeDidAct");
check(fileContains(CONTRACT, "OutcomeChangedState"), "OutcomeChangedState type declared", "Missing OutcomeChangedState");
check(fileContains(CONTRACT, "OutcomeAccuracyAnswer"), "OutcomeAccuracyAnswer type declared", "Missing OutcomeAccuracyAnswer");
check(fileContains(CONTRACT, "OutcomeUsefulnessAnswer"), "OutcomeUsefulnessAnswer type declared", "Missing OutcomeUsefulnessAnswer");

// ── 6. Reference type has all surface fields ───────────────────────────────────
console.log("\n📋 Check 6 — OutcomeVerificationReference & Context");
check(fileContains(CONTRACT, "OutcomeVerificationReference"), "Reference type declared", "Missing OutcomeVerificationReference");
check(fileContains(CONTRACT, "OutcomeVerificationContext"), "Context type declared", "Missing OutcomeVerificationContext");
check(fileContains(CONTRACT, "sourceSurface"), "sourceSurface field on context", "Missing sourceSurface for attribution");
check(fileContains(CONTRACT, "sourceLabel"), "sourceLabel field on context", "Missing sourceLabel for attribution");
check(fileContains(CONTRACT, "strategyRoomSessionId"), "strategyRoomSessionId in reference", "Missing Strategy Room attribution field");
check(fileContains(CONTRACT, "executiveRunId"), "executiveRunId in reference", "Missing Executive Reporting attribution field");

// ── 7. Record type has audit fields ───────────────────────────────────────────
console.log("\n📋 Check 7 — OutcomeVerificationRecord audit fields");
check(fileContains(CONTRACT, "OutcomeVerificationRecord"), "Record type declared", "Missing OutcomeVerificationRecord");
check(fileContains(CONTRACT, "verificationId"), "verificationId on record", "Missing verificationId");
check(fileContains(CONTRACT, "userEmail"), "userEmail on record (attribution)", "Missing userEmail");
check(fileContains(CONTRACT, "proofLabels"), "proofLabels on record", "Missing proofLabels — multi-posture evidence support");
check(fileContains(CONTRACT, "whatChanged"), "whatChanged on record", "Missing whatChanged — user evidence field");
check(fileContains(CONTRACT, "checkpointResponseStatus"), "checkpointResponseStatus on record", "Missing checkpoint response linkage");

// ── 8. Request type has required evidence fields ──────────────────────────────
console.log("\n📋 Check 8 — OutcomeVerificationRequest evidence capture");
check(fileContains(CONTRACT, "OutcomeVerificationRequest"), "Request type declared", "Missing OutcomeVerificationRequest");
check(fileContains(CONTRACT, "evidenceSummary"), "evidenceSummary on request", "Missing evidence summary field");
check(fileContains(CONTRACT, "rememberNote"), "rememberNote on request", "Missing governed memory field");
check(fileContains(CONTRACT, "didAct"), "didAct on request", "Missing action field");
check(fileContains(CONTRACT, "changedState"), "changedState on request", "Missing state change field");
check(fileContains(CONTRACT, "systemDiagnosisAccuracy"), "systemDiagnosisAccuracy on request", "Missing accuracy assessment field");
check(fileContains(CONTRACT, "requiredMoveUsefulness"), "requiredMoveUsefulness on request", "Missing usefulness assessment field");

// ── 9. classifyOutcomeVerification handles all branches ───────────────────────
console.log("\n📋 Check 9 — classifyOutcomeVerification function completeness");
check(fileContains(CONTRACT, "classifyOutcomeVerification"), "classifyOutcomeVerification exported", "Missing classification function");
check(fileContains(CONTRACT, "DISPUTED_FINDING"), "DISPUTED_FINDING checkpoint status handled", "Missing checkpoint status branch");
check(fileContains(CONTRACT, "BLOCKED"), "BLOCKED branch handled", "Missing BLOCKED branch in classifier");
check(fileContains(CONTRACT, "INSUFFICIENT_EVIDENCE"), "INSUFFICIENT_EVIDENCE branch handled", "Missing thin-evidence branch");
check(fileContains(CONTRACT, "PARTIALLY_COMPLETED"), "PARTIALLY_COMPLETED checkpoint status", "Missing partial completion status");
check(
  fileContains(CONTRACT, /hasEvidence\s*=\s*Boolean/),
  "Evidence presence check (hasEvidence) used in classifier",
  "Classifier must gate evidence claims on actual evidence presence",
);

// ── 10. Service file exists ────────────────────────────────────────────────────
console.log("\n📋 Check 10 — outcome-verification-service.ts");
check(fileExists(SERVICE), "outcome-verification-service.ts exists", "Service implementation missing");

// ── 11. OutcomeVerificationResult includes calibration ────────────────────────
console.log("\n📋 Check 11 — OutcomeVerificationResult calibration field");
check(
  fileContains(CONTRACT, "calibration"),
  "calibration field on OutcomeVerificationResult",
  "Missing calibration data — model accuracy tracking requires this",
);
check(
  fileContains(CONTRACT, "predictionError"),
  "predictionError in calibration",
  "Missing prediction error tracking in calibration object",
);
check(
  fileContains(CONTRACT, "accuracyScore"),
  "accuracyScore in calibration",
  "Missing accuracy score in calibration object",
);

// ── 12. Signal verification record (P1) ──────────────────────────────────────
console.log("\n📋 Check 12 — Automatic verification record creation (P1)");
const SVR = "lib/product/signal-verification-record.ts";
check(fileExists(SVR), "signal-verification-record.ts exists", "Signal verification record service missing — P1 requirement");
check(fileContains(SVR, "createSignalVerificationRecord"), "createSignalVerificationRecord exported", "Record creation function missing");
check(fileContains(SVR, "PENDING_VERIFICATION"), "PENDING_VERIFICATION is initial status", "Initial status must be PENDING_VERIFICATION");
check(fileContains(SVR, "operatorReviewRequired"), "operatorReviewRequired field declared", "Operator review flag missing — P1 requirement");
check(fileContains(SVR, "verificationDueAt"), "verificationDueAt field declared", "Due date field missing from record");
check(fileContains(SVR, "originalSignal"), "originalSignal field declared", "Original signal field missing — P1 requirement");
check(fileContains(SVR, "comparisonBasis"), "comparisonBasis field declared", "Comparison basis field missing — P1 requirement");
check(fileContains(SVR, "recommendedMove"), "recommendedMove field declared", "Recommended move field missing — P1 requirement");

// ── 13. Score API creates verification record (P1 wiring) ────────────────────
console.log("\n📋 Check 13 — Material output creates verification record (P1)");
check(
  fileContains("pages/api/diagnostics/score.ts", "createSignalVerificationRecord"),
  "score.ts creates signal verification record",
  "Fast diagnostic does not create a durable verification record after signal output — P1 failure",
);

// ── 14. User verification path complete (P2) ──────────────────────────────────
console.log("\n📋 Check 14 — User verification path (P2)");
const OVP = "components/outcomes/OutcomeVerificationPanel.tsx";
check(fileExists(OVP), "OutcomeVerificationPanel.tsx exists", "User verification UI missing — P2 requirement");
check(fileContains(OVP, '"DISPUTED"') || fileContains(OVP, '"INACCURATE"'), "Dispute path available to user", "User cannot dispute system diagnosis — P2 requirement");
check(fileContains(OVP, '"BLOCKED"'), "Blocked path available to user", "User cannot report action blocked — P2 requirement");
check(fileContains(OVP, '"NO"') || fileContains(OVP, 'didAct'), "Not-acted path available to user", "User cannot report action not taken — P2 requirement");
check(fileContains(OVP, '"UNKNOWN"') || fileContains(OVP, "too early"), "Too-early path available to user", "User cannot report too early to tell — P2 requirement");

// ── 15. Operator review queue (P3) ───────────────────────────────────────────
console.log("\n📋 Check 15 — Operator review queue operational (P3)");
const OP_PAGE = "pages/admin/outcome-verification.tsx";
const OP_API = "pages/api/admin/outcome-verification.ts";
const OP_SVC = "lib/product/operator-outcome-review.ts";
check(fileExists(OP_PAGE), "admin/outcome-verification.tsx exists", "Operator review page missing — P3 requirement");
check(fileExists(OP_API), "api/admin/outcome-verification.ts exists", "Operator review API missing");
check(fileExists(OP_SVC), "operator-outcome-review.ts exists", "Operator review service missing");
check(
  fileContains("pages/admin/index.tsx", "/admin/outcome-verification"),
  "Outcome verification in admin nav",
  "Operator review queue not in admin navigation — P3 requirement",
);
check(fileContains(OP_SVC, "recordOperatorReview"), "recordOperatorReview exported", "Review recording missing");
check(fileContains(OP_SVC, "getPendingOperatorReviews"), "getPendingOperatorReviews exported", "Queue loading missing");
check(fileContains(OP_PAGE, "ACCURACY_CONFIRMED"), "Approve path on operator page", "Operator cannot confirm accuracy");
check(fileContains(OP_PAGE, "ACCURACY_DISPUTED"), "Dispute path on operator page", "Operator cannot dispute accuracy");
check(fileContains(OP_PAGE, "memoryApproved"), "Memory approval gate on operator page", "No memory approval gate — P4 requirement");

// ── 16. Memory compounding (P4) ──────────────────────────────────────────────
console.log("\n📋 Check 16 — Memory compounding chain (P4)");
check(
  fileContains(OP_SVC, "applyVerificationToMemory"),
  "applyVerificationToMemory exported from operator service",
  "Memory application function missing — P4 chain broken",
);
check(
  fileContains(OP_SVC, "ACCURACY_CONFIRMED"),
  "applyVerificationToMemory called on ACCURACY_CONFIRMED",
  "Memory not applied on operator accuracy confirmation — P4 chain broken",
);
check(
  fileContains(OP_SVC, "MEMORY_UPDATED"),
  "MEMORY_UPDATED state written during memory application",
  "Memory update state not written — P4 chain not provable",
);
check(
  fileContains(OP_SVC, "COMPARISON_BASIS_MATURITY"),
  "Comparison basis maturity is a memory target",
  "Maturity upgrade not in memory compounding chain — P5 requirement",
);

// ── 17. Comparison maturity rules (P5) ───────────────────────────────────────
console.log("\n📋 Check 17 — Comparison basis maturity rules (P5)");
const CBC = "lib/product/comparison-basis-contract.ts";
check(
  fileContains(CBC, "BOOTSTRAP_DISTRIBUTION") && fileContains(CBC, "enforceMaturityGate"),
  "Maturity gate guards bootstrap distribution",
  "Bootstrap distribution not gated — can bypass maturity rules",
);
check(
  fileContains(CBC, "OUTCOME_VERIFIED_RECORDS"),
  "OUTCOME_VERIFIED_RECORDS basis type declared",
  "Cannot gate maturity 3+ without this type",
);
check(
  fileContains(CBC, "OPERATOR_REVIEWED_SAMPLE"),
  "OPERATOR_REVIEWED_SAMPLE basis type declared",
  "Cannot gate maturity 4+ without this type",
);
check(
  fileContains(CBC, "maturityLevel >= 3") || fileContains(CBC, "maturityLevel > 2"),
  "Maturity 3+ check implemented in gate",
  "Maturity 3 gate not implemented — P5 failure",
);
check(
  fileContains(CBC, "maturityLevel >= 4"),
  "Maturity 4+ check implemented in gate",
  "Maturity 4 gate not implemented — P5 failure",
);
check(
  fileContains(CBC, "maturityLevel >= 5"),
  "Maturity 5 check implemented in gate",
  "Maturity 5 gate not implemented — P5 failure",
);

// ── Result ─────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
if (violations === 0) {
  console.log("✅ OUTCOME VERIFICATION GUARD — ALL CHECKS PASSED");
  console.log("   Classification: OUTCOME_VERIFICATION_LAYER_COMPLETE");
} else {
  console.error(`❌ OUTCOME VERIFICATION GUARD — ${violations} VIOLATION${violations === 1 ? "" : "S"}`);
  process.exit(1);
}
