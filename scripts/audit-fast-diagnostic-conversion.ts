/**
 * Fast Diagnostic Conversion Audit
 * Run: npx tsx scripts/audit-fast-diagnostic-conversion.ts
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

const fast = fs.readFileSync(path.join(ROOT, "pages/diagnostics/fast.tsx"), "utf-8");

console.log("\n========================================");
console.log("  FAST DIAGNOSTIC CONVERSION AUDIT");
console.log("========================================\n");

check("Entry reframe present", fast.includes("not dealing with a strategy problem") || fast.includes("decision that hasn"));
check("Case live banner present", fast.includes("case is now active") || fast.includes("Your case is now active"));
check("Forecast before CTAs (forecast renders before directive)", fast.indexOf("If nothing changes") < fast.indexOf("System directive"));
check("Cannot-tell-you gap present", fast.includes("cannot tell you") || fast.includes("cannot determine"));
check("Primary CTA is condition-based", fast.includes("directiveCta") && fast.includes("condition ==="));
check("CTAs are not equal-weighted (one primary + secondary links)", fast.includes("secondaryLinks") && fast.includes("SECONDARY"));
check("Cost-first pre-commitment option exists", fast.includes("cost_first") || fast.includes("costFirst"));
check("Fallback references priorAttempt", fast.includes("priorAttempt") && fast.includes("prior attempts"));
check("Fallback references blocker + forcedAction", fast.includes("blocker") && fast.includes("forcedAction") && fast.includes("contradiction"));
check("No fake percentages", !(/\b\d{2}%\b/.test(fast) && fast.includes("similar cases")));
check("No unsupported persistence claims", !fast.includes("permanently stored") && !fast.includes("stored forever"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("FAST DIAGNOSTIC — STILL LEAKING AT RESULT STAGE\n"); process.exit(1); }
else { console.log("FAST DIAGNOSTIC — OPERATOR CONVERSION READY\n"); }
