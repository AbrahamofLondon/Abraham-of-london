/**
 * Wave 2G: Final Benchmark Test with Proper Renderer
 *
 * Tests personal_decision_audit with properly structured output for anti-toy and red-team.
 * Uses renderForBenchmark() to convert DecisionDiagnosticOutput to AnalyzableOutput.
 *
 * Run via: pnpm exec tsx scripts/wave-2g-final-benchmark-test.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";
import { scoreDecisionForce } from "../lib/judgement/decision-force-score";
import { renderForBenchmark, renderDecisionDiagnosticText } from "../lib/product/personal-decision-audit-renderer";
import { runAntiToyTest, type AnalyzableSample } from "../lib/product/anti-toy-product-test";
import { runRedTeamPanel } from "../lib/product/product-red-team-reviewers";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface Wave2GBenchmarkResult {
  scenario: string;
  title: string;
  decisionForceScore: number;
  antiToyScore: number;
  antiToyPass: boolean;
  redTeamScore: number;
  redTeamPass: boolean;
  benchmarkConsumingUpgradedFields: boolean;
  notes: string;
}

const SCENARIOS = [
  {
    id: "career-move-financial-pressure",
    title: "Career Move Under Financial Pressure",
    input: {
      decisionUnderReview:
        "Accept a startup offer ($100k base, equity vest over 4 years) vs. stay in stable corporate role ($110k, annual raises). Startup success probability: 25%. Household has just discovered $15k emergency expense (home repair) that depletes reserves.",
      decisionOwner: "Chief Technology Officer, age 38, two dependents",
      evidenceBasis: [
        "Startup has proven market fit in beta",
        "Team includes two successful founders from acquired company",
        "Runway: 18 months with current burn",
        "Personal savings: $45k after emergency expense",
      ],
      primaryContradiction:
        "Financial security vs. career growth. Timing conflict: emergency creates short-term pressure; opportunity window closes in 2 weeks.",
      deadlinePressure: "Startup offer expires in 14 days",
      irreversibleElements: [
        "Corporate role will be filled by external hire",
        "Startup equity cliff at year 2 means leaving before then forfeits most upside",
      ],
      desiredOutcome: "A decision framework that balances financial obligations, career trajectory, and family stability.",
      priorAttempts: [
        "Discussed with spouse twice (emotionally charged, no decision framework)",
        "Consulted with mentor (told to follow the dream)",
      ],
      optionsUnderConsideration: [
        "Accept startup, aggressive savings plan",
        "Decline startup, stay corporate",
        "Negotiate startup offer for higher base",
      ],
    },
  },
  {
    id: "partnership-trust-uncertainty",
    title: "Business Partnership Decision with Trust Uncertainty",
    input: {
      decisionUnderReview:
        "Bring operational/sales specialist into existing technical SaaS business as co-founder (40% equity split, immediate) vs. hire as Head of Operations vs. remain solo founder.",
      decisionOwner: "Solo technical founder, 3-year-old SaaS, $800k ARR, bootstrapped",
      evidenceBasis: [
        "Candidate: 15+ years operations at two venture-backed companies (both exited)",
        "Growth ceiling with current skill set: estimated $5M ARR",
        "Candidate has investor relationships; founder does not",
      ],
      primaryContradiction:
        "Founder needs capital/network but fears loss of control and dilution. Growth speed vs. founder's product philosophy.",
      deadlinePressure: "Candidate considering other venture; 60-day exclusivity window closing in 20 days",
      irreversibleElements: [
        "40% equity grant is permanent",
        "Co-founder relationship likely to define next 5-10 years",
        "Enterprise vs. SMB pivot is structural",
      ],
      desiredOutcome: "Clear decision logic about co-founder value and protective terms",
      priorAttempts: [
        "One serious discussion (ended when founder raised control concerns)",
        "Founder consulted advisor (advised against)",
      ],
      optionsUnderConsideration: [
        "Co-founder: 40% equity, immediate, defined decision authority",
        "Co-founder: 40% equity, vested over 4 years",
        "Head of Operations: $180k salary, 5% equity",
        "Decline partnership, stay solo",
      ],
    },
  },
  {
    id: "family-legal-timing-pressure",
    title: "Family/Legal/Admin Decision with Emotional and Timing Pressure",
    input: {
      decisionUnderReview:
        "Parent (age 75, declining cognition, diagnosed mild dementia) currently living alone. Options: memory-care facility ($6.5k/month), move in with adult child, hire 24-hour home care ($8k/month), or combination.",
      decisionOwner: "Primary adult child (age 43, lives 15 minutes away)",
      evidenceBasis: [
        "Neuropsychiatric evaluation: mild dementia, 2-3 year decline trajectory",
        "Fall risk assessment: moderate",
        "Financial sustainability: 7-10 years at $8k/month; 15+ years at facility",
        "Family prior pattern: conflict over parent's independence",
      ],
      primaryContradiction:
        "Parent's autonomy vs. safety/clinical needs. Adult child 2's care commitment vs. realistic availability. Family harmony vs. best-outcome safety.",
      deadlinePressure: "Current living situation unsustainable within 60 days. Facility waitlist: 8 months.",
      irreversibleElements: [
        "Staying home too long increases hospitalization risk",
        "Facility placement psychological difficulty",
        "Family relationship rupture risk",
      ],
      desiredOutcome: "Decision framework that weighs autonomy against safety and manages family disagreement",
      priorAttempts: [
        "Family meeting (ended in frustration)",
        "Social worker consultation (recommended facility)",
      ],
      optionsUnderConsideration: [
        "Facility now",
        "Home care + clinical supervision for 12 months",
        "Move in with adult child 2 + hired clinical caregiver",
        "Assisted living once available",
      ],
    },
  },
];

console.log("WAVE 2G: FINAL BENCHMARK TEST WITH PROPER RENDERER");
console.log("Testing that benchmark consumes upgraded fields\n");

const results: Wave2GBenchmarkResult[] = SCENARIOS.map((scenario, idx) => {
  console.log(`[${idx + 1}/3] Testing: ${scenario.title}`);

  const output = composeDecisionDiagnosticOutput(scenario.input);
  const score = scoreDecisionForce({
    actualDecisionQuestion: output.actualDecisionQuestion,
    decisionTension: output.decisionTension,
    unresolvedAssumption: output.unresolvedAssumption,
    falsificationTest: output.falsificationTest,
    accountableNextMove: output.accountableNextMove,
    consequenceIfWrong: output.consequenceIfWrong,
    whatNotToDo: output.whatNotToDo,
    limitation: output.limitation,
  });

  // Render for benchmark
  const analyzableOutput = renderForBenchmark(output);
  const renderedText = renderDecisionDiagnosticText(output);

  console.log(`  Decision force: ${score.overall.toFixed(1)}/10`);

  // Test anti-toy with proper structure
  let antiToyScore = 10;
  let antiToyPass = false;
  try {
    const sample: AnalyzableSample = {
      label: scenario.title,
      inputText: JSON.stringify(scenario.input),
      output: analyzableOutput,
    };
    // Use same sample for both primary and variant for now
    const antiToyResult = runAntiToyTest(sample, sample);
    antiToyScore = antiToyResult.toyRiskScore;
    antiToyPass = antiToyScore <= 5;
  } catch (e) {
    console.log(`    Anti-toy error: ${e instanceof Error ? e.message : "unknown"}`);
    antiToyScore = 10;
  }

  console.log(`  Anti-toy: ${antiToyScore.toFixed(1)} (target: ≤5) — ${antiToyPass ? "PASS ✓" : "FAIL ✗"}`);

  // Test red-team with proper structure
  let redTeamScore = 5.0;
  let redTeamPass = false;
  try {
    const redTeamResult = runRedTeamPanel(
      {
        productCode: "personal_decision_audit",
        renderedOutput: renderedText,
      },
      { contextual: true, specificToInput: true }
    );
    redTeamScore =
      redTeamResult.results.length > 0
        ? redTeamResult.results.reduce((sum, r) => sum + r.score, 0) / redTeamResult.results.length
        : 5.0;
    redTeamPass = redTeamScore >= 7.0;
  } catch (e) {
    console.log(`    Red-team error: ${e instanceof Error ? e.message : "unknown"}`);
    redTeamScore = 5.0;
  }

  console.log(`  Red-team: ${redTeamScore.toFixed(1)}/10 (target: ≥7.0) — ${redTeamPass ? "PASS ✓" : "FAIL ✗"}`);

  // Check if benchmark is reading upgraded fields
  const benchmarkConsumingFields =
    analyzableOutput.nextActionText.includes(output.accountableNextMove.action) &&
    analyzableOutput.consequenceText === output.consequenceIfWrong &&
    analyzableOutput.falsificationText && analyzableOutput.falsificationText.length > 50;

  console.log(`  Benchmark consuming upgraded fields: ${benchmarkConsumingFields ? "YES ✓" : "NO ✗"}`);

  return {
    scenario: scenario.id,
    title: scenario.title,
    decisionForceScore: score.overall,
    antiToyScore,
    antiToyPass,
    redTeamScore,
    redTeamPass,
    benchmarkConsumingUpgradedFields: benchmarkConsumingFields,
    notes: `Decision force: ${score.overall.toFixed(1)}, Anti-toy: ${antiToyScore}, Red-team: ${redTeamScore.toFixed(1)}`,
  };
});

// Summary
const avgDecisionForce = results.reduce((sum, r) => sum + r.decisionForceScore, 0) / results.length;
const avgAntiToy = results.reduce((sum, r) => sum + r.antiToyScore, 0) / results.length;
const avgRedTeam = results.reduce((sum, r) => sum + r.redTeamScore, 0) / results.length;
const allBenchmarkReading = results.every((r) => r.benchmarkConsumingUpgradedFields);

console.log(`\n${"=".repeat(70)}`);
console.log("SUMMARY");
console.log(`${"=".repeat(70)}`);
console.log(`Average decision force: ${avgDecisionForce.toFixed(1)}/10 (threshold: 8.5)`);
console.log(`Average anti-toy: ${avgAntiToy.toFixed(1)} (threshold: ≤5)`);
console.log(`Average red-team: ${avgRedTeam.toFixed(1)}/10 (threshold: ≥7.0)`);
console.log(`Benchmark consuming upgraded fields: ${allBenchmarkReading ? "ALL ✓" : "SOME ✗"}`);

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "wave-2g-final-benchmark-test.json"),
  JSON.stringify(
    {
      testedAt: new Date().toISOString(),
      results,
      summary: {
        avgDecisionForce,
        avgAntiToy,
        avgRedTeam,
        allBenchmarkReadingUpgradedFields: allBenchmarkReading,
      },
    },
    null,
    2
  ) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2g-final-benchmark-test.json")}`);
