import { prisma } from "@/lib/prisma";
import type {
  CanonicalDecisionObject,
  DiagnosticEvidenceNodeInput,
} from "@/lib/diagnostics/evidence-graph";
import {
  detectPatternRecurrence,
  type PatternRecurrenceResult,
} from "@/lib/diagnostics/pattern-recurrence";

export type DiagnosticJourneyComparable = {
  id?: string;
  journeyKey?: string;
  subjectKey?: string | null;
  email?: string | null;
  organisation?: string | null;
  organisationKey?: string | null;
  diagnosticType?: string | null;
  monitoringCadence?: string | null;
  createdAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  stages?: Array<{ stage: string; payload: unknown }> | Record<string, unknown>;
  monitoringSnapshots?: Array<{ snapshot: unknown; createdAt?: Date | string | null }>;
  threadSnapshots?: Array<{ snapshot: unknown; createdAt?: Date | string | null }>;
  evidenceNodes?: DiagnosticEvidenceNodeInput[];
  decisionObjects?: CanonicalDecisionObject[];
  escalationHistory?: unknown;
  routeDecisions?: unknown;
};

export type LongitudinalDeltaSummary = {
  baselineJourneyId: string | null;
  currentJourneyId: string | null;
  daysBetween: number | null;
  scoreDeltas: Record<string, number>;
  contradictionDelta: number;
  conditionStateChanged: boolean;
  baselineCondition: string | null;
  currentCondition: string | null;
  decisionObjectContinuity: string[];
  escalationDelta: number;
  consequenceTrajectory: "improved" | "stable" | "deteriorated" | "unknown";
};

export type LongitudinalComparisonResult = {
  baseline: DiagnosticJourneyComparable | null;
  delta: LongitudinalDeltaSummary;
  recurrence: PatternRecurrenceResult;
  evidenceNodes: DiagnosticEvidenceNodeInput[];
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(a: unknown, b: unknown): number | null {
  const left = toDate(a);
  const right = toDate(b);
  if (!left || !right) return null;
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

function stagePayload(journey: DiagnosticJourneyComparable, stage: string): Record<string, unknown> {
  if (Array.isArray(journey.stages)) {
    const found = journey.stages.find((item) => item.stage === stage);
    return asObject(found?.payload);
  }
  return asObject(asObject(journey.stages)[stage]);
}

function latestSnapshot(journey: DiagnosticJourneyComparable): Record<string, unknown> {
  const snapshots = [
    ...(journey.threadSnapshots || []),
    ...(journey.monitoringSnapshots || []),
  ];
  const latest = snapshots.at(-1);
  return asObject(latest?.snapshot);
}

function metricsFrom(journey: DiagnosticJourneyComparable): Record<string, number> {
  const snapshot = latestSnapshot(journey);
  const coreMetrics = asObject(snapshot.coreMetrics);
  const executive = stagePayload(journey, "executive_reporting");
  const result: Record<string, number> = {};

  for (const [key, value] of Object.entries(coreMetrics)) {
    if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
  }

  for (const key of ["clarityScore", "authorityScore", "governanceScore", "severityScore", "percentScore"]) {
    const value = executive[key];
    if (typeof value === "number" && Number.isFinite(value)) result[key] = value;
  }

  return result;
}

function conditionFrom(journey: DiagnosticJourneyComparable): string | null {
  const snapshot = latestSnapshot(journey);
  const executive = stagePayload(journey, "executive_reporting");
  const enterprise = stagePayload(journey, "enterprise");
  return String(
    snapshot.directive ||
      executive.orgState ||
      executive.route ||
      enterprise.patternTitle ||
      enterprise.band ||
      "",
  ).trim() || null;
}

function contradictionCount(journey: DiagnosticJourneyComparable): number {
  return (journey.evidenceNodes || []).filter((node) => node.kind === "contradiction").length;
}

function escalationRank(journey: DiagnosticJourneyComparable): number {
  const snapshot = latestSnapshot(journey);
  const value = snapshot.escalationLevel;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = String(conditionFrom(journey) || "").toUpperCase();
  if (text.includes("CRITICAL") || text.includes("SCORCHING")) return 4;
  if (text.includes("STRATEGY") || text.includes("HIGH")) return 3;
  if (text.includes("DIAGNOSTIC") || text.includes("MEDIUM")) return 2;
  if (text.includes("LOW") || text.includes("MONITOR")) return 1;
  return 0;
}

function consequenceScore(journey: DiagnosticJourneyComparable): number | null {
  const consequence = [...(journey.evidenceNodes || [])]
    .reverse()
    .find((node) => node.kind === "consequence" || node.kind === "exposure_estimate");
  const payload = asObject(consequence?.payload);
  const value = payload.totalRisk ?? payload.riskScore ?? payload.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sharedDecisionKeys(a: DiagnosticJourneyComparable, b: DiagnosticJourneyComparable): string[] {
  const baseline = new Set((a.decisionObjects || []).map((item) => item.decisionKey).filter(Boolean));
  return [...new Set((b.decisionObjects || []).map((item) => item.decisionKey).filter(Boolean))]
    .filter((key) => baseline.has(key));
}

export function computeLongitudinalComparison(
  current: DiagnosticJourneyComparable,
  prior: DiagnosticJourneyComparable[],
): LongitudinalComparisonResult {
  const baseline = [...prior]
    .filter((journey) => (journey.id || journey.journeyKey) !== (current.id || current.journeyKey))
    .sort((a, b) => {
      const aDate = toDate(a.completedAt || a.startedAt || a.createdAt)?.getTime() ?? 0;
      const bDate = toDate(b.completedAt || b.startedAt || b.createdAt)?.getTime() ?? 0;
      return bDate - aDate;
    })[0] || null;

  const currentMetrics = metricsFrom(current);
  const baselineMetrics = baseline ? metricsFrom(baseline) : {};
  const scoreDeltas: Record<string, number> = {};
  for (const key of Object.keys(currentMetrics)) {
    const currentValue = currentMetrics[key];
    const baselineValue = baselineMetrics[key];
    if (typeof currentValue === "number" && typeof baselineValue === "number") {
      scoreDeltas[key] = Math.round((currentValue - baselineValue) * 100) / 100;
    }
  }

  const baselineConsequence = baseline ? consequenceScore(baseline) : null;
  const currentConsequence = consequenceScore(current);
  const consequenceTrajectory =
    baselineConsequence == null || currentConsequence == null
      ? "unknown"
      : currentConsequence < baselineConsequence
        ? "improved"
        : currentConsequence > baselineConsequence
          ? "deteriorated"
          : "stable";

  const baselineCondition = baseline ? conditionFrom(baseline) : null;
  const currentCondition = conditionFrom(current);
  const recurrence = detectPatternRecurrence({ baseline, current });

  const delta: LongitudinalDeltaSummary = {
    baselineJourneyId: baseline?.id || baseline?.journeyKey || null,
    currentJourneyId: current.id || current.journeyKey || null,
    daysBetween: baseline ? daysBetween(baseline.completedAt || baseline.startedAt || baseline.createdAt, current.completedAt || current.startedAt || current.createdAt) : null,
    scoreDeltas,
    contradictionDelta: contradictionCount(current) - (baseline ? contradictionCount(baseline) : 0),
    conditionStateChanged: Boolean(baselineCondition && currentCondition && baselineCondition !== currentCondition),
    baselineCondition,
    currentCondition,
    decisionObjectContinuity: baseline ? sharedDecisionKeys(baseline, current) : [],
    escalationDelta: escalationRank(current) - (baseline ? escalationRank(baseline) : 0),
    consequenceTrajectory,
  };

  const evidenceNodes: DiagnosticEvidenceNodeInput[] = [
    {
      sourceStage: "monitoring",
      kind: "historical_comparison",
      label: "Longitudinal baseline comparison",
      summary: baseline
        ? `Compared against prior ${baseline.diagnosticType || "diagnostic"} journey.`
        : "No prior comparable journey found.",
      evidenceText: baseline
        ? `Days between observations: ${delta.daysBetween ?? "unknown"}. Consequence trajectory: ${consequenceTrajectory}.`
        : "This journey becomes the baseline for future comparison.",
      confidence: baseline ? 0.82 : 0.45,
      severity: delta.escalationDelta > 0 || consequenceTrajectory === "deteriorated" ? "high" : "medium",
      payload: delta,
    },
    {
      sourceStage: "monitoring",
      kind: "delta_summary",
      label: "Diagnostic movement delta",
      summary: Object.keys(scoreDeltas).length
        ? `Score deltas computed across ${Object.keys(scoreDeltas).length} metrics.`
        : "No comparable numeric score deltas available.",
      confidence: Object.keys(scoreDeltas).length ? 0.78 : 0.4,
      severity: delta.escalationDelta > 0 ? "high" : "low",
      payload: { scoreDeltas, contradictionDelta: delta.contradictionDelta },
    },
    ...recurrence.evidenceNodes,
  ];

  return { baseline, delta, recurrence, evidenceNodes };
}

export async function resolveLongitudinalComparison(input: {
  journeyId?: string | null;
  journeyKey?: string | null;
  email?: string | null;
  subjectKey?: string | null;
  organisationKey?: string | null;
  diagnosticType: string;
  persist?: boolean;
}): Promise<LongitudinalComparisonResult> {
  const p = prisma as any;
  const where: Record<string, unknown> = {
    diagnosticType: input.diagnosticType,
  };
  if (input.email) where.email = input.email;
  if (input.subjectKey) where.subjectKey = input.subjectKey;
  if (input.organisationKey) where.organisationKey = input.organisationKey;

  const journeys = await p.diagnosticJourney.findMany({
    where,
    orderBy: { startedAt: "asc" },
    include: {
      stages: { orderBy: { createdAt: "asc" } },
      threadSnapshots: { orderBy: { createdAt: "asc" } },
      monitoringSnapshots: { orderBy: { createdAt: "asc" } },
      evidenceNodes: { orderBy: { createdAt: "asc" } },
      decisionObjects: { orderBy: { createdAt: "asc" } },
    },
  });

  const current = journeys.find((journey: any) =>
    (input.journeyId && journey.id === input.journeyId) ||
    (input.journeyKey && journey.journeyKey === input.journeyKey),
  ) || journeys.at(-1);

  if (!current) {
    throw new Error("No comparable diagnostic journey found.");
  }

  const result = computeLongitudinalComparison(current, journeys);

  if (input.persist && p.longitudinalComparisonRecord?.create) {
    await p.longitudinalComparisonRecord.create({
      data: {
        journeyId: current.id,
        baselineJourneyId: result.baseline?.id || null,
        subjectKey: current.subjectKey || null,
        email: current.email || null,
        organisationKey: current.organisationKey || null,
        diagnosticType: input.diagnosticType,
        cadence: current.monitoringCadence || "ad_hoc",
        deltaSummary: result.delta,
        recurrenceSummary: result.recurrence,
        evidenceNodes: result.evidenceNodes,
      },
    });
  }

  return result;
}
