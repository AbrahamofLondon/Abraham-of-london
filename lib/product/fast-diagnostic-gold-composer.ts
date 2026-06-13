/**
 * Fast Diagnostic Result — gold-standard composer.
 *
 * The fast diagnostic result is the benchmark for free-tier seriousness.
 * Gold conditions: a user should be able to act within 10 minutes of
 * reading the result, and materially different cases must produce
 * materially different judgement. All judgement derives from the
 * judgement engine's pattern classification of the actual case; if the
 * input cannot support classification, no judgement is issued.
 */

import {
  assessTimeValueSurplus,
  validateWaveOneUniversalOutput,
  type WaveOneTimeValueSurplus,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import {
  composeCaseDerivedJudgement,
} from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export interface FastDiagnosticAnswer {
  question: string;
  answer: string;
}

export interface FastDiagnosticGoldInput {
  productCode: "fast_diagnostic";
  answers: FastDiagnosticAnswer[];
  dominantFrictionSignal: string;
  decisionContext: string;
  statedStake: string;
  minutesSpentByUser: number;
  stakeholders?: string[];
  deadline?: string;
  desiredOutcome?: string;
  priorAttempts?: string[];
  optionsUnderConsideration?: string[];
}

export interface FastDiagnosticGoldResult {
  productCode: "fast_diagnostic";
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  dominantDecisionFriction: string;
  whatYourAnswersSuggest: string;
  likelyCostOfIgnoringThis: string;
  minimumViableCorrection: string;
  whatThisResultDoesNotYetProve: string;
  whenToEscalate: string;
  recommendedNextStep: string;
  falsificationChallenge: string;
  executionSequence: string[];
  actionableWithinMinutes: number;
  timeValueSurplus: WaveOneTimeValueSurplus & { passes: boolean };
  validation: WaveOneValidationResult;
  goldEligible: boolean;
}

const ACTIONABLE_WITHIN_MINUTES = 10;

export function composeFastDiagnosticGoldResult(input: FastDiagnosticGoldInput): FastDiagnosticGoldResult {
  const result = composeCaseDerivedJudgement({
    decisionDescription: `${input.decisionContext} — ${input.dominantFrictionSignal}`,
    stakeholders: input.stakeholders ?? [],
    deadline: input.deadline ?? "",
    evidenceAvailable: input.answers
      .filter((entry) => entry.answer.trim().length > 0)
      .map((entry) => `${entry.question}: ${entry.answer}`),
    constraint: input.dominantFrictionSignal,
    desiredOutcome: input.desiredOutcome ?? "",
    priorAttempts: input.priorAttempts ?? [],
    consequenceOfDelay: input.statedStake,
    optionsUnderConsideration: input.optionsUnderConsideration ?? [],
  });

  if (result.status === "insufficient_pattern_evidence") {
    return insufficientResult(input, result.missingSignals);
  }

  const { judgement, classification } = result;

  const dominantDecisionFriction = judgement.primaryDiagnosis;
  const whatYourAnswersSuggest = `${judgement.decisionTension} This reading rests on ${classification.evidenceMatched.length} signal${classification.evidenceMatched.length === 1 ? "" : "s"} in your answers, not on a generic playbook.`;
  const likelyCostOfIgnoringThis = judgement.commercialConsequence;
  const minimumViableCorrection = judgement.recommendedNextMove;
  const whatThisResultDoesNotYetProve = judgement.limitations.join(" ");
  const whenToEscalate = judgement.escalationTrigger;
  const recommendedNextStep = `Within the next 10 minutes, start the first step: ${judgement.executionSequence[0]} Then continue: ${judgement.executionSequence[1]}`;

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: dominantDecisionFriction,
    whyThisMatters: whatYourAnswersSuggest,
    evidenceOrReasoningBasis: [
      ...input.answers.filter((entry) => entry.answer.trim().length > 0).map((entry) => `You answered "${entry.answer}" to "${entry.question}".`),
      ...classification.evidenceMatched,
    ],
    decisionFrictionOrContradiction: judgement.decisionTension,
    consequenceIfIgnored: likelyCostOfIgnoringThis,
    oneSpecificNextMove: recommendedNextStep,
    whatThisDoesNotProve: whatThisResultDoesNotYetProve,
    escalationTrigger: whenToEscalate,
    optionalDeeperRoute: `Falsification check before any deeper engagement: ${judgement.falsificationChallenge} If the diagnosis survives that test and the case warrants it, a Personal Decision Audit or Strategy Room session can take the same decision into governed review — this result stands on its own either way.`,
  };

  const validation = validateWaveOneUniversalOutput(universal);

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    dominantDecisionFriction,
    whatYourAnswersSuggest,
    likelyCostOfIgnoringThis,
    minimumViableCorrection,
    whatThisResultDoesNotYetProve,
    whenToEscalate,
    recommendedNextStep,
    falsificationChallenge: judgement.falsificationChallenge,
    executionSequence: judgement.executionSequence,
    actionableWithinMinutes: ACTIONABLE_WITHIN_MINUTES,
    timeValueSurplus: assessTimeValueSurplus(universal, input.minutesSpentByUser),
    validation,
    goldEligible: validation.passes,
  };
}

function insufficientResult(
  input: FastDiagnosticGoldInput,
  missingSignals: string[],
): FastDiagnosticGoldResult {
  const refusal = `No judgement is issued on this input: the answers provided do not carry enough signal to classify the decision pattern honestly. ${missingSignals.join(" ")}`;
  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: [],
    dominantDecisionFriction: refusal,
    whatYourAnswersSuggest: "Issuing a confident-sounding diagnosis on insufficient evidence would be theatre, not judgement — this product refuses to do that.",
    likelyCostOfIgnoringThis: "Acting on an unfounded diagnosis costs more than acting on none.",
    minimumViableCorrection: "Re-run the diagnostic with the decision described concretely: who is blocked, what contradicts what, and what expires when.",
    whatThisResultDoesNotYetProve: refusal,
    whenToEscalate: "Not applicable until a classifiable case is supplied.",
    recommendedNextStep: "Add the missing case detail listed above and re-run the diagnostic; no judgement is issued on insufficient evidence.",
    falsificationChallenge: "Not applicable: no diagnosis was made.",
    executionSequence: [],
    actionableWithinMinutes: ACTIONABLE_WITHIN_MINUTES,
    timeValueSurplus: {
      minutesAskedOfUser: input.minutesSpentByUser,
      clarityReturned: refusal,
      nextMoveReturned: "Supply the missing case detail and re-run.",
      surplusJustification: "The honest refusal protects the user's trust; no time-value surplus is claimed.",
      passes: false,
    },
    validation: { productCode: input.productCode, passes: false, failures: ["insufficient_pattern_evidence — gold output blocked."] },
    goldEligible: false,
  };
}
