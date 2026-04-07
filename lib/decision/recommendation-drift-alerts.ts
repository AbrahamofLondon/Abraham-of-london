// lib/decision/recommendation-drift-alerts.ts

export type DriftDirection = "UP" | "DOWN" | "FLAT";
export type DriftSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type DriftMetric =
  | "contextualWeight"
  | "usefulnessScore"
  | string;

export type DriftAlertCandidate = {
  /**
   * Backward-compatible:
   * old consumers use `metric`
   * newer consumers may use `metricKey`
   */
  metric?: DriftMetric;
  metricKey?: string;

  /**
   * Optional human label for dashboards and messages
   */
  label?: string;

  currentValue: number;
  previousValue: number;
  warningThreshold?: number;
  criticalThreshold?: number;

  /**
   * If true, an upward move is treated as adverse in the message layer.
   * Detection itself still tracks magnitude neutrally.
   */
  isInverse?: boolean;
};

export type DriftAlertResult = {
  alertType: string;
  metric: DriftMetric;
  metricKey: string;
  label: string;
  previousValue: number;
  currentValue: number;
  deltaValue: number;
  delta: number;
  deltaPercent: number;
  direction: DriftDirection;
  severity: DriftSeverity;
  isInverse: boolean;
  message: string;
};

function round(value: number, places = 6): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeMetric(input: DriftAlertCandidate): string {
  const metricKey =
    typeof input.metricKey === "string" && input.metricKey.trim()
      ? input.metricKey.trim()
      : typeof input.metric === "string" && input.metric.trim()
        ? input.metric.trim()
        : "";

  return metricKey;
}

function normalizeLabel(metric: string, label?: string): string {
  const raw =
    typeof label === "string" && label.trim()
      ? label.trim()
      : metric;

  if (!raw) return "Unknown Metric";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDirection(delta: number): DriftDirection {
  if (delta > 0) return "UP";
  if (delta < 0) return "DOWN";
  return "FLAT";
}

function getSeverity(
  magnitude: number,
  warning: number,
  critical: number,
): DriftSeverity | null {
  if (magnitude >= critical) return "CRITICAL";
  if (magnitude >= warning * 2) return "HIGH";
  if (magnitude >= warning) return "MEDIUM";
  if (magnitude > 0) return "LOW";
  return null;
}

function buildAlertType(metric: string): string {
  if (metric === "contextualWeight") return "CONTEXTUALWEIGHT_DRIFT";
  if (metric === "usefulnessScore") return "USEFULNESSSCORE_DRIFT";

  return `${metric.replace(/[^A-Za-z0-9]+/g, "").toUpperCase()}_DRIFT`;
}

function buildMessage(args: {
  label: string;
  metric: string;
  direction: DriftDirection;
  severity: DriftSeverity;
  delta: number;
  percent: number;
  isInverse: boolean;
}): string {
  const sign = args.delta > 0 ? "+" : "";
  const pSign = args.percent > 0 ? "+" : "";

  if (args.isInverse) {
    return `${args.label} moved ${args.direction.toLowerCase()} by ${sign}${round(
      args.delta,
      4,
    )} (${pSign}${round(args.percent, 2)}%). Severity: ${
      args.severity
    }. Upward drift is adverse for this metric.`;
  }

  return `${args.label} moved ${args.direction.toLowerCase()} by ${sign}${round(
    args.delta,
    4,
  )} (${pSign}${round(args.percent, 2)}%). Severity: ${args.severity}.`;
}

export function detectDriftAlert(
  input: DriftAlertCandidate,
): DriftAlertResult | null {
  const metricKey = normalizeMetric(input);
  if (!metricKey) return null;

  const current = normalizeNumber(input.currentValue, 0);
  const previous = normalizeNumber(input.previousValue, 0);

  const delta = round(current - previous, 6);
  const denominator = previous === 0 ? 1 : Math.abs(previous);
  const deltaPercent = round((delta / denominator) * 100, 4);

  const warning = Math.abs(normalizeNumber(input.warningThreshold, 5));
  const critical = Math.max(
    warning,
    Math.abs(normalizeNumber(input.criticalThreshold, warning * 3)),
  );

  const magnitude = Math.abs(deltaPercent);
  const severity = getSeverity(magnitude, warning, critical);

  if (!severity) return null;

  const direction = getDirection(delta);
  const label = normalizeLabel(metricKey, input.label);
  const isInverse = Boolean(input.isInverse);

  return {
    alertType: buildAlertType(metricKey),
    metric: metricKey,
    metricKey,
    label,
    previousValue: previous,
    currentValue: current,
    deltaValue: delta,
    delta,
    deltaPercent,
    direction,
    severity,
    isInverse,
    message: buildMessage({
      label,
      metric: metricKey,
      direction,
      severity,
      delta,
      percent: deltaPercent,
      isInverse,
    }),
  };
}

export function detectDriftAlerts(
  inputs: DriftAlertCandidate[],
): DriftAlertResult[] {
  if (!Array.isArray(inputs)) return [];

  return inputs
    .map((input) => detectDriftAlert(input))
    .filter((item): item is DriftAlertResult => Boolean(item))
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent));
}

export default {
  detectDriftAlert,
  detectDriftAlerts,
};