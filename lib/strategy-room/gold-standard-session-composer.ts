export interface StrategyRoomSessionInput {
  sessionId: string;
  intakeSummary: string;
  evidenceStack: string[];
  decisionTension: string;
  executionConstraint: string;
}

export interface StrategyRoomSessionOutput {
  sessionId: string;
  intakeSummary: string;
  decisionTension: string;
  evidenceStack: string[];
  strategicDiagnosis: string;
  executionConstraint: string;
  minimumViableMove: string;
  riskIfIgnored: string;
  followUpDecisionCheckpoint: string;
}

export function composeGoldStandardStrategyRoomSession(
  input: StrategyRoomSessionInput,
): StrategyRoomSessionOutput {
  return {
    sessionId: input.sessionId,
    intakeSummary: input.intakeSummary,
    decisionTension: input.decisionTension,
    evidenceStack: input.evidenceStack,
    strategicDiagnosis: "The room is not gold-standard until the tension, evidence, constraint, and next checkpoint are all explicit.",
    executionConstraint: input.executionConstraint,
    minimumViableMove: "Run the smallest governed move that produces decision evidence within the next operating cycle.",
    riskIfIgnored: "The same constraint will reappear later as delay, misalignment, or weak commitment.",
    followUpDecisionCheckpoint: "Review evidence movement, owner commitment, and escalation need before widening the decision.",
  };
}
