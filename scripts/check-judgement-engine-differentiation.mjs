#!/usr/bin/env node
/**
 * Judgement Engine Differentiation gate.
 *
 * Runs each Wave 1 composer against the golden decision scenarios and fails
 * when materially different cases converge into template-like judgement.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

try {
  const { register } = await import("tsx/esm");
  register();
} catch {
  // When the script itself is run through tsx, registration is already present.
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const REPORT_DIR = resolve(ROOT, "reports");
const JSON_REPORT = resolve(REPORT_DIR, "judgement-engine-differentiation.json");
const MD_REPORT = resolve(REPORT_DIR, "judgement-engine-differentiation.md");

const { GOLDEN_DECISION_SCENARIOS, GLOBAL_GENERIC_MARKERS } = await importTs("lib/judgement/golden-decision-scenarios.ts");
const { JUDGEMENT_DIVERSITY_THRESHOLDS } = await importTs("lib/product/anti-toy-product-test.ts");
const { composeFastDiagnosticGoldResult } = await importTs("lib/product/fast-diagnostic-gold-composer.ts");
const { composeFreeSignalGoldResult } = await importTs("lib/product/free-signal-gold-composer.ts");
const { composeDecisionInstrumentGoldResult } = await importTs("lib/product/decision-instrument-gold-composer.ts");
const { composeStrategyRoomSessionGoldReport } = await importTs("lib/product/strategy-room-session-gold-composer.ts");

const STOPWORDS = new Set([
  "the", "and", "for", "that", "this", "with", "your", "you", "are", "was",
  "not", "its", "has", "have", "but", "can", "will", "must", "into", "from",
  "what", "when", "who", "how", "why", "one", "their", "they", "them", "any",
  "all", "than", "then", "before", "after", "under", "over", "more", "most",
  "case", "decision", "pattern", "owner", "owners", "input", "stated",
]);

const COMPOSERS = [
  { id: "fast_diagnostic", file: "lib/product/fast-diagnostic-gold-composer.ts", run: runFastDiagnostic },
  { id: "free_signal", file: "lib/product/free-signal-gold-composer.ts", run: runFreeSignal },
  { id: "decision_instrument", file: "lib/product/decision-instrument-gold-composer.ts", run: runDecisionInstrument },
  { id: "strategy_room_session", file: "lib/product/strategy-room-session-gold-composer.ts", run: runStrategyRoom },
];

const composerRuns = [];
const patternFailures = [];
const genericFailures = [];
const similarityFailures = [];

for (const composer of COMPOSERS) {
  const scenarioRuns = [];
  for (const scenario of GOLDEN_DECISION_SCENARIOS) {
    const output = composer.run(scenario);
    const classificationPassed = output.patternStatus === "judged" &&
      output.primaryPattern === scenario.expectedPrimaryPattern;

    if (!classificationPassed) {
      patternFailures.push({
        composer: composer.id,
        scenario: scenario.id,
        expectedPrimaryPattern: scenario.expectedPrimaryPattern,
        actualPrimaryPattern: output.primaryPattern,
        status: output.patternStatus,
      });
    }

    const markers = findGenericMarkers(output.fullText, [
      ...GLOBAL_GENERIC_MARKERS,
      ...scenario.unacceptableGenericMarkers,
    ]);
    if (markers.length > 0) {
      genericFailures.push({ composer: composer.id, scenario: scenario.id, markers });
    }

    scenarioRuns.push({ scenario, output, classificationPassed, genericMarkers: markers });
  }

  const comparisons = compareScenarioRuns(composer.id, scenarioRuns);
  similarityFailures.push(...comparisons.filter((comparison) => comparison.fails));
  composerRuns.push({ composer: composer.id, file: composer.file, scenarioRuns, comparisons });
}

const totalRuns = COMPOSERS.length * GOLDEN_DECISION_SCENARIOS.length;
const passedClassifications = totalRuns - patternFailures.length;
const oldFailure = findOldFailureComparison(composerRuns);
const gate = patternFailures.length === 0 && genericFailures.length === 0 && similarityFailures.length === 0
  ? "PASSED"
  : "FAILED";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  scenariosTested: GOLDEN_DECISION_SCENARIOS.length,
  composersTested: COMPOSERS.length,
  thresholds: JUDGEMENT_DIVERSITY_THRESHOLDS,
  patternClassificationsPassed: passedClassifications,
  patternClassificationsTotal: totalRuns,
  similarityFailures: similarityFailures.length,
  genericJudgementFailures: genericFailures.length,
  old84FailureResult: oldFailure,
  patternsDetected: summarizePatterns(composerRuns),
  composerResults: composerRuns.map((composerRun) => ({
    composer: composerRun.composer,
    file: composerRun.file,
    classificationsPassed: composerRun.scenarioRuns.filter((run) => run.classificationPassed).length,
    classificationsTotal: composerRun.scenarioRuns.length,
    maxOverallSimilarity: maxMetric(composerRun.comparisons, "overallJudgementSimilarity"),
    maxDiagnosisSimilarity: maxMetric(composerRun.comparisons, "diagnosisSimilarity"),
    maxNextMoveSimilarity: maxMetric(composerRun.comparisons, "nextMoveSimilarity"),
  })),
  failures: {
    patternFailures,
    genericFailures,
    similarityFailures,
  },
  beforeAfterExample: buildBeforeAfterExample(oldFailure),
  remainingRisks: [
    "This gate tests composer-level rendered output, not every live route integration.",
    "Similarity is lexical; it is strong enough to catch template convergence, but it does not prove strategic correctness by itself.",
    "Gold remains blocked unless the external product value benchmark proves actual rendered output and route evidence.",
  ],
  recommendation: gate === "PASSED"
    ? "Judgement differentiation is GREEN at composer level; proceed to external product value benchmark without restoring gold by declaration."
    : "Judgement differentiation is RED; fix failed classifications, generic markers, or similarity convergence before external certification.",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMarkdown(report));

console.log("JUDGEMENT ENGINE DIFFERENTIATION CHECK");
console.log(`Scenarios tested: ${report.scenariosTested}`);
console.log(`Composers tested: ${report.composersTested}`);
console.log(`Pattern classifications passed: ${report.patternClassificationsPassed}/${report.patternClassificationsTotal}`);
console.log(`Similarity failures: ${report.similarityFailures}`);
console.log(`Generic judgement failures: ${report.genericJudgementFailures}`);
console.log(`Gate: ${report.gate}`);

if (gate !== "PASSED") {
  console.log("");
  console.log("Failures:");
  for (const failure of patternFailures.slice(0, 10)) {
    console.log(`- ${failure.composer}/${failure.scenario}: expected ${failure.expectedPrimaryPattern}, got ${failure.actualPrimaryPattern ?? failure.status}`);
  }
  for (const failure of similarityFailures.slice(0, 10)) {
    console.log(`- ${failure.composer}/${failure.a} vs ${failure.b}: overall ${pct(failure.overallJudgementSimilarity)}, diagnosis ${pct(failure.diagnosisSimilarity)}, next move ${pct(failure.nextMoveSimilarity)}`);
  }
  for (const failure of genericFailures.slice(0, 10)) {
    console.log(`- ${failure.composer}/${failure.scenario}: generic markers ${failure.markers.join(", ")}`);
  }
}

process.exitCode = gate === "PASSED" ? 0 : 1;

async function importTs(relativePath) {
  return import(pathToFileURL(resolve(ROOT, relativePath)).href);
}

function runFastDiagnostic(scenario) {
  const input = scenario.caseInput;
  const result = composeFastDiagnosticGoldResult({
    productCode: "fast_diagnostic",
    answers: [
      { question: "Decision description", answer: input.decisionDescription },
      { question: "Evidence available", answer: input.evidenceAvailable.join("; ") },
      { question: "Prior attempts", answer: input.priorAttempts.join("; ") },
      { question: "Options", answer: input.optionsUnderConsideration.join("; ") },
    ],
    dominantFrictionSignal: input.constraint,
    decisionContext: input.decisionDescription,
    statedStake: input.consequenceOfDelay,
    minutesSpentByUser: 6,
    stakeholders: input.stakeholders,
    deadline: input.deadline,
    desiredOutcome: input.desiredOutcome,
    priorAttempts: input.priorAttempts,
    optionsUnderConsideration: input.optionsUnderConsideration,
  });

  return normalizeOutput({
    patternStatus: result.patternStatus,
    primaryPattern: result.primaryPattern,
    secondaryPatterns: result.secondaryPatterns,
    patternEvidence: result.patternEvidence,
    diagnosis: result.dominantDecisionFriction,
    consequence: result.likelyCostOfIgnoringThis,
    nextMove: result.recommendedNextStep,
    falsification: result.falsificationChallenge,
    executionSequence: result.executionSequence,
    fullText: [
      result.dominantDecisionFriction,
      result.whatYourAnswersSuggest,
      result.likelyCostOfIgnoringThis,
      result.minimumViableCorrection,
      result.recommendedNextStep,
      result.falsificationChallenge,
      result.whenToEscalate,
      ...result.executionSequence,
    ].join("\n"),
  });
}

function runFreeSignal(scenario) {
  const input = scenario.caseInput;
  const result = composeFreeSignalGoldResult({
    productCode: "team_assessment",
    observedSignal: `${input.decisionDescription}. Evidence: ${input.evidenceAvailable.join("; ")}`,
    signalSource: "golden decision scenario",
    customerSituation: input.decisionDescription,
    whatItPointsAt: input.constraint,
    minutesAskedOfUser: 8,
    consequenceOfInaction: input.consequenceOfDelay,
    stakeholders: input.stakeholders,
    deadline: input.deadline,
    desiredOutcome: input.desiredOutcome,
  });

  return normalizeOutput({
    patternStatus: result.patternStatus,
    primaryPattern: result.primaryPattern,
    secondaryPatterns: result.secondaryPatterns,
    patternEvidence: result.patternEvidence,
    diagnosis: result.oneUsefulInterpretation,
    consequence: result.caseDerivedConsequence,
    nextMove: result.onePracticalNextAction,
    falsification: result.falsificationChallenge,
    executionSequence: result.executionSequence,
    fullText: [
      result.oneClearSignal,
      result.oneUsefulInterpretation,
      result.caseDerivedConsequence,
      result.onePracticalNextAction,
      result.falsificationChallenge,
      result.oneEscalationCondition,
      ...result.executionSequence,
    ].join("\n"),
  });
}

function runDecisionInstrument(scenario) {
  const input = scenario.caseInput;
  const result = composeDecisionInstrumentGoldResult({
    productCode: "personal_decision_audit",
    decisionUnderReview: input.decisionDescription,
    decisionOwner: input.stakeholders[0] ?? "accountable owner",
    evidenceBasis: input.evidenceAvailable,
    primaryContradiction: input.constraint,
    deadlinePressure: input.deadline,
    irreversibleElements: [input.consequenceOfDelay],
    desiredOutcome: input.desiredOutcome,
    priorAttempts: input.priorAttempts,
    optionsUnderConsideration: input.optionsUnderConsideration,
  });

  return normalizeOutput({
    patternStatus: result.patternStatus,
    primaryPattern: result.primaryPattern,
    secondaryPatterns: result.secondaryPatterns,
    patternEvidence: result.patternEvidence,
    diagnosis: result.decisionState,
    consequence: result.costOfDelay,
    nextMove: result.nextMove,
    falsification: result.falsificationChallenge,
    executionSequence: result.executionSequence,
    fullText: [
      result.decisionState,
      result.primaryContradiction,
      result.costOfDelay,
      result.strategicRisk,
      result.nextMove,
      result.falsificationChallenge,
      result.reviewCheckpoint,
      ...result.executionSequence,
    ].join("\n"),
  });
}

function runStrategyRoom(scenario) {
  const input = scenario.caseInput;
  const result = composeStrategyRoomSessionGoldReport({
    productCode: "strategy_room",
    sessionId: `golden-${scenario.id}`,
    sessionDate: "2026-06-13",
    participants: input.stakeholders,
    decisionBeingWorked: input.decisionDescription,
    evidenceStack: input.evidenceAvailable,
    primaryTension: input.constraint,
    executionConstraint: input.constraint,
    agreedMinimumMove: input.optionsUnderConsideration[0] ?? input.desiredOutcome,
    checkpointDate: input.deadline,
    consequenceOfInaction: input.consequenceOfDelay,
    desiredOutcome: input.desiredOutcome,
  });

  return normalizeOutput({
    patternStatus: result.patternStatus,
    primaryPattern: result.primaryPattern,
    secondaryPatterns: result.secondaryPatterns,
    patternEvidence: result.patternEvidence,
    diagnosis: result.strategicDiagnosis,
    consequence: result.riskIfIgnored,
    nextMove: result.minimumViableMove,
    falsification: result.falsificationChallenge,
    executionSequence: result.executionSequence,
    fullText: [
      result.sessionContext,
      result.decisionBeingWorked,
      result.primaryTension,
      result.strategicDiagnosis,
      result.riskIfIgnored,
      result.minimumViableMove,
      result.falsificationChallenge,
      result.followUpCheckpoint,
      ...result.executionSequence,
    ].join("\n"),
  });
}

function normalizeOutput(output) {
  return {
    patternStatus: output.patternStatus,
    primaryPattern: output.primaryPattern,
    secondaryPatterns: output.secondaryPatterns ?? [],
    patternEvidence: output.patternEvidence ?? [],
    diagnosis: output.diagnosis ?? "",
    consequence: output.consequence ?? "",
    nextMove: output.nextMove ?? "",
    falsification: output.falsification ?? "",
    executionSequence: output.executionSequence ?? [],
    fullText: output.fullText ?? "",
  };
}

function compareScenarioRuns(composer, runs) {
  const comparisons = [];
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      const a = runs[i];
      const b = runs[j];
      const metrics = similarityMetrics(a.output, b.output);
      const fails =
        metrics.overallJudgementSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.overallJudgementSimilarity ||
        metrics.diagnosisSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.diagnosisSimilarity ||
        metrics.nextMoveSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.nextMoveSimilarity ||
        metrics.consequenceSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.consequenceSimilarity ||
        metrics.falsificationSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.falsificationSimilarity ||
        metrics.executionSequenceSimilarity > JUDGEMENT_DIVERSITY_THRESHOLDS.executionSequenceSimilarity;

      comparisons.push({
        composer,
        a: a.scenario.id,
        b: b.scenario.id,
        ...metrics,
        fails,
      });
    }
  }
  return comparisons;
}

function similarityMetrics(a, b) {
  const diagnosisSimilarity = textSimilarity(a.diagnosis, b.diagnosis);
  const consequenceSimilarity = textSimilarity(a.consequence, b.consequence);
  const nextMoveSimilarity = textSimilarity(a.nextMove, b.nextMove);
  const falsificationSimilarity = textSimilarity(a.falsification, b.falsification);
  const executionSequenceSimilarity = textSimilarity(a.executionSequence.join(" "), b.executionSequence.join(" "));
  const overallJudgementSimilarity = average([
    diagnosisSimilarity,
    consequenceSimilarity,
    nextMoveSimilarity,
    falsificationSimilarity,
    executionSequenceSimilarity,
  ]);

  return {
    overallJudgementSimilarity,
    diagnosisSimilarity,
    consequenceSimilarity,
    nextMoveSimilarity,
    falsificationSimilarity,
    executionSequenceSimilarity,
  };
}

function findGenericMarkers(text, markers) {
  const lower = text.toLowerCase();
  return [...new Set(markers.filter((marker) => lower.includes(String(marker).toLowerCase())))];
}

function summarizePatterns(composerRuns) {
  return composerRuns.map((composerRun) => ({
    composer: composerRun.composer,
    scenarios: composerRun.scenarioRuns.map((run) => ({
      scenario: run.scenario.id,
      expectedPrimaryPattern: run.scenario.expectedPrimaryPattern,
      actualPrimaryPattern: run.output.primaryPattern,
      secondaryPatterns: run.output.secondaryPatterns,
      evidenceMatched: run.output.patternEvidence,
    })),
  }));
}

function findOldFailureComparison(composerRuns) {
  const fast = composerRuns.find((composerRun) => composerRun.composer === "fast_diagnostic");
  const comparison = fast?.comparisons.find((entry) =>
    (entry.a === "pricing-ownership" && entry.b === "hiring-freeze") ||
    (entry.a === "hiring-freeze" && entry.b === "pricing-ownership")
  );
  if (!comparison) return null;
  return {
    pair: "pricing-ownership vs hiring-freeze",
    previousSimilarity: 0.84,
    currentOverallJudgementSimilarity: comparison.overallJudgementSimilarity,
    currentDiagnosisSimilarity: comparison.diagnosisSimilarity,
    currentNextMoveSimilarity: comparison.nextMoveSimilarity,
    eliminated: comparison.overallJudgementSimilarity <= JUDGEMENT_DIVERSITY_THRESHOLDS.overallJudgementSimilarity &&
      comparison.diagnosisSimilarity <= JUDGEMENT_DIVERSITY_THRESHOLDS.diagnosisSimilarity &&
      comparison.nextMoveSimilarity <= JUDGEMENT_DIVERSITY_THRESHOLDS.nextMoveSimilarity,
  };
}

function buildBeforeAfterExample(oldFailure) {
  return {
    before: "The old fast_diagnostic output produced 84% identical judgement for a pricing-ownership case and a hiring-freeze case.",
    after: oldFailure
      ? `The same pair now scores ${pct(oldFailure.currentOverallJudgementSimilarity)} overall, ${pct(oldFailure.currentDiagnosisSimilarity)} diagnosis, and ${pct(oldFailure.currentNextMoveSimilarity)} next-move similarity.`
      : "The old failure pair was not found in the comparison matrix.",
  };
}

function renderMarkdown(data) {
  const composerRows = data.composerResults.map((row) =>
    `| ${row.composer} | ${row.classificationsPassed}/${row.classificationsTotal} | ${pct(row.maxOverallSimilarity)} | ${pct(row.maxDiagnosisSimilarity)} | ${pct(row.maxNextMoveSimilarity)} |`
  ).join("\n");

  return `# Judgement Engine Differentiation Review

## Gate Result

${data.gate}

## Scenarios Tested

${data.scenariosTested} golden scenarios: ${GOLDEN_DECISION_SCENARIOS.map((scenario) => scenario.title).join("; ")}.

## Patterns Detected

${data.patternsDetected.map((entry) => `### ${entry.composer}

${entry.scenarios.map((scenario) => `- ${scenario.scenario}: expected ${scenario.expectedPrimaryPattern}, detected ${scenario.actualPrimaryPattern}; evidence ${scenario.evidenceMatched.join(", ") || "none"}`).join("\n")}`).join("\n\n")}

## Composers Tested

| Composer | Classification Passes | Max Overall Similarity | Max Diagnosis Similarity | Max Next-Move Similarity |
|---|---:|---:|---:|---:|
${composerRows}

## Similarity Results

- Similarity failures: ${data.similarityFailures}
- Old 84% pair: ${data.old84FailureResult ? `${pct(data.old84FailureResult.currentOverallJudgementSimilarity)} overall; eliminated: ${data.old84FailureResult.eliminated ? "yes" : "no"}` : "not found"}

## Generic Judgement Failures

${data.genericJudgementFailures === 0 ? "None." : data.failures.genericFailures.map((failure) => `- ${failure.composer}/${failure.scenario}: ${failure.markers.join(", ")}`).join("\n")}

## Before / After Example

Before: ${data.beforeAfterExample.before}

After: ${data.beforeAfterExample.after}

## Remaining Risks

${data.remainingRisks.map((risk) => `- ${risk}`).join("\n")}

## Recommendation

${data.recommendation}
`;
}

function maxMetric(comparisons, key) {
  return comparisons.reduce((max, comparison) => Math.max(max, comparison[key] ?? 0), 0);
}

function tokenize(text) {
  return new Set(
    String(text)
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

function textSimilarity(a, b) {
  if (String(a).trim().length === 0 && String(b).trim().length === 0) return 0;
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.size === 0 && tokensB.size === 0) return 0;
  const union = new Set([...tokensA, ...tokensB]);
  const intersection = new Set([...tokensA].filter((token) => tokensB.has(token)));
  return intersection.size / union.size;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}
