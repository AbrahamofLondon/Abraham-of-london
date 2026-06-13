/**
 * Decision Instrument — gold-standard composer.
 *
 * Gold condition: the customer should understand the decision better than
 * before and know what to do next. Every section derives from the
 * judgement engine's pattern classification of the actual case: decision
 * state, contradiction, pressure, cost of delay, strategic risk, next
 * move, and checkpoint all change with the pattern, not just the wording.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import { composeCaseDerivedJudgement } from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export type DecisionPressureLevel = "low" | "medium" | "high" | "critical";

export interface DecisionInstrumentGoldInput {
  productCode: string;
  decisionUnderReview: string;
  decisionOwner: string;
  evidenceBasis: string[];
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
  desiredOutcome?: string;
  priorAttempts?: string[];
  optionsUnderConsideration?: string[];
}

export interface DecisionInstrumentGoldResult {
  productCode: string;
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  decisionState: string;
  primaryContradiction: string;
  pressureLevel: DecisionPressureLevel;
  evidenceBasis: string[];
  costOfDelay: string;
  strategicRisk: string;
  nextMove: string;
  reviewCheckpoint: string;
  falsificationChallenge: string;
  executionSequence: string[];
  validation: WaveOneValidationResult;
  goldEligible: boolean;
}

export function composeDecisionInstrumentGoldResult(
  input: DecisionInstrumentGoldInput,
): DecisionInstrumentGoldResult {
  const pressureLevel = derivePressureLevel(input);
  const result = composeCaseDerivedJudgement({
    decisionDescription: input.decisionUnderReview,
    stakeholders: [input.decisionOwner],
    deadline: input.deadlinePressure,
    evidenceAvailable: input.evidenceBasis,
    constraint: input.primaryContradiction,
    desiredOutcome: input.desiredOutcome ?? "",
    priorAttempts: input.priorAttempts ?? [],
    consequenceOfDelay: input.irreversibleElements.length > 0
      ? `irreversible exposure: ${input.irreversibleElements.join("; ")}`
      : input.deadlinePressure,
    optionsUnderConsideration: input.optionsUnderConsideration ?? [],
  });

  if (result.status === "insufficient_pattern_evidence") {
    return insufficientResult(input, pressureLevel, result.missingSignals);
  }

  const { judgement, classification } = result;

  const decisionState = `${judgement.primaryDiagnosis} The instrument records ${input.evidenceBasis.length} evidence item${input.evidenceBasis.length === 1 ? "" : "s"} and ${input.irreversibleElements.length === 0 ? "no irreversible element yet committed" : `${input.irreversibleElements.length} irreversible element(s): ${input.irreversibleElements.join("; ")}`}.`;
  const primaryContradiction = `${judgement.decisionTension} As stated by the owner: ${input.primaryContradiction}.`;
  const costOfDelay = judgement.commercialConsequence;
  const strategicRisk = `Deciding while the ${classification.primaryPattern} pattern stands unaddressed institutionalises it into execution. ${judgement.falsificationChallenge}`;
  const nextMove = judgement.recommendedNextMove;
  const reviewCheckpoint = `${judgement.executionSequence[judgement.executionSequence.length - 1]} Re-open this instrument when that step completes, when the pressure level changes, or within fourteen days — whichever arrives first.`;

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: decisionState,
    whyThisMatters: `Pressure level is ${pressureLevel}. ${costOfDelay}`,
    evidenceOrReasoningBasis: input.evidenceBasis.length > 0
      ? [...input.evidenceBasis, ...classification.evidenceMatched]
      : ["No evidence supplied — the instrument records this as the first gap to close.", ...classification.evidenceMatched],
    decisionFrictionOrContradiction: primaryContradiction,
    consequenceIfIgnored: strategicRisk,
    oneSpecificNextMove: nextMove,
    whatThisDoesNotProve: judgement.limitations.join(" "),
    escalationTrigger: judgement.escalationTrigger,
    optionalDeeperRoute: `${reviewCheckpoint} Where the decision warrants live challenge, a Strategy Room session can work the same case with an evidence stack — the instrument's record remains usable on its own.`,
  };

  const validation = validateWaveOneUniversalOutput(universal);

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    decisionState,
    primaryContradiction,
    pressureLevel,
    evidenceBasis: input.evidenceBasis,
    costOfDelay,
    strategicRisk,
    nextMove,
    reviewCheckpoint,
    falsificationChallenge: judgement.falsificationChallenge,
    executionSequence: judgement.executionSequence,
    validation,
    goldEligible: validation.passes,
  };
}

function derivePressureLevel(input: DecisionInstrumentGoldInput): DecisionPressureLevel {
  const irreversible = input.irreversibleElements.length > 0;
  const deadlined = input.deadlinePressure.trim().length > 0 && !/none|no deadline/i.test(input.deadlinePressure);
  if (irreversible && deadlined) return "critical";
  if (irreversible || deadlined) return "high";
  if (input.evidenceBasis.length === 0) return "medium";
  return "low";
}

function insufficientResult(
  input: DecisionInstrumentGoldInput,
  pressureLevel: DecisionPressureLevel,
  missingSignals: string[],
): DecisionInstrumentGoldResult {
  const refusal = `No judgement is issued: the case as stated does not carry enough signal to classify the decision pattern honestly. ${missingSignals.join(" ")}`;
  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: [],
    decisionState: refusal,
    primaryContradiction: input.primaryContradiction || "Not classifiable from the input supplied.",
    pressureLevel,
    evidenceBasis: input.evidenceBasis,
    costOfDelay: "Acting on an unfounded reading costs more than acting on none.",
    strategicRisk: refusal,
    nextMove: "Restate the decision concretely — who is blocked, what contradicts what, what expires when — and re-run the instrument.",
    reviewCheckpoint: "Not applicable until a classifiable case is supplied.",
    falsificationChallenge: "Not applicable: no diagnosis was made.",
    executionSequence: [],
    validation: { productCode: input.productCode, passes: false, failures: ["insufficient_pattern_evidence — gold output blocked."] },
    goldEligible: false,
  };
}
