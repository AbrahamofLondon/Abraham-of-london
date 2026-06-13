/**
 * Free/Public Signal — gold-standard composer.
 *
 * Every free/public signal must give the user one clear signal, one useful
 * interpretation, one practical next action, one honest limitation, and one
 * escalation condition — all derived from the judgement engine's pattern
 * classification of the actual case, never from a shared template. A free
 * result is blocked if it is generic, promotional, lacks a case-specific
 * next action, or rests on insufficient pattern evidence.
 */

import {
  assessTimeValueSurplus,
  validateWaveOneUniversalOutput,
  type WaveOneTimeValueSurplus,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import { composeCaseDerivedJudgement } from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export interface FreeSignalGoldInput {
  productCode: string;
  observedSignal: string;
  signalSource: string;
  customerSituation: string;
  whatItPointsAt: string;
  minutesAskedOfUser: number;
  consequenceOfInaction?: string;
  stakeholders?: string[];
  deadline?: string;
  desiredOutcome?: string;
}

export interface FreeSignalGoldResult {
  productCode: string;
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  oneClearSignal: string;
  oneUsefulInterpretation: string;
  onePracticalNextAction: string;
  oneHonestLimitation: string;
  oneEscalationCondition: string;
  caseDerivedConsequence: string;
  falsificationChallenge: string;
  executionSequence: string[];
  timeValueSurplus: WaveOneTimeValueSurplus & { passes: boolean };
  validation: WaveOneValidationResult;
  releaseBlocked: boolean;
  blockReasons: string[];
}

export function composeFreeSignalGoldResult(input: FreeSignalGoldInput): FreeSignalGoldResult {
  const result = composeCaseDerivedJudgement({
    decisionDescription: `${input.customerSituation}: ${input.observedSignal}`,
    stakeholders: input.stakeholders ?? [],
    deadline: input.deadline ?? "",
    evidenceAvailable: [input.observedSignal, `Source: ${input.signalSource}`],
    constraint: input.whatItPointsAt,
    desiredOutcome: input.desiredOutcome ?? "",
    priorAttempts: [],
    consequenceOfDelay: input.consequenceOfInaction ?? "",
    optionsUnderConsideration: [],
  });

  if (result.status === "insufficient_pattern_evidence") {
    return insufficientResult(input, result.missingSignals);
  }

  const { judgement, classification } = result;

  const oneClearSignal = `Signal: ${input.observedSignal} — observed in ${input.signalSource}, read against your situation: ${input.customerSituation}.`;
  const oneUsefulInterpretation = judgement.primaryDiagnosis;
  const onePracticalNextAction = `${judgement.executionSequence[0]} ${judgement.recommendedNextMove}`;
  const oneHonestLimitation = judgement.limitations.join(" ");
  const oneEscalationCondition = judgement.escalationTrigger;
  const caseDerivedConsequence = judgement.commercialConsequence;

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: oneClearSignal,
    whyThisMatters: oneUsefulInterpretation,
    evidenceOrReasoningBasis: [
      `Observed signal: ${input.observedSignal}.`,
      `Source: ${input.signalSource}.`,
      ...classification.evidenceMatched,
    ],
    decisionFrictionOrContradiction: judgement.decisionTension,
    consequenceIfIgnored: caseDerivedConsequence,
    oneSpecificNextMove: onePracticalNextAction,
    whatThisDoesNotProve: oneHonestLimitation,
    escalationTrigger: oneEscalationCondition,
    optionalDeeperRoute: `Falsification check first: ${judgement.falsificationChallenge} Where the signal survives that test, the same case can continue into a governed diagnostic — this free result is complete on its own and carries no obligation.`,
  };

  const validation = validateWaveOneUniversalOutput(universal);
  const timeValueSurplus = assessTimeValueSurplus(universal, input.minutesAskedOfUser);
  const blockReasons = freeSignalBlockReasons(input, validation.failures, timeValueSurplus.passes);

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    oneClearSignal,
    oneUsefulInterpretation,
    onePracticalNextAction,
    oneHonestLimitation,
    oneEscalationCondition,
    caseDerivedConsequence,
    falsificationChallenge: judgement.falsificationChallenge,
    executionSequence: judgement.executionSequence,
    timeValueSurplus,
    validation,
    releaseBlocked: blockReasons.length > 0,
    blockReasons,
  };
}

function freeSignalBlockReasons(
  input: FreeSignalGoldInput,
  validationFailures: string[],
  timeValuePassed: boolean,
): string[] {
  const reasons = [...validationFailures];
  if (input.observedSignal.trim().length < 16) {
    reasons.push("Signal is too generic — it must name something a normal AI prompt without this evidence could not.");
  }
  if (input.customerSituation.trim().length < 16) {
    reasons.push("No customer situation supplied — the result cannot demonstrate a clear customer win.");
  }
  if (!timeValuePassed) {
    reasons.push("Time-value surplus failed — the result takes more time than the value it returns.");
  }
  return reasons;
}

function insufficientResult(input: FreeSignalGoldInput, missingSignals: string[]): FreeSignalGoldResult {
  const refusal = `No interpretation is issued: the supplied signal and situation do not carry enough evidence to classify the decision pattern honestly. ${missingSignals.join(" ")}`;
  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: [],
    oneClearSignal: `Signal received: ${input.observedSignal || "(none)"} — insufficient to interpret responsibly.`,
    oneUsefulInterpretation: refusal,
    onePracticalNextAction: "Describe the situation concretely — who is blocked, what contradicts what, what expires when — and re-run the signal.",
    oneHonestLimitation: refusal,
    oneEscalationCondition: "Not applicable until a classifiable case is supplied.",
    caseDerivedConsequence: "Acting on an uninterpretable signal costs more than acting on none.",
    falsificationChallenge: "Not applicable: no interpretation was made.",
    executionSequence: [],
    timeValueSurplus: {
      minutesAskedOfUser: input.minutesAskedOfUser,
      clarityReturned: refusal,
      nextMoveReturned: "Supply the missing case detail and re-run.",
      surplusJustification: "The honest refusal protects the user's trust; no time-value surplus is claimed.",
      passes: false,
    },
    validation: { productCode: input.productCode, passes: false, failures: ["insufficient_pattern_evidence — gold output blocked."] },
    releaseBlocked: true,
    blockReasons: ["insufficient_pattern_evidence — the input cannot support case-derived judgement."],
  };
}
