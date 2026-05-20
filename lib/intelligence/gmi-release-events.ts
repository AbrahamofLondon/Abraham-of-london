import type { QualityGateResult } from "./market-intelligence-quality-gate";

export type GmiReleaseEventType =
  | "GMI_QUALITY_GATE_RUN"
  | "GMI_SOURCE_ROW_VERIFIED"
  | "GMI_SOURCE_ROW_REJECTED"
  | "GMI_CALL_REVIEWED"
  | "GMI_CALL_CARRIED_FORWARD"
  | "GMI_LIFECYCLE_TRANSITION_PROPOSED"
  | "GMI_LIFECYCLE_TRANSITION_APPROVED"
  | "GMI_LIFECYCLE_TRANSITION_REJECTED"
  | "GMI_OUTBOUND_GATE_RUN"
  | "GMI_RELEASE_BLOCKED"
  | "GMI_RELEASE_APPROVED";

export type GmiReleaseEventSeverity =
  | "INFO"
  | "WARNING"
  | "BLOCKER"
  | "APPROVAL";

export type GmiReleaseActor = "SYSTEM" | "ADMIN" | "OPERATOR";

export type GmiSafeMetadataValue = string | number | boolean | null;

export type GmiReleaseEvent = {
  eventVersion: 1;
  eventType: GmiReleaseEventType;
  severity: GmiReleaseEventSeverity;
  reportId: string;
  relatedReportId?: string;
  sourceRowId?: string;
  callId?: string;
  actor?: GmiReleaseActor;
  requestId?: string;
  source?: string;
  occurredAt: string;
  summary: string;
  safeMetadata: Record<string, GmiSafeMetadataValue>;
};

type BaseEventInput = {
  reportId: string;
  relatedReportId?: string;
  actor?: GmiReleaseActor;
  requestId?: string;
  source?: string;
  occurredAt?: string;
};

const UNSAFE_METADATA_KEY_PARTS = [
  "body",
  "content",
  "credential",
  "password",
  "privatekey",
  "raw",
  "secret",
  "sourcefulltext",
  "sourcetext",
  "token",
];

function normalizeMetadataKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSafeMetadataKey(key: string): boolean {
  const normalized = normalizeMetadataKey(key);
  return !UNSAFE_METADATA_KEY_PARTS.some((part) => normalized.includes(part));
}

function toSafeMetadataValue(value: unknown): GmiSafeMetadataValue | undefined {
  if (value === null) return null;
  if (typeof value === "string") return value.slice(0, 300);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  return undefined;
}

export function sanitizeGmiReleaseMetadata(
  metadata: Record<string, unknown>,
): Record<string, GmiSafeMetadataValue> {
  return Object.entries(metadata).reduce<Record<string, GmiSafeMetadataValue>>(
    (safe, [key, value]) => {
      if (!isSafeMetadataKey(key)) return safe;
      const safeValue = toSafeMetadataValue(value);
      if (safeValue !== undefined) safe[key] = safeValue;
      return safe;
    },
    {},
  );
}

function buildEvent(
  input: BaseEventInput & {
    eventType: GmiReleaseEventType;
    severity: GmiReleaseEventSeverity;
    summary: string;
    safeMetadata?: Record<string, unknown>;
    sourceRowId?: string;
    callId?: string;
  },
): GmiReleaseEvent {
  return {
    eventVersion: 1,
    eventType: input.eventType,
    severity: input.severity,
    reportId: input.reportId,
    relatedReportId: input.relatedReportId,
    sourceRowId: input.sourceRowId,
    callId: input.callId,
    actor: input.actor ?? "SYSTEM",
    requestId: input.requestId,
    source: input.source,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    summary: input.summary,
    safeMetadata: sanitizeGmiReleaseMetadata(input.safeMetadata ?? {}),
  };
}

export function buildQualityGateRunEvent(
  input: BaseEventInput & {
    qualityGate: Pick<QualityGateResult, "overallScore" | "releaseReady" | "criticalFailures" | "blockers">;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_QUALITY_GATE_RUN",
    severity: input.qualityGate.releaseReady ? "INFO" : "WARNING",
    summary: `Quality gate run for ${input.reportId}: ${
      input.qualityGate.releaseReady ? "release-ready" : "not release-ready"
    }.`,
    safeMetadata: {
      overallScore: input.qualityGate.overallScore,
      releaseReady: input.qualityGate.releaseReady,
      criticalFailureCount: input.qualityGate.criticalFailures.length,
      blockerCount: input.qualityGate.blockers.length,
      criticalFailures: input.qualityGate.criticalFailures.join(", "),
    },
  });
}

export function buildReleaseBlockedEvent(
  input: BaseEventInput & {
    blockers: readonly string[];
    primaryReason?: string;
  },
): GmiReleaseEvent {
  const primaryReason = input.primaryReason ?? input.blockers[0] ?? "Release conditions not satisfied";
  return buildEvent({
    ...input,
    eventType: "GMI_RELEASE_BLOCKED",
    severity: "BLOCKER",
    summary: `Release blocked for ${input.reportId}: ${primaryReason}.`,
    safeMetadata: {
      blockerCount: input.blockers.length,
      primaryReason,
      blockerCodes: input.blockers.join(", ").slice(0, 300),
    },
  });
}

export function buildSourceRowVerifiedEvent(
  input: BaseEventInput & {
    sourceRowId: string;
    evidenceClass?: string;
    confidence?: string;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_SOURCE_ROW_VERIFIED",
    severity: "INFO",
    sourceRowId: input.sourceRowId,
    summary: `Source row ${input.sourceRowId} verified for ${input.reportId}.`,
    safeMetadata: {
      sourceRowId: input.sourceRowId,
      evidenceClass: input.evidenceClass ?? null,
      confidence: input.confidence ?? null,
      status: "VERIFIED",
    },
  });
}

export function buildSourceRowRejectedEvent(
  input: BaseEventInput & {
    sourceRowId: string;
    evidenceClass?: string;
    reasonCode?: string;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_SOURCE_ROW_REJECTED",
    severity: "WARNING",
    sourceRowId: input.sourceRowId,
    summary: `Source row ${input.sourceRowId} rejected for ${input.reportId}.`,
    safeMetadata: {
      sourceRowId: input.sourceRowId,
      evidenceClass: input.evidenceClass ?? null,
      reasonCode: input.reasonCode ?? null,
      status: "REJECTED",
    },
  });
}

export function buildCallReviewedEvent(
  input: BaseEventInput & {
    callId: string;
    outcomeStatus: string;
    score: number | null;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_CALL_REVIEWED",
    severity: "INFO",
    callId: input.callId,
    summary: `Call ${input.callId} reviewed for ${input.reportId}.`,
    safeMetadata: {
      callId: input.callId,
      outcomeStatus: input.outcomeStatus,
      score: input.score,
    },
  });
}

export function buildCallCarriedForwardEvent(
  input: BaseEventInput & {
    callId: string;
    nextReviewWindow: string;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_CALL_CARRIED_FORWARD",
    severity: "WARNING",
    callId: input.callId,
    summary: `Call ${input.callId} carried forward for ${input.reportId}.`,
    safeMetadata: {
      callId: input.callId,
      nextReviewWindow: input.nextReviewWindow,
    },
  });
}

export function buildLifecycleTransitionProposedEvent(
  input: BaseEventInput & {
    fromState: string;
    toState: string;
    reasonCode?: string;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_LIFECYCLE_TRANSITION_PROPOSED",
    severity: "APPROVAL",
    summary: `Lifecycle transition proposed for ${input.reportId}: ${input.fromState} to ${input.toState}.`,
    safeMetadata: {
      fromState: input.fromState,
      toState: input.toState,
      reasonCode: input.reasonCode ?? null,
    },
  });
}

export function buildOutboundGateRunEvent(
  input: BaseEventInput & {
    channel: string;
    assetId?: string;
    status: string;
    publishable: boolean;
    lifecycleGated: boolean;
  },
): GmiReleaseEvent {
  return buildEvent({
    ...input,
    eventType: "GMI_OUTBOUND_GATE_RUN",
    severity: input.publishable ? "INFO" : "WARNING",
    summary: `Outbound gate run for ${input.reportId}: ${input.publishable ? "publishable" : "not publishable"}.`,
    safeMetadata: {
      channel: input.channel,
      assetId: input.assetId ?? null,
      status: input.status,
      publishable: input.publishable,
      lifecycleGated: input.lifecycleGated,
    },
  });
}
