import type { BehavioralTrendDirection, BehavioralTrendMetric } from "@/lib/behavioral/behavioral-trend-contract";
import type {
  PriorBehavioralActionRecord,
  PriorBehavioralTrendCycle,
  RetainedEnforcementCycleRecord,
  RetainerCycleMemoryBuildInput,
  RetainerCycleMemoryEscalationLevel,
  RetainerCycleMemoryFinding,
  RetainerCycleMemorySeverity,
  RetainerCycleMemoryStatus,
  RetainerCycleMemorySummary,
} from "@/lib/product/retainer-cycle-memory-contract";

type CurrentMetricContext = {
  metric: BehavioralTrendMetric;
  source: string;
};

type PriorMetricHistory = {
  direction: BehavioralTrendDirection;
  observedAt: string;
};

function compareIsoDescending(left: string, right: string) {
  return right.localeCompare(left);
}

function isMeaningfulDirection(direction: BehavioralTrendDirection) {
  return direction !== "INSUFFICIENT_EVIDENCE";
}

function isDeterioratingDirection(direction: BehavioralTrendDirection) {
  return direction === "DETERIORATING" || direction === "RECURRING";
}

function isCurrentDeterioration(direction?: BehavioralTrendDirection | "UNAVAILABLE" | null) {
  return direction === "DETERIORATING" || direction === "RECURRING";
}

function toIsoOrNull(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function findingSeverity(status: RetainerCycleMemoryStatus): RetainerCycleMemorySeverity {
  switch (status) {
    case "DETERIORATED_AFTER_INTERVENTION":
      return "CRITICAL";
    case "REPEATED_SIGNAL":
    case "DETERIORATED_AFTER_WARNING":
      return "HIGH";
    case "NEW_SIGNAL":
    case "EVIDENCE_UNAVAILABLE":
      return "MEDIUM";
    default:
      return "LOW";
  }
}

function recommendedAction(status: RetainerCycleMemoryStatus): string {
  switch (status) {
    case "DETERIORATED_AFTER_INTERVENTION":
      return "Escalate retained oversight review. Prior intervention did not arrest deterioration.";
    case "DETERIORATED_AFTER_WARNING":
      return "Move from warning to retained intervention. The same operating signal has deteriorated again.";
    case "REPEATED_SIGNAL":
      return "Review operating cadence and unresolved commitments before the next retained cycle closes.";
    case "NEW_SIGNAL":
      return "Monitor the signal in the next oversight cycle before treating it as recurrence.";
    case "IMPROVED_AFTER_INTERVENTION":
      return "Maintain the intervention path and verify that the improvement holds across the next cycle.";
    case "STABLE_UNRESOLVED":
      return "Do not treat the issue as closed. Recheck whether the prior operating issue has actually been resolved.";
    case "EVIDENCE_UNAVAILABLE":
      return "Restore behavioral evidence continuity before making stronger claims about execution posture.";
    default:
      return "Retain the signal as historical context until another comparable cycle is available.";
  }
}

function statusExplanation(input: {
  status: RetainerCycleMemoryStatus;
  source?: string | null;
  signalKey: string;
  priorDetCount: number;
  priorDirections: BehavioralTrendDirection[];
  cyclesUnavailable: number;
}): string {
  const signalLabel = input.source ? `${input.source}.${input.signalKey}` : input.signalKey;
  switch (input.status) {
    case "NEW_SIGNAL":
      return `${signalLabel} is deteriorating in the current cycle without prior retained deterioration for the same signal. This is a new signal, not recurrence.`;
    case "REPEATED_SIGNAL":
      return `${signalLabel} has deteriorated across ${input.priorDetCount + 1} retained cycles. This is repeated deterioration, not a one-off movement.`;
    case "DETERIORATED_AFTER_WARNING":
      return `${signalLabel} deteriorated again after a prior operating-cadence warning. Warning alone did not arrest the pattern.`;
    case "DETERIORATED_AFTER_INTERVENTION":
      return `${signalLabel} deteriorated again after a retained intervention was recorded. This indicates failed recovery, not simple recurrence.`;
    case "IMPROVED_AFTER_INTERVENTION":
      return `${signalLabel} is improving after an intervention was recorded. The intervention appears directionally effective from current evidence.`;
    case "STABLE_UNRESOLVED":
      return `${signalLabel} is currently stable, but prior deterioration remains unresolved in retained memory. Stability alone is not closure.`;
    case "EVIDENCE_UNAVAILABLE":
      return `Behavioral evidence for ${signalLabel} is unavailable in the current cycle after prior availability. This is an evidence continuity issue, not proof of deterioration.`;
    default:
      return `${signalLabel} does not yet have enough retained cycle history for a recurrence reading. Prior directions: ${input.priorDirections.join(", ") || "none"}.`;
  }
}

function buildFinding(input: {
  signalKey: string;
  source?: string | null;
  status: RetainerCycleMemoryStatus;
  currentDirection?: BehavioralTrendDirection | "UNAVAILABLE" | null;
  priorDirections: BehavioralTrendDirection[];
  cyclesObserved: number;
  cyclesDeteriorating: number;
  cyclesUnavailable: number;
  lastObservedAt?: string | null;
  lastInterventionAt?: string | null;
  lastWarningAt?: string | null;
}): RetainerCycleMemoryFinding {
  return {
    id: `retainer_memory_${input.source ?? "behavioral"}_${input.signalKey}_${input.status.toLowerCase()}`,
    signalKey: input.signalKey,
    source: input.source ?? null,
    status: input.status,
    severity: findingSeverity(input.status),
    currentDirection: input.currentDirection ?? null,
    priorDirections: input.priorDirections,
    cyclesObserved: input.cyclesObserved,
    cyclesDeteriorating: input.cyclesDeteriorating,
    cyclesUnavailable: input.cyclesUnavailable,
    lastObservedAt: input.lastObservedAt ?? null,
    lastInterventionAt: input.lastInterventionAt ?? null,
    lastWarningAt: input.lastWarningAt ?? null,
    explanation: statusExplanation({
      status: input.status,
      source: input.source,
      signalKey: input.signalKey,
      priorDetCount: Math.max(0, input.cyclesDeteriorating - (isCurrentDeterioration(input.currentDirection) ? 1 : 0)),
      priorDirections: input.priorDirections,
      cyclesUnavailable: input.cyclesUnavailable,
    }),
    recommendedAction: recommendedAction(input.status),
  };
}

function buildMetricKey(source: string, signalKey: string) {
  return `${source}::${signalKey}`;
}

function collectCurrentMetrics(input: RetainerCycleMemoryBuildInput): CurrentMetricContext[] {
  if (!input.currentBehavioralTrends) return [];
  return input.currentBehavioralTrends.metrics.map((metric) => ({
    metric,
    source: input.currentBehavioralTrends?.source ?? "behavioral",
  }));
}

function collectPriorMetricHistory(
  priorCycles: PriorBehavioralTrendCycle[],
): Map<string, PriorMetricHistory[]> {
  const history = new Map<string, PriorMetricHistory[]>();
  for (const cycle of priorCycles) {
    const source = cycle.behavioralTrends?.source;
    if (!source || !cycle.behavioralTrends) continue;
    for (const metric of cycle.behavioralTrends.metrics) {
      const key = buildMetricKey(source, metric.signalKey);
      if (!history.has(key)) {
        history.set(key, []);
      }
      history.get(key)!.push({
        direction: metric.direction,
        observedAt: cycle.observedAt,
      });
    }
  }
  for (const records of history.values()) {
    records.sort((left, right) => compareIsoDescending(left.observedAt, right.observedAt));
  }
  return history;
}

function collectPriorWarnings(actions: PriorBehavioralActionRecord[]): Map<string, string> {
  const warnings = new Map<string, string>();
  for (const action of actions) {
    if (action.actionType !== "REVIEW_OPERATING_CADENCE" || !action.source || !action.signalKey) {
      continue;
    }
    const key = buildMetricKey(action.source, action.signalKey);
    const createdAt = toIsoOrNull(action.createdAt);
    if (!createdAt) continue;
    const existing = warnings.get(key);
    if (!existing || createdAt > existing) {
      warnings.set(key, createdAt);
    }
  }
  return warnings;
}

function collectInterventions(cycles: RetainedEnforcementCycleRecord[]): string[] {
  return cycles
    .map((cycle) => toIsoOrNull(cycle.completedAt ?? cycle.updatedAt ?? null))
    .filter((value): value is string => Boolean(value))
    .sort(compareIsoDescending);
}

function latestInterventionAfterWarning(
  interventions: string[],
  lastWarningAt?: string | null,
) {
  if (!lastWarningAt) return null;
  return interventions.find((timestamp) => timestamp > lastWarningAt) ?? null;
}

function buildCurrentMetricFindings(input: RetainerCycleMemoryBuildInput): RetainerCycleMemoryFinding[] {
  const currentMetrics = collectCurrentMetrics(input);
  const priorCycles = input.priorBehavioralTrends ?? [];
  const priorHistory = collectPriorMetricHistory(priorCycles);
  const priorWarnings = collectPriorWarnings(input.priorStructuredActions ?? []);
  const interventions = collectInterventions(input.retainedEnforcementCycles ?? []);
  const findings: RetainerCycleMemoryFinding[] = [];

  for (const current of currentMetrics) {
    const key = buildMetricKey(current.source, current.metric.signalKey);
    const history = priorHistory.get(key) ?? [];
    const priorDirections = history
      .map((item) => item.direction)
      .filter(isMeaningfulDirection);
    const priorDetCount = priorDirections.filter(isDeterioratingDirection).length;
    const cyclesObserved = history.length + (isMeaningfulDirection(current.metric.direction) ? 1 : 0);
    const lastObservedAt = history[0]?.observedAt ?? null;
    const lastWarningAt = priorWarnings.get(key) ?? null;
    const lastInterventionAt = latestInterventionAfterWarning(interventions, lastWarningAt);

    let status: RetainerCycleMemoryStatus | null = null;
    if (current.metric.direction === "DETERIORATING" || current.metric.direction === "RECURRING") {
      if (lastInterventionAt && priorDetCount >= 1) {
        status = "DETERIORATED_AFTER_INTERVENTION";
      } else if (lastWarningAt && priorDetCount >= 1) {
        status = "DETERIORATED_AFTER_WARNING";
      } else if (priorDetCount >= 1) {
        status = "REPEATED_SIGNAL";
      } else {
        status = "NEW_SIGNAL";
      }
    } else if (current.metric.direction === "IMPROVING") {
      if (lastInterventionAt) {
        status = "IMPROVED_AFTER_INTERVENTION";
      }
    } else if (current.metric.direction === "STABLE") {
      if (priorDetCount >= 1 || Boolean(lastWarningAt)) {
        status = "STABLE_UNRESOLVED";
      }
    }

    if (!status) {
      continue;
    }

    findings.push(buildFinding({
      signalKey: current.metric.signalKey,
      source: current.source,
      status,
      currentDirection: current.metric.direction,
      priorDirections,
      cyclesObserved,
      cyclesDeteriorating: priorDetCount + (isDeterioratingDirection(current.metric.direction) ? 1 : 0),
      cyclesUnavailable: 0,
      lastObservedAt,
      lastInterventionAt,
      lastWarningAt,
    }));
  }

  return findings;
}

function buildEvidenceAvailabilityFinding(input: RetainerCycleMemoryBuildInput): RetainerCycleMemoryFinding | null {
  if (input.currentBehavioralEvidenceStatus !== "unavailable") {
    return null;
  }

  const priorCycles = input.priorBehavioralTrends ?? [];
  const priorAvailable = priorCycles.filter((cycle) => cycle.behavioralEvidenceStatus && cycle.behavioralEvidenceStatus !== "unavailable");
  const unavailableCycles = priorCycles.filter((cycle) => cycle.behavioralEvidenceStatus === "unavailable");
  if (priorAvailable.length === 0) {
    return null;
  }

  const lastObservedAt = [...priorAvailable]
    .sort((left, right) => compareIsoDescending(left.observedAt, right.observedAt))[0]?.observedAt ?? null;

  return buildFinding({
    signalKey: "behavioralEvidenceContinuity",
    source: "behavioral",
    status: "EVIDENCE_UNAVAILABLE",
    currentDirection: "UNAVAILABLE",
    priorDirections: [],
    cyclesObserved: priorAvailable.length,
    cyclesDeteriorating: 0,
    cyclesUnavailable: unavailableCycles.length + 1,
    lastObservedAt,
  });
}

function buildInsufficientHistoryFinding(input: RetainerCycleMemoryBuildInput): RetainerCycleMemoryFinding | null {
  const priorCycles = input.priorBehavioralTrends ?? [];
  if (!input.currentBehavioralTrends) {
    const hasPriorHistory = priorCycles.some((cycle) =>
      Boolean(cycle.behavioralTrends?.metrics.length)
      || cycle.behavioralEvidenceStatus === "unavailable",
    );
    if (hasPriorHistory) {
      return null;
    }
    return buildFinding({
      signalKey: "behavioralTrendBaseline",
      source: "behavioral",
      status: "INSUFFICIENT_HISTORY",
      currentDirection: null,
      priorDirections: [],
      cyclesObserved: 0,
      cyclesDeteriorating: 0,
      cyclesUnavailable: input.currentBehavioralEvidenceStatus === "unavailable" ? 1 : 0,
    });
  }

  const hasMeasuredCurrentSignal = input.currentBehavioralTrends.metrics.some((metric) =>
    metric.direction !== "INSUFFICIENT_EVIDENCE",
  );
  if (hasMeasuredCurrentSignal) {
    return null;
  }

  const hasAnyComparableHistory = priorCycles.some((cycle) => Boolean(cycle.behavioralTrends?.metrics.length));
  if (hasAnyComparableHistory) {
    return null;
  }

  return buildFinding({
    signalKey: "behavioralTrendBaseline",
    source: input.currentBehavioralTrends.source,
    status: "INSUFFICIENT_HISTORY",
    currentDirection: input.currentBehavioralTrends.overallDirection,
    priorDirections: [],
    cyclesObserved: 1,
    cyclesDeteriorating: input.currentBehavioralTrends.hasDeterioration ? 1 : 0,
    cyclesUnavailable: 0,
  });
}

function dedupeFindings(findings: RetainerCycleMemoryFinding[]) {
  const byKey = new Map<string, RetainerCycleMemoryFinding>();
  for (const finding of findings) {
    const key = `${finding.source ?? "behavioral"}::${finding.signalKey}::${finding.status}`;
    if (!byKey.has(key)) {
      byKey.set(key, finding);
    }
  }
  return [...byKey.values()];
}

function resolveEscalationLevel(
  findings: RetainerCycleMemoryFinding[],
  governanceFlags?: RetainerCycleMemoryBuildInput["governanceFlags"],
): RetainerCycleMemoryEscalationLevel {
  if (findings.some((finding) => finding.status === "DETERIORATED_AFTER_INTERVENTION")) {
    if (governanceFlags?.counselReviewRequired || governanceFlags?.boardroomReviewRequired) {
      return "COUNSEL_REVIEW";
    }
    return "BOARDROOM_REVIEW";
  }
  if (findings.some((finding) => finding.status === "DETERIORATED_AFTER_WARNING")) {
    return "RETAINED_INTERVENTION";
  }
  if (findings.some((finding) => finding.status === "REPEATED_SIGNAL")) {
    return "OPERATING_CADENCE_RESET";
  }
  if (findings.some((finding) => finding.status === "EVIDENCE_UNAVAILABLE" && finding.cyclesUnavailable >= 2)) {
    return "OPERATING_CADENCE_RESET";
  }
  return "NONE";
}

function summaryStatus(findings: RetainerCycleMemoryFinding[]): RetainerCycleMemorySummary["status"] {
  if (findings.length === 0) return "insufficient";
  if (findings.every((finding) => finding.status === "INSUFFICIENT_HISTORY")) {
    return "insufficient";
  }
  if (findings.some((finding) => finding.status === "EVIDENCE_UNAVAILABLE")) {
    return findings.some((finding) => !["EVIDENCE_UNAVAILABLE", "INSUFFICIENT_HISTORY"].includes(finding.status))
      ? "partial"
      : "partial";
  }
  return "available";
}

function buildSummaryCopy(findings: RetainerCycleMemoryFinding[], escalationLevel: RetainerCycleMemoryEscalationLevel) {
  if (findings.length === 0) {
    return "Retained cycle memory is unavailable for the current oversight cycle.";
  }
  const critical = findings.filter((finding) =>
    finding.status === "DETERIORATED_AFTER_INTERVENTION" || finding.status === "DETERIORATED_AFTER_WARNING",
  );
  if (critical.length > 0) {
    return `${critical.length} behavioral signal${critical.length === 1 ? "" : "s"} have carried forward through prior warning or intervention history. Retained follow-through is required.`;
  }
  const repeated = findings.filter((finding) => finding.status === "REPEATED_SIGNAL");
  if (repeated.length > 0) {
    return `${repeated.length} behavioral signal${repeated.length === 1 ? "" : "s"} show repeated deterioration across retained oversight cycles.`;
  }
  const unavailable = findings.filter((finding) => finding.status === "EVIDENCE_UNAVAILABLE");
  if (unavailable.length > 0) {
    return escalationLevel === "OPERATING_CADENCE_RESET"
      ? "Behavioral evidence continuity has failed across repeated cycles and should be restored before stronger claims are made."
      : "Behavioral evidence continuity is partial. Current cycle memory is constrained by unavailable evidence.";
  }
  const improving = findings.filter((finding) => finding.status === "IMPROVED_AFTER_INTERVENTION");
  if (improving.length > 0) {
    return `${improving.length} behavioral signal${improving.length === 1 ? "" : "s"} are improving after prior intervention.`;
  }
  const newSignals = findings.filter((finding) => finding.status === "NEW_SIGNAL");
  if (newSignals.length > 0) {
    return `${newSignals.length} new behavioral signal${newSignals.length === 1 ? "" : "s"} were detected this cycle. They remain under watch rather than escalation.`;
  }
  return "Retained cycle memory is available but does not yet support stronger recurrence claims.";
}

export function buildRetainerCycleMemorySummary(
  input: RetainerCycleMemoryBuildInput,
): RetainerCycleMemorySummary {
  const findings = dedupeFindings([
    ...buildCurrentMetricFindings(input),
    ...(() => {
      const evidenceGap = buildEvidenceAvailabilityFinding(input);
      return evidenceGap ? [evidenceGap] : [];
    })(),
    ...(() => {
      const insufficientHistory = buildInsufficientHistoryFinding(input);
      return insufficientHistory ? [insufficientHistory] : [];
    })(),
  ]).sort((left, right) =>
    compareIsoDescending(left.lastObservedAt ?? "", right.lastObservedAt ?? "")
    || left.signalKey.localeCompare(right.signalKey),
  );

  const escalationLevel = resolveEscalationLevel(findings, input.governanceFlags);

  return {
    status: summaryStatus(findings),
    generatedAt: input.generatedAt,
    accountId: input.accountId ?? null,
    userId: input.userId ?? null,
    findings,
    escalationRequired: escalationLevel !== "NONE",
    escalationLevel,
    summary: buildSummaryCopy(findings, escalationLevel),
  };
}
