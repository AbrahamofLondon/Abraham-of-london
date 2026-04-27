/**
 * Diagnostic Ladder Conversion Audit — 10/10 standard.
 * Run: npx tsx scripts/audit-diagnostic-ladder-conversion.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function read(p: string): string { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : ""; }
function exists(p: string): boolean { return fs.existsSync(path.join(ROOT, p)); }

console.log("\n========================================");
console.log("  DIAGNOSTIC LADDER CONVERSION AUDIT");
console.log("========================================\n");

// Shared components exist
console.log("─── Shared Components ───\n");
check("CaseActiveBanner exists", exists("components/diagnostics/unified/CaseActiveBanner.tsx"));
check("ConsequenceTimeline exists", exists("components/diagnostics/unified/ConsequenceTimeline.tsx"));
check("LimitationsBlock exists", exists("components/diagnostics/unified/LimitationsBlock.tsx"));
check("DirectiveCTA exists", exists("components/diagnostics/unified/DirectiveCTA.tsx"));
check("FeedbackLoop exists", exists("components/diagnostics/unified/FeedbackLoop.tsx"));
check("UnifiedResultSurface exists", exists("components/diagnostics/unified/UnifiedResultSurface.tsx"));
check("ConsequenceTimeline generator exists", exists("lib/diagnostics/consequence-timeline.ts"));

// Fast Diagnostic
console.log("\n─── Fast Diagnostic ───\n");
const fast = read("pages/diagnostics/fast.tsx");
check("Fast: case active banner", fast.includes("case is now active") || fast.includes("CaseActiveBanner"));
check("Fast: consequence timeline", fast.includes("If nothing changes") || fast.includes("ConsequenceTimeline"));
check("Fast: cannot-tell-you", fast.includes("cannot tell you") || fast.includes("LimitationsBlock"));
check("Fast: directive CTA (condition-based)", fast.includes("directiveCta") || fast.includes("DirectiveCTA"));
check("Fast: feedback loop", fast.includes("Was this accurate") || fast.includes("FeedbackLoop"));
check("Fast: cost-first option", fast.includes("costFirst") || fast.includes("cost_first"));
check("Fast: no fake statistics", !/\b\d{2}%\b.*similar cases/i.test(fast));

// Constitutional Diagnostic
console.log("\n─── Constitutional Diagnostic ───\n");
const constitutional = read("components/assessments/ConstitutionalDiagnosticSuite.tsx");
const constitutionalPage = read("pages/diagnostics/constitutional-diagnostic.tsx");
check("Constitutional: has post-result conversion surface", constitutional.includes("CaseActiveBanner") || constitutional.includes("DirectiveCTA") || constitutional.includes("LimitationsBlock") || constitutional.includes("UnifiedResultSurface") || constitutionalPage.includes("UnifiedResultSurface"));

// Purpose Alignment
console.log("\n─── Purpose Alignment ───\n");
const purpose = read("components/alignment/PurposeAlignmentAssessment.tsx");
check("Purpose: has feedback/contract mechanism", purpose.includes("PatternBreakerContract") || purpose.includes("FeedbackLoop"));

// Shared conversion components have condition-based routing
console.log("\n─── Routing Logic ───\n");
const directiveCta = read("components/diagnostics/unified/DirectiveCTA.tsx");
check("DirectiveCTA: routes purpose assessment", directiveCta.includes("purpose"));
check("DirectiveCTA: routes constitutional assessment", directiveCta.includes("constitutional"));
check("DirectiveCTA: routes team assessment", directiveCta.includes("team"));
check("DirectiveCTA: routes enterprise assessment", directiveCta.includes("enterprise"));
check("DirectiveCTA: no equal-weight 3-CTA menus", directiveCta.includes("secondary") && !directiveCta.includes("three equal"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("DIAGNOSTIC LADDER — STILL LEAKING\n"); process.exit(1); }
else { console.log("DIAGNOSTIC LADDER — CONVERSION COMPONENTS READY\n"); }
