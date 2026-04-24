/**
 * #6 — Temporal Consistency Detection
 *
 * Flags when answers reference different time frames and contradict.
 * Reveals whether misalignment is structural (consistent across time)
 * or situational (specific to recent event).
 */

export type TemporalInconsistency = {
  recentSignal: { domain: string; score: number; timeframe: string };
  historicSignal: { domain: string; score: number; timeframe: string };
  gap: number;
  classification: "structural" | "situational" | "recovering" | "degrading";
  narrative: string;
};

/**
 * Compare signals across different temporal references.
 * If "last decision" scores high but "typical behaviour" scores low,
 * the misalignment is situational — one good decision doesn't make a pattern.
 */
export function detectTemporalInconsistency(
  recentScores: Record<string, number>,
  historicScores: Record<string, number>,
  daysBetween: number,
): TemporalInconsistency[] {
  const results: TemporalInconsistency[] = [];

  for (const domain of Object.keys(recentScores)) {
    const recent = recentScores[domain];
    const historic = historicScores[domain];
    if (recent === undefined || historic === undefined) continue;

    const gap = recent - historic;
    const absGap = Math.abs(gap);
    if (absGap < 15) continue;

    const classification: TemporalInconsistency["classification"] =
      gap > 15 && daysBetween < 30 ? "situational" // recent improvement, too fast to be structural
      : gap > 15 ? "recovering" // sustained improvement
      : gap < -15 && daysBetween < 30 ? "situational" // recent decline, might be event-driven
      : "degrading"; // sustained decline

    const narrative =
      classification === "situational"
        ? `${domain} changed ${absGap} points in ${daysBetween} days. This is likely event-driven, not structural. What happened?`
        : classification === "recovering"
        ? `${domain} improved ${absGap} points over ${daysBetween} days. The intervention is producing sustained change.`
        : classification === "degrading"
        ? `${domain} declined ${absGap} points over ${daysBetween} days. The degradation is persistent, not temporary.`
        : `${domain} shifted significantly. Requires validation.`;

    results.push({
      recentSignal: { domain, score: recent, timeframe: "current" },
      historicSignal: { domain, score: historic, timeframe: `${daysBetween} days ago` },
      gap,
      classification,
      narrative,
    });
  }

  return results.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
}
