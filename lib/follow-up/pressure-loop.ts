/**
 * Behavioural Pressure Loop — 48h / 7d / 14d follow-up system.
 *
 * The system doesn't just analyse the decision. It remembers it
 * and expects movement.
 *
 * No motivational tone. No encouragement. Only:
 * - recall
 * - contradiction
 * - consequence
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

function stampIdempotencyKeys(spineId: string, msgs: Omit<PressureMessage, "idempotencyKey">[]): PressureMessage[] {
  return msgs.map((m) => ({ ...m, idempotencyKey: `pl_${spineId}_${m.stage}_${Date.now()}` }));
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type PressureStage = "48h" | "7d" | "14d";

export type PressureMessage = {
  stage: PressureStage;
  subject: string;
  body: string;
  /** When this message should be sent (ISO timestamp) */
  scheduledAt: string;
  /** Whether this message has been sent */
  sent: boolean;
  /** Whether the user has taken action since */
  actionRecorded: boolean;
  /** Idempotency key — prevents duplicate sends */
  idempotencyKey: string;
};

export type PressureLoop = {
  spineId: string;
  email: string;
  decision: string;
  forcedAction: string;
  costOfDelay: string;
  conditionClass: string;
  createdAt: string;
  messages: PressureMessage[];
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────

function build48hMessage(decision: string, forcedAction: string): { subject: string; body: string } {
  return {
    subject: "You said you would do this.",
    body: `48 hours ago, you identified:

Decision: "${decision}"

Move: "${forcedAction}"

No action has been recorded.

If this is still unresolved, the constraint is no longer information.

It is avoidance.`,
  };
}

function build7dMessage(forcedAction: string, costOfDelay: string): { subject: string; body: string } {
  return {
    subject: "This is now a pattern.",
    body: `7 days ago, you identified the next move:

"${forcedAction}"

It has not been executed.

${costOfDelay ? `The consequence you named:\n"${costOfDelay}"\n\nThat consequence is now closer.` : "The cost of delay has not disappeared. It has compounded."}

Either act, or update the decision.`,
  };
}

function build14dMessage(conditionClass: string): { subject: string; body: string } {
  return {
    subject: "The system has downgraded your decision.",
    body: `This decision has now entered drift.

Repeated non-action signals:
- avoidance confirmed
- ${conditionClass === "authority" ? "authority unresolved" : conditionClass === "execution" ? "execution deferred" : conditionClass === "definition" ? "definition still unclear" : "instability untested"}

If this continues, the cost will shift from operational to structural.

Re-run the decision when you are ready to act.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOP CREATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a pressure loop from a completed spine.
 * The loop schedules 3 messages: 48h, 7d, 14d.
 */
export function createPressureLoop(spine: IntelligenceSpine): PressureLoop | null {
  if (!spine.email || !spine.case.decision) return null;

  const now = new Date();
  const decision = spine.case.decision;
  const hasMove = !!(spine.case.forcedAction || spine.synthesis?.concreteMove);
  const forcedAction = spine.case.forcedAction ?? spine.synthesis?.concreteMove ?? "";
  const costOfDelay = spine.case.costOfDelay ?? "";
  const conditionClass = spine.deterministic.conditionClass;

  // If no move exists, do not claim "you said you would" — use recovery framing
  if (!hasMove) {
    return {
      spineId: spine.id,
      email: spine.email,
      decision,
      forcedAction: "",
      costOfDelay,
      conditionClass,
      createdAt: now.toISOString(),
      messages: stampIdempotencyKeys(spine.id, [
        {
          stage: "48h",
          subject: "The decision is still open.",
          body: `48 hours ago, you described a decision:\n\n"${decision}"\n\nNo specific move was identified. The system cannot track action without a named move.\n\nReturn and name what you would do if forced to decide in 24 hours.`,
          scheduledAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
          sent: false,
          actionRecorded: false,
        },
        {
          stage: "7d",
          subject: "This decision is now 7 days older.",
          body: `The decision you described is still unresolved:\n\n"${decision}"\n\n${costOfDelay ? `You said the cost is: "${costOfDelay}". That cost has now compounded for a week.` : "The cost of delay has not disappeared. It has compounded."}\n\nReturn when you are ready to name the move.`,
          scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          sent: false,
          actionRecorded: false,
        },
        {
          stage: "14d",
          subject: "The system has classified this as drift.",
          body: `This decision has been unresolved for 14 days without a named action.\n\nThis is drift. The system cannot track what was never committed to.\n\nReturn and re-run the decision when you are ready to act.`,
          scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          sent: false,
          actionRecorded: false,
        },
      ]),
    };
  }

  const msg48h = build48hMessage(decision, forcedAction);
  const msg7d = build7dMessage(forcedAction, costOfDelay);
  const msg14d = build14dMessage(conditionClass);

  return {
    spineId: spine.id,
    email: spine.email,
    decision,
    forcedAction,
    costOfDelay,
    conditionClass,
    createdAt: now.toISOString(),
    messages: stampIdempotencyKeys(spine.id, [
      {
        stage: "48h",
        subject: msg48h.subject,
        body: msg48h.body,
        scheduledAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
      {
        stage: "7d",
        subject: msg7d.subject,
        body: msg7d.body,
        scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
      {
        stage: "14d",
        subject: msg14d.subject,
        body: msg14d.body,
        scheduledAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
    ]),
  };
}

/**
 * Check which messages in a loop are due and not yet sent.
 */
export function getDueMessages(loop: PressureLoop): PressureMessage[] {
  const now = Date.now();
  return loop.messages.filter(
    (m) => !m.sent && !m.actionRecorded && new Date(m.scheduledAt).getTime() <= now,
  );
}

/**
 * Cancel remaining messages in a loop (user took action).
 */
export function markActionTaken(loop: PressureLoop): PressureLoop {
  return {
    ...loop,
    messages: loop.messages.map((m) =>
      m.sent ? m : { ...m, actionRecorded: true },
    ),
  };
}
