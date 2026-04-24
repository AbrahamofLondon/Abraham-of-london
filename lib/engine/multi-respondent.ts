/**
 * #5 — Multi-Respondent Architecture
 *
 * WHY IRREPLICABLE: Creates network effects. Each additional respondent
 * makes the assessment more accurate AND reveals the gap between
 * self-perception and external reality. The gap itself is diagnostic.
 */

export type RespondentView = {
  respondentId: string;
  role: string;
  relationship: "self" | "peer" | "direct_report" | "manager" | "board" | "external";
  scores: Record<string, number>;
  completedAt: string;
};

export type DivergenceAnalysis = {
  domain: string;
  selfScore: number;
  othersMean: number;
  gap: number;
  direction: "self_overstates" | "self_understates" | "aligned";
  blindSpot: boolean;
  narrative: string;
};

export type MultiRespondentResult = {
  respondentCount: number;
  selfIncluded: boolean;
  /** Per-domain divergence between self and others */
  divergences: DivergenceAnalysis[];
  /** Overall self-awareness score (how close self-view matches others) */
  selfAwarenessScore: number;
  /** The single biggest blind spot */
  primaryBlindSpot: DivergenceAnalysis | null;
  /** What the multi-source data proves that single-source cannot */
  uniqueInsight: string;
  /** Confidence multiplier from multi-source */
  confidenceMultiplier: number;
};

export function analyseMultiRespondent(
  selfView: RespondentView | null,
  otherViews: RespondentView[],
): MultiRespondentResult {
  if (otherViews.length === 0) {
    return {
      respondentCount: selfView ? 1 : 0,
      selfIncluded: !!selfView,
      divergences: [],
      selfAwarenessScore: 0,
      primaryBlindSpot: null,
      uniqueInsight: "Single-source assessment. Add respondents to reveal blind spots.",
      confidenceMultiplier: 1.0,
    };
  }

  const allDomains = new Set<string>();
  if (selfView) Object.keys(selfView.scores).forEach((d) => allDomains.add(d));
  otherViews.forEach((v) => Object.keys(v.scores).forEach((d) => allDomains.add(d)));

  const divergences: DivergenceAnalysis[] = [];

  for (const domain of allDomains) {
    const selfScore = selfView?.scores[domain];
    if (selfScore === undefined) continue;

    const otherScores = otherViews
      .map((v) => v.scores[domain])
      .filter((s): s is number => s !== undefined);

    if (otherScores.length === 0) continue;

    const othersMean = Math.round(otherScores.reduce((s, v) => s + v, 0) / otherScores.length);
    const gap = selfScore - othersMean;
    const absGap = Math.abs(gap);

    const direction: DivergenceAnalysis["direction"] =
      gap > 10 ? "self_overstates"
      : gap < -10 ? "self_understates"
      : "aligned";

    const blindSpot = absGap >= 20;

    const narrative = blindSpot
      ? gap > 0
        ? `You scored ${domain} at ${selfScore}%. Others see it at ${othersMean}%. A ${absGap}-point overestimate — you believe this is stronger than others experience it.`
        : `You scored ${domain} at ${selfScore}%. Others see it at ${othersMean}%. A ${absGap}-point underestimate — others see more strength here than you do.`
      : `${domain}: self-view (${selfScore}%) aligns with others (${othersMean}%). Gap: ${absGap} points.`;

    divergences.push({ domain, selfScore, othersMean, gap, direction, blindSpot, narrative });
  }

  // Self-awareness score: inverse of average absolute gap
  const avgAbsGap = divergences.length > 0
    ? divergences.reduce((s, d) => s + Math.abs(d.gap), 0) / divergences.length
    : 0;
  const selfAwarenessScore = Math.round(Math.max(0, 100 - avgAbsGap * 2));

  // Primary blind spot
  const blindSpots = divergences.filter((d) => d.blindSpot).sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
  const primaryBlindSpot = blindSpots[0] ?? null;

  // Confidence multiplier from respondent count
  const confidenceMultiplier = Math.min(2.0, 1.0 + Math.log(otherViews.length + 1) / Math.log(10));

  const uniqueInsight = primaryBlindSpot
    ? `Multi-respondent data reveals: ${primaryBlindSpot.narrative} This blind spot is invisible in single-source assessment.`
    : selfAwarenessScore >= 80
    ? "Multi-respondent data confirms self-assessment accuracy. Self-awareness is high."
    : "Multi-respondent data shows moderate alignment between self-view and external view.";

  return {
    respondentCount: otherViews.length + (selfView ? 1 : 0),
    selfIncluded: !!selfView,
    divergences,
    selfAwarenessScore,
    primaryBlindSpot,
    uniqueInsight,
    confidenceMultiplier,
  };
}
