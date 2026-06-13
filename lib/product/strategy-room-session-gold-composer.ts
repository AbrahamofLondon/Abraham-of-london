/**
 * Strategy Room Session Report — gold-standard composer.
 *
 * The session report must read as a governed decision record.
 * Gold conditions: the report should be useful when reopened one week
 * later, and its strategic diagnosis must derive from the judgement
 * engine's classification of the actual case — not from session-report
 * boilerplate.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import { composeCaseDerivedJudgement } from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export interface StrategyRoomSessionGoldInput {
  productCode: "strategy_room" | "strategy_room_extended";
  sessionId: string;
  sessionDate: string;
  participants: string[];
  decisionBeingWorked: string;
  evidenceStack: string[];
  primaryTension: string;
  executionConstraint: string;
  agreedMinimumMove: string;
  checkpointDate: string;
  consequenceOfInaction?: string;
  desiredOutcome?: string;
}

export interface StrategyRoomSessionGoldReport {
  productCode: "strategy_room" | "strategy_room_extended";
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  sessionContext: string;
  decisionBeingWorked: string;
  evidenceStack: string[];
  primaryTension: string;
  strategicDiagnosis: string;
  executionConstraint: string;
  minimumViableMove: string;
  riskIfIgnored: string;
  followUpCheckpoint: string;
  continuityNote: string;
  falsificationChallenge: string;
  executionSequence: string[];
  reusableAfterDays: number;
  validation: WaveOneValidationResult;
  goldEligible: boolean;
}

const REUSABLE_AFTER_DAYS = 7;

export function composeStrategyRoomSessionGoldReport(
  input: StrategyRoomSessionGoldInput,
): StrategyRoomSessionGoldReport {
  const result = composeCaseDerivedJudgement({
    decisionDescription: input.decisionBeingWorked,
    stakeholders: input.participants,
    deadline: input.checkpointDate,
    evidenceAvailable: input.evidenceStack,
    constraint: input.primaryTension,
    desiredOutcome: input.desiredOutcome ?? "",
    priorAttempts: [],
    consequenceOfDelay: input.consequenceOfInaction ?? input.executionConstraint,
    optionsUnderConsideration: [],
  });

  const sessionContext = `Session ${input.sessionId} held ${input.sessionDate} with ${input.participants.join(", ")}. This record states what was established, not what was discussed.`;
  const decisionBeingWorked = `Decision being worked: ${input.decisionBeingWorked}.`;

  if (result.status === "insufficient_pattern_evidence") {
    return insufficientReport(input, sessionContext, decisionBeingWorked, result.missingSignals);
  }

  const { judgement, classification } = result;

  const primaryTension = `${judgement.decisionTension} As named in the room: ${input.primaryTension}.`;
  const strategicDiagnosis = judgement.primaryDiagnosis;
  const executionConstraint = `Execution constraint: ${input.executionConstraint}. Every move agreed in the session was sized against this constraint, not against ambition.`;
  const minimumViableMove = `Agreed in session: ${input.agreedMinimumMove}. Pattern-consistent intervention: ${judgement.recommendedNextMove}`;
  const riskIfIgnored = judgement.commercialConsequence;
  const followUpCheckpoint = `Follow-up checkpoint: ${input.checkpointDate}. At the checkpoint, test the falsification challenge below, review whether the agreed move produced evidence, and decide whether escalation is warranted. ${judgement.escalationTrigger}`;
  const continuityNote = `Continuity note: reopened a week or more later, this record answers what decision was worked, what ${classification.primaryPattern} dynamics governed it, what move was agreed and by whom, and what the checkpoint must establish. Evidence items are listed verbatim so later readers inherit the basis, not a summary of it.`;

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: strategicDiagnosis,
    whyThisMatters: `${decisionBeingWorked} ${sessionContext}`,
    evidenceOrReasoningBasis: [...input.evidenceStack, ...classification.evidenceMatched],
    decisionFrictionOrContradiction: primaryTension,
    consequenceIfIgnored: riskIfIgnored,
    oneSpecificNextMove: minimumViableMove,
    whatThisDoesNotProve: judgement.limitations.join(" "),
    escalationTrigger: followUpCheckpoint,
    optionalDeeperRoute: continuityNote,
  };

  const validation = validateWaveOneUniversalOutput(universal);

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    sessionContext,
    decisionBeingWorked,
    evidenceStack: input.evidenceStack,
    primaryTension,
    strategicDiagnosis,
    executionConstraint,
    minimumViableMove,
    riskIfIgnored,
    followUpCheckpoint,
    continuityNote,
    falsificationChallenge: judgement.falsificationChallenge,
    executionSequence: judgement.executionSequence,
    reusableAfterDays: REUSABLE_AFTER_DAYS,
    validation,
    goldEligible: validation.passes,
  };
}

function insufficientReport(
  input: StrategyRoomSessionGoldInput,
  sessionContext: string,
  decisionBeingWorked: string,
  missingSignals: string[],
): StrategyRoomSessionGoldReport {
  const refusal = `No strategic diagnosis is recorded: the session inputs do not carry enough signal to classify the decision pattern honestly. ${missingSignals.join(" ")}`;
  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: [],
    sessionContext,
    decisionBeingWorked,
    evidenceStack: input.evidenceStack,
    primaryTension: input.primaryTension || "Not classifiable from the session inputs.",
    strategicDiagnosis: refusal,
    executionConstraint: `Execution constraint: ${input.executionConstraint}.`,
    minimumViableMove: `Agreed in session: ${input.agreedMinimumMove}. The record carries the agreement, but no pattern-derived judgement is attached to it.`,
    riskIfIgnored: "A session record without classifiable judgement defends nothing when reopened.",
    followUpCheckpoint: `Follow-up checkpoint: ${input.checkpointDate}. Re-state the decision and tension concretely before the checkpoint.`,
    continuityNote: "Continuity note: this record is intentionally incomplete — judgement was withheld on insufficient evidence rather than fabricated.",
    falsificationChallenge: "Not applicable: no diagnosis was recorded.",
    executionSequence: [],
    reusableAfterDays: REUSABLE_AFTER_DAYS,
    validation: { productCode: input.productCode, passes: false, failures: ["insufficient_pattern_evidence — gold output blocked."] },
    goldEligible: false,
  };
}
