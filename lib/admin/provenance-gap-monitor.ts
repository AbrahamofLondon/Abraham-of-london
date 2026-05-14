import type { DecisionProvenanceRecord, DecisionProvenanceGap } from "./decision-provenance-record";

export type ProvenanceGapMonitorItem = {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
  postureStatus: DecisionProvenanceRecord["currentPosture"]["status"];
  accountabilityStatement: string;
  provenanceHash: string;
  gapCount: number;
  highestSeverity: "INFO" | "WARNING" | "CRITICAL";
  gaps: Array<{ stage: string; description: string; severity: "INFO" | "WARNING" | "CRITICAL"; href?: string }>;
  nextAction?: string;
  nextActionHref?: string;
};

export type ProvenanceGapMonitorSummary = {
  totalSubjects: number;
  complete: number;
  withGaps: number;
  critical: number;
  warning: number;
  info: number;
  unavailable: number;
  items: ProvenanceGapMonitorItem[];
};

const SEVERITY_ORDER: Record<"INFO" | "WARNING" | "CRITICAL", number> = {
  CRITICAL: 0,
  WARNING: 1,
  INFO: 2,
};

function deriveHighestSeverity(gaps: DecisionProvenanceGap[]): "INFO" | "WARNING" | "CRITICAL" {
  if (gaps.some((g) => g.severity === "CRITICAL")) return "CRITICAL";
  if (gaps.some((g) => g.severity === "WARNING")) return "WARNING";
  return "INFO";
}

function sortItems(items: ProvenanceGapMonitorItem[]): ProvenanceGapMonitorItem[] {
  return [...items].sort((a, b) => {
    const aComplete = a.postureStatus === "COMPLETE" && a.gapCount === 0;
    const bComplete = b.postureStatus === "COMPLETE" && b.gapCount === 0;
    if (aComplete !== bComplete) return aComplete ? 1 : -1;
    if (a.gapCount === 0 && b.gapCount === 0) return 0;
    if (a.gapCount === 0) return 1;
    if (b.gapCount === 0) return -1;
    return SEVERITY_ORDER[a.highestSeverity] - SEVERITY_ORDER[b.highestSeverity];
  });
}

export function buildProvenanceGapMonitor(
  records: DecisionProvenanceRecord[],
): ProvenanceGapMonitorSummary {
  let complete = 0;
  let withGaps = 0;
  let critical = 0;
  let warning = 0;
  let info = 0;
  let unavailable = 0;

  const items: ProvenanceGapMonitorItem[] = [];

  for (const record of records) {
    const gaps = record.provenanceGaps;
    const hasCritical = gaps.some((g) => g.severity === "CRITICAL");
    const hasWarning = !hasCritical && gaps.some((g) => g.severity === "WARNING");
    const hasInfoOnly = !hasCritical && !hasWarning && gaps.some((g) => g.severity === "INFO");
    const isComplete = record.currentPosture.status === "COMPLETE" && gaps.length === 0;

    if (isComplete) complete++;
    if (gaps.length > 0) withGaps++;
    if (hasCritical) critical++;
    if (hasWarning) warning++;
    if (hasInfoOnly) info++;
    if (record.unavailableSources.length > 0) unavailable++;

    items.push({
      subjectType: record.subjectType,
      subjectId: record.subjectId,
      postureStatus: record.currentPosture.status,
      accountabilityStatement: record.accountabilityStatement,
      provenanceHash: record.provenanceHash,
      gapCount: gaps.length,
      highestSeverity: gaps.length > 0 ? deriveHighestSeverity(gaps) : "INFO",
      gaps: gaps.map((g) => ({
        stage: g.stage,
        description: g.description,
        severity: g.severity,
        href: g.href,
      })),
      nextAction: record.currentPosture.nextAction,
      nextActionHref: record.currentPosture.nextActionHref,
    });
  }

  return {
    totalSubjects: records.length,
    complete,
    withGaps,
    critical,
    warning,
    info,
    unavailable,
    items: sortItems(items),
  };
}

export async function loadProvenanceGapMonitor(
  input?: { limit?: number },
): Promise<ProvenanceGapMonitorSummary> {
  const limit = input?.limit ?? 50;

  const [
    { listRetainedReviewCycles },
    { composeDecisionProvenance },
  ] = await Promise.all([
    import("@/lib/product/retained-cadence-service"),
    import("@/lib/admin/decision-provenance-record"),
  ]);

  let allCycles: Awaited<ReturnType<typeof listRetainedReviewCycles>> = [];
  try {
    allCycles = await listRetainedReviewCycles();
  } catch {
    return buildProvenanceGapMonitor([]);
  }

  const uniqueCycleIds = Array.from(
    new Map(allCycles.map((c) => [c.cycleId, c])).values(),
  )
    .slice(0, limit)
    .map((c) => c.cycleId);

  const settled = await Promise.allSettled(
    uniqueCycleIds.map((cycleId) =>
      composeDecisionProvenance({ subjectType: "OVERSIGHT_CYCLE", subjectId: cycleId }),
    ),
  );

  const resolved: DecisionProvenanceRecord[] = settled
    .filter((r): r is PromiseFulfilledResult<DecisionProvenanceRecord> => r.status === "fulfilled")
    .map((r) => r.value);

  const rejectedCount = settled.filter((r) => r.status === "rejected").length;

  const summary = buildProvenanceGapMonitor(resolved);
  return {
    ...summary,
    totalSubjects: summary.totalSubjects + rejectedCount,
    unavailable: summary.unavailable + rejectedCount,
  };
}
