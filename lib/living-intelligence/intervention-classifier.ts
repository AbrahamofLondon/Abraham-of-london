/**
 * lib/living-intelligence/intervention-classifier.ts
 *
 * Classifies each detected contradiction into an intervention type.
 *
 * The classifier determines:
 *   - Whether the issue can be auto-fixed
 *   - Whether human review is required
 *   - Whether an owner decision is required
 *   - What the suggested fix would be (if auto-fixable)
 *
 * Rules:
 *   - Fatal build blockers: never auto-fixable, always require human intervention
 *   - Commercial safety blockers: never auto-fixable, always require owner decision
 *   - Checkout bypasses: never auto-fixable, always require owner decision
 *   - Governance contradictions: may be auto-fixable if the fix is a registry update
 *   - Publication lifecycle conflicts: require owner decision (which source to trust)
 *   - Content route failures: may be auto-fixable (re-run contentlayer build)
 *   - Storefront gaps: informational, may be auto-fixable (add route)
 *   - Narrative drift: requires human review
 *   - Test drift: requires human review
 *   - Source of truth conflicts: require owner decision
 *   - Owner decisions required: by definition require owner decision
 *   - Governed tensions: informational, no action required
 *   - Informational notes: no action required
 */

import type { Contradiction, Intervention, InterventionClassification } from "./estate-state-contract";

const SEVERITY_TO_CLASSIFICATION: Record<string, InterventionClassification> = {
  fatal_build_blocker: "fatal_build_blocker",
  commercial_safety_blocker: "commercial_safety_blocker",
  checkout_bypass: "checkout_bypass",
  governance_contradiction: "governance_contradiction",
  publication_lifecycle_conflict: "publication_lifecycle_conflict",
  content_route_failure: "content_route_failure",
  storefront_gap: "storefront_gap",
  narrative_drift: "narrative_drift",
  test_drift: "test_drift",
  source_of_truth_conflict: "source_of_truth_conflict",
  owner_decision_required: "owner_decision_required",
  governed_tension: "governed_tension",
  informational_note: "informational_note",
};

function isAutoFixable(contradiction: Contradiction): boolean {
  // Never auto-fix safety or build blockers
  if (
    contradiction.severity === "fatal_build_blocker" ||
    contradiction.severity === "commercial_safety_blocker" ||
    contradiction.severity === "checkout_bypass"
  ) {
    return false;
  }

  // Content route failures may be auto-fixable (re-run build)
  if (contradiction.severity === "content_route_failure") {
    return true;
  }

  // Governance contradictions may be auto-fixable if it's a registry update
  if (contradiction.severity === "governance_contradiction") {
    return false; // Owner should decide direction
  }

  // Informational items are not actionable
  if (
    contradiction.severity === "informational_note" ||
    contradiction.severity === "governed_tension"
  ) {
    return false;
  }

  return false;
}

function requiresHumanReview(contradiction: Contradiction): boolean {
  return (
    contradiction.severity === "fatal_build_blocker" ||
    contradiction.severity === "commercial_safety_blocker" ||
    contradiction.severity === "checkout_bypass" ||
    contradiction.severity === "narrative_drift" ||
    contradiction.severity === "test_drift"
  );
}

function requiresOwnerDecision(contradiction: Contradiction): boolean {
  return (
    contradiction.requiresOwnerDecision ||
    contradiction.severity === "owner_decision_required" ||
    contradiction.severity === "source_of_truth_conflict" ||
    contradiction.severity === "publication_lifecycle_conflict"
  );
}

function suggestFix(contradiction: Contradiction): string | undefined {
  if (isAutoFixable(contradiction)) {
    return contradiction.recommendation;
  }
  return undefined;
}

export function classifyContradictions(contradictions: Contradiction[]): Intervention[] {
  return contradictions.map((contradiction) => {
    const classification = SEVERITY_TO_CLASSIFICATION[contradiction.severity] ?? "informational_note";

    return {
      classification,
      contradictionId: contradiction.id,
      title: contradiction.title,
      description: contradiction.description,
      autoFixable: isAutoFixable(contradiction),
      requiresHumanReview: requiresHumanReview(contradiction),
      requiresOwnerDecision: requiresOwnerDecision(contradiction),
      suggestedFix: suggestFix(contradiction),
    };
  });
}
