import "server-only";

/**
 * Contradiction Engine — detects user-specific contradictions from anchor fields.
 *
 * Every contradiction message interpolates actual anchor values.
 * No fixed messages. No category-level detection.
 *
 * Rules:
 * 1. Decision vs Blocker — movement attempted while preservation maintained
 * 2. Urgency vs Owner Clarity — urgency without authority
 * 3. Attempted Actions vs Persistence — prior attempts have not altered the condition
 * 4. Competing Priority vs Decision — always present, the core tension
 * 5. Stated Consequence vs Blocker — named harm being permitted by unconfroned condition
 */

import type { DiagnosticSeverity } from "@/lib/alignment/types";
import type { DecisionAnchors, AnchorContradiction } from "./anchor-types.server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

function hasContent(text: string): boolean {
  return text.trim().length > 5;
}

// ─── Individual contradiction rules ──────────────────────────────────────────

/**
 * Rule 1: Decision vs Blocker
 * The user wants to move, but is preserving a condition that prevents movement.
 */
function detectDecisionVsBlocker(
  anchors: DecisionAnchors,
): AnchorContradiction | null {
  if (!hasContent(anchors.decision) || !hasContent(anchors.blocker)) return null;

  return {
    statement: truncate(anchors.decision, 120),
    tension: truncate(anchors.blocker, 120),
    implication: `You are attempting to ${truncate(anchors.decision, 80)} while preserving the condition that prevents it: ${truncate(anchors.blocker, 80)}. The decision remains reversible — and therefore unexecuted.`,
    severity: "high",
  };
}

/**
 * Rule 2: Urgency vs Owner Clarity
 * The user describes urgency, but ownership is absent or contested.
 */
function detectUrgencyVsOwner(
  anchors: DecisionAnchors,
): AnchorContradiction | null {
  if (!hasContent(anchors.urgency)) return null;
  if (anchors.ownerClarity === "clear") return null;

  const ownerDescription =
    anchors.ownerClarity === "absent"
      ? "no one owns"
      : anchors.ownerClarity === "contested"
        ? "ownership is contested for"
        : "the stated owner lacks real authority over";

  return {
    statement: `Urgency: ${truncate(anchors.urgency, 100)}`,
    tension: `${ownerDescription} this decision`,
    implication: `You describe urgency — ${truncate(anchors.urgency, 60)} — but ${ownerDescription} the decision. Urgency without authority produces chaos, not speed.`,
    severity: anchors.ownerClarity === "absent" ? "high" : "medium",
  };
}

/**
 * Rule 3: Attempted Actions vs Persistence
 * The user has tried before, but the condition persists unchanged.
 */
function detectAttemptedVsPersistence(
  anchors: DecisionAnchors,
): AnchorContradiction | null {
  if (anchors.attemptedActions.length === 0) return null;
  if (!hasContent(anchors.blocker)) return null;

  const attempts = anchors.attemptedActions
    .slice(0, 2)
    .map((a) => truncate(a, 80))
    .join("; ");

  return {
    statement: `Prior actions: ${attempts}`,
    tension: `The condition persists: ${truncate(anchors.blocker, 100)}`,
    implication: `You have already tried: ${attempts}. The condition has not changed. Repeating the same type of correction will not produce a different result.`,
    severity: "medium",
  };
}

/**
 * Rule 4: Competing Priority vs Decision (CORE — always present when both exist)
 * The user is holding two incompatible positions simultaneously.
 */
function detectCompetingPriority(
  anchors: DecisionAnchors,
): AnchorContradiction | null {
  if (!hasContent(anchors.decision) || !hasContent(anchors.competingPriority)) {
    return null;
  }

  return {
    statement: truncate(anchors.decision, 120),
    tension: truncate(anchors.competingPriority, 120),
    implication: `You are holding two positions at the same time: ${truncate(anchors.decision, 80)} and ${truncate(anchors.competingPriority, 80)}. Both cannot be executed together. Until one takes priority, execution will not stabilise.`,
    severity: "high",
  };
}

/**
 * Rule 5: Stated Consequence vs Blocker
 * The user names serious harm, but the blocker that permits it remains in place.
 */
function detectConsequenceVsBlocker(
  anchors: DecisionAnchors,
): AnchorContradiction | null {
  if (!hasContent(anchors.statedConsequence) || !hasContent(anchors.blocker)) {
    return null;
  }

  // Only fire if the consequence sounds material (not generic)
  if (anchors.statedConsequence.length < 20) return null;

  return {
    statement: `You named this consequence: ${truncate(anchors.statedConsequence, 100)}`,
    tension: `But this condition remains: ${truncate(anchors.blocker, 100)}`,
    implication: `The consequence you described — ${truncate(anchors.statedConsequence, 60)} — is being permitted by the condition you have not removed: ${truncate(anchors.blocker, 60)}.`,
    severity: "high",
  };
}

// ─── Main detection function ─────────────────────────────────────────────────

type ContradictionRule = (anchors: DecisionAnchors) => AnchorContradiction | null;

const RULES: ContradictionRule[] = [
  detectCompetingPriority,     // Core tension — always checked first
  detectDecisionVsBlocker,
  detectUrgencyVsOwner,
  detectConsequenceVsBlocker,
  detectAttemptedVsPersistence,
];

/**
 * Detect user-specific contradictions from decision anchors.
 *
 * Returns all contradictions found, ordered by severity.
 * The first contradiction is always the primary tension.
 */
export function detectAnchorContradictions(
  anchors: DecisionAnchors,
): AnchorContradiction[] {
  const contradictions: AnchorContradiction[] = [];

  for (const rule of RULES) {
    const result = rule(anchors);
    if (result) {
      contradictions.push(result);
    }
  }

  // Sort by severity: critical > high > medium > low
  const severityOrder: Record<DiagnosticSeverity, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  return contradictions.sort(
    (a, b) => severityOrder[b.severity] - severityOrder[a.severity],
  );
}
