import { listCaseMemories, listRecommendationMemory } from "./memory-store";

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function evaluateRouteQuality(): {
  routeQualityScore: number;
  recommendationEffectivenessScore: number;
  driftFlags: string[];
} {
  const cases = listCaseMemories();
  const driftFlags: string[] = [];

  if (!cases.length) {
    return {
      routeQualityScore: 0,
      recommendationEffectivenessScore: 0,
      driftFlags: ["No institutional memory available yet."],
    };
  }

  const total = cases.length;
  const escalations = cases.filter((x) => x.latestRoute === "STRATEGY").length;
  const diagnostics = cases.filter((x) => x.latestRoute === "DIAGNOSTIC").length;
  const rejections = cases.filter((x) => x.latestRoute === "REJECT").length;

  let routeQualityScore = 100;

  if (escalations / total > 0.45) {
    driftFlags.push("Escalation rate appears unusually high.");
    routeQualityScore -= 18;
  }

  if (rejections / total > 0.55) {
    driftFlags.push("Rejection rate appears unusually high.");
    routeQualityScore -= 14;
  }

  if (diagnostics / total < 0.15) {
    driftFlags.push("Diagnostic holding route may be underused.");
    routeQualityScore -= 12;
  }

  const allRecs = cases.flatMap((item) => listRecommendationMemory(item.caseKey));
  const reviewed = allRecs.filter((x) => x.outcome !== "UNKNOWN");

  let recommendationEffectivenessScore = 50;

  if (reviewed.length > 0) {
    const successful = reviewed.filter(
      (x) => x.outcome === "SUCCEEDED" || x.outcome === "ADOPTED" || x.outcome === "PARTIAL",
    ).length;

    recommendationEffectivenessScore = round((successful / reviewed.length) * 100, 2);

    if (recommendationEffectivenessScore < 45) {
      driftFlags.push("Recommendation effectiveness is deteriorating.");
    }
  } else {
    driftFlags.push("Recommendation outcomes are not being reviewed consistently.");
  }

  return {
    routeQualityScore: Math.max(0, round(routeQualityScore, 2)),
    recommendationEffectivenessScore,
    driftFlags,
  };
}