import { listConstitutionalEvents, listDriftFlags, listTribunalCases } from "./observability-store";
import type { ConstitutionalDashboardSnapshot } from "./observability-types";
import { evaluateRouteQuality } from "./route-learning";

function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function buildConstitutionalDashboardSnapshot(): ConstitutionalDashboardSnapshot {
  const events = listConstitutionalEvents();
  const drifts = listDriftFlags();
  const tribunals = listTribunalCases();
  const routeEval = evaluateRouteQuality();

  const totalBreaches = events.filter((x) => x.severity === "BREACH").length;
  const totalCriticals = events.filter((x) => x.severity === "CRITICAL").length;
  const openTribunals = tribunals.filter(
    (x) => x.status === "OPEN" || x.status === "UNDER_REVIEW",
  ).length;

  const tribunalPressureScore = round(
    openTribunals * 12 + totalCriticals * 8 + totalBreaches * 4,
    2,
  );

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    totalBreaches,
    totalCriticals,
    openTribunals,
    driftFlagCount: drifts.length,
    routeIntegrityScore: routeEval.routeQualityScore,
    recommendationIntegrityScore: routeEval.recommendationEffectivenessScore,
    tribunalPressureScore,
  };
}