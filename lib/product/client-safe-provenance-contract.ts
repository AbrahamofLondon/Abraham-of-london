/**
 * Client-Safe Provenance Summary
 *
 * A filtered projection of the internal DecisionProvenanceRecord suitable for
 * delivery to sponsors, account holders, and regulated clients. It exposes
 * accountability posture without leaking operator internals, suppression
 * field names, raw evidence, escalation deliberation, or admin system paths.
 *
 * What is included: accountability statement, provenanceHash, delivery/outcome
 * posture, gap count + severity classes, confidence bands, milestone timeline.
 *
 * What is excluded: governance event labels, actor names, source paths,
 * internal suppression details, escalation reasons, admin hrefs, unavailable
 * source lists, operator notes.
 */

export type ClientSafeDeliveryPosture = "DELIVERED" | "APPROVED" | "PENDING" | "UNKNOWN";
export type ClientSafeOutcomePosture = "RECORDED" | "PENDING" | "UNKNOWN";
export type ClientSafeGapSeverity = "INFO" | "WARNING" | "CRITICAL";
export type ClientSafeConfidenceLevel =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "OPERATOR_VERIFIED"
  | "THIRD_PARTY";

export type ClientSafeConfidenceBand = {
  level: ClientSafeConfidenceLevel;
  count: number;
};

export type ClientSafeTimelineMilestone =
  | "EVIDENCE_CAPTURED"
  | "REVIEW_COMPLETED"
  | "DELIVERY_SENT"
  | "OUTCOME_RECORDED";

export type ClientSafeTimelineEntry = {
  milestone: ClientSafeTimelineMilestone;
  occurredAt: string | null;
  label: string;
};

export type ClientSafeProvenanceSummary = {
  version: 1;
  subjectId: string;
  accountabilityStatement: string;
  provenanceHash: string;
  deliveryPosture: ClientSafeDeliveryPosture;
  outcomePosture: ClientSafeOutcomePosture;
  gapCount: number;
  gapClasses: ClientSafeGapSeverity[];
  confidenceBands: ClientSafeConfidenceBand[];
  timelineSummary: ClientSafeTimelineEntry[];
  composedAt: string;
};
