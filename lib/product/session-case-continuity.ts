/**
 * Legacy compatibility shim.
 *
 * New code should import from save-case-continuity.ts. These exports remain so
 * already-landed handoff code can keep working while the public contract is
 * normalized around "save case" terminology.
 */

export {
  SAVE_CASE_CARRY_FORWARD_KEY as SESSION_CASE_CARRY_FORWARD_KEY,
  buildAssessmentResultSaveCasePayload,
  buildBoardSummarySaveCasePayload as buildBoardSummaryCarryForwardPayload,
  buildDecisionDelaySaveCasePayload as buildDelayCalculatorCarryForwardPayload,
  buildFastDiagnosticSaveCasePayload as buildFastDiagnosticCarryForwardPayload,
  clearPendingSaveCase as clearPendingSessionCase,
  readPendingSaveCase as readPendingSessionCase,
  storePendingSaveCase as storePendingSessionCase,
} from "./save-case-continuity";

export type {
  SaveCasePayload as SessionCaseCarryForwardPayload,
  SaveCaseSource as SessionCaseCarryForwardSource,
} from "./save-case-continuity";
