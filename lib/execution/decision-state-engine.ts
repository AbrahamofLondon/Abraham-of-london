/**
 * lib/execution/decision-state-engine.ts — REACTIVE EXECUTION ENGINE
 *
 * This is what turns the system from descriptive → reactive.
 *
 * Every decision exists in a governed state machine.
 * The system reacts when the user fails to act.
 * Time compounds consequence. Avoidance triggers escalation.
 *
 * States: PENDING → EXECUTED | BLOCKED | ESCALATED | FAILED
 * Transitions are governed, not arbitrary.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionState =
  | "PENDING"
  | "EXECUTED"
  | "BLOCKED"
  | "ESCALATED"
  | "FAILED";

export type EscalationTrigger =
  | "DEADLINE_EXCEEDED"
  | "ACTIONS_SKIPPED"
  | "BLOCKED_WITHOUT_REASON"
  | "REPEATED_AVOIDANCE"
  | "MANUAL";

export type DecisionAction = {
  id: string;
  text: string;
  status: DecisionState;
  deadline: string; // ISO date
  createdAt: string;
  updatedAt: string;
  blockReason?: string | null;
  executedAt?: string | null;
  escalatedAt?: string | null;
  failedAt?: string | null;
  avoidanceCount: number;
};

export type SessionExecutionState = {
  sessionId: string;
  systemState: DecisionState;
  actions: DecisionAction[];
  escalationTriggers: EscalationTrigger[];
  consequenceScore: number;
  lastEscalationCheck: string;
  avoidancePatterns: string[];
  directive: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Consequence Model
// consequence(t) = base_risk + (time_delay × escalation_multiplier) + (execution_failure_penalty)
// ─────────────────────────────────────────────────────────────────────────────

export function computeDynamicConsequence(state: SessionExecutionState): {
  score: number;
  label: string;
  explanation: string;
  trend: "STABLE" | "ESCALATING" | "CRITICAL";
} {
  const now = Date.now();
  const actions = state.actions;

  // Base risk from action states
  const pendingCount = actions.filter((a) => a.status === "PENDING").length;
  const blockedCount = actions.filter((a) => a.status === "BLOCKED").length;
  const failedCount = actions.filter((a) => a.status === "FAILED").length;
  const executedCount = actions.filter((a) => a.status === "EXECUTED").length;
  const totalActions = actions.length || 1;

  const baseRisk = Math.round(((pendingCount + blockedCount * 1.5 + failedCount * 2) / totalActions) * 40);

  // Time delay penalty — overdue actions compound
  let timeDelayPenalty = 0;
  for (const action of actions) {
    if (action.status === "PENDING" && action.deadline) {
      const deadlineMs = new Date(action.deadline).getTime();
      if (now > deadlineMs) {
        const daysOverdue = Math.floor((now - deadlineMs) / (24 * 60 * 60 * 1000));
        timeDelayPenalty += Math.min(20, daysOverdue * 3); // 3 points per day, capped at 20 per action
      }
    }
  }

  // Escalation multiplier — repeated avoidance compounds faster
  const avoidanceMultiplier = 1 + (state.avoidancePatterns.length * 0.15);
  const scaledTimeDelay = Math.round(timeDelayPenalty * avoidanceMultiplier);

  // Execution failure penalty — blocked without reason is worst
  const unblockedReasonCount = actions.filter(
    (a) => a.status === "BLOCKED" && !a.blockReason?.trim(),
  ).length;
  const executionFailurePenalty = unblockedReasonCount * 12 + failedCount * 8;

  // Total consequence score (0-100)
  const score = Math.min(100, baseRisk + scaledTimeDelay + executionFailurePenalty);

  // Classification
  const trend: "STABLE" | "ESCALATING" | "CRITICAL" =
    score >= 70 ? "CRITICAL" : score >= 40 ? "ESCALATING" : "STABLE";

  const label =
    score >= 70
      ? "CRITICAL — intervention stalling"
      : score >= 40
        ? "ESCALATING — delay is compounding"
        : executedCount > 0
          ? "RESPONDING — execution in progress"
          : "STABLE — awaiting first action";

  const explanation =
    score >= 70
      ? `${blockedCount + failedCount} actions blocked or failed. ${timeDelayPenalty > 0 ? `${Math.round(timeDelayPenalty)} points of time-delay penalty accumulated.` : ""} ${unblockedReasonCount > 0 ? `${unblockedReasonCount} blocked without stated reason.` : ""} The condition is deteriorating because action is not being taken.`
      : score >= 40
        ? `Consequence is escalating. ${pendingCount} actions pending. ${timeDelayPenalty > 0 ? `Overdue actions adding ${Math.round(timeDelayPenalty)} to risk.` : ""} The system will escalate if this continues.`
        : executedCount > 0
          ? `${executedCount}/${totalActions} actions executed. Consequence is responding to intervention.`
          : `${pendingCount} actions pending. Deadlines active. Consequence will begin escalating when deadlines pass.`;

  return { score, label, explanation, trend };
}

// ─────────────────────────────────────────────────────────────────────────────
// State Transitions (governed)
// ─────────────────────────────────────────────────────────────────────────────

export type TransitionResult = {
  newState: DecisionState;
  triggers: EscalationTrigger[];
  directive: string | null;
  avoidancePattern: string | null;
};

/**
 * Check if the session state should transition based on current actions.
 * This is the reactive core — the system decides, not the user.
 */
export function evaluateStateTransition(state: SessionExecutionState): TransitionResult {
  const actions = state.actions;
  const now = Date.now();
  const triggers: EscalationTrigger[] = [];
  let directive: string | null = null;
  let avoidancePattern: string | null = null;

  // Rule 1: 2+ actions skipped (pending past deadline) → ESCALATED
  const overdueActions = actions.filter((a) => {
    if (a.status !== "PENDING" || !a.deadline) return false;
    return now > new Date(a.deadline).getTime();
  });
  if (overdueActions.length >= 2) {
    triggers.push("ACTIONS_SKIPPED");
    directive = `${overdueActions.length} actions have passed their deadlines without execution. The system is escalating.`;
  }

  // Rule 2: 1+ blocked without reason → contradiction spike
  const blockedNoReason = actions.filter(
    (a) => a.status === "BLOCKED" && !a.blockReason?.trim(),
  );
  if (blockedNoReason.length >= 1) {
    triggers.push("BLOCKED_WITHOUT_REASON");
    directive = directive
      ? `${directive} Additionally, ${blockedNoReason.length} action(s) blocked without stated reason — this is a contradiction.`
      : `${blockedNoReason.length} action(s) blocked without stated reason. The system requires a reason to distinguish genuine constraint from avoidance.`;
  }

  // Rule 3: Repeated avoidance (action marked pending → blocked → pending cycle)
  for (const action of actions) {
    if (action.avoidanceCount >= 3) {
      triggers.push("REPEATED_AVOIDANCE");
      avoidancePattern = `Decision "${action.text.slice(0, 60)}" has been avoided ${action.avoidanceCount} times.`;
      directive = directive
        ? `${directive} ${avoidancePattern}`
        : `This is the ${ordinal(action.avoidanceCount)} time this decision has been avoided. The pattern is structural, not circumstantial.`;
      break;
    }
  }

  // Rule 4: Single overdue deadline → warning (not yet escalation)
  if (overdueActions.length === 1 && triggers.length === 0) {
    triggers.push("DEADLINE_EXCEEDED");
    directive = `1 action has passed its deadline. Execute or state the blocking constraint.`;
  }

  // Determine new state
  let newState: DecisionState = state.systemState;
  if (triggers.includes("ACTIONS_SKIPPED") || triggers.includes("REPEATED_AVOIDANCE")) {
    newState = "ESCALATED";
  } else if (triggers.includes("BLOCKED_WITHOUT_REASON")) {
    newState = "BLOCKED";
  } else if (actions.length > 0 && actions.every((a) => a.status === "EXECUTED")) {
    newState = "EXECUTED";
  } else if (actions.some((a) => a.status === "FAILED")) {
    newState = "FAILED";
  }

  return { newState, triggers, directive, avoidancePattern };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default Deadlines
// ─────────────────────────────────────────────────────────────────────────────

export function computeDefaultDeadline(urgency: "immediate" | "near_term" | "structural"): string {
  const now = new Date();
  switch (urgency) {
    case "immediate":
      now.setDate(now.getDate() + 3);
      break;
    case "near_term":
      now.setDate(now.getDate() + 14);
      break;
    case "structural":
      now.setDate(now.getDate() + 30);
      break;
  }
  return now.toISOString();
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory — repeated patterns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Detect if a decision text has been seen before in the session history.
 * Returns the avoidance count for the most similar prior decision.
 */
export function detectRepeatedAvoidance(
  newDecisionText: string,
  existingActions: DecisionAction[],
): number {
  const normalized = newDecisionText.toLowerCase().trim();
  const terms = normalized.split(/\s+/).filter((w) => w.length > 3);
  if (terms.length === 0) return 0;

  let maxOverlap = 0;
  let matchedAction: DecisionAction | null = null;

  for (const action of existingActions) {
    const existingTerms = action.text.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const overlap = terms.filter((t) => existingTerms.includes(t)).length;
    const overlapRatio = overlap / Math.max(terms.length, 1);
    if (overlapRatio > 0.5 && overlap > maxOverlap) {
      maxOverlap = overlap;
      matchedAction = action;
    }
  }

  return matchedAction ? matchedAction.avoidanceCount + 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0])!;
}
