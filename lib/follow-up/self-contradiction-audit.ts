/**
 * Self-Contradiction Audit — detect when the system contradicts itself.
 *
 * Checks: different outputs for similar inputs, inconsistent scoring.
 * If triggered → SystemIntegrityMode = "investigating"
 *
 * The system does not hide weakness. It contains it before it leaks.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type SelfContradiction = {
  type: "output_divergence" | "scoring_inconsistency";
  spineA: string;
  spineB: string;
  detail: string;
  severity: "low" | "medium" | "high";
};

/**
 * Compare two spines with similar inputs and check for output divergence.
 * Call this on pairs of spines with tokenOverlap > 0.3 on decision text.
 */
export function detectSelfContradiction(a: IntelligenceSpine, b: IntelligenceSpine): SelfContradiction[] {
  const contradictions: SelfContradiction[] = [];

  // Check condition class divergence for similar decisions
  if (a.deterministic.conditionClass !== b.deterministic.conditionClass) {
    contradictions.push({
      type: "output_divergence",
      spineA: a.id,
      spineB: b.id,
      detail: `Similar inputs classified differently: ${a.deterministic.conditionClass} vs ${b.deterministic.conditionClass}`,
      severity: "high",
    });
  }

  // Check C3 scoring inconsistency (>20% difference for similar inputs)
  const scoreDelta = Math.abs(a.c3.specificityScore - b.c3.specificityScore);
  if (scoreDelta > 0.2) {
    contradictions.push({
      type: "scoring_inconsistency",
      spineA: a.id,
      spineB: b.id,
      detail: `C3 scores diverge by ${(scoreDelta * 100).toFixed(0)}% for similar inputs`,
      severity: scoreDelta > 0.35 ? "high" : "medium",
    });
  }

  // Check tier divergence
  if (a.c3.tier !== b.c3.tier) {
    contradictions.push({
      type: "scoring_inconsistency",
      spineA: a.id,
      spineB: b.id,
      detail: `Same input class but different C3 tiers: ${a.c3.tier} vs ${b.c3.tier}`,
      severity: "medium",
    });
  }

  return contradictions;
}
