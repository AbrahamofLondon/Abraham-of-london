// lib/decision/recommendation-outcome-model.ts

export type RouteLevel = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type ReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STაბილIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN"
  | string;

export interface FollowupComparisonInput {
  routeBefore?: string | null;
  routeAfter?: string | null;
  readinessTierBefore?: string | null;
  readinessTierAfter?: string | null;
  clarityDelta?: number | null;
  authorityDelta?: number | null;
  convertedAfterGuidance?: boolean | null;
}

export interface FollowupComparisonResult {
  routeImproved: boolean;
  readinessImproved: boolean;
  clarityImproved: boolean;
  authorityImproved: boolean;
  routeDeltaScore: number;
  readinessDeltaScore: number;
  clarityDeltaScore: number;
  authorityDeltaScore: number;
  totalOutcomeScore: number;
}

const ROUTE_ORDER: Record<string, number> = {
  REJECT: 0,
  DIAGNOSTIC: 1,
  STRATEGY: 2,
};

const READINESS_ORDER: Record<string, number> = {
  FRAGILE: 0,
  EMERGING: 1,
  STABILIZING: 2,
  STაბილIZING: 2,
  EXECUTION_READY: 3,
  SOVEREIGN: 4,
};

function safeUpper(value: unknown): string {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function roundTo(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

export function compareFollowupOutcome(
  input: FollowupComparisonInput
): FollowupComparisonResult {
  const routeBefore = safeUpper(input.routeBefore);
  const routeAfter = safeUpper(input.routeAfter);

  const readinessBefore = safeUpper(input.readinessTierBefore);
  const readinessAfter = safeUpper(input.readinessTierAfter);

  const routeDeltaScore =
    (ROUTE_ORDER[routeAfter] ?? 0) - (ROUTE_ORDER[routeBefore] ?? 0);

  const readinessDeltaScore =
    (READINESS_ORDER[readinessAfter] ?? 0) -
    (READINESS_ORDER[readinessBefore] ?? 0);

  const clarityDeltaScore = safeNumber(input.clarityDelta, 0);
  const authorityDeltaScore = safeNumber(input.authorityDelta, 0);

  const routeImproved = routeDeltaScore > 0;
  const readinessImproved = readinessDeltaScore > 0;
  const clarityImproved = clarityDeltaScore > 0;
  const authorityImproved = authorityDeltaScore > 0;

  const conversionBonus = input.convertedAfterGuidance ? 2 : 0;

  const totalOutcomeScore = roundTo(
    routeDeltaScore * 2 +
      readinessDeltaScore * 1.5 +
      clarityDeltaScore * 0.75 +
      authorityDeltaScore * 0.75 +
      conversionBonus,
    4
  );

  return {
    routeImproved,
    readinessImproved,
    clarityImproved,
    authorityImproved,
    routeDeltaScore,
    readinessDeltaScore,
    clarityDeltaScore,
    authorityDeltaScore,
    totalOutcomeScore,
  };
}