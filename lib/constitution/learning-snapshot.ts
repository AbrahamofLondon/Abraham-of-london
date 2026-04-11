import type { LearningSnapshot } from "./memory-types";
import { listCaseMemories } from "./memory-store";
import { evaluateRouteQuality } from "./route-learning";

export function buildLearningSnapshot(): LearningSnapshot {
  const cases = listCaseMemories();
  const routeEval = evaluateRouteQuality();

  return {
    generatedAt: new Date().toISOString(),
    totalCases: cases.length,
    totalEscalations: cases.filter((x) => x.latestRoute === "STRATEGY").length,
    totalDiagnostics: cases.filter((x) => x.latestRoute === "DIAGNOSTIC").length,
    totalRejections: cases.filter((x) => x.latestRoute === "REJECT").length,
    routeQualityScore: routeEval.routeQualityScore,
    recommendationEffectivenessScore: routeEval.recommendationEffectivenessScore,
    driftFlags: routeEval.driftFlags,
  };
}