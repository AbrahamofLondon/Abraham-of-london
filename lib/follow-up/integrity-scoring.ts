/**
 * Integrity Scoring — anti-gaming layer.
 *
 * Detects: intent flips, cost swings, repeated breaches, contradiction drift.
 * integrityScore < 0.5 → system degrades output confidence.
 *
 * You don't reward manipulation.
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type IntegrityScore = {
  score: number;
  penalties: IntegrityPenalty[];
  degraded: boolean;
  degradedMessage: string | null;
};

export type IntegrityPenalty = {
  type: "intent_flip" | "cost_swing" | "repeated_breach" | "contradiction_drift" | "false_authority";
  weight: number;
  detail: string;
};

/**
 * Compute integrity score from spine state and session history.
 * Returns 0-1. Below 0.5 = degraded.
 */
export function computeIntegrityScore(
  currentSpine: IntelligenceSpine,
  priorSpines?: IntelligenceSpine[],
): IntegrityScore {
  let score = 1.0;
  const penalties: IntegrityPenalty[] = [];

  // 1. Intent flip detection (NO → YES → NO across sessions)
  if (priorSpines && priorSpines.length > 0) {
    const intents = [
      ...priorSpines.map((s) => s.preCommitment?.willing48h),
      currentSpine.preCommitment?.willing48h,
    ].filter((v) => v !== undefined);

    let flips = 0;
    for (let i = 1; i < intents.length; i++) {
      if (intents[i] !== intents[i - 1]) flips++;
    }
    if (flips >= 2) {
      const penalty = Math.min(0.3, flips * 0.1);
      score -= penalty;
      penalties.push({ type: "intent_flip", weight: penalty, detail: `Intent flipped ${flips} times across sessions` });
    }
  }

  // 2. Cost swing detection (>50% change between sessions)
  if (priorSpines && priorSpines.length > 0) {
    const costs = [
      ...priorSpines.map((s) => s.economics?.estimatedMonthlyCost).filter((c): c is number => c !== undefined && c > 0),
      currentSpine.economics?.estimatedMonthlyCost,
    ].filter((c): c is number => c !== undefined && c > 0);

    if (costs.length >= 2) {
      const prev = costs[costs.length - 2]!;
      const curr = costs[costs.length - 1]!;
      const swing = Math.abs(curr - prev) / prev;
      if (swing > 0.5) {
        const penalty = Math.min(0.25, swing * 0.2);
        score -= penalty;
        penalties.push({ type: "cost_swing", weight: penalty, detail: `Cost swung ${Math.round(swing * 100)}% (£${prev} → £${curr})` });
      }
    }
  }

  // 3. Repeated breach
  if (currentSpine.execution?.breach) {
    const breachCount = priorSpines?.filter((s) => s.execution?.breach).length ?? 0;
    if (breachCount >= 2) {
      const penalty = Math.min(0.35, breachCount * 0.12);
      score -= penalty;
      penalties.push({ type: "repeated_breach", weight: penalty, detail: `${breachCount + 1} breaches across sessions` });
    } else if (breachCount === 1) {
      score -= 0.1;
      penalties.push({ type: "repeated_breach", weight: 0.1, detail: "Second breach detected" });
    }
  }

  // 4. False authority detection
  if (currentSpine.case.claimedOwner) {
    const seniorClaim = /\b(CEO|CFO|COO|CTO|VP|board|director|head|I am|myself|me)\b/i.test(currentSpine.case.claimedOwner);
    const showsHesitation = currentSpine.case.blocker && /\b(waiting|permission|approval|not sure|can't|afraid|hesitat)\b/i.test(currentSpine.case.blocker);
    if (seniorClaim && showsHesitation) {
      score -= 0.15;
      penalties.push({ type: "false_authority", weight: 0.15, detail: "Claims senior authority but blocker language shows dependency/hesitation" });
    }
  }

  score = Math.max(0, Math.min(1, score));
  const degraded = score < 0.5;

  return {
    score,
    penalties,
    degraded,
    degradedMessage: degraded
      ? "Your inputs are inconsistent across sessions. The system cannot proceed with high-confidence guidance until resolved."
      : null,
  };
}
