import "server-only";

/**
 * Decision State Engine — the single source of truth for user contact decisions.
 *
 * Computes a unified DecisionState from all available signals.
 * Returns exactly one allowed system, one channel, and one cooldown period.
 *
 * Rules (highest severity wins):
 *   recurring_pattern > deteriorating > fragile > stalled > committed_no_action > executing > idle
 *
 * The system does not send messages because time passed.
 * It speaks because the decision state changed.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type DecisionState =
  | "idle"
  | "committed_no_action"
  | "executing"
  | "stalled"
  | "fragile"
  | "deteriorating"
  | "recurring_pattern";

export type AllowedSystem =
  | "none"
  | "pressure_loop"
  | "escalation_engine"
  | "return_brief"
  | "retainer_gate";

export type ContactChannel =
  | "none"
  | "email"
  | "email_and_in_product"
  | "briefing";

export type DecisionStateInput = {
  userId?: string | null;
  sessionId?: string | null;
  journeyId?: string | null;

  lastCommitmentAt?: Date | null;
  lastActionAt?: Date | null;
  lastContactAt?: Date | null;

  pendingDecisionCount?: number;
  executedDecisionCount?: number;
  blockedDecisionCount?: number;

  trajectory?: "ASCENDING" | "STAGNANT" | "FRAGILE" | "DETERIORATING" | null;

  contradictionCount?: number;
  recurrenceDetected?: boolean;
  paidSession?: boolean;
  buyerStatus?: "free" | "report_buyer" | "strategy_room" | "retainer" | null;
};

export type DecisionStateResult = {
  state: DecisionState;
  severity: "none" | "low" | "medium" | "high" | "critical";
  reason: string;
  allowedSystem: AllowedSystem;
  channel: ContactChannel;
  minimumCooldownHours: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hoursSince(date: Date | null | undefined): number {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function daysSince(date: Date | null | undefined): number {
  if (!date) return Infinity;
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── State message map ───────────────────────────────────────────────────────

export const STATE_MESSAGE_MAP: Record<
  Exclude<DecisionState, "idle" | "executing">,
  { subject: string; opening: string }
> = {
  committed_no_action: {
    subject: "You said you would do this",
    opening: "No action has been recorded.",
  },
  stalled: {
    subject: "This has not progressed",
    opening: "Delay is no longer neutral.",
  },
  fragile: {
    subject: "This has started to deteriorate",
    opening: "The structure has not changed.",
  },
  deteriorating: {
    subject: "This is now deteriorating",
    opening: "Your decision is moving in the wrong direction.",
  },
  recurring_pattern: {
    subject: "This is now a recurring pattern",
    opening: "This is no longer a single decision issue.",
  },
};

// ─── Core computation ────────────────────────────────────────────────────────

export function computeDecisionState(input: DecisionStateInput): DecisionStateResult {
  const {
    lastCommitmentAt,
    lastActionAt,
    pendingDecisionCount = 0,
    executedDecisionCount = 0,
    blockedDecisionCount = 0,
    trajectory,
    contradictionCount = 0,
    recurrenceDetected = false,
  } = input;

  // ── A. Recurring Pattern (CRITICAL) ────────────────────────────────────
  if (
    recurrenceDetected ||
    contradictionCount >= 3 ||
    blockedDecisionCount >= 3
  ) {
    return {
      state: "recurring_pattern",
      severity: "critical",
      reason: recurrenceDetected
        ? "A previously resolved pattern has returned."
        : contradictionCount >= 3
          ? `${contradictionCount} contradictions persist across sessions.`
          : `${blockedDecisionCount} decisions are blocked.`,
      allowedSystem: "retainer_gate",
      channel: "briefing",
      minimumCooldownHours: 168, // 7 days
    };
  }

  // ── B. Deteriorating (HIGH) ────────────────────────────────────────────
  if (trajectory === "DETERIORATING") {
    return {
      state: "deteriorating",
      severity: "high",
      reason: "Blocked decisions outnumber executed ones. The structural problem is compounding.",
      allowedSystem: "return_brief",
      channel: "briefing",
      minimumCooldownHours: 72,
    };
  }

  // ── C. Fragile (MEDIUM) ────────────────────────────────────────────────
  if (trajectory === "FRAGILE") {
    return {
      state: "fragile",
      severity: "medium",
      reason: "Execution has not resolved the primary constraint.",
      allowedSystem: "return_brief",
      channel: "briefing",
      minimumCooldownHours: 72,
    };
  }

  // ── D. Stalled (MEDIUM) ────────────────────────────────────────────────
  if (lastCommitmentAt && !lastActionAt && daysSince(lastCommitmentAt) >= 4) {
    return {
      state: "stalled",
      severity: "medium",
      reason: `${daysSince(lastCommitmentAt)} days since commitment. No action recorded.`,
      allowedSystem: "escalation_engine",
      channel: "email_and_in_product",
      minimumCooldownHours: 72,
    };
  }

  // ── E. Committed No Action (LOW) ───────────────────────────────────────
  if (lastCommitmentAt && !lastActionAt && hoursSince(lastCommitmentAt) >= 48) {
    return {
      state: "committed_no_action",
      severity: "low",
      reason: `${Math.round(hoursSince(lastCommitmentAt))} hours since commitment. No action recorded.`,
      allowedSystem: "pressure_loop",
      channel: "email",
      minimumCooldownHours: 48,
    };
  }

  // ── F. Executing (NONE — leave them alone) ─────────────────────────────
  // Note: FRAGILE/DETERIORATING already handled above, but check for safety
  if (
    executedDecisionCount > 0 &&
    (trajectory as string) !== "FRAGILE" &&
    (trajectory as string) !== "DETERIORATING"
  ) {
    return {
      state: "executing",
      severity: "none",
      reason: "User is actively executing decisions.",
      allowedSystem: "none",
      channel: "none",
      minimumCooldownHours: 24,
    };
  }

  // ── G. Idle (DEFAULT) ──────────────────────────────────────────────────
  return {
    state: "idle",
    severity: "none",
    reason: "No active commitment or decision state.",
    allowedSystem: "none",
    channel: "none",
    minimumCooldownHours: 24,
  };
}
