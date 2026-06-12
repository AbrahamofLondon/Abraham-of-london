/**
 * Free/Public Signal — gold-standard composer.
 *
 * Every free/public signal must give the user one clear signal, one useful
 * interpretation, one practical next action, one honest limitation, and one
 * escalation condition. A free result is blocked if it is generic, mostly
 * promotional, lacks a specific next action, or could be produced by a
 * normal AI prompt without the product's evidence basis.
 */

import {
  assessTimeValueSurplus,
  validateWaveOneUniversalOutput,
  type WaveOneTimeValueSurplus,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";

export interface FreeSignalGoldInput {
  productCode: string;
  observedSignal: string;
  signalSource: string;
  customerSituation: string;
  whatItPointsAt: string;
  minutesAskedOfUser: number;
}

export interface FreeSignalGoldResult {
  productCode: string;
  oneClearSignal: string;
  oneUsefulInterpretation: string;
  onePracticalNextAction: string;
  oneHonestLimitation: string;
  oneEscalationCondition: string;
  timeValueSurplus: WaveOneTimeValueSurplus & { passes: boolean };
  validation: WaveOneValidationResult;
  releaseBlocked: boolean;
  blockReasons: string[];
}

export function composeFreeSignalGoldResult(input: FreeSignalGoldInput): FreeSignalGoldResult {
  const oneClearSignal = `Signal: ${input.observedSignal}, observed in ${input.signalSource} against your situation — ${input.customerSituation}.`;
  const oneUsefulInterpretation = `What this points at: ${input.whatItPointsAt}. The signal matters because it appears where your situation and the evidence intersect, not as a general industry observation.`;
  const onePracticalNextAction = `Practical next action: test the signal against your own case this week — take the single decision it touches, write down who owns it and what evidence would confirm or kill the signal, and review that note within seven days.`;
  const oneHonestLimitation = `Honest limitation: this signal is drawn from ${input.signalSource} and your stated situation only. It does not prove causation, scale, or that your case matches the underlying pattern — it earns attention, not conviction.`;
  const oneEscalationCondition = "Escalation condition: if the signal touches an irreversible commitment, live customer exposure, or a decision already under deadline pressure, move it from observation into a governed review before acting on it.";

  const universal = freeSignalToUniversalOutput(input.productCode, {
    oneClearSignal,
    oneUsefulInterpretation,
    onePracticalNextAction,
    oneHonestLimitation,
    oneEscalationCondition,
    evidence: [
      `Observed signal: ${input.observedSignal}.`,
      `Source: ${input.signalSource}.`,
      `Customer situation it was read against: ${input.customerSituation}.`,
    ],
  });

  const validation = validateWaveOneUniversalOutput(universal);
  const timeValueSurplus = assessTimeValueSurplus(universal, input.minutesAskedOfUser);
  const blockReasons = freeSignalBlockReasons(input, validation.failures, timeValueSurplus.passes);

  return {
    productCode: input.productCode,
    oneClearSignal,
    oneUsefulInterpretation,
    onePracticalNextAction,
    oneHonestLimitation,
    oneEscalationCondition,
    timeValueSurplus,
    validation,
    releaseBlocked: blockReasons.length > 0,
    blockReasons,
  };
}

/**
 * Block conditions for free signals: generic output, promotional output,
 * no specific next action, no clear customer win, or time cost exceeding
 * value returned.
 */
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

interface FreeSignalSections {
  oneClearSignal: string;
  oneUsefulInterpretation: string;
  onePracticalNextAction: string;
  oneHonestLimitation: string;
  oneEscalationCondition: string;
  evidence: string[];
}

function freeSignalToUniversalOutput(productCode: string, sections: FreeSignalSections): WaveOneUniversalOutput {
  return {
    productCode,
    signalOrDiagnosis: sections.oneClearSignal,
    whyThisMatters: sections.oneUsefulInterpretation,
    evidenceOrReasoningBasis: sections.evidence,
    decisionFrictionOrContradiction: sections.oneUsefulInterpretation,
    consequenceIfIgnored: "If the signal is ignored, the decision it touches is made without the one piece of evidence that flagged it — which is how avoidable surprises become expensive ones.",
    oneSpecificNextMove: sections.onePracticalNextAction,
    whatThisDoesNotProve: sections.oneHonestLimitation,
    escalationTrigger: sections.oneEscalationCondition,
    optionalDeeperRoute: "Where the signal survives your seven-day review, the same case can continue into a governed diagnostic — the free signal is complete on its own and carries no obligation.",
  };
}
