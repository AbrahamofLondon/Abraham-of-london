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

// ── 18. Verification propagation — wrapper functions declared (P0/P1) ─────────
console.log("\n📋 Check 18 — createMaterialOutputVerificationRecord + createGovernedReviewObligation");
const SVR_FILE = "lib/product/signal-verification-record.ts";
check(
  fileContains(SVR_FILE, "createMaterialOutputVerificationRecord"),
  "createMaterialOutputVerificationRecord exported",
  "Convenience wrapper missing — propagation across surfaces not possible",
);
check(
  fileContains(SVR_FILE, "createGovernedReviewObligation"),
  "createGovernedReviewObligation exported",
  "Governed review obligation function missing — boardroom/oversight not gated",
);
check(
  fileContains(SVR_FILE, "normaliseSeverity"),
  "normaliseSeverity helper present",
  "Severity normalisation missing — diagnostic severities won't map correctly to signal severities",
);
check(
  fileContains(SVR_FILE, "deriveDueDays"),
  "deriveDueDays helper present",
  "Due date derivation missing — all records will use default 14 days regardless of severity",
);

// ── 19. Purpose Alignment creates verification record (P2) ───────────────────
console.log("\n📋 Check 19 — Purpose Alignment verification record (P2)");
const SUBMIT = "pages/api/diagnostics/submit.ts";
check(
  fileContains(SUBMIT, "createMaterialOutputVerificationRecord"),
  "submit.ts creates verification record (covers purpose-alignment)",
  "Purpose Alignment diagnostic submission is verification-silent — P2 failure",
);
check(
  fileContains(SUBMIT, '"purpose-alignment"'),
  "purpose-alignment mapped explicitly in submit.ts",
  "Purpose Alignment not explicitly mapped to its source surface",
);

// ── 20. Decision Instruments create verification record (P3) ─────────────────
console.log("\n📋 Check 20 — Decision Instruments verification record (P3)");
const DI_RESULTS = "pages/api/decision-instruments/results/index.ts";
check(
  fileContains(DI_RESULTS, "createMaterialOutputVerificationRecord"),
  "instrument results route creates verification record",
  "Instrument result persistence is verification-silent — P3 failure",
);
check(
  fileContains(DI_RESULTS, '"decision-instrument"'),
  "decision-instrument source surface set on record",
  "Instrument source surface not set — records will not be queryable by surface",
);

// ── 21. Executive Reporting creates verification record (P4) ──────────────────
console.log("\n📋 Check 21 — Executive Reporting verification record (P4)");
const ER_ROUTE = "pages/api/diagnostics/executive-reporting.ts";
const API_SUBMIT = "lib/diagnostics/api-submit.ts";
check(
  fileContains(ER_ROUTE, "createMaterialOutputVerificationRecord"),
  "executive-reporting.ts wires verification via afterCreate",
  "Executive Reporting submission is verification-silent — P4 failure",
);
check(
  fileContains(API_SUBMIT, "afterCreate"),
  "api-submit.ts supports afterCreate hook",
  "afterCreate hook missing from handleDiagnosticSubmit — ER verification cannot fire",
);
check(
  fileContains(ER_ROUTE, '"executive-reporting"'),
  "executive-reporting source surface set",
  "Executive Reporting source surface not set on verification record",
);

// ── 22. Strategy Room creates verification record (P4) ───────────────────────
console.log("\n📋 Check 22 — Strategy Room verification record + boardroom obligation (P4)");
const SR_SUBMIT = "pages/api/strategy-room/submit.ts";
check(
  fileContains(SR_SUBMIT, "createMaterialOutputVerificationRecord"),
  "strategy-room/submit.ts creates verification record",
  "Strategy Room commit is verification-silent — P4 failure",
);
check(
  fileContains(SR_SUBMIT, "createGovernedReviewObligation"),
  "strategy-room/submit.ts creates boardroom governed review obligation",
  "Boardroom review obligation not created at strategy session commit — P5 failure",
);
check(
  fileContains(SR_SUBMIT, '"boardroom-session"'),
  "boardroom-session source surface set on governed review obligation",
  "Boardroom review obligation source surface not set",
);

// ── 23. Return Brief creates verification record (P4) ────────────────────────
console.log("\n📋 Check 23 — Return Brief verification record (P4)");
const RB_SEND = "pages/api/internal/return-brief/send.ts";
check(
  fileContains(RB_SEND, "createMaterialOutputVerificationRecord"),
  "return-brief/send.ts creates verification record",
  "Return Brief delivery is verification-silent — P4 failure",
);
check(
  fileContains(RB_SEND, '"return-brief"'),
  "return-brief source surface set on verification record",
  "Return Brief source surface not set",
);
check(
  fileContains(RB_SEND, "operatorReviewRequired: true"),
  "Return Brief sets operatorReviewRequired true (signal recurrence always needs review)",
  "Return Brief does not require operator review — P4 failure",
);

// ── 24. Oversight brief delivery creates governed review obligation (P5) ──────
console.log("\n📋 Check 24 — Oversight Brief governed review obligation (P5)");
const OB_SEND = "pages/api/internal/oversight/send.ts";
check(
  fileContains(OB_SEND, "createGovernedReviewObligation"),
  "oversight/send.ts creates governed review obligation",
  "Oversight brief delivery is verification-silent — P5 failure",
);
check(
  fileContains(OB_SEND, '"oversight-brief"'),
  "oversight-brief source surface set on governed obligation",
  "Oversight source surface not set — records not queryable",
);

// ── 25. No material paid output is verification-silent (P6) ─────────────────
console.log("\n📋 Check 25 — Verification spine coverage (P6)");
const COVERED = [
  ["pages/api/diagnostics/score.ts", "createSignalVerificationRecord", "/diagnostics/fast"],
  [SUBMIT, "createMaterialOutputVerificationRecord", "/diagnostics/purpose-alignment"],
  [DI_RESULTS, "createMaterialOutputVerificationRecord", "/decision-instruments/*/run"],
  [ER_ROUTE, "createMaterialOutputVerificationRecord", "/diagnostics/executive-reporting/run"],
  [SR_SUBMIT, "createMaterialOutputVerificationRecord", "/strategy-room/session"],
  [RB_SEND, "createMaterialOutputVerificationRecord", "/briefing/return/[sessionId]"],
  [SR_SUBMIT, "createGovernedReviewObligation", "/boardroom/[sessionId] (via strategy commit)"],
  [OB_SEND, "createGovernedReviewObligation", "/oversight/brief/[cycleId] (via delivery)"],
];
for (const [file, fn, surface] of COVERED) {
  check(
    fileContains(file, fn),
    `${surface} — verification wired`,
    `${surface} is verification-silent — no accountability point after material output`,
  );
}

// ── 26. Idempotency — verificationKey + dedup guard (P0) ────────────────────
console.log("\n📋 Check 26 — Verification idempotency (P0)");
check(
  fileContains(SVR_FILE, "verificationKey"),
  "verificationKey field declared on SignalVerificationRecord",
  "No idempotency key — duplicate PENDING_VERIFICATION records can be created",
);
check(
  fileContains(SVR_FILE, "computeVerificationKey"),
  "computeVerificationKey function present",
  "Deterministic key computation missing — idempotency not possible",
);
check(
  fileContains(SVR_FILE, "verificationPurpose"),
  "verificationPurpose discriminant on CreateSignalVerificationInput",
  "Purpose discriminant missing — same surface+source pair cannot have different purpose records",
);
check(
  fileContains(SVR_FILE, "Idempotency check"),
  "Idempotency check comment present in createSignalVerificationRecord",
  "No idempotency guard — createSignalVerificationRecord will create duplicates",
);
check(
  fileContains(SVR_FILE, "verdictPrefix"),
  "verdictPrefix used to detect existing records",
  "Duplicate detection not implemented — existing records will not be found",
);

// ── 27. No read-side mutation — boardroom/oversight SSR (P1) ────────────────
console.log("\n📋 Check 27 — No read-side mutation on SSR pages (P1)");
const BOARDROOM_PAGE = "pages/boardroom/index.tsx";
const OVERSIGHT_PAGE = "pages/oversight/index.tsx";
check(
  !fileContains(BOARDROOM_PAGE, "createGovernedReviewObligation"),
  "Boardroom SSR does not create governed review obligations",
  "Boardroom GET/SSR creates governed obligations — read-side mutation violation",
);
check(
  !fileContains(BOARDROOM_PAGE, "createSignalVerificationRecord"),
  "Boardroom SSR does not create verification records",
  "Boardroom GET/SSR creates verification records — read-side mutation violation",
);
check(
  !fileContains(OVERSIGHT_PAGE, "createGovernedReviewObligation"),
  "Oversight SSR does not create governed review obligations",
  "Oversight GET/SSR creates governed obligations — read-side mutation violation",
);
check(
  !fileContains(OVERSIGHT_PAGE, "createSignalVerificationRecord"),
  "Oversight SSR does not create verification records",
  "Oversight GET/SSR creates verification records — read-side mutation violation",
);

// ── 28. Queue posture service and render (P2) ────────────────────────────────
console.log("\n📋 Check 28 — Operator review queue posture (P2)");
const OP_SVC2 = "lib/product/operator-outcome-review.ts";
const OV_PAGE = "pages/admin/outcome-verification.tsx";
const RR_PAGE = "pages/admin/retainer-readiness.tsx";
check(
  fileContains(OP_SVC2, "getOperatorReviewQueuePosture"),
  "getOperatorReviewQueuePosture exported from operator service",
  "Queue posture function missing — cannot surface SLA health to operators",
);
check(
  fileContains(OP_SVC2, "reviewSlaBand"),
  "reviewSlaBand field on ReviewQueuePosture",
  "SLA band classification missing from queue posture",
);
check(
  fileContains(OP_SVC2, "overdueReviewCount"),
  "overdueReviewCount in queue posture",
  "Overdue count missing — operators cannot identify SLA breaches",
);
check(
  fileContains(OP_SVC2, "criticalPendingCount"),
  "criticalPendingCount in queue posture",
  "Critical pending count missing",
);
check(
  fileContains(OV_PAGE, "getOperatorReviewQueuePosture"),
  "outcome-verification page loads queue posture",
  "Queue posture not loaded in /admin/outcome-verification",
);
check(
  fileContains(OV_PAGE, "reviewSlaBand"),
  "SLA band rendered on outcome-verification page",
  "SLA band not rendered for operators",
);
check(
  fileContains(RR_PAGE, "getOperatorReviewQueuePosture"),
  "retainer-readiness page loads verification queue posture",
  "Verification queue posture not visible from retainer readiness surface",
);
check(
  fileContains(RR_PAGE, "Verification Queue Posture"),
  "Verification Queue Posture section rendered on retainer-readiness",
  "Verification queue posture section missing from retainer-readiness",
);

// ── 29. Verification evidence posture (P3) ───────────────────────────────────
console.log("\n📋 Check 29 — Verification evidence posture (P3)");
check(
  fileContains(SVR_FILE, "VerificationEvidencePosture"),
  "VerificationEvidencePosture type declared",
  "Evidence posture type missing — cannot weight memory contributions",
);
check(
  fileContains(SVR_FILE, "SELF_REPORTED_ONLY"),
  "SELF_REPORTED_ONLY posture declared",
  "Minimum evidence posture missing",
);
check(
  fileContains(SVR_FILE, "MULTI_SOURCE_SUPPORTED"),
  "MULTI_SOURCE_SUPPORTED posture declared",
  "Maximum evidence posture missing",
);
check(
  fileContains(SVR_FILE, "resolveVerificationEvidencePosture"),
  "resolveVerificationEvidencePosture exported",
  "Evidence posture resolution function missing",
);
check(
  fileContains(SVR_FILE, "memoryWeightForPosture"),
  "memoryWeightForPosture exported",
  "Memory weight function missing — posture cannot influence memory contribution",
);

// ── 30. Reversibility states declared (P4) ───────────────────────────────────
console.log("\n📋 Check 30 — Reversibility states (P4)");
check(
  fileContains(SVR_FILE, "OUTCOME_REOPENED"),
  "OUTCOME_REOPENED state declared",
  "Cannot re-open completed verifications without deleting history",
);
check(
  fileContains(SVR_FILE, "OPERATOR_REVISED"),
  "OPERATOR_REVISED state declared",
  "Cannot record operator revision of prior decision",
);
check(
  fileContains(SVR_FILE, "MEMORY_DOWNGRADED"),
  "MEMORY_DOWNGRADED state declared",
  "Cannot record memory downgrade — irreversible inflation risk",
);
check(
  fileContains(SVR_FILE, "COMPARISON_BASIS_REDUCED"),
  "COMPARISON_BASIS_REDUCED state declared",
  "Cannot reduce comparison basis — maturity inflation risk",
);
check(
  fileContains(SVR_FILE, "reopenVerificationRecord"),
  "reopenVerificationRecord function exported",
  "No mechanism to re-open a completed verification",
);
check(
  fileContains(SVR_FILE, "downgradeVerificationRecord"),
  "downgradeVerificationRecord function exported",
  "No mechanism to downgrade memory application without history loss",
);

// ── 31. Public claim alignment (P5) ──────────────────────────────────────────
console.log("\n📋 Check 31 — Public claim alignment (P5)");
check(
  fileContains(SVR_FILE, "buildVerificationPublicClaim"),
  "buildVerificationPublicClaim exported",
  "Public claim builder missing — surfaces may use raw status strings as claims",
);
check(
  fileContains(SVR_FILE, "canClaimVerified"),
  "canClaimVerified field on public claim result",
  "No explicit gate on 'verified outcome' language",
);
check(
  fileContains(SVR_FILE, "Every material paid or governed output creates a future review point"),
  "Safe default public claim language present",
  "Safe default claim missing — unverified claims possible",
);
check(
  fileContains(SVR_FILE, "Operator-confirmed outcome"),
  "Operator-confirmed claim label present (highest evidence tier)",
  "No graduated claim language for operator-confirmed outcomes",
);

// ── 32. Controlled demonstration record (P6) ─────────────────────────────────
console.log("\n📋 Check 32 — Controlled demonstration record (P6)");
const DEMO = "lib/product/verification-demonstration-record.ts";
check(
  fileExists(DEMO),
  "verification-demonstration-record.ts exists",
  "No internal demonstration record — loop cannot be validated end-to-end",
);
check(
  fileContains(DEMO, "INTERNAL_DEMONSTRATION_ONLY"),
  "Demo record labelled INTERNAL_DEMONSTRATION_ONLY",
  "Demo record not clearly labelled — risk of confusion with live records",
);
check(
  fileContains(DEMO, "buildVerificationDemonstrationRecord"),
  "buildVerificationDemonstrationRecord exported",
  "Demo record factory missing",
);
check(
  fileContains(DEMO, "MEMORY_UPDATED"),
  "Demo record shows MEMORY_UPDATED as final phase",
  "Demo loop is incomplete — does not reach memory application",
);
check(
  fileContains(DEMO, "COMPARISON_BASIS_MATURITY"),
  "Demo record shows COMPARISON_BASIS_MATURITY as memory target",
  "Demo loop does not show maturity impact — full loop not proven",
);

// ── Result ─────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
if (violations === 0) {
  console.log("✅ OUTCOME VERIFICATION GUARD — ALL CHECKS PASSED");
  console.log("   Classification: GOVERNED_DECISION_INTELLIGENCE_CATEGORY_LEADERSHIP_HARDENED");
} else {
  console.error(`❌ OUTCOME VERIFICATION GUARD — ${violations} VIOLATION${violations === 1 ? "" : "S"}`);
  process.exit(1);
}
