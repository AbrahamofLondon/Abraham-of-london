/**
 * Strategy Room Session Report — gold-standard composer.
 *
 * The session report must read as a governed decision record.
 * Gold condition: the report should be useful when reopened one week later.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";

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
}

export interface StrategyRoomSessionGoldReport {
  productCode: "strategy_room" | "strategy_room_extended";
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
  reusableAfterDays: number;
  validation: WaveOneValidationResult;
}

const REUSABLE_AFTER_DAYS = 7;

export function composeStrategyRoomSessionGoldReport(
  input: StrategyRoomSessionGoldInput,
): StrategyRoomSessionGoldReport {
  const sessionContext = `Session ${input.sessionId} held ${input.sessionDate} with ${input.participants.join(", ")}. This record is written to be reopened: every section below states what was established, not what was discussed.`;
  const decisionBeingWorked = `Decision being worked: ${input.decisionBeingWorked}.`;
  const primaryTension = `Primary tension: ${input.primaryTension}. The session treated this as the load-bearing disagreement — resolving anything else first would have produced motion without progress.`;
  const strategicDiagnosis = `Strategic diagnosis: the decision is constrained less by missing information than by the stated tension and the execution constraint below. The evidence stack as it stands supports a governed minimum move but does not yet support full commitment.`;
  const executionConstraint = `Execution constraint: ${input.executionConstraint}. Any move agreed in this session was sized against this constraint, not against ambition.`;
  const minimumViableMove = `Minimum viable move: ${input.agreedMinimumMove} — owned in the session, sized to be reversible, and selected because it produces decision evidence before the checkpoint.`;
  const riskIfIgnored = `Risk if ignored: the tension documented above does not expire. Left unworked, it resurfaces at the next commitment point as delay, re-litigated agreement, or a decision made by deadline rather than by the owner.`;
  const followUpCheckpoint = `Follow-up checkpoint: ${input.checkpointDate}. At the checkpoint, review whether the minimum move produced evidence, whether the tension has moved, and whether escalation is now warranted.`;
  const continuityNote = `Continuity note: reopened a week or more after the session, this record still answers four questions — what decision was being worked, what tension governed it, what move was agreed and by whom, and what the checkpoint must establish. Evidence items are listed verbatim so later readers inherit the basis, not a summary of it.`;

  const universal = strategyRoomToUniversalOutput(input.productCode, {
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
  });

  return {
    productCode: input.productCode,
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
    reusableAfterDays: REUSABLE_AFTER_DAYS,
    validation: validateWaveOneUniversalOutput(universal),
  };
}

interface StrategyRoomSections {
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
}

function strategyRoomToUniversalOutput(
  productCode: StrategyRoomSessionGoldInput["productCode"],
  sections: StrategyRoomSections,
): WaveOneUniversalOutput {
  return {
    productCode,
    signalOrDiagnosis: sections.strategicDiagnosis,
    whyThisMatters: `${sections.decisionBeingWorked} ${sections.sessionContext}`,
    evidenceOrReasoningBasis: sections.evidenceStack,
    decisionFrictionOrContradiction: sections.primaryTension,
    consequenceIfIgnored: sections.riskIfIgnored,
    oneSpecificNextMove: sections.minimumViableMove,
    whatThisDoesNotProve: `This record proves what the session established under the stated constraint — ${sections.executionConstraint} It does not prove the evidence stack is complete, and it does not commit the organisation beyond the minimum viable move.`,
    escalationTrigger: sections.followUpCheckpoint,
    optionalDeeperRoute: sections.continuityNote,
  };
}
