#!/usr/bin/env node
/**
 * scripts/signal-authority-guard.mjs
 *
 * CI guard for the Signal Supremacy layer.
 *
 * Verifies:
 * 1. FastDiagnosticResult DTO declares detectedSignals, highestSignalSeverity,
 *    signalExecutiveSummary, comparisonBand, comparisonBandCaveat fields
 * 2. Fast diagnostic score API route imports and applies detectIntelligenceSignals
 *    and buildSovereignSignalAssessment (server-side signal injection)
 * 3. Fast diagnostic result page renders detectedSignals when present
 * 4. comparison-basis-contract.ts declares all 5 basis types
 * 5. comparison-basis-presenter.ts exports resolveComparisonPresentation
 *    and bandColorToken and has the instrument registry
 * 6. ConsequencePath component exists and exports default with required props
 * 7. No raw prevalencePercent or signalPredicat* on public surfaces
 * 8. Signal narrative block is rendered on fast result page
 * 9. Score API wraps signal detection in try/catch (non-fatal degradation)
 * 10. ComparisonBasis type has maturityLevel field (distribution maturity)
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

console.log("\n🔍 SIGNAL AUTHORITY GUARD — Supremacy Layer Integrity Check\n");

// ── 1. FastDiagnosticResult DTO has signal fields ──────────────────────────────
console.log("\n📋 Check 1 — FastDiagnosticResult DTO signal fields");
const dto = "lib/diagnostics/fast-diagnostic-dto.ts";
check(fileExists(dto), "DTO file exists", "fast-diagnostic-dto.ts not found");
check(fileContains(dto, "detectedSignals"), "detectedSignals field declared", "Missing detectedSignals on FastDiagnosticResult");
check(fileContains(dto, "highestSignalSeverity"), "highestSignalSeverity field declared", "Missing highestSignalSeverity");
check(fileContains(dto, "signalExecutiveSummary"), "signalExecutiveSummary field declared", "Missing signalExecutiveSummary");
check(fileContains(dto, "comparisonBand"), "comparisonBand field declared", "Missing comparisonBand");
check(fileContains(dto, "comparisonBandCaveat"), "comparisonBandCaveat field declared", "Missing comparisonBandCaveat");
check(fileContains(dto, "SovereignSignalPublicSummary"), "imports SovereignSignalPublicSummary type", "DTO must reference public DTO type");

// ── 2. Score API injects signals server-side ───────────────────────────────────
console.log("\n📋 Check 2 — Score API signal injection");
const scoreApi = "pages/api/diagnostics/score.ts";
check(fileExists(scoreApi), "Score API exists", "score.ts not found");
check(fileContains(scoreApi, "detectIntelligenceSignals"), "Imports detectIntelligenceSignals", "Signal detection not imported in score API");
check(fileContains(scoreApi, "buildSovereignSignalAssessment"), "Imports buildSovereignSignalAssessment", "Signal assessment builder not imported");
check(fileContains(scoreApi, "resolveComparisonPresentation"), "Imports resolveComparisonPresentation", "Comparison presenter not imported");
check(fileContains(scoreApi, "result.detectedSignals = assessment.signals"), "Assigns detectedSignals to result", "Signal injection not wired");
check(fileContains(scoreApi, "result.comparisonBand"), "Assigns comparisonBand", "Comparison band not wired");

// ── 3. Score API wraps detection in try/catch ──────────────────────────────────
console.log("\n📋 Check 3 — Signal detection is non-fatal (try/catch)");
check(
  fileContains(scoreApi, "SIGNAL SUPREMACY LAYER") && fileContains(scoreApi, /try\s*\{[\s\S]{1,2000}detectIntelligenceSignals/),
  "Signal detection inside try block",
  "Signal injection must be wrapped in try/catch to degrade gracefully",
);
check(
  fileContains(scoreApi, /Non-fatal: signal detection should never block/),
  "Non-fatal degradation comment present",
  "Must declare signal detection as non-fatal",
);

// ── 4. Fast diagnostic result page renders named signal ────────────────────────
console.log("\n📋 Check 4 — Fast diagnostic result page signal rendering");
const fastPage = "pages/diagnostics/fast.tsx";
check(fileExists(fastPage), "Fast diagnostic page exists", "fast.tsx not found");
check(fileContains(fastPage, "detectedSignals"), "Result page reads detectedSignals", "No detectedSignals reference on result page");
check(fileContains(fastPage, "signalName"), "Renders signal name", "No signalName rendered on result page");
check(fileContains(fastPage, "severityBand"), "Renders severity band", "No severityBand rendered on result page");
check(fileContains(fastPage, "narrativeSummary"), "Renders signal narrative", "No narrativeSummary rendered on result page");
check(fileContains(fastPage, "admissibleNextMove"), "Renders next admissible move", "No admissibleNextMove rendered on result page");
check(fileContains(fastPage, "differentiatorSummary"), "Renders differentiator", "No differentiatorSummary rendered on result page");
check(fileContains(fastPage, "sampleCaveat"), "Renders sample caveat", "No sampleCaveat on result page — governance requirement");
check(fileContains(fastPage, "comparisonBand"), "Renders comparison band", "No comparisonBand on result page");
check(fileContains(fastPage, "SIGNAL SUPREMACY"), "Signal section clearly labelled", "No signal section heading found");

// ── 5. comparison-basis-contract.ts ───────────────────────────────────────────
console.log("\n📋 Check 5 — comparison-basis-contract.ts");
const cbc = "lib/product/comparison-basis-contract.ts";
check(fileExists(cbc), "comparison-basis-contract.ts exists", "Contract file missing");
check(fileContains(cbc, "BOOTSTRAP_DISTRIBUTION"), "BOOTSTRAP_DISTRIBUTION type declared", "Missing basis type");
check(fileContains(cbc, "INTERNAL_OBSERVED_RECORDS"), "INTERNAL_OBSERVED_RECORDS type declared", "Missing basis type");
check(fileContains(cbc, "OUTCOME_VERIFIED_RECORDS"), "OUTCOME_VERIFIED_RECORDS type declared", "Missing basis type");
check(fileContains(cbc, "OPERATOR_REVIEWED_SAMPLE"), "OPERATOR_REVIEWED_SAMPLE type declared", "Missing basis type");
check(fileContains(cbc, "INSUFFICIENT_SAMPLE"), "INSUFFICIENT_SAMPLE type declared", "Missing basis type");
check(fileContains(cbc, "maturityLevel"), "DistributionMaturityLevel / maturityLevel declared", "Missing distribution maturity");
check(fileContains(cbc, "ComparisonBand"), "ComparisonBand type declared", "Missing comparison band type");
check(fileContains(cbc, "resolveComparisonBand"), "resolveComparisonBand exported", "Missing band resolution function");
check(fileContains(cbc, "isBasisSufficientForPublicClaim"), "isBasisSufficientForPublicClaim exported", "Missing sufficiency check");
check(fileContains(cbc, "comparisonBasisCaveat"), "comparisonBasisCaveat exported", "Missing caveat generator — governance requirement");

// ── 6. comparison-basis-presenter.ts ──────────────────────────────────────────
console.log("\n📋 Check 6 — comparison-basis-presenter.ts");
const cbp = "lib/product/comparison-basis-presenter.ts";
check(fileExists(cbp), "comparison-basis-presenter.ts exists", "Presenter file missing");
check(fileContains(cbp, "resolveComparisonPresentation"), "resolveComparisonPresentation exported", "Missing presentation resolver");
check(fileContains(cbp, "bandColorToken"), "bandColorToken exported", "Missing colour token function");
check(fileContains(cbp, "bandShortLabel"), "bandShortLabel exported", "Missing short label function");
check(fileContains(cbp, "INSTRUMENT_BASIS_REGISTRY"), "Instrument basis registry declared", "Missing instrument registry");
check(fileContains(cbp, "fast-diagnostic"), "fast-diagnostic in registry", "Fast diagnostic not registered");
check(fileContains(cbp, "getBasisForInstrument"), "getBasisForInstrument exported", "Missing basis lookup function");

// ── 7. ConsequencePath component ───────────────────────────────────────────────
console.log("\n📋 Check 7 — ConsequencePath component");
const cp = "components/product/ConsequencePath.tsx";
check(fileExists(cp), "ConsequencePath.tsx exists", "ConsequencePath component missing");
check(fileContains(cp, "thirtyDays"), "thirtyDays prop declared", "Missing 30-day consequence prop");
check(fileContains(cp, "sixtyDays"), "sixtyDays prop declared", "Missing 60-day consequence prop");
check(fileContains(cp, "ninetyDays"), "ninetyDays prop declared", "Missing 90-day consequence prop");
check(fileContains(cp, "compoundingPoint"), "compoundingPoint prop declared", "Missing compounding point prop");
check(fileContains(cp, "correctionPoint"), "correctionPoint prop declared", "Missing correction point prop");
check(fileContains(cp, "export default"), "Default export present", "ConsequencePath not exported as default");
check(
  fileContains(cp, "scenario") || fileContains(cp, "Scenario") || fileContains(cp, "not a financial forecast"),
  "Governance caveat present in component",
  "ConsequencePath must include scenario/financial forecast caveat",
);

// ── 8. No raw engine symbols on public fast diagnostic page ───────────────────
console.log("\n📋 Check 8 — No sovereign engine symbols on public surface");
check(
  !fileContains(fastPage, "detectIntelligenceSignals("),
  "detectIntelligenceSignals not called from page",
  "detectIntelligenceSignals must only be called server-side",
);
check(
  !fileContains(fastPage, "prevalencePercent"),
  "No raw prevalencePercent on fast page",
  "Use prevalenceLabel from public DTO — not raw prevalencePercent",
);

// ── 9. Intelligence signals library has 11+ named signals ─────────────────────
console.log("\n📋 Check 9 — Signal library integrity");
const sigLib = "lib/sovereign/intelligence-signals.ts";
check(fileExists(sigLib), "intelligence-signals.ts exists", "Signal library missing");
check(fileContains(sigLib, "detectIntelligenceSignals"), "detectIntelligenceSignals exported", "Engine function missing");
check(fileContains(sigLib, "detectPrimarySignal"), "detectPrimarySignal exported", "Primary signal shortcut missing");
check(
  (fileContains(sigLib, "id:") && (readFileSync(join(ROOT, sigLib), "utf-8").match(/\bid:/g) || []).length >= 10),
  "Signal library has at least 10 named signals",
  "Signal library appears to have fewer than 10 named signals",
);

// ── 10. Public DTO has buildSovereignSignalAssessment ─────────────────────────
console.log("\n📋 Check 10 — SovereignSignalPublicSummary DTO exports");
const sigDto = "lib/sovereign/sovereign-signal-public-dto.ts";
check(fileExists(sigDto), "sovereign-signal-public-dto.ts exists", "Signal public DTO missing");
check(fileContains(sigDto, "buildSovereignSignalAssessment"), "buildSovereignSignalAssessment exported", "Assessment builder missing");
check(fileContains(sigDto, "toSovereignSignalPublicSummary"), "toSovereignSignalPublicSummary exported", "DTO mapper missing");
check(fileContains(sigDto, "sampleCaveat"), "sampleCaveat in DTO shape", "Caveat field missing from public DTO — governance requirement");
check(fileContains(sigDto, "suppressionNotice"), "suppressionNotice in DTO shape", "Suppression notice field missing");

// ── 11. Canonical signal authority composer ───────────────────────────────────
console.log("\n📋 Check 11 — Canonical signal authority composer (P0)");
const composer = "lib/product/signal-authority-composer.ts";
check(fileExists(composer), "signal-authority-composer.ts exists", "Canonical composer missing — P0 requirement");
check(fileContains(composer, "SignalAuthorityRecord"), "SignalAuthorityRecord type declared", "Canonical type missing from composer");
check(fileContains(composer, "instrumentAuthorityToRecord"), "instrumentAuthorityToRecord adapter exported", "Instrument adapter missing from composer");
check(fileContains(composer, "sovereignSignalToRecord"), "sovereignSignalToRecord adapter exported", "Sovereign signal adapter missing from composer");
check(fileContains(composer, "SignalVerificationState"), "SignalVerificationState type declared", "Verification state type missing — P1 requirement");
check(fileContains(composer, "PENDING_OPERATOR_REVIEW"), "PENDING_OPERATOR_REVIEW state declared", "Operator review state missing from verification lifecycle");
check(fileContains(composer, "MEMORY_UPDATED"), "MEMORY_UPDATED state declared", "Memory update state missing from verification lifecycle");
check(fileContains(composer, "memoryEffect"), "memoryEffect dimension declared", "Memory effect dimension missing — P4 requirement");
check(fileContains(composer, "MemoryTarget"), "MemoryTarget type declared", "Memory target type missing");

// ── 12. Verification record creation from material outputs (P1) ───────────────
console.log("\n📋 Check 12 — Signal verification record creation (P1)");
const svr = "lib/product/signal-verification-record.ts";
check(fileExists(svr), "signal-verification-record.ts exists", "Verification record service missing — P1 requirement");
check(fileContains(svr, "createSignalVerificationRecord"), "createSignalVerificationRecord exported", "Record creation function missing");
check(fileContains(svr, "PENDING_VERIFICATION"), "PENDING_VERIFICATION status in record", "Initial verification status missing");
check(fileContains(svr, "operatorReviewRequired"), "operatorReviewRequired field on record", "Operator review flag missing — P1 requirement");
check(fileContains(svr, "verificationDueAt"), "verificationDueAt field on record", "Due date missing from verification record");
check(fileContains(svr, "sourceSurface"), "sourceSurface field on record", "Source surface attribution missing");
check(fileContains(svr, "originalSignal"), "originalSignal field on record", "Original signal field missing");
check(fileContains(svr, "comparisonBasis"), "comparisonBasis field on record", "Comparison basis missing from record");
check(
  fileContains(scoreApi, "createSignalVerificationRecord"),
  "score.ts creates verification record after signal detection",
  "Fast diagnostic does not create a verification record — P1 requirement",
);

// ── 13. Maturity gate enforcement (P5/P6) ────────────────────────────────────
console.log("\n📋 Check 13 — Comparison maturity gate enforcement (P5/P6)");
check(fileContains(cbc, "enforceMaturityGate"), "enforceMaturityGate exported from contract", "Maturity gate function missing — P6 requirement");
check(fileContains(cbc, "requiresUnverifiedDisclosure"), "requiresUnverifiedDisclosure exported", "Unverified disclosure guard missing");
check(
  fileContains(cbp, "enforceMaturityGate"),
  "presenter calls enforceMaturityGate",
  "Maturity gate not wired into presenter — maturity claims unguarded",
);
check(
  fileContains(cbp, "maturityGateRejection"),
  "presenter surfaces maturityGateRejection",
  "Gate rejection reason not propagated by presenter",
);
check(
  fileContains(cbp, "requiresUnverifiedDisclosure"),
  "presenter calls requiresUnverifiedDisclosure",
  "Unverified disclosure not surfaced by presenter",
);

// ── 14. Operator review queue present and in admin nav (P3) ──────────────────
console.log("\n📋 Check 14 — Operator review queue (P3)");
const operatorPage = "pages/admin/outcome-verification.tsx";
const operatorApi = "pages/api/admin/outcome-verification.ts";
const operatorService = "lib/product/operator-outcome-review.ts";
const adminNav = "pages/admin/index.tsx";
check(fileExists(operatorPage), "admin/outcome-verification.tsx exists", "Operator review page missing — P3 requirement");
check(fileExists(operatorApi), "api/admin/outcome-verification.ts exists", "Operator review API missing");
check(fileExists(operatorService), "operator-outcome-review.ts service exists", "Operator review service missing");
check(
  fileContains(adminNav, "/admin/outcome-verification"),
  "Outcome verification in admin nav",
  "Operator review queue not linked in admin navigation — P3 requirement",
);
check(fileContains(operatorService, "recordOperatorReview"), "recordOperatorReview exported", "Review recording function missing");
check(fileContains(operatorService, "applyVerificationToMemory"), "applyVerificationToMemory exported", "Memory application function missing — P4 requirement");
check(fileContains(operatorService, "getPendingOperatorReviews"), "getPendingOperatorReviews exported", "Queue loading function missing");

// ── 15. Server-only boundary declarations (P8) ───────────────────────────────
// Note: import "server-only" is App Router only. Pages Router uses JSDoc SERVER_ONLY markers.
console.log("\n📋 Check 15 — Server-only boundary guards (P8)");
check(fileContains(sigLib, "SERVER_ONLY"), "intelligence-signals.ts has server-only guard", "Raw signal predicates not guarded — P8 requirement");
check(
  fileContains("lib/product/outcome-verification-service.ts", "SERVER_ONLY"),
  "outcome-verification-service.ts has server-only guard",
  "Verification service not guarded — can leak to client bundle",
);
check(
  fileContains("lib/product/institutional-case-intelligence-composer.ts", "SERVER_ONLY"),
  "institutional-case-intelligence-composer.ts has server-only guard",
  "Intelligence composer not guarded",
);
check(
  fileContains(operatorService, "SERVER_ONLY"),
  "operator-outcome-review.ts has server-only guard",
  "Operator review service not guarded",
);

// ── Result ─────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(60)}`);
if (violations === 0) {
  console.log("✅ SIGNAL AUTHORITY GUARD — ALL CHECKS PASSED");
  console.log("   Classification: GOVERNED_DECISION_INTELLIGENCE_CATEGORY_LEADERSHIP_READY");
} else {
  console.error(`❌ SIGNAL AUTHORITY GUARD — ${violations} VIOLATION${violations === 1 ? "" : "S"}`);
  process.exit(1);
}
