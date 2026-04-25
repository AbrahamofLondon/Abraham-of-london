/**
 * Client-side utility for registering/updating pressure loops.
 *
 * Call from any assessment page after producing a result.
 * Works with or without a spine — falls back to basic case data.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { loadSpineFromSession } from "@/lib/decision/spine-persistence";
import { createPressureLoop } from "./pressure-loop";

/**
 * Register a pressure loop from the current spine state.
 * Best-effort — never blocks the UI, never throws.
 *
 * Call this at the end of any assessment that produces a verdict.
 */
export function registerPressureLoopFromSpine(spine?: IntelligenceSpine | null): void {
  const s = spine ?? loadSpineFromSession();
  if (!s) return;

  const loop = createPressureLoop(s);
  if (!loop) return;

  void fetch("/api/follow-up/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loop }),
  }).catch(() => { /* best-effort */ });
}

/**
 * Register a pressure loop from minimal case data (no spine required).
 * Use this in assessments that don't have spine access yet.
 */
export function registerPressureLoopFromCase(input: {
  email: string;
  decision: string;
  forcedAction?: string;
  costOfDelay?: string;
  conditionClass?: string;
}): void {
  if (!input.email || !input.decision) return;

  const loop = {
    spineId: `case_${Date.now()}`,
    email: input.email,
    decision: input.decision,
    forcedAction: input.forcedAction ?? "the action identified",
    costOfDelay: input.costOfDelay ?? "",
    conditionClass: input.conditionClass ?? "unknown",
    createdAt: new Date().toISOString(),
    messages: [
      {
        stage: "48h" as const,
        subject: "You said you would do this.",
        body: `48 hours ago, you identified:\n\nDecision: "${input.decision}"\n\nNo action has been recorded.\n\nIf this is still unresolved, the constraint is no longer information.\n\nIt is avoidance.`,
        scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
      {
        stage: "7d" as const,
        subject: "This is now a pattern.",
        body: `7 days ago, you identified a decision that is still unresolved.\n\nThe cost of delay has not disappeared. It has compounded.\n\nEither act, or update the decision.`,
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
      {
        stage: "14d" as const,
        subject: "The system has downgraded your decision.",
        body: `This decision has now entered drift.\n\nRepeated non-action signals:\n- avoidance confirmed\n- authority unresolved\n\nIf this continues, the cost will shift from operational to structural.`,
        scheduledAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        sent: false,
        actionRecorded: false,
      },
    ],
  };

  void fetch("/api/follow-up/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ loop }),
  }).catch(() => { /* best-effort */ });
}
