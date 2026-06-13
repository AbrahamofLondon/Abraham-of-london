/**
 * Judgement Quality Autopsy: Decision Force Analysis
 *
 * Inspects actual diagnostic outputs and scores decision force.
 * Maps failures to specific engine layers.
 *
 * Run via: pnpm exec tsx scripts/autopsy-decision-force.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { composeDecisionDiagnosticOutput } from "../lib/product/decision-diagnostic-composer";
import { scoreDecisionForce } from "../lib/judgement/decision-force-score";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");

interface AutopsyFinding {
  scenarioId: string;
  title: string;
  decisionForceScore: any;
  engineLayerFailures: string[];
  genericAiComparison: string;
  recommendation: string;
}

const SCENARIOS = [
  {
    id: "career-move-financial-pressure",
    title: "Career Move Under Financial Pressure",
    input: {
      decisionUnderReview:
        "Accept a startup offer ($100k base, equity) vs. stay in stable corporate role ($110k). Startup success: 25%. Household just discovered $15k emergency expense.",
      decisionOwner: "Chief Technology Officer, age 38, two dependents",
      evidenceBasis: [
        "Startup proven market fit",
        "Team: two successful founders",
        "Runway: 18 months",
        "Personal savings: $45k after emergency",
      ],
      primaryContradiction:
        "Financial security vs. career growth. Emergency creates short-term pressure; offer window closes in 2 weeks.",
      deadlinePressure: "Startup offer expires in 14 days",
      irreversibleElements: ["Corporate role filled", "Startup equity cliff at year 2"],
      desiredOutcome: "Decision framework balancing financial, career, family stability.",
      priorAttempts: ["Discussed with spouse (emotionally charged)", "Consulted mentor"],
      optionsUnderConsideration: [
        "Accept startup, aggressive savings",
        "Decline, stay corporate",
        "Negotiate higher base",
      ],
    },
  },
  {
    id: "partnership-trust-uncertainty",
    title: "Business Partnership with Trust Uncertainty",
    input: {
      decisionUnderReview:
        "Bring operational specialist as co-founder (40% equity) vs. Head of Operations (salary) vs. stay solo. Candidate: 15+ years operations, two exits.",
      decisionOwner: "Solo technical founder, 3-year SaaS, $800k ARR",
      evidenceBasis: [
        "Candidate: proven operator, two exits",
        "Growth ceiling solo: $5M ARR",
        "Candidate has investor relationships",
      ],
      primaryContradiction:
        "Need capital/network vs. fear of control loss and dilution. Growth speed vs. founder's product philosophy.",
      deadlinePressure: "Candidate considering other venture; 60-day window closing in 20 days",
      irreversibleElements: [
        "40% equity is permanent",
        "5-10 year relationship impact",
        "Enterprise vs. SMB structural choice",
      ],
      desiredOutcome: "Clear decision logic on co-founder value and protective terms",
      priorAttempts: ["One discussion (control concerns ended it)", "Advisor advised against"],
      optionsUnderConsideration: [
        "Co-founder 40% immediate",
        "Co-founder 40% vested 4 years",
        "Head of Ops $180k + 5%",
        "Stay solo",
      ],
    },
  },
  {
    id: "family-legal-timing-pressure",
    title: "Family/Legal/Admin Decision with Emotional and Timing Pressure",
    input: {
      decisionUnderReview:
        "Parent age 75, mild dementia, living alone. Options: memory-care facility ($6.5k/month), move in with child, hire 24-hour care ($8k/month), or combination.",
      decisionOwner: "Primary adult child, age 43, 15 minutes away",
      evidenceBasis: [
        "Neuropsych eval: mild dementia, 2-3 year decline",
        "Fall risk: moderate",
        "Financial: 7-10 years at $8k/month; 15+ years at facility",
        "Family conflict history",
      ],
      primaryContradiction:
        "Autonomy vs. safety/clinical. Child 2's commitment vs. realistic availability. Family harmony vs. best outcome safety.",
      deadlinePressure: "Unsustainable in 60 days. Facility waitlist 8 months; enroll in 14 days.",
      irreversibleElements: [
        "Staying home increases hospitalization risk",
        "Facility placement psychological difficulty",
        "Family rupture risk",
      ],
      desiredOutcome: "Framework weighing autonomy against safety; managing family disagreement",
      priorAttempts: ["Family meeting (frustration)", "Social worker (recommended facility)"],
      optionsUnderConsideration: [
        "Facility now",
        "Home care + clinical supervision 12 months",
        "Move in with child 2 + caregiver",
        "Assisted living when available",
      ],
    },
  },
];

console.log("WAVE 2E: JUDGEMENT QUALITY AUTOPSY\n");

const findings: AutopsyFinding[] = SCENARIOS.map((scenario, idx) => {
  console.log(`[${idx + 1}/3] Autopsy: ${scenario.title}`);

  // Generate output
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

  console.log(`  Overall force score: ${score.overall.toFixed(1)}/10`);
  console.log(`  Critical failures: ${score.criticalFailures.length}`);

  // Map failures to engine layers
  const engineLayerFailures: string[] = [];

  if (score.actualDecisionNamed < 7) {
    engineLayerFailures.push("decision_question_extraction");
  }
  if (score.tradeOffSharpness < 7) {
    engineLayerFailures.push("tradeoff_modelling");
  }
  if (score.assumptionSpecificity < 7) {
    engineLayerFailures.push("assumption_extraction");
  }
  if (score.falsificationStrength < 7) {
    engineLayerFailures.push("falsification_pressure");
  }
  if (score.accountabilityStrength < 7) {
    engineLayerFailures.push("execution_translation");
  }
  if (score.consequenceSpecificity < 7) {
    engineLayerFailures.push("consequence_modelling");
  }
  if (score.nonGenericity < 7) {
    engineLayerFailures.push("language_specificity");
  }

  // Generic AI comparison
  const genericAiComparison = `Generic AI would say: "Consider the trade-off between ${scenario.input.primaryContradiction.substring(0, 40)}... Weigh your options carefully." We say: "${output.actualDecisionQuestion.substring(0, 60)}..." Difference: specificity to case facts.`;

  return {
    scenarioId: scenario.id,
    title: scenario.title,
    decisionForceScore: score,
    engineLayerFailures: [...new Set(engineLayerFailures)],
    genericAiComparison,
    recommendation: score.recommendation,
  };
});

// Summary
const avgScore = findings.reduce((sum, f) => sum + f.decisionForceScore.overall, 0) / findings.length;
const commonFailures = Array.from(
  new Set(findings.flatMap((f) => f.engineLayerFailures))
).sort();

console.log(`\n${"=".repeat(70)}`);
console.log(`AUTOPSY SUMMARY`);
console.log(`${"=".repeat(70)}`);
console.log(`Average decision force score: ${avgScore.toFixed(1)}/10 (threshold: 8.5)`);
console.log(`Scenarios with critical failures: ${findings.filter((f) => f.decisionForceScore.criticalFailures.length > 0).length}/3`);
console.log(`Most common failing layers:`);
commonFailures.forEach((layer) => {
  const count = findings.filter((f) => f.engineLayerFailures.includes(layer)).length;
  console.log(`  - ${layer}: ${count}/3 scenarios`);
});

// Write report
mkdirSync(REPORTS_DIR, { recursive: true });

writeFileSync(
  join(REPORTS_DIR, "wave-2e-judgement-quality-autopsy.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      summary: {
        averageDecisionForceScore: avgScore,
        passThreshold: 8.5,
        passed: avgScore >= 8.5,
        scenariosWithCriticalFailures: findings.filter((f) => f.decisionForceScore.criticalFailures.length > 0)
          .length,
        commonFailingLayers: commonFailures,
      },
      findings,
    },
    null,
    2
  ) + "\n"
);

console.log(`\nWritten: ${join(REPORTS_DIR, "wave-2e-judgement-quality-autopsy.json")}`);
