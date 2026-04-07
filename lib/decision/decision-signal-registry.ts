// lib/decision/decision-signal-registry.ts

import {
  detectDriftAlert,
  detectDriftAlerts,
  type DriftAlertCandidate,
  type DriftAlertResult,
  type DriftSeverity,
} from "@/lib/decision/recommendation-drift-alerts";
import {
  calculateResonanceSync,
  scoreToBand,
  type ResonanceBand,
  type ResonanceInputRecord,
  type ResonanceResult,
} from "@/lib/ogr/simulation-engine";

export type DecisionSignalMetricKey =
  | "contextualWeight"
  | "usefulnessScore"
  | "resonanceScore"
  | "confidenceScore"
  | string;

export type DecisionSignalSource =
  | "DRIFT_ENGINE"
  | "RESONANCE_ENGINE"
  | "MANUAL"
  | "SYSTEM";

export type DecisionSignalDirection = "UP" | "DOWN" | "FLAT";

export type DecisionSignalSeverity =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type DecisionSignalStatus =
  | "HEALTHY"
  | "WATCH"
  | "ELEVATED"
  | "CRITICAL";

export type DecisionSignalScope = {
  assetId: string;
  assetTitle: string;
  assetKind: string;
  contextType: string;
  contextValue: string;
};

export type DecisionSignalMetricSnapshot = {
  metricKey: DecisionSignalMetricKey;
  label: string;
  currentValue: number;
  previousValue: number | null;
  delta: number;
  deltaPercent: number;
  direction: DecisionSignalDirection;
  severity: DecisionSignalSeverity;
  source: DecisionSignalSource;
  message?: string;
};

export type DecisionSignalRegistryInput = DecisionSignalScope & {
  driftCandidates?: DriftAlertCandidate[];
  resonanceInputs?: ResonanceInputRecord[];
  confidenceScore?: number | null;
  metadata?: Record<string, unknown>;
};

export type DecisionSignalRegistryResult = DecisionSignalScope & {
  registryKey: string;
  status: DecisionSignalStatus;
  highestSeverity: DecisionSignalSeverity;
  healthScore: number;
  driftScore: number;
  resonanceScore: number;
  confidenceScore: number | null;
  resonanceBand: ResonanceBand | null;
  alertCount: number;
  alerts: DriftAlertResult[];
  metrics: DecisionSignalMetricSnapshot[];
  generatedAt: string;
  metadata: Record<string, unknown>;
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function roundTo(value: number, places = 4): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toRegistryKey(scope: DecisionSignalScope): string {
  return [
    normalizeString(scope.assetId),
    normalizeString(scope.contextType).toLowerCase(),
    normalizeString(scope.contextValue).toLowerCase(),
  ].join("::");
}

function mapDriftSeverity(
  severity: DriftSeverity | null | undefined,
): DecisionSignalSeverity {
  switch (severity) {
    case "LOW":
      return "LOW";
    case "MEDIUM":
      return "MEDIUM";
    case "HIGH":
      return "HIGH";
    case "CRITICAL":
      return "CRITICAL";
    default:
      return "NONE";
  }
}

function compareSeverity(
  a: DecisionSignalSeverity,
  b: DecisionSignalSeverity,
): number {
  const order: Record<DecisionSignalSeverity, number> = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  return order[a] - order[b];
}

function getHighestSeverity(
  severities: DecisionSignalSeverity[],
): DecisionSignalSeverity {
  return severities.reduce<DecisionSignalSeverity>(
    (highest, current) =>
      compareSeverity(current, highest) > 0 ? current : highest,
    "NONE",
  );
}

function mapStatus(highestSeverity: DecisionSignalSeverity): DecisionSignalStatus {
  switch (highestSeverity) {
    case "CRITICAL":
      return "CRITICAL";
    case "HIGH":
      return "ELEVATED";
    case "MEDIUM":
      return "WATCH";
    case "LOW":
    case "NONE":
    default:
      return "HEALTHY";
  }
}

function severityPenalty(severity: DecisionSignalSeverity): number {
  switch (severity) {
    case "LOW":
      return 5;
    case "MEDIUM":
      return 15;
    case "HIGH":
      return 30;
    case "CRITICAL":
      return 50;
    case "NONE":
    default:
      return 0;
  }
}

function buildMetricLabel(metricKey: string): string {
  const raw = normalizeString(metricKey);
  if (!raw) return "Unknown Metric";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildDriftMetricSnapshots(
  alerts: DriftAlertResult[],
): DecisionSignalMetricSnapshot[] {
  return alerts.map((alert) => ({
    metricKey: alert.metricKey,
    label: alert.label,
    currentValue: alert.currentValue,
    previousValue: alert.previousValue,
    delta: alert.delta,
    deltaPercent: alert.deltaPercent,
    direction: alert.direction,
    severity: mapDriftSeverity(alert.severity),
    source: "DRIFT_ENGINE",
    message: alert.message,
  }));
}

function buildResonanceMetricSnapshots(
  resonance: ResonanceResult | null,
  confidenceScore: number | null,
): DecisionSignalMetricSnapshot[] {
  if (!resonance) return [];

  const items: DecisionSignalMetricSnapshot[] = [
    {
      metricKey: "resonanceScore",
      label: "Resonance Score",
      currentValue: roundTo(resonance.score, 4),
      previousValue: null,
      delta: 0,
      deltaPercent: 0,
      direction: "FLAT",
      severity: "NONE",
      source: "RESONANCE_ENGINE",
      message: resonance.band
        ? `Resonance classified as ${resonance.band}.`
        : undefined,
    },
  ];

  if (typeof confidenceScore === "number") {
    items.push({
      metricKey: "confidenceScore",
      label: "Confidence Score",
      currentValue: roundTo(confidenceScore, 4),
      previousValue: null,
      delta: 0,
      deltaPercent: 0,
      direction: "FLAT",
      severity: "NONE",
      source: "RESONANCE_ENGINE",
      message: "Weighted certainty across resonance inputs.",
    });
  }

  return items;
}

function computeDriftScore(alerts: DriftAlertResult[]): number {
  if (!alerts.length) return 100;

  const penalty = alerts.reduce((sum, alert) => {
    return sum + severityPenalty(mapDriftSeverity(alert.severity));
  }, 0);

  return clamp(100 - penalty, 0, 100);
}

function computeHealthScore(args: {
  driftScore: number;
  resonanceScore: number;
  confidenceScore: number | null;
  highestSeverity: DecisionSignalSeverity;
}): number {
  const baseConfidence =
    typeof args.confidenceScore === "number" ? args.confidenceScore : 1;

  const weighted =
    args.driftScore * 0.45 +
    args.resonanceScore * 0.35 +
    clamp(baseConfidence * 100, 0, 100) * 0.20;

  const severityPenaltyValue = severityPenalty(args.highestSeverity) * 0.35;

  return clamp(roundTo(weighted - severityPenaltyValue, 2), 0, 100);
}

export function buildDecisionSignalRegistry(
  input: DecisionSignalRegistryInput,
): DecisionSignalRegistryResult {
  const scope: DecisionSignalScope = {
    assetId: normalizeString(input.assetId),
    assetTitle: normalizeString(input.assetTitle),
    assetKind: normalizeString(input.assetKind),
    contextType: normalizeString(input.contextType),
    contextValue: normalizeString(input.contextValue),
  };

  const driftCandidates = Array.isArray(input.driftCandidates)
    ? input.driftCandidates
    : [];

  const alerts =
    driftCandidates.length > 1
      ? detectDriftAlerts(driftCandidates)
      : driftCandidates.length === 1
        ? [detectDriftAlert(driftCandidates[0])].filter(
            (item): item is DriftAlertResult => Boolean(item),
          )
        : [];

  const resonance =
    Array.isArray(input.resonanceInputs) && input.resonanceInputs.length > 0
      ? calculateResonanceSync(input.resonanceInputs, {
          includeConfidence: true,
          calculateBand: true,
        })
      : null;

  const confidenceScore =
    typeof input.confidenceScore === "number"
      ? clamp(input.confidenceScore, 0, 1)
      : resonance?.confidence ?? null;

  const driftMetrics = buildDriftMetricSnapshots(alerts);
  const resonanceMetrics = buildResonanceMetricSnapshots(
    resonance,
    confidenceScore,
  );

  const metrics = [...driftMetrics, ...resonanceMetrics];

  const highestSeverity = getHighestSeverity(
    metrics.map((metric) => metric.severity),
  );

  const driftScore = computeDriftScore(alerts);
  const resonanceScore = roundTo(resonance?.score ?? 0, 4);

  const healthScore = computeHealthScore({
    driftScore,
    resonanceScore,
    confidenceScore,
    highestSeverity,
  });

  return {
    ...scope,
    registryKey: toRegistryKey(scope),
    status: mapStatus(highestSeverity),
    highestSeverity,
    healthScore,
    driftScore,
    resonanceScore,
    confidenceScore,
    resonanceBand: resonance?.band ?? (resonance ? scoreToBand(resonance.score) : null),
    alertCount: alerts.length,
    alerts,
    metrics,
    generatedAt: new Date().toISOString(),
    metadata:
      input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
        ? input.metadata
        : {},
  };
}

export default {
  buildDecisionSignalRegistry,
};