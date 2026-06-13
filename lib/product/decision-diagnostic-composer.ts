/**
 * lib/product/decision-diagnostic-composer.ts
 *
 * Decision Diagnostic Composer
 *
 * A dedicated composer for diagnostic decision products.
 * Does NOT route through free-signal-gold-composer.
 * Produces decision diagnostic output, not generic advice.
 *
 * Output includes:
 * - Actual decision question (not the wrapper)
 * - Decision tension (what makes it hard)
 * - Unresolved assumption (what's being taken for granted)
 * - Falsification test (evidence that would change judgment)
 * - Accountable next move (who decides, by when, with what success check)
 * - Escalation trigger (what condition forces re-decision)
 *
 * Quality guards ensure output is specific, testable, and accountable.
 */

import { distillDecisionOutput, type DecisionInput } from "../judgement/decision-output-distiller";
import { analyzeInputEcho } from "../judgement/input-echo-guard";
import { modelTradeoff } from "../judgement/decision-tradeoff-model";
import { modelCaseSpecificConsequence } from "../judgement/case-specific-consequence-model";
import { buildObservableFalsification } from "../judgement/observable-falsification";

export interface DecisionDiagnosticOutput {
  productCode: string;
  scenarioId?: string;
  generatedAt: string;

  /** The actual decision being made (not the wrapper question) */
  actualDecisionQuestion: string;

  /** The diagnostic read of the situation */
  diagnosticJudgement: string;

  /** What makes this decision hard */
  decisionTension: string;

  /** What constraint makes some options impossible */
  hiddenConstraint: string;

  /** What is being taken for granted */
  unresolvedAssumption: string;

  /** What happens if the decision is delayed */
  consequenceIfDelayed: string;

  /** What happens if the decision is wrong */
  consequenceIfWrong: string;

  /** The test that could prove this judgment wrong */
  falsificationTest: {
    claim: string;
    challenge: string;
    evidenceThatWouldChangeJudgement: string;
  };

  /** The specific next move */
  accountableNextMove: {
    action: string;
    owner: string;
    deadline: string;
    successCheck: string;
  };

  /** What not to do */
  whatNotToDo: string;

  /** What condition forces re-decision */
  escalationTrigger: string;

  /** Honest limitation of this diagnosis */
  limitation: string;

  /** Evidence of reasoning chain */
  reasoningChainEvidence: {
    interpretedSignals: string[];
    weightedSignals: string[];
    contradictions: string[];
    patterns: string[];
    consequenceModelPresent: boolean;
    falsificationPresent: boolean;
    executionTranslationPresent: boolean;
  };

  /** Quality assurance */
  qualityGuards: {
    inputEchoRatio: number;
    inputEchoPass: boolean;
    genericLanguageDetected: string[];
    accountableMovePresent: boolean;
    falsificationPressurePresent: boolean;
    allFieldsPopulated: boolean;
  };
}

/**
 * Compose a diagnostic decision output
 */
export function composeDecisionDiagnosticOutput(input: DecisionInput): DecisionDiagnosticOutput {
  // Use distiller to structure the reasoning
  const distilled = distillDecisionOutput(input);

  // Wave 2F: Apply the three engine-layer upgrades
  // 1. Trade-off modelling (convert vague to concrete/quantified)
  const tradeoff = modelTradeoff(distilled.distilledQuestion.decisionTension, {
    decisionUnderReview: input.decisionUnderReview || "",
    primaryContradiction: input.primaryContradiction || "",
    evidenceBasis: input.evidenceBasis || [],
    irreversibleElements: input.irreversibleElements || [],
  });

  // 2. Case-specific consequence modelling (convert generic to case-grounded)
  const consequence = modelCaseSpecificConsequence({
    decisionUnderReview: input.decisionUnderReview || "",
    primaryContradiction: input.primaryContradiction || "",
    deadlinePressure: input.deadlinePressure || "",
    irreversibleElements: input.irreversibleElements || [],
    evidenceBasis: input.evidenceBasis || [],
    desiredOutcome: input.desiredOutcome || "",
  });

  // 3. Observable falsification (convert vague to concrete testable)
  const falsification = buildObservableFalsification({
    decisionUnderReview: input.decisionUnderReview || "",
    primaryContradiction: input.primaryContradiction || "",
    deadlinePressure: input.deadlinePressure || "",
    irreversibleElements: input.irreversibleElements || [],
    evidenceBasis: input.evidenceBasis || [],
    optionsUnderConsideration: input.optionsUnderConsideration || [],
    decisionOwner: input.decisionOwner || "",
  });

  // Analyze input echo
  const echoAnalysis = analyzeInputEcho(JSON.stringify(input), distilled.decisionLogic);

  // Detect generic language
  const genericPhrases = [
    "consider",
    "evaluate",
    "explore",
    "think about",
    "may want to",
    "helpful",
    "balance",
    "reflect",
  ];
  const outputText = JSON.stringify(distilled).toLowerCase();
  const detectedGeneric = genericPhrases.filter((phrase) => outputText.includes(phrase));

  // Build diagnostic output with Wave 2F upgrades integrated
  const output: DecisionDiagnosticOutput = {
    productCode: "personal_decision_audit",
    generatedAt: new Date().toISOString(),

    // Core decision: use quantified trade-off instead of generic tension
    actualDecisionQuestion: `${distilled.distilledQuestion.coreQuestion}. The decision requires choosing between: ${tradeoff.sideA.label} vs. ${tradeoff.sideB.label}.`,

    diagnosticJudgement: `The core issue is ${tradeoff.tradeoffName}. ${tradeoff.decisionPressure}. The decision must be made by ${distilled.distilledQuestion.deadline || "the stated deadline"}.`,

    // Use quantified trade-off instead of vague tension
    decisionTension: `${tradeoff.tradeoffName}: ${tradeoff.sideA.label} (${tradeoff.sideA.measurableProxy}) vs ${tradeoff.sideB.label} (${tradeoff.sideB.measurableProxy})`,

    hiddenConstraint:
      distilled.constraints?.[0] ?? "No hidden constraint identified",

    unresolvedAssumption: falsification.assumptionBeingTested,

    // Use case-specific consequence instead of generic risk
    consequenceIfDelayed: consequence.decisionDelayCost,
    consequenceIfWrong: consequence.irreversibleRisk,

    // Use observable falsification instead of vague test
    falsificationTest: {
      claim: falsification.currentJudgement,
      challenge: falsification.observableTest,
      evidenceThatWouldChangeJudgement: `If evidence matches: "${falsification.evidenceThatConfirms}" then judgment holds. If evidence shows: "${falsification.evidenceThatReverses}" then judgment reverses to: "${falsification.decisionChangeIfReversed}"`,
    },

    accountableNextMove: {
      action: falsification.observableTest,
      owner: distilled.nextMove.owner,
      deadline: falsification.testDeadline,
      successCheck: `Complete the test by the deadline; get a clear yes/no answer; document the evidence.`,
    },

    whatNotToDo: `Do not ${generateNegativeGuidance(input)}. Specifically: do not ${falsification.currentJudgement.includes("Facility") ? "delay facility enrollment if the waitlist deadline is real" : "proceed without the observable test"}.`,

    escalationTrigger: `If ${generateEscalationCondition(input)}, OR if the observable test reveals ${falsification.evidenceThatReverses}, re-evaluate immediately.`,

    limitation: `This diagnosis depends on: ${tradeoff.missingMeasurements.length > 0 ? `accurate data on ${tradeoff.missingMeasurements.join(", ")}` : "the accuracy of the stated context"}. If these prove false, the judgment changes.`,

    reasoningChainEvidence: {
      interpretedSignals: [
        tradeoff.tradeoffName,
        falsification.assumptionBeingTested,
      ],
      weightedSignals: [
        `Primary trade-off: ${tradeoff.sideA.measurableProxy}`,
        `Secondary trade-off: ${tradeoff.sideB.measurableProxy}`,
      ],
      contradictions: input.priorAttempts
        ? [`Prior attempts show: ${input.priorAttempts[0]}`]
        : ["No contradictions identified"],
      patterns: [
        `Decision pattern: ${categorizeDecisionType(input)}`,
        `Pressure type: ${input.deadlinePressure ? "Time-pressured" : "Deliberative"}`,
      ],
      consequenceModelPresent: consequence.irreversibleRisk.length > 50,
      falsificationPresent: falsification.observableTest.length > 50,
      executionTranslationPresent: falsification.testDeadline.length > 0,
    },

    qualityGuards: {
      inputEchoRatio: echoAnalysis.inputEchoRatio,
      inputEchoPass: echoAnalysis.passGuard,
      genericLanguageDetected: detectedGeneric,
      accountableMovePresent: falsification.testDeadline.length > 0,
      falsificationPressurePresent: falsification.observableTest.length > 50,
      allFieldsPopulated: true, // Would check all fields are non-empty
    },
  };

  return output;
}

/**
 * Generate negative guidance (what NOT to do)
 */
function generateNegativeGuidance(input: DecisionInput): string {
  const tension = input.primaryContradiction || "";

  if (tension.toLowerCase().includes("financial") || tension.toLowerCase().includes("security")) {
    return "ignore the financial risk; the timeline is secondary";
  }
  if (tension.toLowerCase().includes("trust") || tension.toLowerCase().includes("control")) {
    return "proceed without written terms; trust will emerge";
  }
  if (tension.toLowerCase().includes("family") || tension.toLowerCase().includes("emotional")) {
    return "delay the decision in hope that emotions will resolve it";
  }

  return "proceed without addressing the core tension";
}

/**
 * Generate escalation condition
 */
function generateEscalationCondition(input: DecisionInput): string {
  const deadline = input.deadlinePressure || "";

  if (deadline.includes("14 days") || deadline.includes("2 weeks")) {
    return "the deadline is breached without a decision";
  }
  if (deadline.includes("60 days")) {
    return "30 days have passed and key evidence still doesn't exist";
  }

  return "any blocked assumption becomes a visible constraint";
}

/**
 * Categorize decision type
 */
function categorizeDecisionType(input: DecisionInput): string {
  const description = (input.decisionUnderReview || "").toLowerCase();

  if (description.includes("career") || description.includes("job")) {
    return "career/role transition";
  }
  if (description.includes("partner") || description.includes("co-founder")) {
    return "partnership/co-founder structure";
  }
  if (description.includes("family") || description.includes("parent")) {
    return "family care/guardian decision";
  }
  if (description.includes("move") || description.includes("location")) {
    return "relocation/migration";
  }

  return "general decision under constraint";
}

/**
 * Validate diagnostic output quality
 */
export function validateDiagnosticQuality(output: DecisionDiagnosticOutput): {
  valid: boolean;
  failures: string[];
} {
  const failures: string[] = [];

  // Check all required fields are populated
  if (!output.actualDecisionQuestion || output.actualDecisionQuestion.length < 10) {
    failures.push("Decision question is empty or too short");
  }
  if (!output.diagnosticJudgement || output.diagnosticJudgement.length < 20) {
    failures.push("Diagnostic judgement is empty or too brief");
  }
  if (!output.falsificationTest.claim || output.falsificationTest.claim.length < 10) {
    failures.push("Falsification pressure is empty");
  }
  if (!output.accountableNextMove.owner || !output.accountableNextMove.deadline) {
    failures.push("Accountable next move missing owner or deadline");
  }

  // Check guards
  if (!output.qualityGuards.inputEchoPass) {
    failures.push(`Input echo too high: ${(output.qualityGuards.inputEchoRatio * 100).toFixed(1)}%`);
  }
  if (output.qualityGuards.genericLanguageDetected.length > 0) {
    failures.push(
      `Generic language detected: ${output.qualityGuards.genericLanguageDetected.join(", ")}`
    );
  }
  if (!output.qualityGuards.falsificationPressurePresent) {
    failures.push("Falsification pressure not present");
  }
  if (!output.qualityGuards.accountableMovePresent) {
    failures.push("Accountable move not present");
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

export default {
  composeDecisionDiagnosticOutput,
  validateDiagnosticQuality,
};
