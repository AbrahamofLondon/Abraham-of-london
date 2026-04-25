/**
 * Escalation Engine — time-based pressure escalation for non-buyers.
 *
 * Not nurturing. Escalation based on inaction.
 * Every message pulls from spine: personal, specific, undeniable.
 *
 * Segments:
 * A: Intent YES, no purchase → high-pressure conversion
 * B: Intent NO → challenge + escalation
 * C: Low cost (<£5k) → educate or discard
 * D: High cost (>£20k) → immediate Strategy Room escalation
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type EscalationSegment = "A" | "B" | "C" | "D";

export type EscalationMessage = {
  stage: "24h" | "48h" | "72h" | "5d" | "7d";
  subject: string;
  body: string;
  cta: { label: string; href: string };
  tone: "reality" | "breach" | "pressure" | "pattern" | "fork";
  /** Idempotency key */
  key: string;
};

export type EscalationPlan = {
  segment: EscalationSegment;
  messages: EscalationMessage[];
  stopped: boolean;
  stopReason: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENTATION
// ─────────────────────────────────────────────────────────────────────────────

export function classifySegment(spine: IntelligenceSpine): EscalationSegment {
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const intent = spine.preCommitment?.willing48h ?? false;

  if (cost > 20000) return "D";
  if (intent && cost >= 5000) return "A";
  if (!intent) return "B";
  return "C";
}

// ─────────────────────────────────────────────────────────────────────────────
// STOP CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

function checkStopConditions(spine: IntelligenceSpine): string | null {
  if (spine.execution?.actionTaken) return "Action confirmed — escalation stopped.";
  // Purchase detection would come from entitlement check — stub for now
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export function buildEscalationPlan(spine: IntelligenceSpine): EscalationPlan {
  const stop = checkStopConditions(spine);
  if (stop) return { segment: classifySegment(spine), messages: [], stopped: true, stopReason: stop };

  const segment = classifySegment(spine);
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const dailyCost = Math.round(cost / 30);
  const decision = spine.case.decision?.slice(0, 80) ?? "your decision";
  const move = spine.synthesis?.concreteMove?.slice(0, 80) ?? "the identified action";
  const breaches = spine.execution?.breachCount ?? 0;
  const accuracy = spine.accuracyFeedback?.response;
  const id = spine.id;

  const messages: EscalationMessage[] = [];

  // ── T+24h: Reality Reminder ──
  const msg24h: string[] = [
    "You ran the diagnostic. You identified the issue. You did not act.",
    "",
    "That means the problem is still active.",
  ];
  if (dailyCost > 0) msg24h.push("", `If your estimate was accurate, that is approximately £${dailyCost} already lost since then.`);
  msg24h.push("", "This is not a reminder. This is the cost continuing.");
  if (accuracy === "yes") msg24h.push("", "You already confirmed this diagnosis was accurate.");

  messages.push({
    stage: "24h",
    subject: "The cost did not pause.",
    body: msg24h.join("\n"),
    cta: { label: "See what this is really costing", href: "/diagnostics/executive-reporting" },
    tone: "reality",
    key: `esc_${id}_24h`,
  });

  // ── T+48h: Commitment Breach ──
  const msg48h: string[] = [];
  if (spine.preCommitment?.willing48h) {
    msg48h.push("You said you would act within 48 hours.", "", "You didn't.", "", "This is not a productivity issue. It is a pattern.");
  } else {
    msg48h.push(`The decision you described — "${decision}" — is now 48 hours older.`, "", "Nothing has changed except the cost.");
  }
  msg48h.push("", "Until that pattern is addressed, every future decision will follow the same path.");

  messages.push({
    stage: "48h",
    subject: spine.preCommitment?.willing48h ? "You said you would act." : "48 hours. No movement.",
    body: msg48h.join("\n"),
    cta: { label: "Enter Strategy Room", href: "/strategy-room" },
    tone: "breach",
    key: `esc_${id}_48h`,
  });

  // ── T+72h: Pressure Escalation ──
  const cost72h = dailyCost * 3;
  const msg72h = [
    "You have waited 72 hours.",
    cost72h > 0 ? `Estimated cost accrued: £${cost72h.toLocaleString()}.` : "",
    "",
    "Nothing improved.",
    "",
    "At this point, delay is no longer neutral. It is actively worsening the position.",
  ].filter(Boolean);

  messages.push({
    stage: "72h",
    subject: `72 hours.${cost72h > 0 ? ` £${cost72h.toLocaleString()} accrued.` : ""} No movement.`,
    body: msg72h.join("\n"),
    cta: { label: "Enforce the decision", href: "/strategy-room" },
    tone: "pressure",
    key: `esc_${id}_72h`,
  });

  // ── T+5d: Pattern Recognition ──
  const msg5d = [
    "This is not the first time.",
    "",
    "The system has now recorded:",
    "- a known issue",
    "- a defined action",
    "- a missed execution",
    "",
    "That combination is a pattern.",
    breaches > 0 ? `Breach count: ${breaches + 1}.` : "",
    "",
    "Patterns do not resolve themselves. They repeat.",
  ].filter(Boolean);

  messages.push({
    stage: "5d",
    subject: "This is now a pattern.",
    body: msg5d.join("\n"),
    cta: { label: "Start with the structure", href: "/diagnostics/constitutional-diagnostic" },
    tone: "pattern",
    key: `esc_${id}_5d`,
  });

  // ── T+7d: Final Fork ──
  const msg7d = [
    "At this point, there are only two positions:",
    "",
    "1. You act.",
    "2. You accept the cost.",
    "",
    "There is no third option.",
    "",
    cost > 0 ? `If you accept it: £${(cost * 12).toLocaleString()} per year continues.` : "If you accept it, nothing changes.",
    "",
    "If you don't — this is where you intervene.",
  ];

  messages.push({
    stage: "7d",
    subject: "Two options remain.",
    body: msg7d.join("\n"),
    cta: segment === "D" || segment === "A" ? { label: "Force the decision", href: "/strategy-room" } : { label: "See the cost", href: "/diagnostics/executive-reporting" },
    tone: "fork",
    key: `esc_${id}_7d`,
  });

  // Apply segment-specific amplification
  if (segment === "D") {
    // High cost: amplify financial language in all messages
    for (const msg of messages) {
      if (cost > 0) msg.subject = `£${Math.round(cost).toLocaleString()}/month — ${msg.subject}`;
    }
  }

  return { segment, messages, stopped: false, stopReason: null };
}

/**
 * Get the message due now based on hours since spine creation.
 */
export function getDueEscalationMessage(plan: EscalationPlan, hoursSinceCreation: number): EscalationMessage | null {
  if (plan.stopped) return null;

  const thresholds: Record<string, number> = { "24h": 24, "48h": 48, "72h": 72, "5d": 120, "7d": 168 };

  // Find the latest message that should have been sent
  let due: EscalationMessage | null = null;
  for (const msg of plan.messages) {
    const threshold = thresholds[msg.stage] ?? 999;
    if (hoursSinceCreation >= threshold) due = msg;
  }

  return due;
}
