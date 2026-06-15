/**
 * lib/living-intelligence/governed-learning-engine.ts
 *
 * The engine may learn:
 *   - a contradiction repeated
 *   - a prior fix regressed
 *   - a source of truth was previously accepted as authoritative
 *   - a product was owner-gated
 *   - a phrase was banned
 *   - a route repeatedly failed
 *   - a component remained decorative
 *   - a lifecycle rule was accepted
 *
 * The engine must not learn/invent:
 *   - Stripe IDs
 *   - prices
 *   - publication approval
 *   - owner approval
 *   - user consent
 *   - evidence not present
 *   - readiness state not declared
 *   - legal/financial conclusions
 *   - product capability not implemented
 */

import type { DriftMemoryStore, DriftMemoryEntry } from "./drift-memory-store";
import { getMemory } from "./drift-memory-store";

export type LearnedInsight = {
  type: "repeated_contradiction" | "regressed_fix" | "accepted_authority" | "owner_gated_product" | "banned_phrase" | "repeated_route_failure" | "decorative_component" | "accepted_lifecycle_rule";
  description: string;
  evidence: string[];
  recommendation: string;
};

// ─── Learning rules ─────────────────────────────────────────────────────────

function learnRepeatedContradictions(memory: DriftMemoryStore): LearnedInsight[] {
  const insights: LearnedInsight[] = [];
  for (const entry of memory.entries) {
    if (entry.recurrenceCount >= 3 && (entry.status === "repeated" || entry.status === "worsened")) {
      insights.push({
        type: "repeated_contradiction",
        description: `Contradiction "${entry.title}" has recurred ${entry.recurrenceCount} times without resolution.`,
        evidence: [`First seen: ${entry.firstSeen}`, `Last seen: ${entry.lastSeen}`, `Recurrence count: ${entry.recurrenceCount}`],
        recommendation: "Escalate for owner decision. A recurring unresolved contradiction indicates systemic issue, not one-time drift.",
      });
    }
  }
  return insights;
}

function learnRegressedFixes(memory: DriftMemoryStore): LearnedInsight[] {
  const insights: LearnedInsight[] = [];
  for (const entry of memory.entries) {
    if (entry.status === "regressed") {
      insights.push({
        type: "regressed_fix",
        description: `Previously resolved contradiction "${entry.title}" has regressed.`,
        evidence: [`First seen: ${entry.firstSeen}`, `Resolved at: ${entry.lastSeen}`, `Current severity: ${entry.currentSeverity}`],
        recommendation: "The previous fix may have been incomplete or was reverted. Investigate before re-applying.",
      });
    }
  }
  return insights;
}

function learnAcceptedAuthorities(memory: DriftMemoryStore): LearnedInsight[] {
  const insights: LearnedInsight[] = [];
  for (const entry of memory.entries) {
    if (entry.status === "accepted_risk" && entry.doctrineClaimId) {
      insights.push({
        type: "accepted_authority",
        description: `Owner accepted risk for "${entry.title}" related to doctrine claim ${entry.doctrineClaimId}.`,
        evidence: [`Owner decision: ${entry.ownerDecision ?? "Not recorded"}`, `Date: ${entry.ownerDecisionDate ?? "Not recorded"}`],
        recommendation: "Respect owner decision. Do not re-flag unless new evidence changes the risk profile.",
      });
    }
  }
  return insights;
}

// ─── Main learning engine ───────────────────────────────────────────────────

export function runLearningEngine(): {
  insights: LearnedInsight[];
  memory: DriftMemoryStore;
} {
  const memory = getMemory();
  const insights: LearnedInsight[] = [
    ...learnRepeatedContradictions(memory),
    ...learnRegressedFixes(memory),
    ...learnAcceptedAuthorities(memory),
  ];

  return { insights, memory };
}
