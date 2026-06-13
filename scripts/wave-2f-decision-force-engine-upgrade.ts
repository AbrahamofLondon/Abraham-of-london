/**
 * Wave 2F: Decision Force Engine Upgrade
 *
 * Tests the three engine-layer upgrades (trade-off modelling, consequence modelling, observable falsification)
 * against the same three scenarios from Waves 2B-2E.
 *
 * Compares results to Wave 2E baseline to measure improvement.
 *
 * Run via: pnpm exec tsx scripts/wave-2f-decision-force-engine-upgrade.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";
import { scoreDecisionForce } from "../lib/judgement/decision-force-score";
import { runAntiToyTest, type AnalyzableSample } from "../lib/product/anti-toy-product-test";
import { runRedTeamPanel } from "../lib/product/product-red-team-reviewers";
import { renderForBenchmark } from "../lib/product/personal-decision-audit-renderer";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface Wave2FScenarioResult {
  scenarioId: string;
  title: string;
  decisionForceScore: any;
  antiToyScore: number;
  redTeamScore: number;
  comparisonToWave2E: {
    decisionForceImproved: boolean;
    decisionForceDelta: number;
    antiToyImproved: boolean;
    antiToyDelta: number;
    redTeamImproved: boolean;
    redTeamDelta: number;
  };
}

interface Wave2FUpgradeResult {
  productCode: string;
  testedAt: string;
  upgradesApplied: string[];
  scenarios: Wave2FScenarioResult[];
  aggregateMetrics: {
    decisionForceMean: number;
    decisionForcePass: boolean;
    antiToyMean: number;
    antiToyPass: boolean;
    redTeamMean: number;
    redTeamPass: boolean;
  };
  wave2EBaseline: {
    decisionForceMean: number;
    antiToyMean: number;
    redTeamMean: number;
  };
  improvement: {
    decisionForceImproved: boolean;
    decisionForceDelta: number;
    antiToyImproved: boolean;
    antiToyDelta: number;
    redTeamImproved: boolean;
    redTeamDelta: number;
    improvementSummary: string;
  };
  gatePassed: boolean;
  gateFailureReasons: string[];
  recommendedClassification: "diagnostic_product" | "blocked_until_claim_evidenced";
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

// Wave 2E baseline scores
const WAVE_2E_BASELINE = {
  careerMove: { decisionForce: 6.7, antiToy: 10.0, redTeam: 5.0 },
  partnership: { decisionForce: 6.9, antiToy: 10.0, redTeam: 5.0 },
  familyLegal: { decisionForce: 7.2, antiToy: 10.0, redTeam: 5.0 },
};

console.log("WAVE 2F: DECISION FORCE ENGINE UPGRADE");
console.log("Applying trade-off modelling, consequence modelling, observable falsification\n");

const scenarios: Wave2FScenarioResult[] = SCENARIOS.map((scenario, idx) => {
  console.log(`[${idx + 1}/3] Testing: ${scenario.title}`);

  // Generate output using upgraded composer
  const output = composeDecisionDiagnosticOutput(scenario.input);

  // Score decision force
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

  console.log(`  Decision force: ${score.overall.toFixed(1)}/10`);

  // Measure anti-toy
  const outputText = `
DECISION: ${output.actualDecisionQuestion}
TENSION: ${output.decisionTension}
FALSIFICATION: ${output.falsificationTest.challenge}
CONSEQUENCE: ${output.consequenceIfWrong}
NEXT MOVE: ${output.accountableNextMove.action}
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

  console.log(`  Anti-toy: ${antiToyScore.toFixed(1)} (Wave 2E: 10.0)`);

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

  console.log(`  Red-team: ${redTeamScore.toFixed(1)}/10 (Wave 2E: 5.0)`);

  // Compare to Wave 2E baseline
  let baseline = WAVE_2E_BASELINE.careerMove;
  if (scenario.id.includes("partnership")) {
    baseline = WAVE_2E_BASELINE.partnership;
  } else if (scenario.id.includes("family")) {
    baseline = WAVE_2E_BASELINE.familyLegal;
  }

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    decisionForceScore: score,
    antiToyScore,
    redTeamScore,
    comparisonToWave2E: {
      decisionForceImproved: score.overall > baseline.decisionForce,
      decisionForceDelta: score.overall - baseline.decisionForce,
      antiToyImproved: antiToyScore < baseline.antiToy,
      antiToyDelta: baseline.antiToy - antiToyScore,
      redTeamImproved: redTeamScore > baseline.redTeam,
      redTeamDelta: redTeamScore - baseline.redTeam,
    },
  };
});

// Aggregate results
const decisionForceMean = scenarios.reduce((sum, s) => sum + s.decisionForceScore.overall, 0) / scenarios.length;
const antiToyMean = scenarios.reduce((sum, s) => sum + s.antiToyScore, 0) / scenarios.length;
const redTeamMean = scenarios.reduce((sum, s) => sum + s.redTeamScore, 0) / scenarios.length;

const wave2EDecisionForceMean = (6.7 + 6.9 + 7.2) / 3;
const wave2EAntiToyMean = 10.0;
const wave2ERedTeamMean = 5.0;

const result: Wave2FUpgradeResult = {
  productCode: "personal_decision_audit",
  testedAt: new Date().toISOString(),
  upgradesApplied: [
    "Trade-off modelling (decision-tradeoff-model.ts)",
    "Case-specific consequence modelling (case-specific-consequence-model.ts)",
    "Observable falsification (observable-falsification.ts)",
  ],
  scenarios,
  aggregateMetrics: {
    decisionForceMean,
    decisionForcePass: decisionForceMean >= 8.5,
    antiToyMean,
    antiToyPass: antiToyMean <= 5,
    redTeamMean,
    redTeamPass: redTeamMean >= 7.0,
  },
  wave2EBaseline: {
    decisionForceMean: wave2EDecisionForceMean,
    antiToyMean: wave2EAntiToyMean,
    redTeamMean: wave2ERedTeamMean,
  },
  improvement: {
    decisionForceImproved: decisionForceMean > wave2EDecisionForceMean,
    decisionForceDelta: decisionForceMean - wave2EDecisionForceMean,
    antiToyImproved: antiToyMean < wave2EAntiToyMean,
    antiToyDelta: wave2EAntiToyMean - antiToyMean,
    redTeamImproved: redTeamMean > wave2ERedTeamMean,
    redTeamDelta: redTeamMean - wave2ERedTeamMean,
    improvementSummary: generateImprovementSummary({
      decisionForceMean,
      wave2EDecisionForceMean,
      antiToyMean,
      wave2EAntiToyMean,
      redTeamMean,
      wave2ERedTeamMean,
    }),
  },
  gatePassed: false,
  gateFailureReasons: [],
  recommendedClassification: "blocked_until_claim_evidenced",
};

// Gate logic
if (result.aggregateMetrics.decisionForcePass && result.aggregateMetrics.antiToyPass && result.aggregateMetrics.redTeamPass) {
  result.gatePassed = true;
  result.recommendedClassification = "diagnostic_product";
} else {
  if (!result.aggregateMetrics.decisionForcePass) {
    result.gateFailureReasons.push(
      `Decision force: ${decisionForceMean.toFixed(1)} (threshold: ≥8.5, Wave 2E baseline: ${wave2EDecisionForceMean.toFixed(1)}, delta: ${(decisionForceMean - wave2EDecisionForceMean).toFixed(1)})`
    );
  }
  if (!result.aggregateMetrics.antiToyPass) {
    result.gateFailureReasons.push(
      `Anti-toy: ${antiToyMean.toFixed(1)} (threshold: ≤5, Wave 2E baseline: ${wave2EAntiToyMean}, delta: ${(wave2EAntiToyMean - antiToyMean).toFixed(1)})`
    );
  }
  if (!result.aggregateMetrics.redTeamPass) {
    result.gateFailureReasons.push(
      `Red-team: ${redTeamMean.toFixed(1)} (threshold: ≥7.0, Wave 2E baseline: ${wave2ERedTeamMean.toFixed(1)}, delta: ${(redTeamMean - wave2ERedTeamMean).toFixed(1)})`
    );
  }
}

console.log(`\n${"=".repeat(70)}`);
console.log(`GATE RESULT: ${result.gatePassed ? "PASSED ✓" : "FAILED ✗"}`);
console.log(`${"=".repeat(70)}`);
console.log(`\nUpgrades Applied:`);
result.upgradesApplied.forEach((u) => console.log(`  - ${u}`));
console.log(`\nMetrics (vs. Wave 2E):`);
console.log(`  Decision force: ${decisionForceMean.toFixed(1)}/10 (Wave 2E: ${wave2EDecisionForceMean.toFixed(1)}, delta: ${(decisionForceMean - wave2EDecisionForceMean).toFixed(1)}) — ${result.aggregateMetrics.decisionForcePass ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  Anti-toy: ${antiToyMean.toFixed(1)} (Wave 2E: ${wave2EAntiToyMean.toFixed(1)}, delta: ${(wave2EAntiToyMean - antiToyMean).toFixed(1)}) — ${result.aggregateMetrics.antiToyPass ? "PASS ✓" : "FAIL ✗"}`);
console.log(`  Red-team: ${redTeamMean.toFixed(1)}/10 (Wave 2E: ${wave2ERedTeamMean.toFixed(1)}, delta: ${(redTeamMean - wave2ERedTeamMean).toFixed(1)}) — ${result.aggregateMetrics.redTeamPass ? "PASS ✓" : "FAIL ✗"}`);

if (result.gateFailureReasons.length > 0) {
  console.log(`\nFailure reasons:`);
  result.gateFailureReasons.forEach((r) => console.log(`  - ${r}`));
}

console.log(`\nRecommended classification: ${result.recommendedClassification}`);

// Write reports
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "wave-2f-decision-force-engine-upgrade.json"),
  JSON.stringify(result, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2f-decision-force-engine-upgrade.json")}`);

function generateImprovementSummary(metrics: {
  decisionForceMean: number;
  wave2EDecisionForceMean: number;
  antiToyMean: number;
  wave2EAntiToyMean: number;
  redTeamMean: number;
  wave2ERedTeamMean: number;
}): string {
  const improvements = [];

  if (metrics.decisionForceMean > metrics.wave2EDecisionForceMean) {
    improvements.push(
      `Decision force improved from ${metrics.wave2EDecisionForceMean.toFixed(1)} to ${metrics.decisionForceMean.toFixed(1)} (+${(metrics.decisionForceMean - metrics.wave2EDecisionForceMean).toFixed(1)})`
    );
  } else if (metrics.decisionForceMean === metrics.wave2EDecisionForceMean) {
    improvements.push(`Decision force unchanged at ${metrics.decisionForceMean.toFixed(1)}`);
  } else {
    improvements.push(
      `Decision force declined from ${metrics.wave2EDecisionForceMean.toFixed(1)} to ${metrics.decisionForceMean.toFixed(1)} (${(metrics.decisionForceMean - metrics.wave2EDecisionForceMean).toFixed(1)})`
    );
  }

  if (metrics.antiToyMean < metrics.wave2EAntiToyMean) {
    improvements.push(
      `Anti-toy improved from ${metrics.wave2EAntiToyMean} to ${metrics.antiToyMean.toFixed(1)} (${(metrics.wave2EAntiToyMean - metrics.antiToyMean).toFixed(1)} point reduction)`
    );
  } else {
    improvements.push(`Anti-toy unchanged at ${metrics.antiToyMean}`);
  }

  if (metrics.redTeamMean > metrics.wave2ERedTeamMean) {
    improvements.push(
      `Red-team improved from ${metrics.wave2ERedTeamMean.toFixed(1)} to ${metrics.redTeamMean.toFixed(1)} (+${(metrics.redTeamMean - metrics.wave2ERedTeamMean).toFixed(1)})`
    );
  } else {
    improvements.push(`Red-team unchanged at ${metrics.redTeamMean.toFixed(1)}`);
  }

  return improvements.join("; ");
}
