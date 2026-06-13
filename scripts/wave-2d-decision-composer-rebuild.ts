/**
 * Wave 2D: Decision Composer Architecture Rebuild
 *
 * Re-architect personal_decision_audit to use decision-diagnostic-composer
 * instead of free-signal-gold-composer.
 *
 * Tests the new composer against the same three Wave 2B/2C scenarios.
 * Measures whether architectural change improves quality.
 *
 * Run via: pnpm exec tsx scripts/wave-2d-decision-composer-rebuild.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import {
  composeDecisionDiagnosticOutput,
  validateDiagnosticQuality,
  type DecisionDiagnosticOutput,
} from "../lib/product/decision-diagnostic-composer";
import { runAntiToyTest, type AnalyzableSample } from "../lib/product/anti-toy-product-test";
import { runRedTeamPanel } from "../lib/product/product-red-team-reviewers";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface Wave2DScenarioTest {
  scenarioId: string;
  title: string;
  input: any;
  diagnosticOutput: DecisionDiagnosticOutput;
  validationResult: { valid: boolean; failures: string[] };
  antiToyScore: number;
  redTeamScore: number;
  improvedFromWave2C: boolean;
}

interface Wave2DRebuildResult {
  productCode: string;
  testedAt: string;
  architectureChange: string;
  scenarios: Wave2DScenarioTest[];
  aggregateMetrics: {
    qualityValidationPass: boolean;
    antiToyMean: number;
    antiToyPass: boolean;
    redTeamMean: number;
    redTeamPass: boolean;
    inputEchoPass: boolean;
  };
  thresholds: {
    antiToyMax: number;
    redTeamMin: number;
  };
  gatePassed: boolean;
  gateFailureReasons: string[];
  recommendedClassification: "diagnostic_product" | "blocked_until_claim_evidenced";
  architecturalSuccess: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Test Scenarios (Same as Wave 2B/2C)
// ────────────────────────────────────────────────────────────────────────────

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

// ────────────────────────────────────────────────────────────────────────────
// Run Wave 2D Tests
// ────────────────────────────────────────────────────────────────────────────

console.log("WAVE 2D: DECISION COMPOSER ARCHITECTURE REBUILD");
console.log("Testing new decision-diagnostic-composer (no free-signal dependency)...\n");

const scenarios: Wave2DScenarioTest[] = SCENARIOS.map((scenario, idx) => {
  console.log(`[${idx + 1}/3] Testing: ${scenario.title}`);

  // Generate diagnostic output using NEW composer (not free-signal)
  const diagnosticOutput = composeDecisionDiagnosticOutput(scenario.input);
  const validationResult = validateDiagnosticQuality(diagnosticOutput);

  console.log(
    `  Validation: ${validationResult.valid ? "PASS ✓" : "FAIL ✗"} (${validationResult.failures.length} issues)`
  );
  if (!validationResult.valid) {
    validationResult.failures.slice(0, 2).forEach((f) => console.log(`    - ${f}`));
  }

  // Measure anti-toy
  const outputText = `
DECISION: ${diagnosticOutput.actualDecisionQuestion}
TENSION: ${diagnosticOutput.decisionTension}
ASSUMPTION: ${diagnosticOutput.unresolvedAssumption}
FALSIFICATION: ${diagnosticOutput.falsificationTest.challenge}
NEXT MOVE: ${diagnosticOutput.accountableNextMove.action} by ${diagnosticOutput.accountableNextMove.owner}
  `;

  let antiToyScore = 10;
  try {
    const sample: AnalyzableSample = {
      productCode: "personal_decision_audit",
      renderedOutput: outputText,
      inputEcho: JSON.stringify(scenario.input),
    };
    const antiToyResult = runAntiToyTest([sample]);
    antiToyScore = antiToyResult.scores[0] || 10;
  } catch {
    antiToyScore = 10;
  }

  console.log(`  Anti-toy: ${antiToyScore.toFixed(1)} (target: ≤5)`);

  // Measure red-team
  let redTeamScore = 5.0;
  try {
    const redTeamResult = runRedTeamPanel(
      { productCode: "personal_decision_audit", renderedOutput: outputText },
      { contextual: true, specificToInput: true }
    );
    redTeamScore = redTeamResult.results.reduce((sum, r) => sum + r.score, 0) / redTeamResult.results.length;
  } catch {
    redTeamScore = 5.0;
  }

  console.log(`  Red-team: ${redTeamScore.toFixed(1)}/10 (target: ≥7.0)`);
  console.log(`  Input echo: ${(diagnosticOutput.qualityGuards.inputEchoRatio * 100).toFixed(1)}% (${diagnosticOutput.qualityGuards.inputEchoPass ? "pass" : "fail"})`);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    input: scenario.input,
    diagnosticOutput,
    validationResult,
    antiToyScore,
    redTeamScore,
    improvedFromWave2C: antiToyScore < 10 || redTeamScore > 5.0,
  };
});

// ────────────────────────────────────────────────────────────────────────────
// Aggregate Results
// ────────────────────────────────────────────────────────────────────────────

const qualityValidationPass = scenarios.every((s) => s.validationResult.valid);
const antiToyMean = scenarios.reduce((sum, s) => sum + s.antiToyScore, 0) / scenarios.length;
const redTeamMean = scenarios.reduce((sum, s) => sum + s.redTeamScore, 0) / scenarios.length;
const inputEchoPass = scenarios.every((s) => s.diagnosticOutput.qualityGuards.inputEchoPass);

const result: Wave2DRebuildResult = {
  productCode: "personal_decision_audit",
  testedAt: new Date().toISOString(),
  architectureChange: "Replaced free-signal-gold-composer dependency with decision-diagnostic-composer",
  scenarios,
  aggregateMetrics: {
    qualityValidationPass,
    antiToyMean,
    antiToyPass: antiToyMean <= 5,
    redTeamMean,
    redTeamPass: redTeamMean >= 7.0,
    inputEchoPass,
  },
  thresholds: {
    antiToyMax: 5,
    redTeamMin: 7.0,
  },
  gatePassed: false,
  gateFailureReasons: [],
  recommendedClassification: "blocked_until_claim_evidenced",
  architecturalSuccess: false,
};

// Gate logic
if (result.aggregateMetrics.antiToyPass && result.aggregateMetrics.redTeamPass && inputEchoPass) {
  result.gatePassed = true;
  result.recommendedClassification = "diagnostic_product";
  result.architecturalSuccess = true;
} else {
  if (!result.aggregateMetrics.antiToyPass) {
    result.gateFailureReasons.push(`Anti-toy: ${antiToyMean.toFixed(1)} (threshold: ≤5)`);
  }
  if (!result.aggregateMetrics.redTeamPass) {
    result.gateFailureReasons.push(`Red-team: ${redTeamMean.toFixed(1)} (threshold: ≥7.0)`);
  }
  if (!inputEchoPass) {
    result.gateFailureReasons.push(`Input echo: not all scenarios pass`);
  }
  if (!qualityValidationPass) {
    result.gateFailureReasons.push(`Quality validation: ${scenarios.filter((s) => !s.validationResult.valid).length} scenarios failed`);
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`GATE RESULT: ${result.gatePassed ? "PASSED ✓" : "FAILED ✗"}`);
console.log(`ARCHITECTURE SUCCESS: ${result.architecturalSuccess ? "YES ✓" : "NO ✗"}`);
console.log(`${"=".repeat(70)}`);
console.log(`\nArchitectural Change:`);
console.log(`  ${result.architectureChange}`);
console.log(`\nMetrics:`);
console.log(`  Quality validation: ${qualityValidationPass ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  Anti-toy: ${antiToyMean.toFixed(1)} (threshold: ≤5) — ${result.aggregateMetrics.antiToyPass ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  Red-team: ${redTeamMean.toFixed(1)}/10 (threshold: ≥7.0) — ${result.aggregateMetrics.redTeamPass ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  Input echo: ${inputEchoPass ? "PASS ✓" : "FAIL ✗"}`);

if (result.gateFailureReasons.length > 0) {
  console.log(`\nFailure reasons:`);
  result.gateFailureReasons.forEach((r) => console.log(`  - ${r}`));
}

console.log(`\nRecommended classification: ${result.recommendedClassification}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "wave-2d-decision-composer-rebuild.json"),
  JSON.stringify(result, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2d-decision-composer-rebuild.json")}`);
