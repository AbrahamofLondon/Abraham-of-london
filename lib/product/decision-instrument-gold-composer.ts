/**
 * Decision Instrument — gold-standard composer.
 *
 * Gold condition: the customer should understand the decision better than
 * before and know what to do next. Every decision instrument output carries
 * decision state, primary contradiction, pressure level, evidence basis,
 * cost of delay, strategic risk, next move, and review checkpoint.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";

export type DecisionPressureLevel = "low" | "medium" | "high" | "critical";

export interface DecisionInstrumentGoldInput {
  productCode: string;
  decisionUnderReview: string;
  decisionOwner: string;
  evidenceBasis: string[];
  primaryContradiction: string;
  deadlinePressure: string;
  irreversibleElements: string[];
}

export interface DecisionInstrumentGoldResult {
  productCode: string;
  decisionState: string;
  primaryContradiction: string;
  pressureLevel: DecisionPressureLevel;
  evidenceBasis: string[];
  costOfDelay: string;
  strategicRisk: string;
  nextMove: string;
  reviewCheckpoint: string;
  validation: WaveOneValidationResult;
}

export function composeDecisionInstrumentGoldResult(
  input: DecisionInstrumentGoldInput,
): DecisionInstrumentGoldResult {
  const pressureLevel = derivePressureLevel(input);

  const decisionState = `Decision state: "${input.decisionUnderReview}" is owned by ${input.decisionOwner} and currently rests on ${input.evidenceBasis.length} stated piece${input.evidenceBasis.length === 1 ? "" : "s"} of evidence, with ${input.irreversibleElements.length === 0 ? "no irreversible element yet committed" : `${input.irreversibleElements.length} irreversible element(s) in play: ${input.irreversibleElements.join("; ")}`}.`;
  const primaryContradiction = `Primary contradiction: ${input.primaryContradiction}. Until this contradiction is confronted, additional analysis adds confidence without adding safety.`;
  const costOfDelay = `Cost of delay: under the stated pressure — ${input.deadlinePressure} — each cycle of delay narrows the option set and shifts the decision toward whoever is least exposed to its consequences.`;
  const strategicRisk = `Strategic risk: deciding while the contradiction stands means the chosen path inherits it. The risk is not choosing wrongly once; it is institutionalising ${input.primaryContradiction} into the execution that follows.`;
  const nextMove = `Next move: ${input.decisionOwner} resolves or explicitly accepts the contradiction in writing, then commits the smallest reversible step that tests it against the strongest piece of evidence available — before touching any irreversible element.`;
  const reviewCheckpoint = `Review checkpoint: re-open this instrument when the reversible step has produced evidence, when the deadline pressure changes, or within fourteen days — whichever arrives first.`;

  const universal = decisionInstrumentToUniversalOutput(input.productCode, {
    decisionState,
    primaryContradiction,
    costOfDelay,
    strategicRisk,
    nextMove,
    reviewCheckpoint,
    evidenceBasis: input.evidenceBasis,
    pressureLevel,
  });

  return {
    productCode: input.productCode,
    decisionState,
    primaryContradiction,
    pressureLevel,
    evidenceBasis: input.evidenceBasis,
    costOfDelay,
    strategicRisk,
    nextMove,
    reviewCheckpoint,
    validation: validateWaveOneUniversalOutput(universal),
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

interface DecisionInstrumentSections {
  decisionState: string;
  primaryContradiction: string;
  costOfDelay: string;
  strategicRisk: string;
  nextMove: string;
  reviewCheckpoint: string;
  evidenceBasis: string[];
  pressureLevel: DecisionPressureLevel;
}

function decisionInstrumentToUniversalOutput(
  productCode: string,
  sections: DecisionInstrumentSections,
): WaveOneUniversalOutput {
  return {
    productCode,
    signalOrDiagnosis: sections.decisionState,
    whyThisMatters: `Pressure level is ${sections.pressureLevel}. ${sections.costOfDelay}`,
    evidenceOrReasoningBasis: sections.evidenceBasis.length > 0
      ? sections.evidenceBasis
      : ["No evidence supplied — the instrument records this as the first gap to close."],
    decisionFrictionOrContradiction: sections.primaryContradiction,
    consequenceIfIgnored: sections.strategicRisk,
    oneSpecificNextMove: sections.nextMove,
    whatThisDoesNotProve: "This instrument structures the decision as stated. It does not prove the evidence supplied is complete or accurate, and it cannot see contradictions the owner has not disclosed.",
    escalationTrigger: "Escalate when the next move requires authority above the named owner, irreversible spend, customer or regulatory exposure, or when the review checkpoint passes without movement.",
    optionalDeeperRoute: sections.reviewCheckpoint + " Where the decision warrants live challenge, a Strategy Room session can work the same case with an evidence stack — the instrument's record remains usable on its own.",
  };
}
