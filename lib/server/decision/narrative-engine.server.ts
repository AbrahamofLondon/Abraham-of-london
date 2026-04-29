import "server-only";

/**
 * Narrative Engine — 8-section anchor-bound output composer.
 *
 * Every section must:
 * 1. Reference at least one user anchor
 * 2. Express a contradiction OR implication
 * 3. Avoid reusable phrasing
 *
 * Falls back to classification-derived text when anchor fields are empty.
 * This is deterministic + composable — no LLM generation.
 */

import type {
  DecisionAnchors,
  AnchorContradiction,
  AnchorNarrative,
  NarrativeClassificationContext,
} from "./anchor-types.server";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

function hasContent(text: string): boolean {
  return text.trim().length > 5;
}

function joinList(items: string[], max: number = 2): string {
  const limited = items.slice(0, max);
  if (limited.length === 0) return "";
  if (limited.length === 1) return limited[0]!;
  return `${limited.slice(0, -1).join(", ")} and ${limited.at(-1)}`;
}

// ─── Section 1: Opening ──────────────────────────────────────────────────────

function composeOpening(
  anchors: DecisionAnchors,
  contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): string {
  const parts: string[] = [];

  // Reference attempted actions if available
  if (anchors.attemptedActions.length > 0) {
    const attempts = joinList(
      anchors.attemptedActions.map((a) => truncate(a, 80)),
    );
    parts.push(`You are not stuck because you lack effort. You have already tried: ${attempts}.`);
  } else {
    parts.push("You are not stuck because you lack awareness.");
  }

  // Reference the core decision
  if (hasContent(anchors.decision)) {
    parts.push(`The decision in front of you is: ${truncate(anchors.decision, 120)}.`);
  }

  // Reference the competing priority as the breakdown point
  if (hasContent(anchors.competingPriority)) {
    parts.push(
      `The breakdown is here: you have not resolved whether ${truncate(anchors.decision, 60)} should take priority over ${truncate(anchors.competingPriority, 80)}.`,
    );
  } else if (contradictions.length > 0) {
    parts.push(
      `The breakdown is structural: ${truncate(contradictions[0]!.implication, 120)}.`,
    );
  }

  return parts.join(" ");
}

// ─── Section 2: Condition ────────────────────────────────────────────────────

function composeCondition(
  anchors: DecisionAnchors,
  contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): string {
  const primary = contradictions[0];

  if (primary) {
    return `Right now, your decision is structurally unstable. You are holding two positions at the same time: ${truncate(primary.statement, 100)}, and ${truncate(primary.tension, 100)}. Both cannot be executed together.`;
  }

  if (hasContent(anchors.decision) && hasContent(anchors.blocker)) {
    return `Right now, your decision is structurally unstable. You have committed to ${truncate(anchors.decision, 80)}, but ${truncate(anchors.blocker, 80)} keeps it reversible.`;
  }

  return `The current condition is ${classification.patternLabel}. The structure is not yet stable enough to execute cleanly.`;
}

// ─── Section 3: Why it exists ────────────────────────────────────────────────

function composeWhyItExists(
  anchors: DecisionAnchors,
  _contradictions: AnchorContradiction[],
  _classification: NarrativeClassificationContext,
): string {
  const parts: string[] = [];

  parts.push("This exists because the decision has not been fully committed.");

  if (hasContent(anchors.blocker)) {
    parts.push(
      `You are still preserving: ${truncate(anchors.blocker, 120)}. That keeps the decision reversible — and therefore unexecuted.`,
    );
  }

  if (anchors.ownerClarity !== "clear") {
    const ownerReason =
      anchors.ownerClarity === "absent"
        ? "No one has been named as the decision owner."
        : anchors.ownerClarity === "contested"
          ? "Ownership of this decision is contested."
          : "The stated owner does not hold real authority.";
    parts.push(ownerReason);
  }

  return parts.join(" ");
}

// ─── Section 4: Pattern ──────────────────────────────────────────────────────

function composePattern(
  anchors: DecisionAnchors,
  _contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): string {
  if (hasContent(anchors.decision) && hasContent(anchors.competingPriority)) {
    return `This pattern appears when someone commits to ${truncate(anchors.decision, 80)}, but continues to protect ${truncate(anchors.competingPriority, 80)}. Execution stalls because the system is protecting both outcomes.`;
  }

  if (hasContent(anchors.decision)) {
    return `This pattern appears when the decision — ${truncate(anchors.decision, 80)} — has been identified but not structurally committed. The system continues to operate as though the decision is optional.`;
  }

  return `The structural pattern is ${classification.patternLabel}. ${classification.consequence}`;
}

// ─── Section 5: Cost of inaction ─────────────────────────────────────────────

function composeCostOfInaction(
  anchors: DecisionAnchors,
  _contradictions: AnchorContradiction[],
  _classification: NarrativeClassificationContext,
): AnchorNarrative["costOfInaction"] {
  const decision = hasContent(anchors.decision)
    ? truncate(anchors.decision, 60)
    : "this decision";
  const blocker = hasContent(anchors.blocker)
    ? truncate(anchors.blocker, 60)
    : "the current constraint";
  const consequence = hasContent(anchors.statedConsequence)
    ? truncate(anchors.statedConsequence, 80)
    : "the condition will compound";

  return {
    thirtyDays: `You will continue delaying ${decision} while maintaining ${blocker}. The decision window narrows but remains available.`,
    sixtyDays: `The impact will begin to show: ${consequence}. The cost of correction has increased. Options that were available 60 days ago are now constrained.`,
    ninetyDays: `${decision} will no longer be optional. It will be forced under worse conditions, with fewer options and higher cost than if it had been resolved now.`,
  };
}

// ─── Section 6: Perspective ──────────────────────────────────────────────────

function composePerspective(
  anchors: DecisionAnchors,
  contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): string {
  const tension = contradictions[0]
    ? truncate(contradictions[0].tension, 60)
    : hasContent(anchors.blocker)
      ? truncate(anchors.blocker, 60)
      : "the unresolved condition";

  switch (classification.perspectiveType) {
    case "personal":
      return `To an outside observer, this will look like hesitation — even though the real issue is ${tension}. The distinction matters to you. It will not matter to the outcome.`;
    case "team":
      return `To leadership, this appears as execution drift, not ${tension}. The team reads the gap differently from how it is being described above them.`;
    case "enterprise":
      return `To the board, this presents as governance failure, not ${tension}. At institutional level, the cause is less visible than the consequence.`;
    case "board":
      return `To external stakeholders, this reads as institutional incoherence. The internal distinction between ${tension} and strategic failure will not be visible from outside.`;
    default:
      return `The condition — ${tension} — is visible at every level, though it may be interpreted differently depending on position.`;
  }
}

// ─── Section 7: Required move ────────────────────────────────────────────────

function composeRequiredMove(
  anchors: DecisionAnchors,
  _contradictions: AnchorContradiction[],
  _classification: NarrativeClassificationContext,
): string {
  if (hasContent(anchors.decision) && hasContent(anchors.competingPriority)) {
    return `The next move is not more analysis. You must decide: will you prioritise ${truncate(anchors.decision, 80)} over ${truncate(anchors.competingPriority, 80)}? Until that is resolved, execution will not stabilise.`;
  }

  if (hasContent(anchors.decision)) {
    return `The next move is not more analysis. You must commit to ${truncate(anchors.decision, 100)} or explicitly decide not to. Deferral is not a third option.`;
  }

  return "The next move is not more analysis. The decision must be named, owned, and committed before execution can stabilise.";
}

// ─── Section 8: CTA ─────────────────────────────────────────────────────────

function composeCTA(
  anchors: DecisionAnchors,
  _contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): string {
  if (hasContent(classification.firstAction)) {
    // Bind the classification's first action to the user's anchor language
    if (hasContent(anchors.decision)) {
      return `${classification.firstAction} Start with: ${truncate(anchors.decision, 80)}.`;
    }
    return classification.firstAction;
  }

  if (hasContent(anchors.decision)) {
    return `Name the decision owner for ${truncate(anchors.decision, 80)} and set a deadline. Do both within 48 hours.`;
  }

  return "Name the decision, name the owner, set a deadline. Do all three within 48 hours.";
}

// ─── Main composer ───────────────────────────────────────────────────────────

/**
 * Compose a complete 8-section anchor-bound narrative.
 *
 * Every section references at least one user anchor. When an anchor field
 * is empty, the section falls back to classification-derived text.
 */
export function composeAnchorNarrative(
  anchors: DecisionAnchors,
  contradictions: AnchorContradiction[],
  classification: NarrativeClassificationContext,
): AnchorNarrative {
  return {
    opening: composeOpening(anchors, contradictions, classification),
    condition: composeCondition(anchors, contradictions, classification),
    whyItExists: composeWhyItExists(anchors, contradictions, classification),
    pattern: composePattern(anchors, contradictions, classification),
    costOfInaction: composeCostOfInaction(anchors, contradictions, classification),
    perspective: composePerspective(anchors, contradictions, classification),
    requiredMove: composeRequiredMove(anchors, contradictions, classification),
    cta: composeCTA(anchors, contradictions, classification),
  };
}
