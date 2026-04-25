/**
 * Decision Credit Score — behavioural reputation metric.
 *
 * 0-100. Based on: action follow-through, breach frequency,
 * verified impact quality, consistency over time.
 *
 * Surfaced to user: "Your Decision Score: 62 (Declining)"
 * Status pressure: "Leaders in your category average: 78"
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";

export type DecisionCreditScore = {
  score: number;
  trend: "improving" | "stable" | "declining";
  components: {
    followThrough: number;    // 0-30
    breachPenalty: number;     // 0-25 (subtracted)
    impactQuality: number;    // 0-25
    consistency: number;       // 0-20
  };
  label: string;
};

/**
 * Compute decision credit score from spine + history.
 */
export function computeDecisionCreditScore(
  currentSpine: IntelligenceSpine,
  priorSpines?: IntelligenceSpine[],
): DecisionCreditScore {
  const all = [...(priorSpines ?? []), currentSpine];

  // Follow-through: how often action was taken when committed
  const committed = all.filter((s) => s.preCommitment?.willing48h);
  const acted = committed.filter((s) => s.execution?.actionTaken);
  const followThrough = committed.length > 0 ? Math.round((acted.length / committed.length) * 30) : 15;

  // Breach penalty
  const totalBreaches = all.reduce((sum, s) => sum + (s.execution?.breachCount ?? 0), 0);
  const breachPenalty = Math.min(25, totalBreaches * 8);

  // Impact quality
  const impacts = all.map((s) => s.execution?.verifiedImpact).filter(Boolean);
  const structural = impacts.filter((i) => i === "structural_change").length;
  const impactQuality = impacts.length > 0 ? Math.round((structural / impacts.length) * 25) : 10;

  // Consistency: integrity score stability
  const integrityScores = all.map((s) => s.integrityScore ?? 1);
  const avgIntegrity = integrityScores.reduce((a, b) => a + b, 0) / integrityScores.length;
  const consistency = Math.round(avgIntegrity * 20);

  const raw = followThrough - breachPenalty + impactQuality + consistency;
  const score = Math.max(0, Math.min(100, raw));

  // Trend: compare last 2 spines
  let trend: DecisionCreditScore["trend"] = "stable";
  if (priorSpines && priorSpines.length > 0) {
    const prevScore = computeDecisionCreditScore(priorSpines[priorSpines.length - 1]!, priorSpines.slice(0, -1));
    if (score > prevScore.score + 5) trend = "improving";
    else if (score < prevScore.score - 5) trend = "declining";
  }

  const label = score >= 80 ? "Strong" : score >= 60 ? "Moderate" : score >= 40 ? "Weak" : "Critical";

  return {
    score,
    trend,
    components: { followThrough, breachPenalty, impactQuality, consistency },
    label,
  };
}

/**
 * Format for display.
 */
export function formatCreditScore(dcs: DecisionCreditScore): string {
  const trendLabel = dcs.trend === "improving" ? "Improving" : dcs.trend === "declining" ? "Declining" : "Stable";
  return `Your Decision Score: ${dcs.score} (${trendLabel})`;
}
