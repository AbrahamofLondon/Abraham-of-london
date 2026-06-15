/**
 * lib/living-intelligence/living-recommendation-engine.ts
 *
 * Produces governed recommendations for each detected contradiction.
 *
 * The recommendation engine must never fabricate:
 *   - Stripe IDs
 *   - Prices
 *   - Source claims
 *   - Publication status
 *   - Access permission
 *
 * Recommendations are based solely on the estate snapshot and the
 * source-of-truth hierarchy.
 */

import type { Contradiction, Recommendation, RecommendationAction } from "./estate-state-contract";

function mapSeverityToPriority(severity: string): "critical" | "high" | "medium" | "low" {
  switch (severity) {
    case "fatal_build_blocker":
    case "commercial_safety_blocker":
    case "checkout_bypass":
      return "critical";
    case "governance_contradiction":
    case "publication_lifecycle_conflict":
    case "source_of_truth_conflict":
      return "high";
    case "content_route_failure":
    case "storefront_gap":
    case "narrative_drift":
    case "test_drift":
      return "medium";
    case "owner_decision_required":
      return "high";
    case "governed_tension":
    case "informational_note":
      return "low";
    default:
      return "medium";
  }
}

function deriveAction(contradiction: Contradiction): RecommendationAction {
  switch (contradiction.severity) {
    case "fatal_build_blocker":
      return "hold_deployment";
    case "commercial_safety_blocker":
    case "checkout_bypass":
      return "block_checkout";
    case "governance_contradiction":
      return "update_registry";
    case "publication_lifecycle_conflict":
    case "source_of_truth_conflict":
      return "request_owner_decision";
    case "content_route_failure":
      return "add_route";
    case "storefront_gap":
      return "update_storefront";
    case "narrative_drift":
      return "remove_public_claim";
    case "test_drift":
      return "update_test";
    case "owner_decision_required":
      return "request_owner_decision";
    case "governed_tension":
      return "mark_as_governed_tension";
    case "informational_note":
      return "no_action_required";
    default:
      return "no_action_required";
  }
}

function deriveTarget(contradiction: Contradiction): string {
  // Extract the first domain as the primary target
  if (contradiction.domains.length > 0) {
    return contradiction.domains[0] ?? "unknown";
  }
  return "unknown";
}

function isAutoSafe(contradiction: Contradiction): boolean {
  // Only informational notes and governed tensions are auto-safe
  return (
    contradiction.severity === "informational_note" ||
    contradiction.severity === "governed_tension"
  );
}

export function generateRecommendations(contradictions: Contradiction[]): Recommendation[] {
  return contradictions.map((contradiction) => ({
    action: deriveAction(contradiction),
    target: deriveTarget(contradiction),
    reason: contradiction.recommendation,
    priority: mapSeverityToPriority(contradiction.severity),
    autoSafe: isAutoSafe(contradiction),
  }));
}
