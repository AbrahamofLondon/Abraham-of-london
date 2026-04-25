/**
 * Inbound Filtering System — turns attention into qualified pipeline.
 *
 * Not a funnel. A controlled access system to decision enforcement.
 * Maximise qualified pressure, not conversions.
 *
 * Tier 1: Curious → Restricted Fast
 * Tier 2: Aware → Full Fast
 * Tier 3: Under pressure → Executive Reporting
 * Tier 4: Decision-ready → Strategy Room
 *
 * Users don't see tiers. They feel friction or flow.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

// ─────────────────────────────────────────────────────────────────────────────
// TIER ROUTING
// ─────────────────────────────────────────────────────────────────────────────

export type QualificationTier = 1 | 2 | 3 | 4;

export type QualificationResult = {
  tier: QualificationTier;
  label: "curious" | "aware" | "under_pressure" | "decision_ready";
  allowedProducts: string[];
  blockedProducts: string[];
  routeOverride: string | null;
  gateMessage: string | null;
};

/**
 * Qualify a user based on spine state.
 * Returns tier + allowed products + gate messages.
 */
export function qualifyUser(spine: IntelligenceSpine): QualificationResult {
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const intent = spine.preCommitment?.willing48h ?? false;
  const hasDecision = spine.case.decision && spine.case.decision.trim().length > 20;
  const hasOwner = spine.case.claimedOwner && spine.case.claimedOwner.trim().length > 2;
  const falseAuth = spine.flags?.falseAuthority ?? false;
  const avoidance = spine.flags?.avoidanceSuspected ?? false;

  // Tier 4: Decision-ready (cost > £20k, intent YES, decision + owner clear)
  if (cost > 20000 && intent && hasDecision && hasOwner && !falseAuth) {
    return {
      tier: 4,
      label: "decision_ready",
      allowedProducts: ["fast", "constitutional", "team", "enterprise", "executive_reporting", "strategy_room"],
      blockedProducts: [],
      routeOverride: "/strategy-room",
      gateMessage: null,
    };
  }

  // Tier 3: Under pressure (cost > £5k, has decision)
  if (cost > 5000 && hasDecision) {
    return {
      tier: 3,
      label: "under_pressure",
      allowedProducts: ["fast", "constitutional", "team", "enterprise", "executive_reporting"],
      blockedProducts: falseAuth ? ["strategy_room"] : [],
      routeOverride: null,
      gateMessage: falseAuth ? "You are not the decision owner in this situation. Diagnostic access only." : null,
    };
  }

  // Tier 2: Aware (has decision, some cost awareness)
  if (hasDecision && (cost > 0 || intent)) {
    return {
      tier: 2,
      label: "aware",
      allowedProducts: ["fast", "constitutional", "team", "enterprise"],
      blockedProducts: ["strategy_room"],
      routeOverride: null,
      gateMessage: cost < 1000 && !intent ? "This is not the right level for intervention." : null,
    };
  }

  // Tier 1: Curious (vague input, low cost, no commitment)
  return {
    tier: 1,
    label: "curious",
    allowedProducts: ["fast"],
    blockedProducts: ["constitutional", "team", "enterprise", "executive_reporting", "strategy_room"],
    routeOverride: null,
    gateMessage: avoidance ? "You are describing a topic, not a decision. The system cannot operate on ambiguity." : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY ROOM GATE
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyRoomGateResult = {
  allowed: boolean;
  missingFields: string[];
  gateMessage: string | null;
};

/**
 * Check whether Strategy Room entry requirements are met.
 * All 4 fields required: decision, cost, deadline, decision owner.
 */
export function checkStrategyRoomGate(spine: IntelligenceSpine): StrategyRoomGateResult {
  const missing: string[] = [];

  if (!spine.case.decision || spine.case.decision.trim().length < 10) missing.push("decision");
  if (!spine.economics?.estimatedMonthlyCost && !spine.economics?.costOfDelayMonthly) missing.push("cost");
  if (!spine.economics?.deadline) missing.push("deadline");
  if (!spine.case.claimedOwner || spine.case.claimedOwner.trim().length < 2) missing.push("decision owner");

  if (missing.length > 0) {
    return {
      allowed: false,
      missingFields: missing,
      gateMessage: `This is not a discussion environment. Missing: ${missing.join(", ")}. If the decision is not defined, this session will not help you.`,
    };
  }

  // False authority block
  if (spine.flags?.falseAuthority) {
    return {
      allowed: false,
      missingFields: [],
      gateMessage: "You are not the decision owner in this situation. Strategy Room access requires actual decision authority.",
    };
  }

  // Breach tier 3 block (requires acknowledgment)
  if (spine.execution?.breachCount && spine.execution.breachCount >= 3) {
    return {
      allowed: false,
      missingFields: [],
      gateMessage: "Three or more commitments breached. Strategy Room access requires explicit acknowledgment of this pattern before re-entry.",
    };
  }

  return { allowed: true, missingFields: [], gateMessage: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// METRIC-DRIVEN FILTER ADJUSTMENT
// ─────────────────────────────────────────────────────────────────────────────

export type FilterAdjustment = {
  costThresholdMultiplier: number;
  strategyRoomTightened: boolean;
  reason: string | null;
};

/**
 * Adjust filters based on north star metrics.
 * When metrics drop, tighten filters automatically.
 */
export function adjustFiltersFromMetrics(metrics: {
  qer: number;
  dar: number;
  tar: number;
}): FilterAdjustment {
  let multiplier = 1.0;
  let srTightened = false;
  const reasons: string[] = [];

  // QER low → leads are weak → raise cost threshold
  if (metrics.qer < 0.08) {
    multiplier = 1.5;
    reasons.push("QER below threshold — raising cost qualification");
  }
  if (metrics.qer < 0.05) {
    multiplier = 2.0;
    reasons.push("QER critical — doubling cost qualification");
  }

  // TAR low → diagnosis weak → reduce volume
  if (metrics.tar < 0.70) {
    multiplier = Math.max(multiplier, 1.3);
    reasons.push("TAR below threshold — tightening input quality");
  }

  // DAR low → buyers not serious → tighten SR gate
  if (metrics.dar < 0.60) {
    srTightened = true;
    reasons.push("DAR below threshold — tightening Strategy Room gate");
  }

  return {
    costThresholdMultiplier: multiplier,
    strategyRoomTightened: srTightened,
    reason: reasons.length > 0 ? reasons.join("; ") : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-FOLLOW-UP FOR NON-BUYERS
// ─────────────────────────────────────────────────────────────────────────────

export type NonBuyerFollowUp = {
  shouldFollowUp: boolean;
  delayHours: number;
  message: string;
  escalation: "soft" | "direct" | "final";
};

/**
 * Generate follow-up strategy for non-buyers based on their qualification tier.
 */
export function nonBuyerFollowUpStrategy(
  tier: QualificationTier,
  hoursSinceVisit: number,
): NonBuyerFollowUp | null {
  // Tier 1 (curious) — don't follow up. They're not ready.
  if (tier === 1) return null;

  // Tier 2 (aware) — soft follow-up after 72h
  if (tier === 2) {
    if (hoursSinceVisit < 72) return null;
    if (hoursSinceVisit < 168) {
      return {
        shouldFollowUp: true,
        delayHours: 72,
        message: "You described a decision that is still open. The system identified a condition. If nothing has changed, the cost is still accruing.",
        escalation: "soft",
      };
    }
    return {
      shouldFollowUp: true,
      delayHours: 168,
      message: "The decision you described is now a week older. The system's reading has not changed. The cost has.",
      escalation: "direct",
    };
  }

  // Tier 3 (under pressure) — direct follow-up after 48h
  if (tier === 3) {
    if (hoursSinceVisit < 48) return null;
    if (hoursSinceVisit < 96) {
      return {
        shouldFollowUp: true,
        delayHours: 48,
        message: "The system identified a decision under pressure with measurable cost. You viewed the diagnosis but did not proceed to pricing. The cost has not paused.",
        escalation: "direct",
      };
    }
    return {
      shouldFollowUp: true,
      delayHours: 96,
      message: "Four days since the system flagged this decision. If the cost estimate you provided was accurate, approximately £X has accrued since then. Either the problem resolved itself, or you are avoiding the next step.",
      escalation: "final",
    };
  }

  // Tier 4 (decision-ready) — immediate pressure after 24h
  if (tier === 4) {
    if (hoursSinceVisit < 24) return null;
    return {
      shouldFollowUp: true,
      delayHours: 24,
      message: "You identified a high-cost decision, confirmed intent to act, and did not enter Strategy Room. The system records this as hesitation, not uncertainty. The decision is not getting cheaper.",
      escalation: "final",
    };
  }

  return null;
}
