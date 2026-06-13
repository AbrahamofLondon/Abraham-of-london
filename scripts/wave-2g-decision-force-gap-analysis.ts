/**
 * Wave 2G: Decision Force Gap Analysis
 *
 * Breaks down all 9 decision-force dimensions for each scenario.
 * Identifies which dimensions are weak (<7.0) and which are suppressing the average.
 *
 * Run via: pnpm exec tsx scripts/wave-2g-decision-force-gap-analysis.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";
import { scoreDecisionForce, type DecisionForceScore } from "../lib/judgement/decision-force-score";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface DimensionBreakdown {
  scenario: string;
  title: string;
  dimensions: {
    actualDecisionNamed: number;
    tradeOffSharpness: number;
    assumptionSpecificity: number;
    falsificationStrength: number;
    accountabilityStrength: number;
    consequenceSpecificity: number;
    nonGenericity: number;
    actionPressure: number;
    reusableValue: number;
    overall: number;
  };
  criticalFailures: string[];
  weakDimensions: string[]; // < 7.0
  suppressingDimensions: string[]; // < 8.5 but >= 7.0
  belowThreshold: number;
}

interface GapAnalysisResult {
  productCode: string;
  testedAt: string;
  scenarios: DimensionBreakdown[];
  summary: {
    averageScore: number;
    threshold: number;
    gap: number;
    scenarioWeakest: string;
    scenarioStrongest: string;
    dimensionMostWeak: { name: string; averageScore: number };
    dimensionWeakestScenario: { dimension: string; scenario: string; score: number };
    mostCommonWeakDimensions: { dimension: string; failureCount: number }[];
  };
  recommendations: string[];
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

console.log("WAVE 2G: DECISION FORCE GAP ANALYSIS");
console.log("Breaking down all 9 dimensions for each scenario\n");

const breakdowns: DimensionBreakdown[] = SCENARIOS.map((scenario, idx) => {
  console.log(`[${idx + 1}/3] Analyzing: ${scenario.title}`);

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

  const dimensions = {
    actualDecisionNamed: score.actualDecisionNamed,
    tradeOffSharpness: score.tradeOffSharpness,
    assumptionSpecificity: score.assumptionSpecificity,
    falsificationStrength: score.falsificationStrength,
    accountabilityStrength: score.accountabilityStrength,
    consequenceSpecificity: score.consequenceSpecificity,
    nonGenericity: score.nonGenericity,
    actionPressure: score.actionPressure,
    reusableValue: score.reusableValue,
    overall: score.overall,
  };

  const weakDimensions = Object.entries(dimensions)
    .filter(([key, val]) => key !== "overall" && val < 7.0)
    .map(([key]) => key);

  const suppressingDimensions = Object.entries(dimensions)
    .filter(([key, val]) => key !== "overall" && val >= 7.0 && val < 8.5)
    .map(([key]) => key);

  console.log(`  Overall: ${dimensions.overall.toFixed(1)}/10`);
  console.log(`  Weak dimensions (<7.0): ${weakDimensions.length > 0 ? weakDimensions.join(", ") : "none"}`);
  console.log(`  Suppressing dimensions (7.0-8.5): ${suppressingDimensions.length > 0 ? suppressingDimensions.join(", ") : "none"}`);

  return {
    scenario: scenario.id,
    title: scenario.title,
    dimensions,
    criticalFailures: score.criticalFailures,
    weakDimensions,
    suppressingDimensions,
    belowThreshold: Object.entries(dimensions)
      .filter(([key, val]) => key !== "overall" && val < 8.5)
      .length,
  };
});

// Summary analysis
const avgScore = breakdowns.reduce((sum, b) => sum + b.dimensions.overall, 0) / breakdowns.length;
const weakestScenario = breakdowns.reduce((min, b) => (b.dimensions.overall < min.dimensions.overall ? b : min));
const strongestScenario = breakdowns.reduce((max, b) => (b.dimensions.overall > max.dimensions.overall ? b : max));

// Find weakest dimension across all scenarios
const dimensionAverages: { [key: string]: number[] } = {
  actualDecisionNamed: [],
  tradeOffSharpness: [],
  assumptionSpecificity: [],
  falsificationStrength: [],
  accountabilityStrength: [],
  consequenceSpecificity: [],
  nonGenericity: [],
  actionPressure: [],
  reusableValue: [],
};

breakdowns.forEach((b) => {
  Object.keys(dimensionAverages).forEach((dim) => {
    dimensionAverages[dim].push(b.dimensions[dim as keyof typeof b.dimensions]);
  });
});

const dimensionAvgs = Object.entries(dimensionAverages).map(([name, values]) => ({
  name,
  avg: values.reduce((a, b) => a + b, 0) / values.length,
}));

const mostWeakDimension = dimensionAvgs.reduce((min, d) => (d.avg < min.avg ? d : min));

// Find most common weak dimensions
const allWeakDimensions = breakdowns.flatMap((b) => b.weakDimensions);
const weakDimensionCounts: { [key: string]: number } = {};
allWeakDimensions.forEach((dim) => {
  weakDimensionCounts[dim] = (weakDimensionCounts[dim] || 0) + 1;
});

const mostCommonWeakDimensions = Object.entries(weakDimensionCounts)
  .sort(([, countA], [, countB]) => countB - countA)
  .map(([dimension, failureCount]) => ({ dimension, failureCount }));

// Find weakest dimension in any scenario
let weakestDimensionScore = { dimension: "", scenario: "", score: 10 };
breakdowns.forEach((b) => {
  Object.entries(b.dimensions).forEach(([dim, score]) => {
    if (dim !== "overall" && score < weakestDimensionScore.score) {
      weakestDimensionScore = { dimension: dim, scenario: b.title, score };
    }
  });
});

const recommendations: string[] = [];

// Analysis and recommendations
if (avgScore < 8.5) {
  recommendations.push(`Gap to threshold: ${(8.5 - avgScore).toFixed(1)} points`);
}

if (mostCommonWeakDimensions.length > 0) {
  recommendations.push(
    `Most common weak dimensions: ${mostCommonWeakDimensions.map((d) => `${d.dimension} (${d.failureCount}/3)`).join(", ")}`
  );
}

if (weakestScenario.dimensions.overall < 8.0) {
  recommendations.push(`Weakest scenario: ${weakestScenario.title} (${weakestScenario.dimensions.overall.toFixed(1)}/10)`);
}

if (mostWeakDimension.avg < 7.0) {
  recommendations.push(`Weakest dimension overall: ${mostWeakDimension.name} (avg ${mostWeakDimension.avg.toFixed(1)}/10)`);
}

if (weakestDimensionScore.score < 6.0) {
  recommendations.push(
    `Critical failure: ${weakestDimensionScore.dimension} in ${weakestDimensionScore.scenario} (${weakestDimensionScore.score.toFixed(1)}/10)`
  );
}

const result: GapAnalysisResult = {
  productCode: "personal_decision_audit",
  testedAt: new Date().toISOString(),
  scenarios: breakdowns,
  summary: {
    averageScore: avgScore,
    threshold: 8.5,
    gap: Math.max(0, 8.5 - avgScore),
    scenarioWeakest: weakestScenario.title,
    scenarioStrongest: strongestScenario.title,
    dimensionMostWeak: { name: mostWeakDimension.name, averageScore: mostWeakDimension.avg },
    dimensionWeakestScenario: weakestDimensionScore,
    mostCommonWeakDimensions,
  },
  recommendations,
};

// Print detailed dimension table
console.log(`\n${"=".repeat(70)}`);
console.log("DIMENSION TABLE (all 9 dimensions x 3 scenarios)");
console.log(`${"=".repeat(70)}\n`);

const dimensionNames = [
  "actualDecisionNamed",
  "tradeOffSharpness",
  "assumptionSpecificity",
  "falsificationStrength",
  "accountabilityStrength",
  "consequenceSpecificity",
  "nonGenericity",
  "actionPressure",
  "reusableValue",
];

// Header
console.log(`Dimension                      | Career    | Partnership | Family    | Average   | Status`);
console.log(`${"".padEnd(30, "-")}+-----------+-----------+-----------+-----------+--------`);

dimensionNames.forEach((dim) => {
  const scores = breakdowns.map((b) => b.dimensions[dim as keyof typeof b.dimensions]);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const status = avg < 7.0 ? "WEAK" : avg < 8.5 ? "MED" : "GOOD";
  const career = scores[0].toFixed(1).padStart(5);
  const partner = scores[1].toFixed(1).padStart(5);
  const family = scores[2].toFixed(1).padStart(5);
  const avgStr = avg.toFixed(1).padStart(5);

  console.log(
    `${dim.padEnd(30)} | ${career}    | ${partner}     | ${family}    | ${avgStr}    | ${status}`
  );
});

console.log(`${"".padEnd(30, "-")}+-----------+-----------+-----------+-----------+--------`);
console.log(`${"OVERALL".padEnd(30)} | ${breakdowns[0].dimensions.overall.toFixed(1).padStart(5)}    | ${breakdowns[1].dimensions.overall.toFixed(1).padStart(5)}     | ${breakdowns[2].dimensions.overall.toFixed(1).padStart(5)}    | ${avgScore.toFixed(1).padStart(5)}    | ${avgScore >= 8.5 ? "PASS" : "FAIL"}`);

console.log(`\n${"=".repeat(70)}`);
console.log("SUMMARY");
console.log(`${"=".repeat(70)}`);
console.log(`Average decision force: ${avgScore.toFixed(1)}/10`);
console.log(`Threshold: 8.5`);
console.log(`Gap: ${(8.5 - avgScore).toFixed(1)}`);
console.log(`Weakest scenario: ${weakestScenario.title} (${weakestScenario.dimensions.overall.toFixed(1)}/10)`);
console.log(`Strongest scenario: ${strongestScenario.title} (${strongestScenario.dimensions.overall.toFixed(1)}/10)`);
console.log(`Weakest dimension: ${mostWeakDimension.name} (avg ${mostWeakDimension.avg.toFixed(1)}/10)`);

if (mostCommonWeakDimensions.length > 0) {
  console.log(`\nMost common weak dimensions (<7.0):`);
  mostCommonWeakDimensions.forEach((d) => {
    console.log(`  ${d.dimension}: ${d.failureCount}/3 scenarios`);
  });
}

// Write JSON report
mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "wave-2g-decision-force-gap-analysis.json"),
  JSON.stringify(result, null, 2) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2g-decision-force-gap-analysis.json")}`);
