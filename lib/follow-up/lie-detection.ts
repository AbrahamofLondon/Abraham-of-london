/**
 * Lie Detection Layer — catches understated costs, vague decisions, gamed answers.
 *
 * Users will:
 * - understate cost
 * - avoid real decisions
 * - game answers
 *
 * This layer catches it and escalates tone.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// ECONOMIC SANITY CHECK
// ─────────────────────────────────────────────────────────────────────────────

export type EconomicSanityResult = {
  suspicious: boolean;
  reason: string | null;
  suggestedMinimum: number | null;
};

/**
 * Check if the stated monthly cost is plausible given the decision context.
 */
export function checkEconomicSanity(input: {
  estimatedMonthlyCost: number;
  conditionClass: string;
  contradictionSeverity?: "low" | "medium" | "high" | "critical";
  claimedOwner?: string;
  blocker?: string;
}): EconomicSanityResult {
  const { estimatedMonthlyCost, conditionClass, contradictionSeverity } = input;

  // Authority problems involving named senior roles are rarely < £5k/month
  if (conditionClass === "authority" && input.claimedOwner) {
    const seniorRole = /\b(CEO|CFO|COO|CTO|VP|board|director|head)\b/i.test(input.claimedOwner);
    if (seniorRole && estimatedMonthlyCost < 5000) {
      return {
        suspicious: true,
        reason: "This estimate appears inconsistent with your situation. A decision involving senior leadership rarely costs less than £5,000 per month in drift. Are you underestimating the cost, or avoiding the real number?",
        suggestedMinimum: 5000,
      };
    }
  }

  // Critical contradiction severity + low cost = suspicious
  if (contradictionSeverity === "critical" && estimatedMonthlyCost < 2000) {
    return {
      suspicious: true,
      reason: "The system detected a critical contradiction in your inputs, but the stated cost is below £2,000/month. Severe contradictions typically carry higher structural cost. Are you underestimating?",
      suggestedMinimum: 2000,
    };
  }

  // Execution problems with named blockers are rarely trivial
  if (conditionClass === "execution" && input.blocker && input.blocker.length > 20 && estimatedMonthlyCost < 1000) {
    return {
      suspicious: true,
      reason: "You described a substantial blocker but estimated a low monthly cost. If this blocker is real, the cost is likely higher than stated.",
      suggestedMinimum: 1000,
    };
  }

  return { suspicious: false, reason: null, suggestedMinimum: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// AVOIDANCE ESCALATION SIGNAL
// ─────────────────────────────────────────────────────────────────────────────

export type AvoidanceFlag = {
  suspected: boolean;
  signals: string[];
  toneEscalation: string | null;
};

/**
 * Detect avoidance patterns: vague decisions, repeated topics, contradictory answers.
 */
export function detectAvoidance(spine: IntelligenceSpine): AvoidanceFlag {
  const signals: string[] = [];

  const decision = spine.case.decision ?? "";

  // Vague decision (topic, not decision)
  if (decision.length < 30 || !/\b(whether|decide|choose|approve|replace|remove|hire|fire|cut|invest|close|launch)\b/i.test(decision)) {
    signals.push("Decision text describes a topic, not a specific decision");
  }

  // Repeated across sessions (check memory)
  if (spine.memory && spine.memory.recurrenceSignals.length > 0) {
    const repeated = spine.memory.recurrenceSignals.filter((s) => s.similarity > 0.5);
    if (repeated.length > 0) {
      signals.push("Same decision pattern detected across multiple sessions");
    }
  }

  // Blocker contradicts forced action (already detected, but flag avoidance specifically)
  if (spine.case.blocker && spine.case.forcedAction) {
    const blockerWords = new Set(spine.case.blocker.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const forcedWords = new Set(spine.case.forcedAction.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    let overlap = 0;
    for (const w of blockerWords) { if (forcedWords.has(w)) overlap++; }
    if (blockerWords.size > 3 && overlap === 0) {
      signals.push("Blocker and forced action share no language — avoidance likely");
    }
  }

  // Pre-commitment = NO
  if (spine.preCommitment && !spine.preCommitment.willing48h) {
    signals.push("User declined 48h commitment");
  }

  const suspected = signals.length >= 2;
  const toneEscalation = suspected
    ? "You are describing a topic, not a decision. The system cannot operate on ambiguity."
    : signals.length === 1
      ? signals[0]!
      : null;

  return { suspected, signals, toneEscalation };
}

// ─────────────────────────────────────────────────────────────────────────────
// DO NOT SELL FILTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Block ER purchase if the user is not a qualified buyer.
 * Returns null if purchase should proceed. Returns message if blocked.
 */
export function shouldBlockERPurchase(spine: IntelligenceSpine): string | null {
  const cost = spine.economics?.estimatedMonthlyCost;
  const intent = spine.preCommitment?.willing48h;

  // Block: low cost AND no intent
  if (cost !== undefined && cost < 1000 && intent === false) {
    return "This is not the right level for this problem. The system recommends resolving at the Fast Diagnostic level first.";
  }

  return null;
}

/**
 * Dynamic Strategy Room pricing based on decision scale.
 * Returns the product code to use for checkout.
 */
export function resolveStrategyRoomTier(estimatedMonthlyCost: number | undefined): "strategy_room" | "strategy_room_extended" {
  if (estimatedMonthlyCost !== undefined && estimatedMonthlyCost > 20000) {
    return "strategy_room_extended";
  }
  return "strategy_room";
}
