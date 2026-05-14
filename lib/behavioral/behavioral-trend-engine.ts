import { loadLatestBehavioralSignalSnapshots } from "./behavioral-signal-snapshot-store";
import type { BehavioralSignalSnapshotRecord } from "./behavioral-signal-snapshot-contract";
import type {
  BehavioralTrendDirection,
  BehavioralTrendMetric,
  BehavioralTrendSummary,
} from "./behavioral-trend-contract";

// Minimum absolute delta to declare a meaningful directional movement.
// Below this threshold, a metric is considered STABLE regardless of direction.
const DELTA_THRESHOLD = 0.10;

// For slackResponsiveness (response-time in hours), deterioration means longer time.
// All other rate metrics: higher is better, so deterioration means lower.
const HIGHER_IS_WORSE_KEYS = new Set(["meetingCancellationRate", "slackResponsiveness"]);

export type TrendWindowInput = {
  userId: string;
  source: string;
  /** ISO string — end of the current oversight cycle window */
  currentWindowEnd: string;
  /** ISO string — start of the current oversight cycle window */
  currentWindowStart: string;
  /** ISO string — start of the previous cycle window (must be before currentWindowStart) */
  previousWindowStart: string;
  /** Signal keys to compare across windows */
  signalKeys?: string[];
  /** Max age in minutes when loading snapshots — defaults to 90 days */
  maxAgeMinutes?: number;
};

type GroupedSnapshots = {
  current: Map<string, BehavioralSignalSnapshotRecord[]>;
  previous: Map<string, BehavioralSignalSnapshotRecord[]>;
};

function pickLatestValue(records: BehavioralSignalSnapshotRecord[]): number | null {
  if (records.length === 0) return null;
  const sorted = [...records].sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  const value = sorted[0]?.signalValue;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function groupByWindow(
  snapshots: BehavioralSignalSnapshotRecord[],
  currentWindowStart: string,
  currentWindowEnd: string,
  previousWindowStart: string,
): GroupedSnapshots {
  const current = new Map<string, BehavioralSignalSnapshotRecord[]>();
  const previous = new Map<string, BehavioralSignalSnapshotRecord[]>();

  for (const snap of snapshots) {
    const at = snap.generatedAt;
    const key = snap.signalKey;

    if (at >= currentWindowStart && at <= currentWindowEnd) {
      if (!current.has(key)) current.set(key, []);
      current.get(key)!.push(snap);
    } else if (at >= previousWindowStart && at < currentWindowStart) {
      if (!previous.has(key)) previous.set(key, []);
      previous.get(key)!.push(snap);
    }
  }

  return { current, previous };
}

function computeDirection(
  delta: number,
  signalKey: string,
): BehavioralTrendDirection {
  if (Math.abs(delta) < DELTA_THRESHOLD) return "STABLE";
  const worseIsHigher = HIGHER_IS_WORSE_KEYS.has(signalKey);
  const isImproving = worseIsHigher ? delta < 0 : delta > 0;
  return isImproving ? "IMPROVING" : "DETERIORATING";
}

function buildExplanation(
  signalKey: string,
  currentValue: number | null,
  previousValue: number | null,
  direction: BehavioralTrendDirection,
  delta: number | null,
): string {
  if (direction === "INSUFFICIENT_EVIDENCE") {
    if (currentValue === null && previousValue === null) {
      return `No data available for ${signalKey} in either window.`;
    }
    if (previousValue === null) {
      return `${signalKey} has a current reading of ${currentValue?.toFixed(2)} but no prior cycle data to compare against.`;
    }
    return `${signalKey} has prior data but no current reading to compare against.`;
  }
  if (direction === "STABLE") {
    return `${signalKey} is stable (delta ${delta !== null ? delta.toFixed(2) : "N/A"}, threshold ±${DELTA_THRESHOLD}).`;
  }
  const arrow = direction === "IMPROVING" ? "improved" : "deteriorated";
  return `${signalKey} has ${arrow} from ${previousValue?.toFixed(2) ?? "N/A"} to ${currentValue?.toFixed(2) ?? "N/A"} (delta ${delta !== null ? (delta > 0 ? "+" : "") + delta.toFixed(2) : "N/A"}).`;
}

function resolveEvidencePosture(
  records: BehavioralSignalSnapshotRecord[],
): BehavioralTrendMetric["evidencePosture"] {
  if (records.length === 0) return "unavailable";
  const postures = new Set(records.map((r) => r.evidencePosture ?? "snapshot"));
  if (postures.size === 1) {
    const p = postures.values().next().value as string;
    if (p === "integrated") return "live";
    return "snapshot";
  }
  return "mixed";
}

function computeMetric(
  source: string,
  signalKey: string,
  currentRecords: BehavioralSignalSnapshotRecord[],
  previousRecords: BehavioralSignalSnapshotRecord[],
  currentWindowStart: string,
  currentWindowEnd: string,
  previousWindowStart: string,
): BehavioralTrendMetric {
  const currentValue = pickLatestValue(currentRecords);
  const previousValue = pickLatestValue(previousRecords);

  const hasCurrent = currentValue !== null;
  const hasPrevious = previousValue !== null;

  if (!hasCurrent || !hasPrevious) {
    const allRecords = [...currentRecords, ...previousRecords];
    return {
      signalKey,
      source,
      sourceLabel: source,
      currentValue,
      previousValue,
      delta: null,
      direction: "INSUFFICIENT_EVIDENCE",
      evidencePosture: resolveEvidencePosture(allRecords),
      evidenceWindowStart: currentWindowStart,
      evidenceWindowEnd: currentWindowEnd,
      previousWindowStart,
      explanation: buildExplanation(signalKey, currentValue, previousValue, "INSUFFICIENT_EVIDENCE", null),
    };
  }

  const delta = currentValue - previousValue;
  const direction = computeDirection(delta, signalKey);

  const currentPosture = resolveEvidencePosture(currentRecords);
  const previousPosture = resolveEvidencePosture(previousRecords);
  const evidencePosture: BehavioralTrendMetric["evidencePosture"] =
    currentPosture === previousPosture ? currentPosture : "mixed";

  return {
    signalKey,
    source,
    sourceLabel: source,
    currentValue,
    previousValue,
    delta,
    direction,
    evidencePosture,
    evidenceWindowStart: currentWindowStart,
    evidenceWindowEnd: currentWindowEnd,
    previousWindowStart,
    explanation: buildExplanation(signalKey, currentValue, previousValue, direction, delta),
  };
}

function resolveOverallDirection(metrics: BehavioralTrendMetric[]): BehavioralTrendDirection {
  const measured = metrics.filter((m) => m.direction !== "INSUFFICIENT_EVIDENCE");
  if (measured.length === 0) return "INSUFFICIENT_EVIDENCE";

  const deteriorating = measured.filter((m) => m.direction === "DETERIORATING");
  const improving = measured.filter((m) => m.direction === "IMPROVING");

  if (deteriorating.length > 0) return "DETERIORATING";
  if (improving.length > measured.length / 2) return "IMPROVING";
  return "STABLE";
}

function buildSummaryText(
  source: string,
  overall: BehavioralTrendDirection,
  metrics: BehavioralTrendMetric[],
): string {
  const measured = metrics.filter((m) => m.direction !== "INSUFFICIENT_EVIDENCE");
  const insufficient = metrics.filter((m) => m.direction === "INSUFFICIENT_EVIDENCE");

  if (measured.length === 0) {
    return `No prior cycle data available for ${source} to establish a trend baseline.`;
  }

  const parts: string[] = [];
  if (overall === "IMPROVING") {
    parts.push(`${source} signals are improving across the review window.`);
  } else if (overall === "DETERIORATING") {
    const worst = metrics.filter((m) => m.direction === "DETERIORATING").map((m) => m.signalKey);
    parts.push(`${source} signals show deterioration in: ${worst.join(", ")}.`);
  } else if (overall === "STABLE") {
    parts.push(`${source} signals are stable — no significant movement detected.`);
  } else {
    parts.push(`${source} trend direction is unclear.`);
  }

  if (insufficient.length > 0) {
    parts.push(`Insufficient prior data for: ${insufficient.map((m) => m.signalKey).join(", ")}.`);
  }

  return parts.join(" ");
}

export async function buildBehavioralTrendSummary(
  input: TrendWindowInput,
): Promise<BehavioralTrendSummary | null> {
  const maxAgeMinutes = input.maxAgeMinutes ?? 90 * 24 * 60;

  // Load enough history to cover both windows — use previousWindowStart as effective cutoff.
  // We load more than needed and filter by window in memory rather than making two DB calls.
  const minutesSincePreviousWindowStart = Math.ceil(
    (Date.now() - new Date(input.previousWindowStart).getTime()) / (60 * 1000),
  );
  const effectiveMaxAge = Math.min(minutesSincePreviousWindowStart + 60, maxAgeMinutes);

  const snapshots = await loadLatestBehavioralSignalSnapshots({
    userId: input.userId,
    source: input.source,
    signalKeys: input.signalKeys,
    maxAgeMinutes: effectiveMaxAge,
    limit: 500,
  });

  if (snapshots.length === 0) return null;

  const { current, previous } = groupByWindow(
    snapshots,
    input.currentWindowStart,
    input.currentWindowEnd,
    input.previousWindowStart,
  );

  // Determine which signal keys to compare — union of both windows.
  const allKeys = new Set([...current.keys(), ...previous.keys()]);
  if (allKeys.size === 0) return null;

  const metrics: BehavioralTrendMetric[] = [];
  for (const key of allKeys) {
    metrics.push(
      computeMetric(
        input.source,
        key,
        current.get(key) ?? [],
        previous.get(key) ?? [],
        input.currentWindowStart,
        input.currentWindowEnd,
        input.previousWindowStart,
      ),
    );
  }

  const overallDirection = resolveOverallDirection(metrics);
  const hasDeterioration = metrics.some((m) => m.direction === "DETERIORATING");
  const hasRecurrence = metrics.some((m) => m.direction === "RECURRING");
  const insufficientDataKeys = metrics
    .filter((m) => m.direction === "INSUFFICIENT_EVIDENCE")
    .map((m) => m.signalKey);

  return {
    userId: input.userId,
    source: input.source,
    computedAt: new Date().toISOString(),
    metrics,
    overallDirection,
    summary: buildSummaryText(input.source, overallDirection, metrics),
    hasDeterioration,
    hasRecurrence,
    repeatedDriftSignals: [],
    insufficientDataKeys,
  };
}

export function buildBehavioralTrendSummaryFromSnapshots(
  userId: string,
  source: string,
  snapshots: BehavioralSignalSnapshotRecord[],
  currentWindowStart: string,
  currentWindowEnd: string,
  previousWindowStart: string,
): BehavioralTrendSummary | null {
  const { current, previous } = groupByWindow(
    snapshots,
    currentWindowStart,
    currentWindowEnd,
    previousWindowStart,
  );

  const allKeys = new Set([...current.keys(), ...previous.keys()]);
  if (allKeys.size === 0) return null;

  const metrics: BehavioralTrendMetric[] = [];
  for (const key of allKeys) {
    metrics.push(
      computeMetric(
        source,
        key,
        current.get(key) ?? [],
        previous.get(key) ?? [],
        currentWindowStart,
        currentWindowEnd,
        previousWindowStart,
      ),
    );
  }

  const overallDirection = resolveOverallDirection(metrics);
  const hasDeterioration = metrics.some((m) => m.direction === "DETERIORATING");
  const hasRecurrence = metrics.some((m) => m.direction === "RECURRING");
  const insufficientDataKeys = metrics
    .filter((m) => m.direction === "INSUFFICIENT_EVIDENCE")
    .map((m) => m.signalKey);

  return {
    userId,
    source,
    computedAt: new Date().toISOString(),
    metrics,
    overallDirection,
    summary: buildSummaryText(source, overallDirection, metrics),
    hasDeterioration,
    hasRecurrence,
    repeatedDriftSignals: [],
    insufficientDataKeys,
  };
}
