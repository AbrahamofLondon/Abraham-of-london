import type { GovernedMemoryItem } from "@/lib/product/governed-memory-contract";

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
  velocityBand: "FAST" | "STEADY" | "SLOW" | "STALLED" | "INSUFFICIENT_DATA";
  evidencePosture: "SYSTEM_MEASURED" | "PARTIAL" | "INSUFFICIENT";
  explanation: string;
};

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
    if (ageHours > 24) return "SLOW";
    return "STEADY";
  }

  const elapsed = hoursBetween(input.checkpointCreatedAt, terminalAt.toISOString());
  if (elapsed == null) return "INSUFFICIENT_DATA";
  if (elapsed <= 24) return "FAST";
  if (elapsed <= 72) return "STEADY";
  return "SLOW";
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
