/**
 * Fast Diagnostic Result — gold-standard composer.
 *
 * The fast diagnostic result is the benchmark for free-tier seriousness.
 * Gold condition: a user should be able to act within 10 minutes of
 * reading the result.
 */

import {
  assessTimeValueSurplus,
  validateWaveOneUniversalOutput,
  type WaveOneTimeValueSurplus,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";

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
}

export interface FastDiagnosticGoldResult {
  productCode: "fast_diagnostic";
  dominantDecisionFriction: string;
  whatYourAnswersSuggest: string;
  likelyCostOfIgnoringThis: string;
  minimumViableCorrection: string;
  whatThisResultDoesNotYetProve: string;
  whenToEscalate: string;
  recommendedNextStep: string;
  actionableWithinMinutes: number;
  timeValueSurplus: WaveOneTimeValueSurplus & { passes: boolean };
  validation: WaveOneValidationResult;
}

const ACTIONABLE_WITHIN_MINUTES = 10;

export function composeFastDiagnosticGoldResult(input: FastDiagnosticGoldInput): FastDiagnosticGoldResult {
  const answerBasis = input.answers
    .filter((entry) => entry.answer.trim().length > 0)
    .map((entry) => `You answered "${entry.answer}" to "${entry.question}".`);

  const dominantDecisionFriction = `The dominant decision friction in your situation is ${input.dominantFrictionSignal}, surfaced directly by your answers about ${input.decisionContext}.`;
  const whatYourAnswersSuggest = `Taken together, your answers suggest the decision is stalling on ${input.dominantFrictionSignal} rather than on missing information: the pattern across your responses points at ${input.decisionContext} as the live pressure point.`;
  const likelyCostOfIgnoringThis = `If this friction is left unaddressed, the stake you named — ${input.statedStake} — degrades by default: the decision gets made late, reactively, or by whoever feels the pressure first instead of whoever owns it.`;
  const minimumViableCorrection = `The minimum viable correction is to name a single decision owner for ${input.decisionContext}, write the decision in one sentence, and set a 48-hour checkpoint to confirm whether the friction has moved.`;
  const whatThisResultDoesNotYetProve = "This result reads the friction pattern in your answers only. It does not yet prove root cause, the size of the commercial exposure, or that the correction will hold under organisational pressure — that requires fuller evidence than a fast diagnostic collects.";
  const whenToEscalate = "Escalate beyond this result when the decision involves irreversible spend, more than one accountable owner, customer or regulatory exposure, or when the 48-hour checkpoint shows the friction has not moved.";
  const recommendedNextStep = `Within the next 10 minutes: write the one-sentence decision statement for ${input.decisionContext}, name its owner, and put the 48-hour checkpoint in the owner's calendar. That single act converts this diagnosis into a governed decision.`;

  const universal = fastDiagnosticToUniversalOutput({
    dominantDecisionFriction,
    whatYourAnswersSuggest,
    likelyCostOfIgnoringThis,
    minimumViableCorrection,
    whatThisResultDoesNotYetProve,
    whenToEscalate,
    recommendedNextStep,
    answerBasis,
  });

  return {
    productCode: input.productCode,
    dominantDecisionFriction,
    whatYourAnswersSuggest,
    likelyCostOfIgnoringThis,
    minimumViableCorrection,
    whatThisResultDoesNotYetProve,
    whenToEscalate,
    recommendedNextStep,
    actionableWithinMinutes: ACTIONABLE_WITHIN_MINUTES,
    timeValueSurplus: assessTimeValueSurplus(universal, input.minutesSpentByUser),
    validation: validateWaveOneUniversalOutput(universal),
  };
}

interface FastDiagnosticSections {
  dominantDecisionFriction: string;
  whatYourAnswersSuggest: string;
  likelyCostOfIgnoringThis: string;
  minimumViableCorrection: string;
  whatThisResultDoesNotYetProve: string;
  whenToEscalate: string;
  recommendedNextStep: string;
  answerBasis: string[];
}

function fastDiagnosticToUniversalOutput(sections: FastDiagnosticSections): WaveOneUniversalOutput {
  return {
    productCode: "fast_diagnostic",
    signalOrDiagnosis: sections.dominantDecisionFriction,
    whyThisMatters: sections.whatYourAnswersSuggest,
    evidenceOrReasoningBasis: sections.answerBasis,
    decisionFrictionOrContradiction: sections.dominantDecisionFriction,
    consequenceIfIgnored: sections.likelyCostOfIgnoringThis,
    oneSpecificNextMove: sections.recommendedNextStep,
    whatThisDoesNotProve: sections.whatThisResultDoesNotYetProve,
    escalationTrigger: sections.whenToEscalate,
    optionalDeeperRoute: "If the checkpoint shows the friction holding, a Personal Decision Audit or Strategy Room session can take the same decision into governed, evidence-backed review — the fast result stands on its own either way.",
  };
}
