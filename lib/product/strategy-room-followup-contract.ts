/**
 * lib/product/strategy-room-followup-contract.ts
 *
 * Contract for the Strategy Room follow-up loop.
 *
 * After a Strategy Room session produces a governed commitment, a
 * follow-up loop is initiated:
 *   - 7-day check-in: did the action happen?
 *   - Action confirmation or escalation
 *   - If confirmed: closes the loop, updates case record
 *   - If not confirmed: escalates (Return Brief, counsel flag)
 *
 * This is the type contract only. Side-effects (email scheduling, record
 * updates) are handled by the API endpoint and server-side services.
 */

// ─── Follow-up status ─────────────────────────────────────────────────────────

export type FollowUpStatus =
  | "PENDING"        // Awaiting user confirmation (within window)
  | "CONFIRMED"      // User confirmed the action happened
  | "NOT_CONFIRMED"  // User stated the action did not happen
  | "ESCALATED"      // Escalated to counsel or Return Brief
  | "EXPIRED"        // Confirmation window closed without response
  | "OVERRIDDEN";    // Operator-overridden

// ─── Confirmation result ──────────────────────────────────────────────────────

export type FollowUpOutcome =
  | "ACTION_TAKEN"
  | "ACTION_DEFERRED"
  | "ACTION_BLOCKED"
  | "SITUATION_CHANGED"
  | "ESCALATION_NEEDED";

// ─── Follow-up record ─────────────────────────────────────────────────────────

export type StrategyRoomFollowUp = {
  followUpId: string;
  caseId: string;
  sessionId: string;
  /** The commitment or action that is being followed up on */
  commitmentLabel: string;
  /** The date the follow-up was initiated (typically at session close) */
  initiatedAt: string;
  /** The date by which confirmation is expected (initiatedAt + 7 days) */
  dueBy: string;
  status: FollowUpStatus;
  outcome?: FollowUpOutcome | null;
  /** User-provided note at confirmation time */
  confirmationNote?: string | null;
  confirmedAt?: string | null;
  escalatedAt?: string | null;
};

// ─── Confirmation request ─────────────────────────────────────────────────────

export type FollowUpConfirmationRequest = {
  followUpId: string;
  caseId: string;
  outcome: FollowUpOutcome;
  note?: string;
};

// ─── Confirmation response ────────────────────────────────────────────────────

export type FollowUpConfirmationResponse = {
  ok: true;
  followUpId: string;
  status: FollowUpStatus;
  nextStep: string;
  returnBriefTriggered: boolean;
  escalated: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function followUpDueBy(initiatedAt: Date | string): Date {
  const start = initiatedAt instanceof Date ? initiatedAt : new Date(initiatedAt);
  return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
}

export function isFollowUpOverdue(dueBy: Date | string, now: Date = new Date()): boolean {
  const due = dueBy instanceof Date ? dueBy : new Date(dueBy);
  return now > due;
}

export function deriveFollowUpStatus(
  outcome: FollowUpOutcome | null | undefined,
  isExpired: boolean,
): FollowUpStatus {
  if (!outcome) return isExpired ? "EXPIRED" : "PENDING";
  if (outcome === "ACTION_TAKEN") return "CONFIRMED";
  if (outcome === "ESCALATION_NEEDED") return "ESCALATED";
  return "NOT_CONFIRMED";
}

export function nextStepForOutcome(outcome: FollowUpOutcome): string {
  switch (outcome) {
    case "ACTION_TAKEN":
      return "Action confirmed. The governed record has been updated. The case remains open until fully resolved.";
    case "ACTION_DEFERRED":
      return "Action deferred. A Return Brief will be generated to document the deferral and the current case state.";
    case "ACTION_BLOCKED":
      return "Action blocked. The block has been recorded. Consider whether counsel review is warranted.";
    case "SITUATION_CHANGED":
      return "Situation has changed. Run the next assessment to update the governed record.";
    case "ESCALATION_NEEDED":
      return "Escalation flagged. This case has been marked for counsel review. A Return Brief is being generated.";
  }
}

export function shouldTriggerReturnBrief(outcome: FollowUpOutcome): boolean {
  return (
    outcome === "ACTION_DEFERRED" ||
    outcome === "ACTION_BLOCKED" ||
    outcome === "ESCALATION_NEEDED"
  );
}

export function shouldEscalate(outcome: FollowUpOutcome): boolean {
  return outcome === "ESCALATION_NEEDED" || outcome === "ACTION_BLOCKED";
}
