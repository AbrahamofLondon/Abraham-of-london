import type { StoredPurposeAlignmentAssessment } from "./types";

export function buildPurposeAlignmentDashboard(
  history: StoredPurposeAlignmentAssessment[]
) {
  const latest = history[0] ?? null;
  const previous = history[1] ?? null;

  const scoreDelta =
    latest && previous ? latest.totalScore - previous.totalScore : null;

  const domainTrend =
    latest?.domainScores.map((domain) => {
      const previousDomain = previous?.domainScores.find(
        (item) => item.domain === domain.domain
      );

      return {
        domain: domain.domain,
        currentPercent: domain.percent,
        previousPercent: previousDomain?.percent ?? null,
        delta:
          typeof previousDomain?.percent === "number"
            ? domain.percent - previousDomain.percent
            : null,
      };
    }) ?? [];

  return {
    latest,
    previous,
    scoreDelta,
    domainTrend,
  };
}