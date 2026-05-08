/**
 * lib/strategy-room/counsel-trigger.ts — Counsel escalation trigger model.
 *
 * The Strategy Room is a mostly automated governed execution environment.
 * Human counsel enters only when governance thresholds are exceeded.
 * Counsel is an escalation privilege, not a sales CTA.
 *
 * This module evaluates whether a case requires human counsel based on
 * available evidence, authority, consequence, execution state, and AI terrain.
 */

import type { StrategyRoomState } from "@/lib/strategy-room/room-state-contract";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type CounselTriggerReason =
  | "HIGH_FINANCIAL_EXPOSURE"
  | "CONTESTED_AUTHORITY"
  | "LEGAL_OR_REGULATORY_SENSITIVITY"
  | "REPUTATIONAL_RISK"
  | "BOARD_CONFLICT"
  | "REPEATED_EXECUTION_FAILURE"
  | "AMBIGUOUS_EVIDENCE"
  | "MULTI_STAKEHOLDER_DEADLOCK"
  | "HIGH_AI_TERRAIN_EXPOSURE"
  | "LOW_SYSTEM_CONFIDENCE"
  | "OUTCOME_DIVERGENCE"
  | "HUMAN_REVIEW_REQUESTED";

export type CounselSystemAction =
  | "CONTINUE_AUTOMATED_GOVERNANCE"
  | "WARN_AND_CONTINUE"
  | "PAUSE_EXECUTION"
  | "REQUIRE_COUNSEL_REVIEW"
  | "ESCALATE_TO_RETAINER_REVIEW";

export type CounselTriggerResult = {
  required: boolean;
  recommended: boolean;
  reasons: CounselTriggerReason[];
  explanation: string;
  systemAction: CounselSystemAction;
  repairActions: string[];
};

export type CounselStatus =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "PAUSED_PENDING_REVIEW"
  | "ESCALATED_TO_RETAINER";

// ─────────────────────────────────────────────────────────────────────────────
// THRESHOLDS
// ─────────────────────────────────────────────────────────────────────────────

const CONSEQUENCE_THRESHOLD_WARN = 75;
const CONSEQUENCE_THRESHOLD_REQUIRE = 90;
const EXECUTION_FAILURE_THRESHOLD = 3;

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate whether a Strategy Room case requires human counsel.
 * Uses available room state — does not invent missing data.
 */
export function evaluateCounselTrigger(
  state: StrategyRoomState,
): CounselTriggerResult {
  const reasons: CounselTriggerReason[] = [];
  const repairActions: string[] = [];

  // ── Consequence exposure ──
  if (state.consequence?.score != null) {
    if (state.consequence.score >= CONSEQUENCE_THRESHOLD_REQUIRE) {
      reasons.push("HIGH_FINANCIAL_EXPOSURE");
      repairActions.push("Consequence exposure exceeds automated governance threshold. Counsel review required before execution proceeds.");
    }
  }

  // ── Contested authority ──
  if (state.authorityStatus === "contested" || state.authorityStatus === "unclear") {
    reasons.push("CONTESTED_AUTHORITY");
    repairActions.push("Authority is contested or unclear. Counsel may be required to resolve the authority question before execution.");
  }

  // ── Escalation triggers ──
  if (state.escalation?.triggers) {
    for (const trigger of state.escalation.triggers) {
      const type = trigger.triggerType.toLowerCase();
      if (type.includes("legal") || type.includes("regulatory")) {
        reasons.push("LEGAL_OR_REGULATORY_SENSITIVITY");
        repairActions.push("Legal or regulatory sensitivity detected. Counsel review recommended.");
      }
      if (type.includes("reputation") || type.includes("public")) {
        reasons.push("REPUTATIONAL_RISK");
      }
      if (type.includes("board") || type.includes("governance")) {
        reasons.push("BOARD_CONFLICT");
        repairActions.push("Board or governance conflict detected. Counsel review may be required.");
      }
      if (type.includes("stakeholder") || type.includes("deadlock")) {
        reasons.push("MULTI_STAKEHOLDER_DEADLOCK");
      }
    }
  }

  // ── Execution failure ──
  const blockedActions = state.execution.requiredActions.filter((a) => a.status === "blocked");
  if (blockedActions.length >= EXECUTION_FAILURE_THRESHOLD) {
    reasons.push("REPEATED_EXECUTION_FAILURE");
    repairActions.push("Multiple execution actions are blocked. This pattern suggests structural resistance that may require counsel.");
  }

  // ── Avoidance pattern ──
  if (state.avoidance?.count != null && state.avoidance.count >= 2) {
    reasons.push("REPEATED_EXECUTION_FAILURE");
    repairActions.push("Repeated avoidance pattern detected. Counsel review may help identify the structural root.");
  }

  // ── Ambiguous evidence ──
  if (state.evidenceTier === "single_source" || state.evidenceTier === "insufficient") {
    reasons.push("AMBIGUOUS_EVIDENCE");
    repairActions.push("Evidence tier is below multi-source. Strengthen evidence before critical execution decisions.");
  }

  // ── Retainer eligibility ──
  if (state.retainer?.eligible) {
    // If already retainer-eligible, counsel may be part of retainer
  }

  // ── Deduplicate reasons ──
  const uniqueReasons = [...new Set(reasons)];

  // ── Derive system action ──
  const systemAction = deriveSystemAction(uniqueReasons, state);
  const required = systemAction === "REQUIRE_COUNSEL_REVIEW" || systemAction === "PAUSE_EXECUTION" || systemAction === "ESCALATE_TO_RETAINER_REVIEW";
  const recommended = systemAction === "WARN_AND_CONTINUE" || required;

  return {
    required,
    recommended,
    reasons: uniqueReasons,
    explanation: buildExplanation(uniqueReasons, systemAction),
    systemAction,
    repairActions: [...new Set(repairActions)],
  };
}

function deriveSystemAction(
  reasons: CounselTriggerReason[],
  state: StrategyRoomState,
): CounselSystemAction {
  if (reasons.length === 0) return "CONTINUE_AUTOMATED_GOVERNANCE";

  // Hard require: high exposure + contested authority
  if (reasons.includes("HIGH_FINANCIAL_EXPOSURE") && reasons.includes("CONTESTED_AUTHORITY")) {
    return "REQUIRE_COUNSEL_REVIEW";
  }

  // Hard require: legal/regulatory
  if (reasons.includes("LEGAL_OR_REGULATORY_SENSITIVITY")) {
    return "PAUSE_EXECUTION";
  }

  // Retainer escalation: repeated failure pattern
  if (reasons.includes("REPEATED_EXECUTION_FAILURE") && state.retainer?.eligible) {
    return "ESCALATE_TO_RETAINER_REVIEW";
  }

  // Require: board conflict or stakeholder deadlock
  if (reasons.includes("BOARD_CONFLICT") || reasons.includes("MULTI_STAKEHOLDER_DEADLOCK")) {
    return "REQUIRE_COUNSEL_REVIEW";
  }

  // Warn: single elevated trigger
  if (reasons.length >= 1) {
    return "WARN_AND_CONTINUE";
  }

  return "CONTINUE_AUTOMATED_GOVERNANCE";
}

function buildExplanation(
  reasons: CounselTriggerReason[],
  action: CounselSystemAction,
): string {
  if (reasons.length === 0) {
    return "Counsel review is not currently required. The system has sufficient evidence, authority, and execution confidence to continue automated governance.";
  }

  const reasonLabels = reasons.map(reasonToLabel);

  switch (action) {
    case "REQUIRE_COUNSEL_REVIEW":
      return `Counsel review is required. ${reasonLabels.join(". ")}. Execution is paused until the governance question is resolved.`;
    case "PAUSE_EXECUTION":
      return `Execution is paused. ${reasonLabels.join(". ")}. Counsel review must be completed before the case proceeds.`;
    case "ESCALATE_TO_RETAINER_REVIEW":
      return `This case exceeds automated governance threshold. ${reasonLabels.join(". ")}. Retainer-level oversight is recommended.`;
    case "WARN_AND_CONTINUE":
      return `Automated governance continues with advisory. ${reasonLabels.join(". ")}. Counsel review is available if needed.`;
    default:
      return "Automated governance continues.";
  }
}

function reasonToLabel(reason: CounselTriggerReason): string {
  switch (reason) {
    case "HIGH_FINANCIAL_EXPOSURE": return "Consequence exposure exceeds automated governance threshold";
    case "CONTESTED_AUTHORITY": return "Authority is contested and cannot be resolved programmatically";
    case "LEGAL_OR_REGULATORY_SENSITIVITY": return "Legal or regulatory sensitivity detected";
    case "REPUTATIONAL_RISK": return "Reputational risk identified";
    case "BOARD_CONFLICT": return "Board or governance conflict detected";
    case "REPEATED_EXECUTION_FAILURE": return "Repeated execution failure or avoidance pattern";
    case "AMBIGUOUS_EVIDENCE": return "Evidence tier is below the threshold for high-confidence automated governance";
    case "MULTI_STAKEHOLDER_DEADLOCK": return "Multi-stakeholder deadlock prevents unilateral execution";
    case "HIGH_AI_TERRAIN_EXPOSURE": return "AI terrain exposure is high";
    case "LOW_SYSTEM_CONFIDENCE": return "System confidence is below threshold";
    case "OUTCOME_DIVERGENCE": return "Outcome diverges from prediction";
    case "HUMAN_REVIEW_REQUESTED": return "Human review has been explicitly requested";
  }
}

/**
 * Derive CounselStatus for room state contract.
 */
export function deriveCounselStatus(trigger: CounselTriggerResult): CounselStatus {
  switch (trigger.systemAction) {
    case "CONTINUE_AUTOMATED_GOVERNANCE": return "NOT_REQUIRED";
    case "WARN_AND_CONTINUE": return "RECOMMENDED";
    case "REQUIRE_COUNSEL_REVIEW": return "REQUIRED";
    case "PAUSE_EXECUTION": return "PAUSED_PENDING_REVIEW";
    case "ESCALATE_TO_RETAINER_REVIEW": return "ESCALATED_TO_RETAINER";
  }
}
