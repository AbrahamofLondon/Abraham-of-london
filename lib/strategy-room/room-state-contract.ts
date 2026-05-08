/**
 * lib/strategy-room/room-state-contract.ts — Canonical Strategy Room state contract.
 *
 * Defines the server-authoritative state of an active Strategy Room session.
 * Used by the execution command surface to render governed case state.
 *
 * Adapts to existing types: StrategyRoomAdmissionResult, LivingCase,
 * EvidenceTier, StageEntry, DecisionExecutionRecord.
 */

import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { StageEntry } from "@/lib/product/evidence-stage-contract";

// ─────────────────────────────────────────────────────────────────────────────
// ROOM STATE
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyRoomState = {
  /** Execution session ID */
  sessionId: string;
  /** Living Case ID (journeyKey) */
  caseId: string;
  /** Canonical decision ID */
  decisionId: string | null;

  /** Admission status — ADMITTED users see execution command */
  admissionStatus: "ADMITTED" | "RESTRICTED" | "BLOCKED";
  admissionReasons?: string[];

  /** The decision under governance — user's own words */
  decisionStatement: string;

  /** Evidence state */
  evidenceTier: EvidenceTier;
  completedStages?: StageEntry[];

  /** Authority / mandate */
  authorityStatus?: string | null;
  authorityType?: string | null;

  /** Continuity from signal-continuity derivation */
  continuityStatus?: string | null;
  continuitySummary?: string | null;

  /** Dynamic consequence */
  consequence?: {
    score?: number | null;
    trend?: "STABLE" | "ESCALATING" | "CRITICAL" | null;
    summary?: string | null;
    currentExposure?: number | null;
    previousExposure?: number | null;
  } | null;

  /** Avoidance pattern detection */
  avoidance?: {
    pattern?: string | null;
    severity?: string | null;
    count?: number;
    basis?: string | null;
  } | null;

  /** Escalation triggers */
  escalation?: {
    triggers: Array<{
      triggerType: string;
      message: string;
      createdAt?: string | null;
    }>;
    currentLevel?: string | null;
  } | null;

  /** Execution state — locked decisions, required actions, completion */
  execution: {
    state: "PENDING" | "ACTIVE" | "STALLED" | "COMPLETED" | "FAILED";
    requiredActions: Array<{
      id: string;
      label: string;
      owner?: string | null;
      dueAt?: string | null;
      status: "pending" | "in_progress" | "completed" | "blocked";
    }>;
    lockedDecision?: string | null;
    lockedOwner?: string | null;
    firstAction?: string | null;
  };

  /** Return Brief availability */
  returnBrief?: {
    available: boolean;
    href?: string | null;
    trajectory?: string | null;
  } | null;

  /** Retainer eligibility */
  retainer?: {
    eligible: boolean;
    reason?: string | null;
    tier?: string | null;
  } | null;

  /** Feedback / verification */
  feedback?: {
    verificationPending: boolean;
    nextVerificationAt?: string | null;
    lastFeedbackAt?: string | null;
  } | null;

  /** Counsel escalation status */
  counsel?: {
    status: "NOT_REQUIRED" | "RECOMMENDED" | "REQUIRED" | "PAUSED_PENDING_REVIEW" | "ESCALATED_TO_RETAINER";
    reasons: string[];
    explanation?: string | null;
    systemAction?: string | null;
    repairActions?: string[];
  } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOM STATE DERIVATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine execution state from decision log entries.
 */
export function deriveExecutionState(
  decisions: Array<{ status?: string }>,
): StrategyRoomState["execution"]["state"] {
  if (decisions.length === 0) return "PENDING";
  const hasCompleted = decisions.some((d) => d.status === "completed" || d.status === "executed");
  const hasBlocked = decisions.some((d) => d.status === "blocked");
  const hasActive = decisions.some((d) => d.status === "active" || d.status === "in_progress");

  if (hasCompleted && !hasBlocked) return "COMPLETED";
  if (hasBlocked) return "STALLED";
  if (hasActive) return "ACTIVE";
  return "PENDING";
}

/**
 * Check if a room state has sufficient data to render execution command.
 * Execution command should only render for ADMITTED sessions with a decision.
 */
export function canRenderExecutionCommand(state: StrategyRoomState): boolean {
  return (
    state.admissionStatus === "ADMITTED" &&
    state.decisionStatement.length > 0 &&
    state.evidenceTier !== "insufficient"
  );
}

export type { StrategyRoomState as RoomState };
