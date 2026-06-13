/**
 * Wave 2C: Personal Decision Audit Claim Recovery
 *
 * Re-test personal_decision_audit with improved output engines:
 * - Decision output distiller (reduces input echo)
 * - Input echo guard (measures quality)
 * - Strengthened falsification pressure
 * - Accountability layer
 *
 * Run against the same three Wave 2B scenarios.
 * Measure: anti-toy, red-team, generic AI outperformance.
 *
 * Run via: pnpm exec tsx scripts/wave-2c-personal-decision-audit-recovery.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { distillDecisionOutput } from "../lib/judgement/decision-output-distiller";
import { analyzeInputEcho, guardAgainstInputEcho } from "../lib/judgement/input-echo-guard";
import { runAntiToyTest, type AnalyzableSample } from "../lib/product/anti-toy-product-test";
import { runRedTeamPanel } from "../lib/product/product-red-team-reviewers";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface Wave2CScenarioComparison {
  scenarioId: string;
  title: string;

  // Wave 2B results
  wave2bAntiToy: number;
  wave2bRedTeam: number;
  wave2bInputEcho: number;

  // Wave 2C results
  wave2cDistilledOutput: string;
  wave2cAntiToy: number;
  wave2cRedTeam: number;
  wave2cInputEcho: number;
  wave2cInputEchoPass: boolean;
  wave2cInputEchoFeedback: string;

  // Improvement
  antiToyImprovement: number;
  redTeamImprovement: number;
  echoImprovement: number;
}

interface Wave2CRecoveryResult {
  productCode: string;
  testedAt: string;
  scenarios: Wave2CScenarioComparison[];
  aggregateMetrics: {
    antiToyWave2b: number;
    antiToyWave2c: number;
    antiToyImprovement: number;
    antiToyPass: boolean;

    redTeamWave2b: number;
    redTeamWave2c: number;
    redTeamImprovement: number;
    redTeamPass: boolean;

    inputEchoPass: boolean;
  };
  thresholds: {
    antiToyMax: number;
    redTeamMin: number;
    inputEchoRatioMax: number;
  };
  gatePassed: boolean;
  gateFailureReasons: string[];
  recommendedClassification: "diagnostic_product" | "blocked_until_claim_evidenced";
}

// ────────────────────────────────────────────────────────────────────────────
// Test Scenarios (Same as Wave 2B)
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
        "Mortgage: $2200/month; no other debt",
        "Spouse income: $75k stable",
        "Risk tolerance: historically moderate (changed roles twice, no forced exits)",
      ],
      primaryContradiction:
        "Financial security (dependent on job stability) vs. career growth (depends on taking risk). Timing conflict: emergency creates short-term pressure; opportunity window closes in 2 weeks.",
      deadlinePressure: "Startup offer expires in 14 days",
      irreversibleElements: [
        "Corporate role will be filled by external hire (two-year notice would burn bridge)",
        "Startup equity cliff at year 2 means leaving before then forfeits most upside",
      ],
      desiredOutcome:
        "A decision framework that balances financial obligations, career trajectory, and family stability. Not a prediction of outcome, but a clear decision logic and execution sequence.",
      priorAttempts: [
        "Discussed with spouse twice (emotionally charged, no decision framework)",
        "Consulted with mentor (told to 'follow the dream')",
        "Ran personal financial model once (conflicting assumptions about success rate)",
      ],
      optionsUnderConsideration: [
        "Accept startup, aggressive savings plan",
        "Decline startup, stay corporate, revisit startup world in 2 years",
        "Negotiate startup offer for higher base or longer cliff",
        "Ask spouse to temporarily increase work hours during startup ramp",
      ],
    },
  },
  {
    id: "partnership-trust-uncertainty",
    title: "Business Partnership Decision with Trust Uncertainty",
    input: {
      decisionUnderReview:
        "Bring operational/sales specialist into existing technical SaaS business as co-founder (40% equity split, immediate) vs. hire as Head of Operations (salary, no equity) vs. remain solo founder. Candidate has strong network and operating track record but different risk tolerance and product vision (wants to pivot to enterprise focus; founder prefers bottom-up SMB).",
      decisionOwner: "Solo technical founder, 3-year-old SaaS, $800k ARR, bootstrapped",
      evidenceBasis: [
        "Candidate: 15+ years operations at two venture-backed companies (both exited)",
        "Growth ceiling with current skill set: estimated $5M ARR (hiring constraints)",
        "Candidate has investor relationships; founder does not",
        "Candidate's risk tolerance: prefers proven enterprise markets; founder: comfortable experiment phase",
        "Product vision divergence: documented in email thread (friendly but real)",
        "Working relationship: 3 customer projects together, no financial relationship yet",
        "Founder's personal runway: 18 months without revenue",
      ],
      primaryContradiction:
        "Founder needs capital/network (candidate offers) but fears loss of control and dilution (candidate requires equity and decision-making power). Speed of growth vs. founder's product philosophy.",
      deadlinePressure:
        "Candidate considering other venture (good market, but 60-day exclusivity window closing in 20 days)",
      irreversibleElements: [
        "40% equity grant is permanent (can only be reversed through dilution or buyout)",
        "Co-founder relationship likely to define next 5-10 years of company",
        "Enterprise vs. SMB pivot is structural (cannot do both; customer base incompatible)",
      ],
      desiredOutcome:
        "Clear decision logic about whether co-founder role creates net value despite control dilution, and if yes, what terms protect founder's interests (decision seat on product, explicit SKU roadmap, revision clauses).",
      priorAttempts: [
        "One serious discussion (ended when founder raised control concerns; candidate felt dismissed)",
        "Founder consulted advisor (advised against; too pessimistic on scaling solo)",
        "Candidate shared operating deck (positive, but glossed over how to maintain SMB strategy)",
      ],
      optionsUnderConsideration: [
        "Co-founder: 40% equity, immediate, defined decision authority on product",
        "Co-founder: 40% equity, vested over 4 years, required alignment on product roadmap",
        "Head of Operations: $180k salary, 5% equity, advisory board seat, no veto power",
        "Decline partnership, stay solo, hire Head of Operations in 12 months when runway allows",
      ],
    },
  },
  {
    id: "family-legal-timing-pressure",
    title: "Family/Legal/Admin Decision with Emotional and Timing Pressure",
    input: {
      decisionUnderReview:
        "Parent (age 75, declining cognition, diagnosed mild dementia) currently living alone; can no longer independently manage medications, finances, or home maintenance. Options: (1) move to memory-care facility ($6.5k/month, waitlist 8 months), (2) move in with adult child (emotional caregiving, no clinical support), (3) hire 24-hour home care ($8k/month, agency turnover high), (4) combination (assisted living + periodic clinical supervision). Estate: $320k liquid; home worth $450k; parent has $2.4k/month pension. Adult child 1 (recommends facility; concerned about quality of life at home); Adult child 2 (wants parent to move in; concerned about facility depersonalization). Spouse of adult child 1: medical professional, willing to provide periodic clinical supervision if parent stays home. Parent's stated preference: stay in home 'as long as possible.'",
      decisionOwner: "Primary adult child (age 43, lives 15 minutes away, full-time employment)",
      evidenceBasis: [
        "Neuropsychiatric evaluation: mild dementia, 2-3 year functional decline trajectory estimate",
        "Fall risk assessment: moderate (recent minor fall, weak ankle history)",
        "Financial sustainability: 7-10 years at $8k/month; 15+ years at facility (waiting list discount unlikely)",
        "Family prior pattern: conflict over parent's independence after stroke 5 years ago",
        "Clinical supervision availability: spouse (MD, available ~4 hours/week)",
        "Agency home care: three inquiries, all report high staff turnover (average 6 months)",
        "Facility waitlist: current 8 months; two facilities acceptable to children, but quality variance",
      ],
      primaryContradiction:
        "Parent's autonomy preference vs. safety/clinical needs. Adult child 2's care commitment vs. realistic time/emotional availability. Clinical supervision adequacy (spouse's 4 hours/week) vs. 24-hour risk. Family harmony vs. best-outcome safety.",
      deadlinePressure:
        "Current living situation unsustainable within 60 days (medication mismanagement already causing minor health events). Facility waitlist: 8 months (enrollment decision needed in 14 days to secure spot, but commitment is reversible only if new opening elsewhere found).",
      irreversibleElements: [
        "Staying home too long without adequate support increases hospitalization risk (irreversibly damages cognitive function)",
        "Facility placement: psychological difficulty of reverting if regrets, though legally/financially possible",
        "Family relationship rupture if disagreement escalates (already tension between children)",
      ],
      desiredOutcome:
        "Decision framework that weighs parent's autonomy against safety, acknowledges family disagreement as real (not to be 'solved' but navigated), and establishes clear decision logic for phasing (e.g., start at home with clinical supervision + waitlist enrollment, trigger transition if specific events occur).",
      priorAttempts: [
        "Family meeting (ended in frustration; children want parent to 'decide' but parent defers)",
        "Social worker consultation (recommended facility; one child defensive)",
        "Financial advisor review (indicated all options sustainable, so finance not discriminating factor)",
      ],
      optionsUnderConsideration: [
        "Facility now (decision ends ambiguity; parent unhappy initially but research shows adjustment)",
        "Home care + clinical supervision for 12 months, then reassess (delays decision; risk increases during delay)",
        "Move in with adult child 2 + hired clinical caregiver (balances autonomy + safety; requires family commitment)",
        "Hybrid: assisted living (more autonomy than facility, more support than home) once available (waitlist: unknown, likely 6-12 months)",
      ],
    },
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Run Wave 2C Recovery
// ────────────────────────────────────────────────────────────────────────────

console.log("WAVE 2C: PERSONAL DECISION AUDIT CLAIM RECOVERY");
console.log("Re-testing with improved output engines...\n");

// Load Wave 2B results for comparison
const wave2bProof = JSON.parse(readFileSync(join(REPORTS_DIR, "wave-2b-personal-decision-audit-proof.json"), "utf-8"));

const comparisons: Wave2CScenarioComparison[] = SCENARIOS.map((scenario, idx) => {
  const wave2bResult = wave2bProof.scenarios[idx];
  console.log(`[${idx + 1}/3] Testing: ${scenario.title}`);

  // Generate improved output using distiller
  const distilledOutput = distillDecisionOutput(scenario.input);
  const outputText = `
DECISION QUESTION: ${distilledOutput.distilledQuestion.coreQuestion}

DECISION TENSION: ${distilledOutput.distilledQuestion.decisionTension}

KEY ASSUMPTION: ${distilledOutput.keyAssumptions[0]?.assumption || "Unknown"}

FALSIFICATION PRESSURE: ${distilledOutput.falsificationPressures[0]?.falsifyingChallenge || "Unknown"}

NEXT MOVE: ${distilledOutput.nextMove.action} by ${distilledOutput.nextMove.owner} (deadline: ${distilledOutput.nextMove.deadline})

WHAT WOULD CHANGE THIS: ${distilledOutput.falsificationPressures[0]?.evidenceThatWouldChangeJudgement || "Unknown"}
  `;

  // Measure input echo on new output
  const echoAnalysis = analyzeInputEcho(JSON.stringify(scenario.input), outputText);
  console.log(`  Input echo: ${(echoAnalysis.inputEchoRatio * 100).toFixed(1)}% (Wave 2B: ~50%, threshold: 30%)`);
  console.log(`  Echo pass: ${echoAnalysis.passGuard ? "YES ✓" : "NO ✗"}`);

  // Measure anti-toy on new output
  const sample: AnalyzableSample = {
    productCode: "personal_decision_audit",
    renderedOutput: outputText,
    inputEcho: JSON.stringify(scenario.input),
  };

  let wave2cAntiToy = 10;
  try {
    const antiToyResult = runAntiToyTest([sample]);
    wave2cAntiToy = antiToyResult.scores[0] || 10;
  } catch {
    wave2cAntiToy = 10;
  }

  // Measure red-team on new output
  let wave2cRedTeam = 5.0;
  try {
    const redTeamResult = runRedTeamPanel(
      {
        productCode: "personal_decision_audit",
        renderedOutput: outputText,
      },
      { contextual: true, specificToInput: true }
    );
    wave2cRedTeam = redTeamResult.results.reduce((sum, r) => sum + r.score, 0) / redTeamResult.results.length;
  } catch {
    wave2cRedTeam = 5.0;
  }

  console.log(`  Anti-toy: ${wave2cAntiToy.toFixed(1)} (Wave 2B: ${wave2bResult.antiToyScore}, target: <=5)`);
  console.log(`  Red-team: ${wave2cRedTeam.toFixed(1)}/10 (Wave 2B: ${wave2bResult.redTeamScore}, target: >=7.0)`);

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    wave2bAntiToy: wave2bResult.antiToyScore,
    wave2bRedTeam: wave2bResult.redTeamScore,
    wave2bInputEcho: 50, // Estimated from prior failures
    wave2cDistilledOutput: outputText,
    wave2cAntiToy,
    wave2cRedTeam,
    wave2cInputEcho: echoAnalysis.inputEchoRatio * 100,
    wave2cInputEchoPass: echoAnalysis.passGuard,
    wave2cInputEchoFeedback: `Echo ratio: ${(echoAnalysis.inputEchoRatio * 100).toFixed(1)}% (${echoAnalysis.passGuard ? "pass" : "fail"})`,
    antiToyImprovement: wave2bResult.antiToyScore - wave2cAntiToy,
    redTeamImprovement: wave2cRedTeam - wave2bResult.redTeamScore,
    echoImprovement: 50 - echoAnalysis.inputEchoRatio * 100,
  };
});

// ────────────────────────────────────────────────────────────────────────────
// Aggregate Results
// ────────────────────────────────────────────────────────────────────────────

const antiToyWave2b = comparisons.reduce((sum, c) => sum + c.wave2bAntiToy, 0) / comparisons.length;
const antiToyWave2c = comparisons.reduce((sum, c) => sum + c.wave2cAntiToy, 0) / comparisons.length;
const antiToyImprovement = antiToyWave2b - antiToyWave2c;

const redTeamWave2b = comparisons.reduce((sum, c) => sum + c.wave2bRedTeam, 0) / comparisons.length;
const redTeamWave2c = comparisons.reduce((sum, c) => sum + c.wave2cRedTeam, 0) / comparisons.length;
const redTeamImprovement = redTeamWave2c - redTeamWave2b;

const inputEchoPass = comparisons.every((c) => c.wave2cInputEchoPass);

const result: Wave2CRecoveryResult = {
  productCode: "personal_decision_audit",
  testedAt: new Date().toISOString(),
  scenarios: comparisons,
  aggregateMetrics: {
    antiToyWave2b,
    antiToyWave2c,
    antiToyImprovement,
    antiToyPass: antiToyWave2c <= 5,

    redTeamWave2b,
    redTeamWave2c,
    redTeamImprovement,
    redTeamPass: redTeamWave2c >= 7.0,

    inputEchoPass,
  },
  thresholds: {
    antiToyMax: 5,
    redTeamMin: 7.0,
    inputEchoRatioMax: 30,
  },
  gatePassed: false,
  gateFailureReasons: [],
  recommendedClassification: "blocked_until_claim_evidenced",
};

// Gate logic
if (result.aggregateMetrics.antiToyPass && result.aggregateMetrics.redTeamPass && inputEchoPass) {
  result.gatePassed = true;
  result.recommendedClassification = "diagnostic_product";
} else {
  if (!result.aggregateMetrics.antiToyPass) {
    result.gateFailureReasons.push(`Anti-toy: ${antiToyWave2c.toFixed(1)} (threshold: <= 5)`);
  }
  if (!result.aggregateMetrics.redTeamPass) {
    result.gateFailureReasons.push(`Red-team: ${redTeamWave2c.toFixed(1)} (threshold: >= 7.0)`);
  }
  if (!inputEchoPass) {
    result.gateFailureReasons.push(`Input echo: not all scenarios pass (must be < 30%)`);
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`GATE RESULT: ${result.gatePassed ? "PASSED ✓" : "FAILED ✗"}`);
console.log(`${"=".repeat(70)}`);
console.log(`\nMetrics Comparison:`);
console.log(`  Anti-toy: ${antiToyWave2b.toFixed(1)} (Wave 2B) → ${antiToyWave2c.toFixed(1)} (Wave 2C) [improvement: ${antiToyImprovement.toFixed(1)}]`);
console.log(
  `  Red-team: ${redTeamWave2b.toFixed(1)} (Wave 2B) → ${redTeamWave2c.toFixed(1)} (Wave 2C) [improvement: ${redTeamImprovement.toFixed(1)}]`
);
console.log(`  Input echo: ${inputEchoPass ? "PASS ✓" : "FAIL ✗"}`);

if (result.gateFailureReasons.length > 0) {
  console.log(`\nFailure reasons:`);
  result.gateFailureReasons.forEach((r) => console.log(`  - ${r}`));
}

console.log(`\nRecommended classification: ${result.recommendedClassification}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(join(REPORTS_DIR, "wave-2c-personal-decision-audit-recovery.json"), JSON.stringify(result, null, 2) + "\n");

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2c-personal-decision-audit-recovery.json")}`);
