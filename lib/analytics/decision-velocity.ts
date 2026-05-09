import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";
import type { IntelligenceMeta, IntelligenceScope } from "@/lib/product/intelligence-contract";
import { defaultIntelligenceMeta } from "@/lib/product/intelligence-contract";
import {
  createFieldProvenance,
  type FieldProvenance,
} from "@/lib/product/field-provenance-contract";

export type DecisionVelocitySnapshot = {
  userId?: string | null;
  userEmail?: string | null;
  caseId: string;
  journeyId?: string | null;
  sourceSurface: string;
  diagnosisAt?: string | null;
  checkpointCreatedAt?: string | null;
  firstResponseAt?: string | null;
  completedAt?: string | null;
  hoursDiagnosisToCheckpoint?: number | null;
  hoursCheckpointToResponse?: number | null;
  hoursDiagnosisToCompletion?: number | null;
  responseStatus?: string | null;
  outcomeClassification?: string | null;
  velocityBand: "FAST" | "STEADY" | "SLOWING" | "STALLED" | "INSUFFICIENT_DATA";
  evidencePosture: "SYSTEM_MEASURED" | "PARTIAL" | "INSUFFICIENT";
  explanation: string;
};

export type DecisionVelocitySummary = {
  status: "NO_DATA" | "FIRST_CHECKPOINT_CREATED" | "MEASURED_PERSONAL" | "TREND_AVAILABLE";
  averageTimeToFirstResponseDays: number | null;
  previousAverageTimeToFirstResponseDays?: number | null;
  trendDeltaDays?: number | null;
  openCheckpointCount: number;
  overdueCheckpointCount: number;
  completedCheckpointCount: number;
  blockedCheckpointCount: number;
  decisionVelocityBand: "FAST" | "STEADY" | "SLOWING" | "STALLED" | "INSUFFICIENT_DATA";
  sourceLabel: string;
  evidencePosture: "SYSTEM_MEASURED" | "PARTIAL" | "INSUFFICIENT";
  summary: string;
  caution?: string;
  meta: IntelligenceMeta;
};

function buildDecisionVelocityProvenance(input: {
  scope: IntelligenceScope;
  sourceLabel: string;
  checkpoints: DecisionVelocityCheckpointRecord[];
}): FieldProvenance[] {
  return input.checkpoints.map((checkpoint, index) =>
    createFieldProvenance({
      fieldKey: `checkpoint.${index}.responseStatus`,
      sourceSurface: "DECISION_CENTRE",
      sourceLabel: input.sourceLabel,
      capturedAt: checkpoint.respondedAt ?? checkpoint.createdAt ?? checkpoint.dueAt ?? null,
      priorValueDate: checkpoint.createdAt ?? checkpoint.dueAt ?? null,
      currentValueDate: checkpoint.respondedAt ?? null,
      caseId: input.scope.caseId ?? null,
      journeyId: input.scope.journeyId ?? null,
      strategyRoomSessionId: input.scope.strategyRoomSessionId ?? null,
      executiveRunId: input.scope.executiveRunId ?? null,
      scopeType: "CHECKPOINT",
      scopeId: input.scope.caseId ?? input.scope.journeyId ?? input.scope.strategyRoomSessionId ?? null,
      evidencePosture: checkpoint.respondedAt ? "SYSTEM_COMPUTED" : "INSUFFICIENT_DATA",
      confidenceLabel: checkpoint.respondedAt ? "MEASURED" : "PARTIAL",
    }),
  );
}

type BuildDecisionVelocityInput = Omit<DecisionVelocitySnapshot, "hoursDiagnosisToCheckpoint" | "hoursCheckpointToResponse" | "hoursDiagnosisToCompletion" | "velocityBand" | "evidencePosture" | "explanation">;

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hoursBetween(from?: string | null, to?: string | null): number | null {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  if (!fromDate || !toDate) return null;
  return Math.round(((toDate.getTime() - fromDate.getTime()) / 36e5) * 10) / 10;
}

function bandFor(input: {
  checkpointCreatedAt?: string | null;
  firstResponseAt?: string | null;
  completedAt?: string | null;
}): DecisionVelocitySnapshot["velocityBand"] {
  const checkpointCreatedAt = parseDate(input.checkpointCreatedAt);
  if (!checkpointCreatedAt) return "INSUFFICIENT_DATA";

  const terminalAt = parseDate(input.completedAt) ?? parseDate(input.firstResponseAt);
  if (!terminalAt) {
    const ageHours = hoursBetween(input.checkpointCreatedAt, new Date().toISOString());
    if (ageHours == null) return "INSUFFICIENT_DATA";
    if (ageHours >= 72) return "STALLED";
    if (ageHours > 24) return "SLOWING";
    return "STEADY";
  }

  const elapsed = hoursBetween(input.checkpointCreatedAt, terminalAt.toISOString());
  if (elapsed == null) return "INSUFFICIENT_DATA";
  if (elapsed <= 24) return "FAST";
  if (elapsed <= 72) return "STEADY";
  return "SLOWING";
}

function explanationFor(snapshot: {
  velocityBand: DecisionVelocitySnapshot["velocityBand"];
  checkpointCreatedAt?: string | null;
  firstResponseAt?: string | null;
  completedAt?: string | null;
  hoursCheckpointToResponse?: number | null;
  hoursDiagnosisToCompletion?: number | null;
}): string {
  if (!snapshot.checkpointCreatedAt) {
    return "No durable checkpoint exists yet, so decision velocity cannot be measured.";
  }
  if (snapshot.velocityBand === "INSUFFICIENT_DATA") {
    return "The available timestamps are incomplete, so decision velocity remains insufficient data.";
  }
  if (!snapshot.firstResponseAt && !snapshot.completedAt) {
    const ageHours = hoursBetween(snapshot.checkpointCreatedAt, new Date().toISOString());
    if (snapshot.velocityBand === "STALLED") {
      return `No confirmed action has been recorded ${Math.round(ageHours ?? 0)} hours after checkpoint creation.`;
    }
    return `A checkpoint exists, but no confirmed response has been recorded after ${Math.round(ageHours ?? 0)} hours.`;
  }
  if (snapshot.velocityBand === "FAST") {
    if (snapshot.hoursDiagnosisToCompletion != null) {
      return `Action was confirmed ${Math.round(snapshot.hoursDiagnosisToCompletion)} hours after diagnosis.`;
    }
    return `A response was recorded ${Math.round(snapshot.hoursCheckpointToResponse ?? 0)} hours after checkpoint creation.`;
  }
  if (snapshot.velocityBand === "STEADY") {
    return `A governed response was recorded ${Math.round(snapshot.hoursCheckpointToResponse ?? snapshot.hoursDiagnosisToCompletion ?? 0)} hours after checkpoint creation.`;
  }
  return `Action was not confirmed until ${Math.round(snapshot.hoursCheckpointToResponse ?? snapshot.hoursDiagnosisToCompletion ?? 0)} hours after checkpoint creation.`;
}

export function buildDecisionVelocitySnapshot(
  input: BuildDecisionVelocityInput,
): DecisionVelocitySnapshot {
  const hoursDiagnosisToCheckpoint = hoursBetween(input.diagnosisAt, input.checkpointCreatedAt);
  const hoursCheckpointToResponse = hoursBetween(input.checkpointCreatedAt, input.firstResponseAt ?? input.completedAt);
  const hoursDiagnosisToCompletion = hoursBetween(input.diagnosisAt, input.completedAt ?? input.firstResponseAt);
  const velocityBand = bandFor(input);
  const evidencePosture: DecisionVelocitySnapshot["evidencePosture"] =
    !input.checkpointCreatedAt
      ? "INSUFFICIENT"
      : (input.firstResponseAt || input.completedAt)
        ? "SYSTEM_MEASURED"
        : "PARTIAL";

  return {
    ...input,
    hoursDiagnosisToCheckpoint,
    hoursCheckpointToResponse,
    hoursDiagnosisToCompletion,
    velocityBand,
    evidencePosture,
    explanation: explanationFor({
      velocityBand,
      checkpointCreatedAt: input.checkpointCreatedAt,
      firstResponseAt: input.firstResponseAt,
      completedAt: input.completedAt,
      hoursCheckpointToResponse,
      hoursDiagnosisToCompletion,
    }),
  };
}

export function buildDecisionVelocityMemoryItems(
  snapshot: DecisionVelocitySnapshot,
): GovernedMemoryItem[] {
  if (snapshot.velocityBand === "INSUFFICIENT_DATA") return [];

  const item: GovernedMemoryItem = {
    id: `decision_velocity:${snapshot.caseId}`,
    sourceSurface: "DECISION_CENTRE",
    capturedAt: snapshot.completedAt ?? snapshot.firstResponseAt ?? snapshot.checkpointCreatedAt ?? null,
    evidenceOrigin: "SYSTEM_COMPUTED",
    audienceSafe: true,
    label: "Decision velocity",
    summary: snapshot.explanation,
    status: snapshot.velocityBand === "STALLED" ? "UNRESOLVED" : "ACTIVE",
    confidenceLabel: snapshot.evidencePosture === "SYSTEM_MEASURED" ? "VERIFIED" : "PARTIAL",
  };

  return [item];
}

type DecisionVelocityCheckpointRecord = {
  createdAt?: string | null;
  dueAt?: string | null;
  responseStatus?: string | null;
  respondedAt?: string | null;
};

export function buildDecisionVelocitySummary(input: {
  checkpoints: DecisionVelocityCheckpointRecord[];
  scope: IntelligenceScope;
  sourceLabel?: string;
  sourceSurfaces?: string[];
  generatedAt?: string;
}): DecisionVelocitySummary {
  const checkpoints = [...input.checkpoints];
  const responseHours = checkpoints
    .map((checkpoint) => hoursBetween(checkpoint.createdAt ?? checkpoint.dueAt, checkpoint.respondedAt))
    .filter((value): value is number => value != null && value >= 0);
  const measuredResponses = checkpoints.filter((checkpoint) => Boolean(checkpoint.respondedAt)).length;
  const averageTimeToFirstResponseDays = responseHours.length > 0
    ? Math.round(((responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length) / 24) * 10) / 10
    : null;
  const previousAverageTimeToFirstResponseDays = responseHours.length > 1
    ? Math.round((((responseHours.slice(0, -1).reduce((sum, value) => sum + value, 0) / responseHours.slice(0, -1).length)) / 24) * 10) / 10
    : null;
  const trendDeltaDays = averageTimeToFirstResponseDays != null && previousAverageTimeToFirstResponseDays != null
    ? Math.round((averageTimeToFirstResponseDays - previousAverageTimeToFirstResponseDays) * 10) / 10
    : null;
  const openCheckpointCount = checkpoints.filter((checkpoint) => !checkpoint.respondedAt).length;
  const overdueCheckpointCount = checkpoints.filter((checkpoint) => !checkpoint.respondedAt && parseDate(checkpoint.dueAt)?.getTime()! < Date.now()).length;
  const completedCheckpointCount = checkpoints.filter((checkpoint) => checkpoint.responseStatus === "COMPLETED").length;
  const blockedCheckpointCount = checkpoints.filter((checkpoint) => checkpoint.responseStatus === "BLOCKED").length;

  let decisionVelocityBand: DecisionVelocitySummary["decisionVelocityBand"] = "INSUFFICIENT_DATA";
  if (blockedCheckpointCount > 0) {
    decisionVelocityBand = "STALLED";
  } else if (averageTimeToFirstResponseDays == null) {
    decisionVelocityBand = openCheckpointCount > 0 ? "INSUFFICIENT_DATA" : "INSUFFICIENT_DATA";
  } else if (overdueCheckpointCount > 0 || averageTimeToFirstResponseDays > 5) {
    decisionVelocityBand = "STALLED";
  } else if (averageTimeToFirstResponseDays > 3) {
    decisionVelocityBand = "SLOWING";
  } else if (averageTimeToFirstResponseDays > 1) {
    decisionVelocityBand = "STEADY";
  } else {
    decisionVelocityBand = "FAST";
  }

  const sourceLabel = input.sourceLabel ?? "Checkpoint history";
  const provenance = buildDecisionVelocityProvenance({
    scope: input.scope,
    sourceLabel,
    checkpoints,
  });
  const evidencePosture: DecisionVelocitySummary["evidencePosture"] =
    measuredResponses > 0 ? "SYSTEM_MEASURED" : checkpoints.length > 0 ? "PARTIAL" : "INSUFFICIENT";
  const status: DecisionVelocitySummary["status"] =
    checkpoints.length === 0
      ? "NO_DATA"
      : measuredResponses === 0
        ? "FIRST_CHECKPOINT_CREATED"
        : measuredResponses > 1
          ? "TREND_AVAILABLE"
          : "MEASURED_PERSONAL";

  let summary = "No decision velocity has been measured yet.";
  if (status === "FIRST_CHECKPOINT_CREATED") {
    summary = "A checkpoint has been scheduled. Velocity starts once an outcome is recorded.";
  } else if (status === "MEASURED_PERSONAL" && averageTimeToFirstResponseDays != null) {
    summary = `Your average time from diagnosis to recorded response is ${averageTimeToFirstResponseDays} day${averageTimeToFirstResponseDays === 1 ? "" : "s"}.`;
  } else if (status === "TREND_AVAILABLE" && averageTimeToFirstResponseDays != null && trendDeltaDays != null) {
    const direction = trendDeltaDays < 0 ? "improved" : trendDeltaDays > 0 ? "worsened" : "held steady";
    summary = direction === "held steady"
      ? `Your recorded decision velocity is holding steady at ${averageTimeToFirstResponseDays} day${averageTimeToFirstResponseDays === 1 ? "" : "s"} to response.`
      : `Your recorded decision velocity ${direction} by ${Math.abs(trendDeltaDays)} day${Math.abs(trendDeltaDays) === 1 ? "" : "s"} compared with your previous recorded cycle.`;
  }
  if (openCheckpointCount > 0 && status !== "NO_DATA") {
    summary += ` ${openCheckpointCount} checkpoint${openCheckpointCount === 1 ? " remains" : "s remain"} unresolved.`;
  }

  const capturedAt = checkpoints
    .map((checkpoint) => checkpoint.respondedAt ?? checkpoint.dueAt ?? checkpoint.createdAt ?? null)
    .filter((value): value is string => Boolean(value))
    .at(-1) ?? null;
  const previousCapturedAt = checkpoints
    .map((checkpoint) => checkpoint.respondedAt ?? checkpoint.dueAt ?? checkpoint.createdAt ?? null)
    .filter((value): value is string => Boolean(value))
    .at(-2) ?? null;
  return {
    status,
    averageTimeToFirstResponseDays,
    previousAverageTimeToFirstResponseDays,
    trendDeltaDays,
    openCheckpointCount,
    overdueCheckpointCount,
    completedCheckpointCount,
    blockedCheckpointCount,
    decisionVelocityBand,
    sourceLabel,
    evidencePosture,
    summary,
    caution: evidencePosture === "SYSTEM_MEASURED"
      ? "Measured from recorded checkpoints. Not a benchmark."
      : status === "FIRST_CHECKPOINT_CREATED"
        ? "External benchmark unavailable. This is based only on your record."
        : "No decision velocity has been measured yet.",
    meta: defaultIntelligenceMeta({
      scope: input.scope,
      sourceLabel,
      sourceSurfaces: input.sourceSurfaces ?? ["Checkpoint history"],
      generatedAt: input.generatedAt,
      capturedAt,
      previousCapturedAt,
      currentCapturedAt: capturedAt,
      evidencePosture: evidencePosture === "SYSTEM_MEASURED" ? "SYSTEM_MEASURED" : evidencePosture === "PARTIAL" ? "INSUFFICIENT_DATA" : "INSUFFICIENT_DATA",
      confidenceLabel: evidencePosture === "SYSTEM_MEASURED" ? "MEASURED" : evidencePosture === "PARTIAL" ? "UNAVAILABLE" : "UNAVAILABLE",
      dataQuality: status === "NO_DATA" ? "EMPTY" : status === "FIRST_CHECKPOINT_CREATED" ? "THIN" : "MATURE",
      evidenceBasis: "Measured from recorded checkpoints.",
      meaning: "Shows how quickly recorded decisions move into governed response.",
      limitation: "Not compared with external users.",
      nextAction: openCheckpointCount > 0 ? "Respond to the open checkpoint." : "Record the next governed response to strengthen this reading.",
      provenance,
      comparisonBasis: trendDeltaDays != null ? "CURRENT_VS_PRIOR" : capturedAt ? "BASELINE_ONLY" : "THIN_STATE",
      emptyState: status === "NO_DATA"
        ? {
            reason: "No decision velocity has been measured yet.",
            nextAction: "Complete a diagnostic and wait for the first checkpoint.",
          }
        : undefined,
    }),
  };
}
