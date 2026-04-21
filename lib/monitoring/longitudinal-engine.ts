export type DiagnosticSnapshot = {
  id?: string;
  timestamp: string;
  stage: string;
  coreMetrics: Record<string, number>;
  tensions: string[];
  escalationLevel: number;
  directive?: string | null;
  benchmarkPosition?: unknown;
  trajectoryResult?: unknown;
};

export type MonitoringSnapshot = DiagnosticSnapshot & {
  cadence?: "monthly" | "quarterly" | "ad_hoc";
  organisationId?: string | null;
};

export type LongitudinalAnalysis = {
  metricChanges: Array<{
    metric: string;
    previous: number;
    current: number;
    delta: number;
  }>;
  tensionPersistence: string[];
  escalationMovement: "down" | "flat" | "up" | "unknown";
  classification: "recovery" | "stable" | "deterioration" | "insufficient";
  interventionEffect?: "positive" | "neutral" | "negative" | "unknown";
};

export function analyseLongitudinalChange(
  snapshots: DiagnosticSnapshot[],
): LongitudinalAnalysis {
  const ordered = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
  if (ordered.length < 2) {
    return {
      metricChanges: [],
      tensionPersistence: [],
      escalationMovement: "unknown",
      classification: "insufficient",
      interventionEffect: "unknown",
    };
  }

  const previous = ordered[ordered.length - 2]!;
  const current = ordered[ordered.length - 1]!;
  const metricNames = new Set([
    ...Object.keys(previous.coreMetrics || {}),
    ...Object.keys(current.coreMetrics || {}),
  ]);

  const metricChanges = Array.from(metricNames).map((metric) => {
    const prev = previous.coreMetrics[metric] ?? 0;
    const curr = current.coreMetrics[metric] ?? 0;
    return { metric, previous: prev, current: curr, delta: Math.round(curr - prev) };
  });

  const tensionPersistence = current.tensions.filter((tension) =>
    previous.tensions.includes(tension),
  );

  const escalationDelta = current.escalationLevel - previous.escalationLevel;
  const escalationMovement =
    escalationDelta > 0 ? "up" : escalationDelta < 0 ? "down" : "flat";

  const averageDelta =
    metricChanges.length > 0
      ? metricChanges.reduce((sum, item) => sum + item.delta, 0) / metricChanges.length
      : 0;

  const classification =
    escalationMovement === "up" || averageDelta < -8
      ? "deterioration"
      : escalationMovement === "down" || averageDelta > 8
        ? "recovery"
        : "stable";

  return {
    metricChanges,
    tensionPersistence,
    escalationMovement,
    classification,
    interventionEffect:
      classification === "recovery"
        ? "positive"
        : classification === "deterioration"
          ? "negative"
          : "neutral",
  };
}

export function resolveMonitoringStatus(snapshots: MonitoringSnapshot[]) {
  const analysis = analyseLongitudinalChange(snapshots);
  const latest = [...snapshots].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )[0];

  return {
    latestStatus: latest?.directive || latest?.stage || "No monitoring status",
    trendLine: analysis.classification,
    unresolvedPersistentTensions: analysis.tensionPersistence,
    risingRisks:
      analysis.escalationMovement === "up"
        ? analysis.metricChanges.filter((metric) => metric.delta < 0).map((metric) => metric.metric)
        : [],
    stateTransitions: analysis.metricChanges,
    analysis,
  };
}
