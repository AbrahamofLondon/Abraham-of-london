/**
 * Multi-User Collision Detection — organisational truth gaps.
 *
 * When multiple users from the same org run assessments,
 * detect contradictions between their perceptions.
 *
 * CEO says: "Decision ownership is clear"
 * Team says: "Ownership is unclear"
 * Output: "Structural contradiction between leadership perception and operational reality."
 *
 * This is where £10k+ deals come from.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type CollisionType =
  | "authority_perception_gap"
  | "blocker_contradiction"
  | "cost_estimate_divergence"
  | "condition_class_mismatch";

export type UserCollision = {
  type: CollisionType;
  userA: { email: string; role?: string; claim: string };
  userB: { email: string; role?: string; claim: string };
  severity: "low" | "medium" | "high" | "critical";
  message: string;
};

export type CollisionReport = {
  organisationKey: string;
  collisions: UserCollision[];
  structuralContradiction: boolean;
  summary: string;
};

/**
 * Detect collisions between spines from the same organisation.
 */
export function detectCollisions(spines: IntelligenceSpine[], organisationKey: string): CollisionReport {
  const collisions: UserCollision[] = [];

  for (let i = 0; i < spines.length; i++) {
    for (let j = i + 1; j < spines.length; j++) {
      const a = spines[i]!;
      const b = spines[j]!;

      // Authority perception gap
      if (a.case.claimedOwner && b.case.claimedOwner) {
        const aOwner = a.case.claimedOwner.toLowerCase();
        const bOwner = b.case.claimedOwner.toLowerCase();
        if (aOwner !== bOwner && a.case.decision && b.case.decision) {
          // Check if they're describing the same decision area
          const decisionOverlap = tokenOverlap(a.case.decision, b.case.decision);
          if (decisionOverlap > 0.2) {
            collisions.push({
              type: "authority_perception_gap",
              userA: { email: a.email ?? "unknown", role: a.case.claimedOwner, claim: `Owner: "${a.case.claimedOwner}"` },
              userB: { email: b.email ?? "unknown", role: b.case.claimedOwner, claim: `Owner: "${b.case.claimedOwner}"` },
              severity: "high",
              message: `Two users describe the same decision area but name different owners. This is a structural authority gap, not a communication problem.`,
            });
          }
        }
      }

      // Condition class mismatch on same decision
      if (a.deterministic.conditionClass !== b.deterministic.conditionClass) {
        const decisionOverlap = tokenOverlap(a.case.decision, b.case.decision);
        if (decisionOverlap > 0.15) {
          collisions.push({
            type: "condition_class_mismatch",
            userA: { email: a.email ?? "unknown", claim: `Condition: ${a.deterministic.conditionClass}` },
            userB: { email: b.email ?? "unknown", claim: `Condition: ${b.deterministic.conditionClass}` },
            severity: "critical",
            message: `Users perceive the same decision as fundamentally different types of problems (${a.deterministic.conditionClass} vs ${b.deterministic.conditionClass}). Resolution requires alignment before action.`,
          });
        }
      }

      // Cost estimate divergence
      const costA = a.economics?.estimatedMonthlyCost;
      const costB = b.economics?.estimatedMonthlyCost;
      if (costA && costB && costA > 0 && costB > 0) {
        const ratio = Math.max(costA, costB) / Math.min(costA, costB);
        if (ratio > 3) {
          collisions.push({
            type: "cost_estimate_divergence",
            userA: { email: a.email ?? "unknown", claim: `Cost: £${costA.toLocaleString()}/month` },
            userB: { email: b.email ?? "unknown", claim: `Cost: £${costB.toLocaleString()}/month` },
            severity: ratio > 5 ? "critical" : "high",
            message: `Cost estimates diverge by ${ratio.toFixed(1)}x. One party is significantly underestimating or overestimating the impact.`,
          });
        }
      }

      // Blocker contradiction
      if (a.case.blocker && b.case.blocker) {
        const blockerOverlap = tokenOverlap(a.case.blocker, b.case.blocker);
        if (blockerOverlap < 0.05 && tokenOverlap(a.case.decision, b.case.decision) > 0.15) {
          collisions.push({
            type: "blocker_contradiction",
            userA: { email: a.email ?? "unknown", claim: `Blocker: "${a.case.blocker.slice(0, 60)}"` },
            userB: { email: b.email ?? "unknown", claim: `Blocker: "${b.case.blocker.slice(0, 60)}"` },
            severity: "high",
            message: `Users describe completely different blockers for the same decision area. At least one perception is wrong.`,
          });
        }
      }
    }
  }

  const structuralContradiction = collisions.some((c) => c.severity === "critical");

  let summary: string;
  if (collisions.length === 0) {
    summary = "No perceptual contradictions detected between users in this organisation.";
  } else if (structuralContradiction) {
    summary = `${collisions.length} collision${collisions.length > 1 ? "s" : ""} detected. At least one is structural — leadership and operational reality are contradicting each other.`;
  } else {
    summary = `${collisions.length} collision${collisions.length > 1 ? "s" : ""} detected. Perceptual gaps exist but none yet rise to structural contradiction.`;
  }

  return { organisationKey, collisions, structuralContradiction, summary };
}

function tokenOverlap(a: string, b: string): number {
  const stop = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "will", "would", "could", "should", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "and", "but", "or", "not", "no", "so", "if", "this", "that", "it", "you", "your", "they", "we"]);
  const tokensA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)));
  const tokensB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stop.has(w)));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokensA) { if (tokensB.has(t)) overlap++; }
  return overlap / Math.max(tokensA.size, tokensB.size);
}
