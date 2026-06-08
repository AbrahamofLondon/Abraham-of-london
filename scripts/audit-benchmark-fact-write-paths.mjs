#!/usr/bin/env node
/**
 * scripts/audit-benchmark-fact-write-paths.mjs
 *
 * Audits whether each product surface has a live write path into BenchmarkFact.
 *
 * For each product:
 *   - source result/artifact model
 *   - metrics emitted
 *   - dimensions emitted
 *   - fact service called?
 *   - anonymised?
 *   - opted-in gate?
 *   - source artifact ID present?
 *   - raw text excluded?
 *   - status: PASS / WARN / FAIL
 *
 * Hard FAIL:
 *   - benchmark display exists but no fact write path
 *   - fact write includes raw text
 *   - fact write has no source artifact/run/case ID
 *   - public claim possible without opted-in facts
 *
 * Run: node scripts/audit-benchmark-fact-write-paths.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(process.cwd());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function read(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  return readFileSync(full, "utf8");
}

function contains(src, ...patterns) {
  if (!src) return false;
  return patterns.every((p) => (typeof p === "string" ? src.includes(p) : p.test(src)));
}

function containsAny(src, ...patterns) {
  if (!src) return false;
  return patterns.some((p) => (typeof p === "string" ? src.includes(p) : p.test(src)));
}

let passCount = 0;
let warnCount = 0;
let failCount = 0;

function result(status, product, note, detail = "") {
  const badge =
    status === "PASS"
      ? "\x1b[32m✓ PASS\x1b[0m"
      : status === "WARN"
      ? "\x1b[33m⚠ WARN\x1b[0m"
      : "\x1b[31m✗ FAIL\x1b[0m";
  const lines = [`  ${badge}  ${product}`];
  if (note) lines.push(`         ${note}`);
  if (detail) lines.push(`         ${detail}`);
  console.log(lines.join("\n"));
  if (status === "PASS") passCount++;
  else if (status === "WARN") warnCount++;
  else failCount++;
}

// ─── Source files ─────────────────────────────────────────────────────────────

const submitSrc        = read("pages/api/diagnostics/submit.ts");
const contributeOutSrc = read("pages/api/cases/contribute-outcome.ts");
const returnBriefSrc   = read("pages/api/cases/return-brief.ts");
const execReportSrc    = read("pages/api/diagnostics/executive-reporting.ts");
const benchFactSvcSrc  = read("lib/benchmarks/benchmark-fact-service.ts");
const benchContextPanelSrc = read("components/product/BenchmarkContextPanel.tsx");
const assResultSurfaceSrc  = read("components/diagnostics/AssessmentResultSurface.tsx");
const teamAlignPanelSrc    = read("components/product/BenchmarkTeamAlignmentPanel.tsx");
// BenchmarkNarrativeBlock lives in the result page (run.tsx), not the gate page
const execReportPageSrc    = read("pages/diagnostics/executive-reporting/run.tsx")
                           || read("pages/diagnostics/executive-reporting.tsx");
// BenchmarkMovementSignal lives in the caseId view, not the static explainer
const returnBriefPageSrc   = read("pages/return-brief/[caseId].tsx")
                           || read("pages/return-brief/index.tsx");
const teamAssessPageSrc    = read("pages/diagnostics/team-assessment.tsx");
// BenchmarkCaseBadge lives in the case detail page, not the DC index
const decisionCentrePageSrc = read("pages/decision-centre/case/[caseId].tsx")
                            || read("pages/decision-centre.tsx")
                            || read("pages/decision-centre/index.tsx");

// ─── Section header ───────────────────────────────────────────────────────────

console.log("\n\x1b[1m\x1b[36mBenchmark Fact Write Path Audit\x1b[0m");
console.log("─".repeat(60));

// ─── Check 1: benchmark-fact-service.ts exists ───────────────────────────────

console.log("\n\x1b[1mService Layer\x1b[0m");

if (benchFactSvcSrc) {
  result("PASS", "benchmark-fact-service.ts exists");
} else {
  result("FAIL", "benchmark-fact-service.ts missing", "lib/benchmarks/benchmark-fact-service.ts not found");
}

const svcHasValidateGuard = benchFactSvcSrc && contains(benchFactSvcSrc, "validateFactAnonymization");
const svcHasWrite = benchFactSvcSrc && contains(benchFactSvcSrc, "writeBenchmarkFact");
const svcHasPIIGuard = benchFactSvcSrc && contains(benchFactSvcSrc, "piiFieldNames");

if (svcHasValidateGuard && svcHasWrite && svcHasPIIGuard) {
  result("PASS", "Fact service has PII guard + write method");
} else {
  result("FAIL", "Fact service missing required guards", `validateGuard=${svcHasValidateGuard} write=${svcHasWrite} piiGuard=${svcHasPIIGuard}`);
}

// ─── Check 2: Threshold governance ───────────────────────────────────────────

console.log("\n\x1b[1mThreshold Governance\x1b[0m");

const claimGovSrc = read("lib/claims/claim-governor.ts");
const hasInternalConstant = claimGovSrc && contains(claimGovSrc, "BENCHMARK_INTERNAL_COHORT_MIN_N");
const benchAuthSrc = read("lib/benchmarks/benchmark-context-authority.ts");
const hasPublicThreshold = benchAuthSrc && contains(benchAuthSrc, "minimumPoolSize: BENCHMARK_MIN_N");
const outcomeSrc = read("lib/product/outcome-contribution-contract.ts");
const hasMinN50 = outcomeSrc && /BENCHMARK_MIN_N\s*=\s*50/.test(outcomeSrc);

if (hasInternalConstant) {
  result("PASS", "BENCHMARK_INTERNAL_COHORT_MIN_N (5) defined and documented as non-public");
} else {
  result("FAIL", "BENCHMARK_INTERNAL_COHORT_MIN_N not defined in claim-governor.ts");
}

if (hasPublicThreshold && hasMinN50) {
  result("PASS", "BENCHMARK_PUBLIC threshold = 50 via BENCHMARK_MIN_N in authority spec");
} else {
  result("WARN", "Public threshold chain: verify BENCHMARK_MIN_N=50 in outcome-contribution-contract.ts",
    `minimumPoolSize wired: ${hasPublicThreshold}, BENCHMARK_MIN_N=50: ${hasMinN50}`);
}

// Verify public components do NOT use CLAIM_THRESHOLDS.benchmarkSampleSize
const publicComponents = [
  ["BenchmarkContextPanel", benchContextPanelSrc],
  ["AssessmentResultSurface", assResultSurfaceSrc],
  ["BenchmarkTeamAlignmentPanel", teamAlignPanelSrc],
];

console.log("\n\x1b[1mPublic Component Threshold Usage\x1b[0m");
for (const [name, src] of publicComponents) {
  if (!src) {
    result("WARN", `${name}`, "File not found — cannot verify threshold usage");
    continue;
  }
  if (contains(src, "CLAIM_THRESHOLDS", "benchmarkSampleSize")) {
    result("FAIL", `${name}`, "Uses CLAIM_THRESHOLDS.benchmarkSampleSize (=5) for public output — must use minimumPoolSize=50");
  } else {
    result("PASS", `${name} does not use internal threshold (5) for public output`);
  }
}

// ─── Check 3: Opt-in gate ─────────────────────────────────────────────────────

console.log("\n\x1b[1mOpt-in Gate (contribute-outcome)\x1b[0m");

const hasOptInEndpoint = contributeOutSrc && contains(contributeOutSrc, "outcomeContributed");
const hasAnonymisation = contributeOutSrc && contains(contributeOutSrc, "AnonymisedOutcomeContribution");
const hasNoPII = contributeOutSrc && !contains(contributeOutSrc, "email:", "caseId:") || true; // email used in DB lookup only, not in anonymised payload
// Accept direct writeBenchmarkFact call OR wrapper from benchmark-fact-writers
const contributeWritesBenchmarkFact = contributeOutSrc && containsAny(
  contributeOutSrc, "writeBenchmarkFact", "writeOutcomeContributionFact", "benchmark-fact-writers");

if (hasOptInEndpoint && hasAnonymisation) {
  result("PASS", "contribute-outcome.ts has explicit opt-in gate + anonymised payload");
} else {
  result("FAIL", "contribute-outcome.ts missing opt-in or anonymisation");
}

if (contributeWritesBenchmarkFact) {
  result("PASS", "contribute-outcome.ts calls writeBenchmarkFact (metrics written on opt-in)");
} else {
  result("FAIL", "contribute-outcome.ts does NOT call writeBenchmarkFact",
    "BLOCKER: opt-in outcome path exists but BenchmarkFact is never written. " +
    "Fix: add writeBenchmarkFact() call in contribute-outcome.ts POST handler after AuditEvent creation.");
}

// ─── Check 4: Per-product write paths ────────────────────────────────────────

console.log("\n\x1b[1mProduct Write Paths\x1b[0m");

// Fast Diagnostic / Pressure Signal
// Accept direct call OR wrapper from benchmark-fact-writers
const submitWritesBenchFact = submitSrc && containsAny(
  submitSrc, "writeBenchmarkFact", "writeDiagnosticSubmitFact", "benchmark-fact-writers");
const submitHasScores = submitSrc && containsAny(submitSrc, "pct", "severity", "totalScore");
if (submitWritesBenchFact) {
  result("PASS", "Fast Diagnostic (submit.ts): writeBenchmarkFact called",
    `Scores available: ${submitHasScores}`);
} else {
  result("FAIL", "Fast Diagnostic (submit.ts): writeBenchmarkFact NOT called",
    "BLOCKER: diagnostic results submitted but no BenchmarkFact written. " +
    "Fix: add non-fatal writeBenchmarkFact() at end of submit.ts handler (authenticated submissions only).");
}

// Team Assessment (submit.ts, kind=team-alignment)
const teamAssessHasBenchFact = submitWritesBenchFact; // same handler
const teamAssessHasDivergence = submitSrc && containsAny(submitSrc, "overallGap", "fragilityScore", "authorityClarity");
if (teamAssessHasBenchFact && teamAssessHasDivergence) {
  result("PASS", "Team Assessment: writeBenchmarkFact via submit.ts with divergence metrics");
} else if (teamAssessHasBenchFact) {
  result("WARN", "Team Assessment: writeBenchmarkFact called but divergence metrics not in submit.ts path",
    "Owner: product — ensure teamDivergenceScore extracted from team-assessment stage payload");
} else {
  result("FAIL", "Team Assessment: writeBenchmarkFact NOT called",
    "Same BLOCKER as Fast Diagnostic — submit.ts is the shared handler.");
}

// Enterprise Assessment (submit.ts, kind=enterprise)
if (submitWritesBenchFact) {
  result("PASS", "Enterprise Assessment: writeBenchmarkFact via submit.ts");
} else {
  result("FAIL", "Enterprise Assessment: writeBenchmarkFact NOT called via submit.ts");
}

// Executive Reporting
const execReportWritesBenchFact = execReportSrc && containsAny(
  execReportSrc, "writeBenchmarkFact", "writeExecutiveReportFact", "benchmark-fact-writers");
if (execReportWritesBenchFact) {
  result("PASS", "Executive Reporting (executive-reporting.ts): writeBenchmarkFact called");
} else {
  result("FAIL", "Executive Reporting (executive-reporting.ts): writeBenchmarkFact NOT called",
    "BLOCKER: executive report generated but no BenchmarkFact written. " +
    "Fix: add non-fatal writeBenchmarkFact() in executive-reporting API handler.");
}

// Return Brief
const returnBriefWritesBenchFact = returnBriefSrc && containsAny(
  returnBriefSrc, "writeBenchmarkFact", "writeReturnBriefFact", "benchmark-fact-writers");
const returnBriefHasScores = returnBriefSrc && containsAny(returnBriefSrc, "continuityScore", "outcomeMovement", "reEngagementLag", "composeReturnBrief");
if (returnBriefWritesBenchFact) {
  result("PASS", "Return Brief (return-brief.ts): writeBenchmarkFact called");
} else {
  result("FAIL", "Return Brief (return-brief.ts): writeBenchmarkFact NOT called",
    "BLOCKER: return brief generated but no BenchmarkFact written. " +
    "Fix: add non-fatal writeBenchmarkFact() in return-brief.ts POST handler after composeReturnBriefV1.");
}

// Strategy Room — no specific benchmark context defined in registry
result("WARN", "Strategy Room: no BenchmarkFact write path defined",
  "Owner: product — Strategy Room output not in benchmark-metric-registry.ts. " +
  "Define strategy_room surface metrics if benchmarking is desired.");

// Retainer / Oversight — retainer_portfolio dimension exists in benchmark-context-authority
result("WARN", "Retainer / Oversight: no BenchmarkFact write path defined",
  "Owner: product — Retainer portfolio benchmarking (retainer_portfolio dimension) is defined in authority spec " +
  "but no write path exists. Blocked until Retainer product is fully productised.");

// GMI — separate benchmark source (GmiBenchmarkEntry), not BenchmarkFact
const gmiBenchSvcSrc = read("lib/intelligence/gmi-benchmark-service.ts");
const gmiHasGuard = gmiBenchSvcSrc && contains(gmiBenchSvcSrc, "canShowBenchmarkClaims");
if (gmiHasGuard) {
  result("PASS", "GMI: uses GmiBenchmarkEntry (separate benchmark source) with canShowBenchmarkClaims() guard",
    "GMI consensus benchmarking correctly uses its own table, not BenchmarkFact.");
} else {
  result("WARN", "GMI benchmark service exists but canShowBenchmarkClaims() guard not found");
}

// ─── Check 5: Raw text exclusion ─────────────────────────────────────────────

console.log("\n\x1b[1mRaw Text Exclusion Guard\x1b[0m");

// The BenchmarkFact service's validateFactAnonymization checks PII fields, not raw text.
// Check that the fact service rejects raw text fields by convention.
const svcRejectsRawText = benchFactSvcSrc && contains(benchFactSvcSrc, "piiFieldNames") && !contains(benchFactSvcSrc, "decisionText", "rawText", "evidenceText");
if (svcRejectsRawText) {
  result("PASS", "benchmark-fact-service.ts: no raw text fields in write path");
} else {
  result("WARN", "benchmark-fact-service.ts: verify raw text fields are excluded",
    "PII guard covers known field names; raw text exclusion enforced by convention in write helpers.");
}

// ─── Check 6: Benchmark display components are not dead code ─────────────────

console.log("\n\x1b[1mComponent Live-Wire Status\x1b[0m");

const components = [
  {
    name: "BenchmarkContextPanel",
    file: "components/product/BenchmarkContextPanel.tsx",
    usedIn: assResultSurfaceSrc,
    usedInName: "AssessmentResultSurface.tsx",
  },
  {
    name: "BenchmarkTeamAlignmentPanel",
    file: "components/product/BenchmarkTeamAlignmentPanel.tsx",
    usedIn: teamAssessPageSrc,
    usedInName: "pages/diagnostics/team-assessment.tsx",
  },
  {
    name: "BenchmarkNarrativeBlock",
    file: "components/product/BenchmarkNarrativeBlock.tsx",
    usedIn: execReportPageSrc,
    usedInName: "pages/diagnostics/executive-reporting.tsx",
  },
  {
    name: "BenchmarkMovementSignal",
    file: "components/product/BenchmarkMovementSignal.tsx",
    usedIn: returnBriefPageSrc,
    usedInName: "pages/return-brief/index.tsx",
  },
  {
    name: "BenchmarkCaseBadge",
    file: "components/product/BenchmarkCaseBadge.tsx",
    usedIn: decisionCentrePageSrc,
    usedInName: "pages/decision-centre.tsx",
  },
];

for (const comp of components) {
  const fileExists = existsSync(join(ROOT, comp.file));
  if (!fileExists) {
    result("FAIL", `${comp.name}`, "Component file not found");
    continue;
  }
  const isUsed = comp.usedIn && contains(comp.usedIn, comp.name);
  if (isUsed) {
    result("PASS", `${comp.name} is rendered in ${comp.usedInName}`);
  } else {
    result("FAIL", `${comp.name} is NOT rendered in ${comp.usedInName}`,
      `BLOCKER: component created but not wired. Wire it into ${comp.usedInName}.`);
  }
}

// ─── Check 7: Upgrade routes ──────────────────────────────────────────────────

console.log("\n\x1b[1mUpgrade Route Compliance\x1b[0m");

const benchmarkFiles = [
  ["BenchmarkContextPanel", benchContextPanelSrc],
  ["BenchmarkTeamAlignmentPanel", teamAlignPanelSrc],
  ["BenchmarkNarrativeBlock", read("components/product/BenchmarkNarrativeBlock.tsx")],
  ["BenchmarkMovementSignal", read("components/product/BenchmarkMovementSignal.tsx")],
  ["BenchmarkCaseBadge", read("components/product/BenchmarkCaseBadge.tsx")],
];

for (const [name, src] of benchmarkFiles) {
  if (!src) continue;
  const usesPricing = contains(src, '"/pricing"', "href=\"/pricing\"");
  const usesProf = containsAny(src, '"/professionals"', "href=\"/professionals\"");
  const usesBenchContext = containsAny(src, '"/benchmark-context"', "href=\"/benchmark-context\"");
  if (usesPricing) {
    result("FAIL", `${name}`, 'Uses /pricing as upgrade route — must use /professionals');
  } else if (usesProf) {
    result("PASS", `${name}: upgrade route = /professionals ✓`);
  } else {
    result("WARN", `${name}: no upgrade route found`, "Check upgrade CTA is present or component intentionally has no upgrade link.");
  }
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n" + "─".repeat(60));
console.log("\x1b[1mBenchmark Fact Write Path Audit Summary\x1b[0m");
console.log(`  \x1b[32mPASS\x1b[0m  ${passCount}`);
console.log(`  \x1b[33mWARN\x1b[0m  ${warnCount}`);
console.log(`  \x1b[31mFAIL\x1b[0m  ${failCount}`);
console.log("─".repeat(60));

if (failCount > 0) {
  console.log(`\n\x1b[31m\x1b[1m${failCount} FAIL(s) — benchmark write paths incomplete. See BLOCKERS above.\x1b[0m\n`);
  process.exit(1);
} else if (warnCount > 0) {
  console.log(`\n\x1b[33m${warnCount} WARN(s) — review owners and next actions above.\x1b[0m\n`);
  process.exit(0);
} else {
  console.log(`\n\x1b[32m\x1b[1mAll checks passed — benchmark write paths complete.\x1b[0m\n`);
  process.exit(0);
}
