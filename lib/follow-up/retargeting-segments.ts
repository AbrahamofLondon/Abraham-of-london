/**
 * Retargeting Segments — pressure statements, not ads.
 *
 * Signal-driven segments from spine data. No guesswork.
 * Every impression feels like the system is watching them.
 * Because it is.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type RetargetSegment = "high_intent" | "accuracy_confirmed" | "breach_pattern" | "high_exposure" | "exclude";

export type RetargetCreative = {
  segment: RetargetSegment;
  type: "cost_continuation" | "pattern_exposure" | "authority_challenge" | "social_proof" | "economic_anchor";
  headline: string;
  body: string;
  cta: string;
  ctaHref: string;
};

export type RetargetProfile = {
  segment: RetargetSegment;
  creatives: RetargetCreative[];
  frequencyCap: number; // impressions per day
  durationDays: number;
  exclude: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// SEGMENT CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export function classifyRetargetSegment(spine: IntelligenceSpine): RetargetSegment {
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const intent = spine.preCommitment?.willing48h ?? false;
  const accuracy = spine.accuracyFeedback?.response;
  const breaches = spine.execution?.breachCount ?? 0;

  // Exclude: low cost + no intent
  if (cost < 1000 && !intent) return "exclude";

  // Priority order
  if (cost >= 20000) return "high_exposure";
  if (breaches >= 1) return "breach_pattern";
  if (accuracy === "yes") return "accuracy_confirmed";
  if (intent) return "high_intent";

  return "exclude";
}

// ─────────────────────────────────────────────────────────────────────────────
// CREATIVE GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export function buildRetargetProfile(spine: IntelligenceSpine): RetargetProfile {
  const segment = classifyRetargetSegment(spine);
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;

  if (segment === "exclude") {
    return { segment, creatives: [], frequencyCap: 0, durationDays: 0, exclude: true };
  }

  const creatives: RetargetCreative[] = [];

  // Cost continuation (all segments except exclude)
  creatives.push({
    segment,
    type: "cost_continuation",
    headline: "The cost did not pause.",
    body: cost > 0
      ? `You identified an issue costing £${cost.toLocaleString()}/month. You did not act. The cost continued.`
      : "You identified the issue. You did not act. The cost did not pause. It continued.",
    cta: "See what this is really costing",
    ctaHref: "/diagnostics/executive-reporting",
  });

  // Pattern exposure (breach segment)
  if (segment === "breach_pattern") {
    creatives.push({
      segment,
      type: "pattern_exposure",
      headline: "You don't have a difficult decision.",
      body: "You have a repeated avoidance pattern. That's why nothing changed.",
      cta: "Break the pattern",
      ctaHref: "/strategy-room",
    });
  }

  // Authority challenge (high intent or high exposure)
  if (segment === "high_intent" || segment === "high_exposure") {
    creatives.push({
      segment,
      type: "authority_challenge",
      headline: "If you need approval, you are not the decision owner.",
      body: "And until that changes, the outcome won't.",
      cta: "Test the structure",
      ctaHref: "/diagnostics/constitutional-diagnostic",
    });
  }

  // Economic anchor (high exposure)
  if (segment === "high_exposure" && cost > 0) {
    creatives.push({
      segment,
      type: "economic_anchor",
      headline: `£295 feels expensive until the problem costs £${cost.toLocaleString()}.`,
      body: "After that, it feels irrelevant.",
      cta: "See the real cost",
      ctaHref: "/diagnostics/executive-reporting",
    });
  }

  // Accuracy confirmed
  if (segment === "accuracy_confirmed") {
    creatives.push({
      segment,
      type: "social_proof",
      headline: "You already trust the diagnosis.",
      body: "The question is not whether it's accurate. It's whether you act on it.",
      cta: "Act on it",
      ctaHref: "/diagnostics/executive-reporting",
    });
  }

  // Frequency + duration by segment
  const frequencyCap = segment === "high_exposure" ? 3 : segment === "high_intent" ? 2 : 1;
  const durationDays = segment === "high_exposure" ? 14 : 10;

  return { segment, creatives, frequencyCap, durationDays, exclude: false };
}

/**
 * Generate dynamic personalised creative from spine.
 * The impression feels like the system is watching them — because it is.
 */
export function personaliseCreative(spine: IntelligenceSpine, hoursSinceVisit: number): RetargetCreative | null {
  const segment = classifyRetargetSegment(spine);
  if (segment === "exclude") return null;

  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const dailyCost = Math.round(cost / 30);
  const daysSince = Math.round(hoursSinceVisit / 24);
  const accrued = dailyCost * daysSince;

  if (cost > 0 && daysSince >= 1) {
    return {
      segment,
      type: "cost_continuation",
      headline: `You've waited ${daysSince} day${daysSince === 1 ? "" : "s"}.`,
      body: `Estimated cost: £${accrued.toLocaleString()}. Nothing improved. This is what delay looks like.`,
      cta: "Resume diagnostic",
      ctaHref: "/diagnostics/fast",
    };
  }

  return null;
}
