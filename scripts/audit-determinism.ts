/**
 * Determinism Audit — prove same input → same output.
 *
 * Runs the scoring and classification engine twice with identical inputs.
 * If outputs differ → FAIL.
 *
 * Run: npx tsx scripts/audit-determinism.ts
 */

import { createCaseObject, classifyCondition } from "../lib/decision/case-object";
import { scoreC3 } from "../lib/decision/c3-fidelity-scorer";
import { buildDeterministicOutput, deterministicFallback } from "../lib/decision/synthesis-engine";
import { forecastDefaultPath } from "../lib/decision/default-path-forecast";

const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

console.log("\n========================================");
console.log("  DETERMINISM AUDIT");
console.log("  Same input → same output. No exceptions.");
console.log("========================================\n");

const testCase = createCaseObject({
  id: "determinism_test",
  decision: "Whether to replace the VP of Engineering who has been underperforming for 18 months",
  priorAttempt: "Tried a PIP last Q2 but the CEO intervened and softened the targets",
  costOfDelay: "Losing £45,000 per month in engineering velocity. Two senior engineers quit.",
  claimedOwner: "The CHRO is supposed to own this but defers to the CEO",
  blocker: "The CEO will not approve termination of someone he personally recruited",
  forcedAction: "Move them to a non-critical advisory role and promote the Staff Engineer",
});

// Run 1
const c3_1 = scoreC3(testCase);
const det_1 = buildDeterministicOutput(testCase);
const class_1 = classifyCondition(testCase);
const fallback_1 = deterministicFallback(testCase);
const forecast_1 = forecastDefaultPath(testCase);

// Run 2 (identical input)
const c3_2 = scoreC3(testCase);
const det_2 = buildDeterministicOutput(testCase);
const class_2 = classifyCondition(testCase);
const fallback_2 = deterministicFallback(testCase);
const forecast_2 = forecastDefaultPath(testCase);

// Compare
check("C3 specificity score identical", c3_1.specificityScore === c3_2.specificityScore, `${c3_1.specificityScore} vs ${c3_2.specificityScore}`);
check("C3 tier identical", c3_1.tier === c3_2.tier, `${c3_1.tier} vs ${c3_2.tier}`);
check("C3 confidence band identical", c3_1.confidenceBand === c3_2.confidenceBand);
check("C3 clarity identical", c3_1.clarity === c3_2.clarity);
check("C3 context identical", c3_1.context === c3_2.context);
check("C3 consequence identical", c3_1.consequence === c3_2.consequence);

check("Condition class identical", class_1 === class_2, `${class_1} vs ${class_2}`);
check("Deterministic condition identical", det_1.conditionClass === det_2.conditionClass);
check("Deterministic signal key identical", det_1.signal.key === det_2.signal.key);
check("Deterministic contradiction count identical", det_1.contradictionSet.length === det_2.contradictionSet.length);

check("Fallback verdict identical", fallback_1.verdict === fallback_2.verdict);
check("Fallback move identical", fallback_1.concreteMove === fallback_2.concreteMove);
check("Fallback contradiction identical", fallback_1.primaryContradiction === fallback_2.primaryContradiction);
check("Fallback forecast identical", fallback_1.defaultPathForecast === fallback_2.defaultPathForecast);

check("Forecast 7d identical", forecast_1.sevenDays === forecast_2.sevenDays);
check("Forecast 30d identical", forecast_1.thirtyDays === forecast_2.thirtyDays);
check("Forecast 90d identical", forecast_1.ninetyDays === forecast_2.ninetyDays);
check("Forecast decay rate identical", forecast_1.optionDecayRate === forecast_2.optionDecayRate);
check("Forecast control shift identical", forecast_1.controlShiftProbability === forecast_2.controlShiftProbability);

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log("DETERMINISM VIOLATED. System is non-deterministic.\n");
  process.exit(1);
} else {
  console.log("DETERMINISM PROVEN. Same input → same output. No randomness.\n");
}
