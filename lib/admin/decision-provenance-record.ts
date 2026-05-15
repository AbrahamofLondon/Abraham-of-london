/**
 * Decision Provenance Record is the accountability layer beneath governed
 * decision operations. It does not make decisions and does not claim certainty.
 * It composes existing evidence, governance events, gaps, posture, and
 * deterministic hash into an audit-safe record of what happened to a decision.
 */

import { createHash } from "crypto";

import type { BoardroomArchiveEntry } from "@/lib/product/boardroom-archive-contract";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { OutcomeVerificationRecord } from "@/lib/product/outcome-verification-contract";
import type { OversightCycleArchiveRecord } from "@/lib/product/oversight-cycle-ledger-contract";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";
import type { CounselHistoryEntry } from "@/lib/product/counsel-history-contract";
import type { RetainedReviewCycle, CadenceHistoryEvent } from "@/lib/product/retained-cadence-contract";
import type { RetainerCycleMemorySummary } from "@/lib/product/retainer-cycle-memory-contract";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";

export type DecisionProvenanceRecord = {
  version: 1;
  id: string;
  subjectType:
    | "OVERSIGHT_CYCLE"
    | "EXECUTIVE_REPORT"
    | "DECISION_CASE"
    | "RETAINER_ACCOUNT"
    | "DELIVERY_ITEM"
    | "STRATEGY_ROOM_RECORD";
  subjectId: string;
  evidenceInputs: DecisionProvenanceEvidenceInput[];
  governanceEvents: DecisionProvenanceEvent[];
  timeline: DecisionProvenanceTimelineItem[];
  currentPosture: {
    status:
      | "COMPLETE"
      | "IN_REVIEW"
      | "BLOCKED"
      | "ESCALATED"
      | "DELIVERED"
      | "UNVERIFIED"
      | "UNKNOWN";
    summary: string;
    nextAction?: string;
    nextActionHref?: string;
  };
  provenanceGaps: DecisionProvenanceGap[];
  provenanceHash: string;
  accountabilityStatement: string;
  unavailableSources: string[];
};

export type DecisionProvenanceConfidenceEvidence = {
  reason: string;
  sourceType?:
    | "USER_INPUT"
    | "SYSTEM_RULE"
    | "OPERATOR_ACTION"
    | "THIRD_PARTY_RECORD"
    | "INTEGRATION"
    | "UNKNOWN";
  sourceRef?: string | null;
  observedAt?: string | null;
};

export type DecisionProvenanceEvidenceInput = {
  type: string;
  label: string;
  evidencePosture?: string | null;
  source?: string | null;
  createdAt?: string | null;
  confidence:
    | "USER_REPORTED"
    | "SYSTEM_INFERRED"
    | "OPERATOR_VERIFIED"
    | "THIRD_PARTY";
  confidenceEvidence?: DecisionProvenanceConfidenceEvidence;
};

export type DecisionProvenanceEvent = {
  type:
    | "SIGNAL_DETECTED"
    | "OPERATOR_REVIEWED"
    | "SUPPRESSION_APPLIED"
    | "SUPPRESSION_RELEASED"
    | "COUNSEL_ESCALATED"
    | "BOARDROOM_ESCALATED"
    | "DELIVERY_APPROVED"
    | "DELIVERY_SENT"
    | "OUTCOME_RECORDED"
    | "MEMORY_UPDATED"
    | "ACCESS_REVIEWED"
    | "BATCH_ACTION_RECORDED"
    | "EVIDENCE_ADMITTED"
    | "DECISION_RECORDED"
    | "AUTHORITY_ASSIGNED"
    | "CONSTRAINT_RETAINED"
    | "REVIEW_TRIGGER_SET"
    | "CHECKPOINT_CREATED"
    | "RETURN_BRIEF_STATUS_RECORDED";
  label: string;
  actor?: string | null;
  occurredAt?: string | null;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  href?: string;
};

export type DecisionProvenanceTimelineItem = {
  date: string;
  event: string;
  type: "INPUT" | "REVIEW" | "ACTION" | "OUTCOME" | "MEMORY" | "GAP";
};

export type DecisionProvenanceGap = {
  stage: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  href?: string;
  remediation?: {
    action: string;
    owner: "operator" | "admin" | "founder" | "future-team";
    href?: string;
  };
};

export type DecisionProvenanceSourceInventoryItem = {
  sourceName: string;
  modelOrHelper: string;
  evidenceProvided: string;
  eventTypes: DecisionProvenanceEvent["type"][];
  confidence: DecisionProvenanceEvidenceInput["confidence"];
  hasActor: boolean;
  hasTimestamp: boolean;
  safeToExpose: boolean;
  v1Status: "USED" | "DEFERRED";
  deferredReason?: string;
};

export const DECISION_PROVENANCE_SOURCE_INVENTORY: DecisionProvenanceSourceInventoryItem[] = [
  {
    sourceName: "Retained cadence cycles",
    modelOrHelper: "retained-cadence-service.listRetainedReviewCycles",
    evidenceProvided: "Cycle identity, cadence state, source, schedule, operator, and evidence posture.",
    eventTypes: ["SIGNAL_DETECTED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Retained cadence history",
    modelOrHelper: "retained-cadence-service.loadCadenceHistory",
    evidenceProvided: "Recorded cadence actions without raw client payloads.",
    eventTypes: ["SIGNAL_DETECTED", "BATCH_ACTION_RECORDED"],
    confidence: "OPERATOR_VERIFIED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Suppression ledger",
    modelOrHelper: "suppression-ledger.loadSuppressionLedger",
    evidenceProvided: "Field references, reasons, override status, and source posture. Raw suppressed values are not exposed.",
    eventTypes: ["SUPPRESSION_APPLIED", "SUPPRESSION_RELEASED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Delivery audit",
    modelOrHelper: "oversight-delivery-service.listAllDeliveries",
    evidenceProvided: "Artifact, approval, delivery status, method, recipient role, and timestamps.",
    eventTypes: ["DELIVERY_APPROVED", "DELIVERY_SENT"],
    confidence: "OPERATOR_VERIFIED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Outcome verification",
    modelOrHelper: "OutcomeVerificationRecord and outcome-verification-service",
    evidenceProvided: "Outcome classification, status, posture, and timestamp. Narrative payloads are not exposed.",
    eventTypes: ["OUTCOME_RECORDED"],
    confidence: "USER_REPORTED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Counsel review history",
    modelOrHelper: "counsel-history-loader.loadCounselHistory",
    evidenceProvided: "Counsel trigger, assignment, status, and operator disposition.",
    eventTypes: ["COUNSEL_ESCALATED", "OPERATOR_REVIEWED"],
    confidence: "OPERATOR_VERIFIED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Boardroom archive",
    modelOrHelper: "boardroom-archive.loadBoardroomArchiveSummary",
    evidenceProvided: "Boardroom dossier trigger, export status, and qualification timestamp.",
    eventTypes: ["BOARDROOM_ESCALATED"],
    confidence: "OPERATOR_VERIFIED",
    hasActor: false,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Retainer cycle memory",
    modelOrHelper: "retainer-cycle-memory-engine.buildRetainerCycleMemorySummary",
    evidenceProvided: "Retained memory status, findings count, escalation requirement, and generated timestamp.",
    eventTypes: ["MEMORY_UPDATED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: false,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Admin event log",
    modelOrHelper: "event-log.buildEventLogSummary",
    evidenceProvided: "Cross-source admin events.",
    eventTypes: ["ACCESS_REVIEWED", "BATCH_ACTION_RECORDED"],
    confidence: "OPERATOR_VERIFIED",
    hasActor: true,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "DEFERRED",
    deferredReason: "v1 avoids duplicating the event log and uses domain records directly.",
  },
  {
    sourceName: "Executive reports",
    modelOrHelper: "executive-reporting-run (Prisma)",
    evidenceProvided: "Report identity, route, status, and timestamp. Raw report content is not exposed.",
    eventTypes: ["SIGNAL_DETECTED", "OUTCOME_RECORDED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: false,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "USED",
  },
  {
    sourceName: "Decision Centre cases",
    modelOrHelper: "decision-centre case helpers",
    evidenceProvided: "Decision case context and signals.",
    eventTypes: ["SIGNAL_DETECTED", "OUTCOME_RECORDED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: false,
    hasTimestamp: true,
    safeToExpose: false,
    v1Status: "DEFERRED",
    deferredReason: "Not wired until a stable data source with deterministic subject linkage exists for decision cases.",
  },
  {
    sourceName: "Access diagnostics",
    modelOrHelper: "access-diagnostics",
    evidenceProvided: "Access posture and diagnostics results.",
    eventTypes: ["ACCESS_REVIEWED"],
    confidence: "SYSTEM_INFERRED",
    hasActor: false,
    hasTimestamp: true,
    safeToExpose: true,
    v1Status: "DEFERRED",
    deferredReason: "Persisted subject linkage is not yet direct enough for deterministic composition.",
  },
];

export type DecisionProvenanceSourceData = {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
  cycles?: RetainedReviewCycle[];
  cadenceHistory?: CadenceHistoryEvent[];
  suppressions?: SuppressionEvent[];
  deliveries?: DeliveryRecord[];
  outcomes?: OutcomeVerificationRecord[];
  counselEntries?: CounselHistoryEntry[];
  boardroomEntries?: BoardroomArchiveEntry[];
  decisionRecords?: OversightReviewDecisionRecord[];
  archiveRecords?: OversightCycleArchiveRecord[];
  memorySummary?: RetainerCycleMemorySummary | null;
  unavailableSources?: string[];
  unsupportedReason?: string;
};

export type StrategyRoomProvenanceBackingRecord = {
  sessionId: string;
  sessionKey: string;
  sessionStatus: string;
  createdAt: string;
  updatedAt: string;
  admittedEvidenceAt?: string | null;
  decisionEvents: Array<{
    status: string;
    createdAt: string;
  }>;
  authorityAssignedAt?: string | null;
  constraintRetainedAt?: string | null;
  reviewTriggerAt?: string | null;
  checkpointCreatedAt?: string | null;
  returnBriefStatus?: "AVAILABLE" | "PENDING" | "UNAVAILABLE" | null;
  returnBriefObservedAt?: string | null;
  unavailableSources?: string[];
};

type HashableDecisionProvenanceRecord = Omit<DecisionProvenanceRecord, "provenanceHash">;
type StatementInput = Omit<DecisionProvenanceRecord, "accountabilityStatement" | "provenanceHash">;

export const SUPPORTED_DECISION_PROVENANCE_SUBJECT_TYPES = [
  "OVERSIGHT_CYCLE",
  "EXECUTIVE_REPORT",
  "RETAINER_ACCOUNT",
  "DELIVERY_ITEM",
  "STRATEGY_ROOM_RECORD",
] as const satisfies readonly DecisionProvenanceRecord["subjectType"][];

const SUPPORTED_SUBJECT_TYPES = new Set<DecisionProvenanceRecord["subjectType"]>(
  SUPPORTED_DECISION_PROVENANCE_SUBJECT_TYPES,
);

export type SupportedDecisionProvenanceSubjectType =
  (typeof SUPPORTED_DECISION_PROVENANCE_SUBJECT_TYPES)[number];

export function isSupportedDecisionProvenanceSubjectType(
  subjectType: string,
): subjectType is SupportedDecisionProvenanceSubjectType {
  return SUPPORTED_SUBJECT_TYPES.has(subjectType as DecisionProvenanceRecord["subjectType"]);
}

function isoOrNull(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function stableCompare(left?: string | null, right?: string | null) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  return left.localeCompare(right);
}

function sortEvidenceInputs(inputs: DecisionProvenanceEvidenceInput[]) {
  return [...inputs].sort((left, right) =>
    stableCompare(left.createdAt, right.createdAt)
    || left.type.localeCompare(right.type)
    || left.label.localeCompare(right.label)
    || (left.source ?? "").localeCompare(right.source ?? ""),
  );
}

function sortGovernanceEvents(events: DecisionProvenanceEvent[]) {
  return [...events].sort((left, right) =>
    stableCompare(left.occurredAt, right.occurredAt)
    || left.type.localeCompare(right.type)
    || left.label.localeCompare(right.label)
    || (left.actor ?? "").localeCompare(right.actor ?? ""),
  );
}

function sortGaps(gaps: DecisionProvenanceGap[]) {
  const severityOrder: Record<DecisionProvenanceGap["severity"], number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
  };
  return [...gaps].sort((left, right) =>
    severityOrder[left.severity] - severityOrder[right.severity]
    || left.stage.localeCompare(right.stage)
    || left.description.localeCompare(right.description),
  );
}

function normalizeEvidenceConfidence(
  posture?: string | null,
  source?: string | null,
): DecisionProvenanceEvidenceInput["confidence"] {
  const value = `${posture ?? ""} ${source ?? ""}`.toUpperCase();
  if (value.includes("THIRD_PARTY") || value.includes("EXTERNAL_VERIFIED")) return "THIRD_PARTY";
  if (value.includes("VERIFIED") || value.includes("OPERATOR_REVIEWED") || value.includes("OPERATOR_RECORDED")) {
    return "OPERATOR_VERIFIED";
  }
  if (value.includes("USER_REPORTED")) return "USER_REPORTED";
  return "SYSTEM_INFERRED";
}

function evidenceLabelWithoutSensitivePayload(input: {
  prefix: string;
  value?: string | null;
  fallback: string;
}) {
  const value = input.value?.trim();
  return value ? `${input.prefix}: ${value}` : input.fallback;
}

function buildConfidenceEvidence(
  confidence: DecisionProvenanceEvidenceInput["confidence"],
  source?: string | null,
  observedAt?: string | null,
): DecisionProvenanceConfidenceEvidence {
  switch (confidence) {
    case "USER_REPORTED":
      return {
        reason: "Provided by user during diagnostic or intake.",
        sourceType: "USER_INPUT",
        sourceRef: source ?? null,
        observedAt: observedAt ?? null,
      };
    case "SYSTEM_INFERRED":
      return {
        reason: "Derived by deterministic system rule.",
        sourceType: "SYSTEM_RULE",
        sourceRef: source ?? null,
        observedAt: observedAt ?? null,
      };
    case "OPERATOR_VERIFIED":
      return {
        reason: "Recorded through operator review workflow.",
        sourceType: "OPERATOR_ACTION",
        sourceRef: null,
        observedAt: observedAt ?? null,
      };
    case "THIRD_PARTY":
      return {
        reason: "Derived from third-party or integration source.",
        sourceType: "THIRD_PARTY_RECORD",
        sourceRef: source ?? null,
        observedAt: observedAt ?? null,
      };
  }
}

export function composeEvidenceInputs(
  data: DecisionProvenanceSourceData,
): DecisionProvenanceEvidenceInput[] {
  const inputs: DecisionProvenanceEvidenceInput[] = [];

  for (const cycle of data.cycles ?? []) {
    const confidence = normalizeEvidenceConfidence(cycle.evidencePosture, "retained-cadence-service");
    inputs.push({
      type: "CADENCE_CYCLE",
      label: `Retained review cycle (${cycle.cadenceType})`,
      evidencePosture: cycle.evidencePosture,
      source: "retained-cadence-service",
      createdAt: isoOrNull(cycle.createdAt),
      confidence,
      confidenceEvidence: buildConfidenceEvidence(confidence, "retained-cadence-service", isoOrNull(cycle.createdAt)),
    });
  }

  for (const archive of data.archiveRecords ?? []) {
    inputs.push({
      type: "OVERSIGHT_ARCHIVE",
      label: `Oversight archive for cycle ${archive.cycleId}`,
      evidencePosture: archive.efficacyGrade,
      source: "oversight-cycle-archive",
      createdAt: isoOrNull(archive.createdAt),
      confidence: "SYSTEM_INFERRED",
      confidenceEvidence: buildConfidenceEvidence("SYSTEM_INFERRED", "oversight-cycle-archive", isoOrNull(archive.createdAt)),
    });
  }

  for (const suppression of data.suppressions ?? []) {
    const posture = suppression.evidencePosture ?? suppression.originalPosture ?? null;
    const confidence = normalizeEvidenceConfidence(posture, suppression.evidenceSource);
    inputs.push({
      type: "SUPPRESSION",
      label: `Suppression: ${suppression.fieldName} on ${suppression.surface}`,
      evidencePosture: posture,
      source: "suppression-ledger",
      createdAt: isoOrNull(suppression.suppressedAt),
      confidence,
      confidenceEvidence: buildConfidenceEvidence(confidence, suppression.evidenceSource, isoOrNull(suppression.suppressedAt)),
    });
  }

  for (const delivery of data.deliveries ?? []) {
    const confidence = normalizeEvidenceConfidence(delivery.evidencePosture, "operator delivery audit");
    inputs.push({
      type: "DELIVERY",
      label: `Delivery record: ${delivery.artifactType} for ${delivery.recipientRole}`,
      evidencePosture: delivery.evidencePosture ?? delivery.status,
      source: delivery.sourceLabel ?? "oversight-delivery-service",
      createdAt: isoOrNull(delivery.createdAt),
      confidence,
      confidenceEvidence: buildConfidenceEvidence(confidence, delivery.sourceLabel ?? "oversight-delivery-service", isoOrNull(delivery.createdAt)),
    });
  }

  for (const decision of data.decisionRecords ?? []) {
    inputs.push({
      type: "OPERATOR_DECISION",
      label: `Operator decision: ${decision.decision}`,
      evidencePosture: decision.efficacyGrade,
      source: "oversight-review-decision-ledger",
      createdAt: isoOrNull(decision.createdAt),
      confidence: "OPERATOR_VERIFIED",
      confidenceEvidence: buildConfidenceEvidence("OPERATOR_VERIFIED", "oversight-review-decision-ledger", isoOrNull(decision.createdAt)),
    });
  }

  for (const outcome of data.outcomes ?? []) {
    const confidence = normalizeEvidenceConfidence(outcome.evidencePosture, "outcome-verification-service");
    inputs.push({
      type: "OUTCOME_VERIFICATION",
      label: `Outcome verification: ${outcome.outcomeClassification}`,
      evidencePosture: outcome.evidencePosture,
      source: outcome.sourceLabel ?? "outcome-verification-service",
      createdAt: isoOrNull(outcome.createdAt),
      confidence,
      confidenceEvidence: buildConfidenceEvidence(confidence, outcome.sourceLabel ?? "outcome-verification-service", isoOrNull(outcome.createdAt)),
    });
  }

  if (data.memorySummary) {
    inputs.push({
      type: "RETAINER_CYCLE_MEMORY",
      label: `Retainer cycle memory: ${data.memorySummary.status}`,
      evidencePosture: data.memorySummary.escalationRequired ? data.memorySummary.escalationLevel : "NONE",
      source: "retainer-cycle-memory",
      createdAt: isoOrNull(data.memorySummary.generatedAt),
      confidence: "SYSTEM_INFERRED",
      confidenceEvidence: buildConfidenceEvidence("SYSTEM_INFERRED", "retainer-cycle-memory", isoOrNull(data.memorySummary.generatedAt)),
    });
  }

  return sortEvidenceInputs(inputs);
}

export function composeGovernanceEvents(
  data: DecisionProvenanceSourceData,
): DecisionProvenanceEvent[] {
  const events: DecisionProvenanceEvent[] = [];

  for (const history of data.cadenceHistory ?? []) {
    events.push({
      type: history.action.toLowerCase().includes("batch") ? "BATCH_ACTION_RECORDED" : "SIGNAL_DETECTED",
      label: `Cadence action: ${history.action}`,
      actor: history.operatorId ?? null,
      occurredAt: isoOrNull(history.timestamp),
      severity: "LOW",
      href: "/admin/retained-cadence",
    });
  }

  for (const decision of data.decisionRecords ?? []) {
    events.push({
      type: "OPERATOR_REVIEWED",
      label: `Operator reviewed: ${decision.decision}`,
      actor: decision.operatorId ?? null,
      occurredAt: isoOrNull(decision.createdAt),
      severity: decision.deliveryAllowed ? "LOW" : "HIGH",
      href: "/admin/oversight-review",
    });
  }

  for (const suppression of data.suppressions ?? []) {
    const highRisk = /privacy|legal|counsel|unsafe|critical|risk/i.test(
      `${suppression.suppressionRule} ${suppression.suppressionReason}`,
    );
    events.push({
      type: "SUPPRESSION_APPLIED",
      label: `Suppressed ${suppression.fieldName}: ${suppression.suppressionReason}`,
      actor: suppression.reviewedByOperator ?? (suppression.suppressedBySystem ? "system" : null),
      occurredAt: isoOrNull(suppression.suppressedAt),
      severity: highRisk ? "HIGH" : "MEDIUM",
      href: "/admin/suppression-ledger",
    });

    if (suppression.overrideStatus === "APPROVED_FOR_RELEASE") {
      events.push({
        type: "SUPPRESSION_RELEASED",
        label: `Suppression released: ${suppression.fieldName}`,
        actor: suppression.reviewedByOperator ?? null,
        occurredAt: isoOrNull(suppression.reviewedAt),
        severity: suppression.overrideReason ? "MEDIUM" : "CRITICAL",
        href: "/admin/suppression-ledger",
      });
    }
  }

  for (const counsel of data.counselEntries ?? []) {
    events.push({
      type: "COUNSEL_ESCALATED",
      label: evidenceLabelWithoutSensitivePayload({
        prefix: "Counsel escalation",
        value: counsel.triggerReason,
        fallback: "Counsel escalation recorded",
      }),
      actor: counsel.assignedTo ?? null,
      occurredAt: isoOrNull(counsel.triggeredAt),
      severity: "HIGH",
      href: "/admin/counsel-review",
    });

    if (counsel.operatorDisposition && counsel.operatorDisposition !== "PENDING") {
      events.push({
        type: "OPERATOR_REVIEWED",
        label: `Counsel disposition: ${counsel.operatorDisposition}`,
        actor: counsel.assignedTo ?? null,
        occurredAt: isoOrNull(counsel.triggeredAt),
        severity: "MEDIUM",
        href: "/admin/counsel-review",
      });
    }
  }

  for (const boardroom of data.boardroomEntries ?? []) {
    events.push({
      type: "BOARDROOM_ESCALATED",
      label: evidenceLabelWithoutSensitivePayload({
        prefix: "Boardroom escalation",
        value: boardroom.triggerReason,
        fallback: "Boardroom escalation recorded",
      }),
      actor: null,
      occurredAt: isoOrNull(boardroom.qualifiedAt),
      severity: "HIGH",
      href: "/admin/boardroom-archive",
    });
  }

  for (const delivery of data.deliveries ?? []) {
    if (delivery.approvedBy || delivery.status === "APPROVED" || delivery.status === "DELIVERED") {
      events.push({
        type: "DELIVERY_APPROVED",
        label: `Delivery approved for ${delivery.recipientRole}`,
        actor: delivery.approvedBy ?? null,
        occurredAt: isoOrNull(delivery.createdAt),
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    }

    if (delivery.status === "DELIVERED" && delivery.deliveredAt) {
      events.push({
        type: "DELIVERY_SENT",
        label: `Delivery sent via ${delivery.deliveryMethod}`,
        actor: delivery.deliveredBy ?? null,
        occurredAt: isoOrNull(delivery.deliveredAt),
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    }
  }

  for (const archive of data.archiveRecords ?? []) {
    if (archive.approvedAt || ["APPROVED_FOR_DELIVERY", "CLIENT_VIEW_READY", "DELIVERED"].includes(archive.deliveryStatus)) {
      events.push({
        type: "DELIVERY_APPROVED",
        label: `Archive delivery state: ${archive.deliveryStatus}`,
        actor: archive.operatorId ?? null,
        occurredAt: isoOrNull(archive.approvedAt ?? archive.createdAt),
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    }
    if (archive.deliveredAt || archive.deliveryStatus === "DELIVERED") {
      events.push({
        type: "DELIVERY_SENT",
        label: "Archived oversight cycle delivered",
        actor: archive.operatorId ?? null,
        occurredAt: isoOrNull(archive.deliveredAt),
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    }
  }

  for (const outcome of data.outcomes ?? []) {
    events.push({
      type: "OUTCOME_RECORDED",
      label: `Outcome recorded: ${outcome.outcomeClassification}`,
      actor: outcome.userEmail ?? outcome.userId ?? null,
      occurredAt: isoOrNull(outcome.createdAt),
      severity: outcome.status === "BLOCKED" || outcome.status === "DISPUTED" ? "HIGH" : "LOW",
      href: "/admin/outcome-verification",
    });
  }

  if (data.memorySummary) {
    events.push({
      type: "MEMORY_UPDATED",
      label: `Retainer cycle memory updated: ${data.memorySummary.status}`,
      actor: null,
      occurredAt: isoOrNull(data.memorySummary.generatedAt),
      severity: data.memorySummary.escalationRequired ? "HIGH" : "LOW",
      href: "/admin/retained-cadence",
    });
  }

  return sortGovernanceEvents(events);
}

function gapRemediation(stage: string, severity: DecisionProvenanceGap["severity"]): DecisionProvenanceGap["remediation"] {
  switch (stage) {
    case "Delivery":
      return {
        action: severity === "CRITICAL" ? "Investigate delivery failure" : "Review delivery queue and approve pending items",
        owner: "operator",
        href: "/admin/delivery-queue",
      };
    case "Outcome":
      return {
        action: "Complete outcome verification for this subject",
        owner: "operator",
        href: "/admin/outcome-verification",
      };
    case "Suppression":
      return severity === "CRITICAL"
        ? { action: "Review suppression override and record reason", owner: "operator", href: "/admin/suppression-ledger" }
        : { action: "Review suppression ledger for unreviewed items", owner: "operator", href: "/admin/suppression-ledger" };
    case "Operator review":
      return {
        action: "Open oversight review and record operator decision",
        owner: "operator",
        href: "/admin/oversight-review",
      };
    case "Evidence":
      return {
        action: "Capture evidence before making provenance claims",
        owner: "operator",
      };
    case "Source availability":
      return {
        action: "Re-run or inspect the unavailable data source",
        owner: "admin",
      };
    case "Subject support":
      return {
        action: "No action yet — subject type not supported in current version",
        owner: "future-team",
      };
    case "Escalation":
      return {
        action: "Verify escalation record exists in counsel or boardroom surface",
        owner: "operator",
        href: severity === "CRITICAL" ? "/admin/counsel-review" : "/admin/boardroom-archive",
      };
    case "Memory":
      return {
        action: "Allow additional oversight cycles to accumulate before retainer cycle memory becomes available",
        owner: "future-team",
      };
    default:
      return undefined;
  }
}

export function composeProvenanceGaps(
  data: DecisionProvenanceSourceData,
  evidenceInputs: DecisionProvenanceEvidenceInput[],
  governanceEvents: DecisionProvenanceEvent[],
): DecisionProvenanceGap[] {
  const gaps: DecisionProvenanceGap[] = [];
  const hasOperatorReview = governanceEvents.some((event) => event.type === "OPERATOR_REVIEWED");
  const hasDeliveryApproval = governanceEvents.some((event) => event.type === "DELIVERY_APPROVED");
  const hasDeliverySent = governanceEvents.some((event) => event.type === "DELIVERY_SENT");
  const hasOutcome = governanceEvents.some((event) => event.type === "OUTCOME_RECORDED");
  const hasSuppression = governanceEvents.some((event) => event.type === "SUPPRESSION_APPLIED");
  const hasCounsel = governanceEvents.some((event) => event.type === "COUNSEL_ESCALATED");
  const hasBoardroom = governanceEvents.some((event) => event.type === "BOARDROOM_ESCALATED");

  function addGap(stage: string, description: string, severity: DecisionProvenanceGap["severity"], href?: string) {
    gaps.push({
      stage,
      description,
      severity,
      href,
      remediation: gapRemediation(stage, severity),
    });
  }

  if (!SUPPORTED_SUBJECT_TYPES.has(data.subjectType)) {
    addGap("Subject support", `${data.subjectType} provenance composition is not supported in v1.`, "INFO");
  }

  for (const source of data.unavailableSources ?? []) {
    addGap("Source availability", `${source} could not be loaded for this provenance record.`, "WARNING");
  }

  if (data.unsupportedReason) {
    addGap("Subject support", data.unsupportedReason, "INFO");
  }

  if (evidenceInputs.length === 0) {
    addGap("Evidence", "No evidence inputs recorded for this subject.", "WARNING");
  }

  if (SUPPORTED_SUBJECT_TYPES.has(data.subjectType) && data.subjectType !== "DELIVERY_ITEM" && !hasOperatorReview) {
    addGap("Operator review", "No operator review event recorded.", "WARNING", "/admin/oversight-review");
  }

  for (const suppression of data.suppressions ?? []) {
    if (suppression.overrideStatus !== "NONE" && !suppression.overrideReason) {
      addGap("Suppression", `Suppression override for ${suppression.fieldName} has no recorded reason.`, "CRITICAL", "/admin/suppression-ledger");
    }
  }

  if (hasSuppression && !data.suppressions?.some((suppression) => suppression.reviewedByOperator || suppression.reviewedAt)) {
    addGap("Suppression", "Suppression exists without an operator review record.", "WARNING", "/admin/suppression-ledger");
  }

  if (data.subjectType !== "DELIVERY_ITEM" && !hasDeliveryApproval && !hasDeliverySent) {
    addGap("Delivery", "No delivery record exists for this subject.", "WARNING", "/admin/delivery-queue");
  }

  if (hasDeliveryApproval && !hasDeliverySent) {
    addGap("Delivery", "Delivery was approved but no sent record exists.", "WARNING", "/admin/delivery-queue");
  }

  if (hasDeliverySent && !hasOutcome) {
    addGap("Outcome", "Delivery was sent but no outcome verification has been recorded.", "WARNING", "/admin/outcome-verification");
  }

  for (const decision of data.decisionRecords ?? []) {
    if (decision.decision === "ESCALATE_TO_COUNSEL" && !hasCounsel) {
      addGap("Escalation", "Counsel escalation was selected but no counsel review record exists.", "CRITICAL", "/admin/counsel-review");
    }
    if (decision.decision === "ESCALATE_TO_BOARDROOM" && !hasBoardroom) {
      addGap("Escalation", "Boardroom escalation was selected but no boardroom archive record exists.", "CRITICAL", "/admin/boardroom-archive");
    }
  }

  if (data.memorySummary?.status === "insufficient") {
    addGap("Memory", "Retainer cycle memory is insufficient for this subject.", "INFO", "/admin/retained-cadence");
  }

  return sortGaps(gaps);
}

function eventTimelineType(event: DecisionProvenanceEvent): DecisionProvenanceTimelineItem["type"] {
  if (event.type === "OPERATOR_REVIEWED") return "REVIEW";
  if (event.type === "REVIEW_TRIGGER_SET") return "REVIEW";
  if (event.type === "OUTCOME_RECORDED") return "OUTCOME";
  if (event.type === "MEMORY_UPDATED") return "MEMORY";
  return "ACTION";
}

export function composeTimeline(
  evidenceInputs: DecisionProvenanceEvidenceInput[],
  governanceEvents: DecisionProvenanceEvent[],
): DecisionProvenanceTimelineItem[] {
  const items: DecisionProvenanceTimelineItem[] = [];

  for (const input of evidenceInputs) {
    if (!input.createdAt) continue;
    items.push({
      date: input.createdAt,
      event: input.label,
      type: "INPUT",
    });
  }

  for (const event of governanceEvents) {
    if (!event.occurredAt) continue;
    items.push({
      date: event.occurredAt,
      event: event.label,
      type: eventTimelineType(event),
    });
  }

  return items.sort((left, right) =>
    left.date.localeCompare(right.date)
    || left.type.localeCompare(right.type)
    || left.event.localeCompare(right.event),
  );
}

export function deriveCurrentPosture(input: {
  evidenceInputs: DecisionProvenanceEvidenceInput[];
  governanceEvents: DecisionProvenanceEvent[];
  provenanceGaps: DecisionProvenanceGap[];
}): DecisionProvenanceRecord["currentPosture"] {
  const { evidenceInputs, governanceEvents, provenanceGaps } = input;
  const hasCriticalGap = provenanceGaps.some((gap) => gap.severity === "CRITICAL");
  const hasEscalation = governanceEvents.some((event) =>
    event.type === "COUNSEL_ESCALATED" || event.type === "BOARDROOM_ESCALATED",
  );
  const hasDeliverySent = governanceEvents.some((event) => event.type === "DELIVERY_SENT");
  const hasDeliveryApproved = governanceEvents.some((event) => event.type === "DELIVERY_APPROVED");
  const hasOutcome = governanceEvents.some((event) => event.type === "OUTCOME_RECORDED");
  const hasOperatorReview = governanceEvents.some((event) => event.type === "OPERATOR_REVIEWED");
  const hasEvidence = evidenceInputs.length > 0;

  if (hasCriticalGap) {
    const suppressionGap = provenanceGaps.find((gap) => gap.stage === "Suppression" && gap.severity === "CRITICAL");
    return {
      status: "BLOCKED",
      summary: "A critical provenance gap blocks completion.",
      nextAction: suppressionGap ? "Review suppression ledger" : "Resolve critical provenance gap",
      nextActionHref: suppressionGap?.href ?? provenanceGaps.find((gap) => gap.severity === "CRITICAL")?.href,
    };
  }

  if (hasEscalation) {
    const counsel = governanceEvents.some((event) => event.type === "COUNSEL_ESCALATED");
    return {
      status: "ESCALATED",
      summary: "A counsel or boardroom escalation is recorded for this subject.",
      nextAction: counsel ? "Review counsel record" : "Review boardroom record",
      nextActionHref: counsel ? "/admin/counsel-review" : "/admin/boardroom-archive",
    };
  }

  if (hasDeliverySent && hasOutcome) {
    return {
      status: "COMPLETE",
      summary: "Delivery and outcome are both recorded.",
    };
  }

  if (hasDeliverySent && !hasOutcome) {
    return {
      status: "UNVERIFIED",
      summary: "Delivery is recorded but outcome verification is not recorded.",
      nextAction: "Complete outcome verification",
      nextActionHref: "/admin/outcome-verification",
    };
  }

  if (hasDeliveryApproved) {
    return {
      status: "DELIVERED",
      summary: "Delivery approval is recorded; sent outcome is not complete.",
      nextAction: "Review delivery state",
      nextActionHref: "/admin/delivery-queue",
    };
  }

  if (hasOperatorReview) {
    return {
      status: "IN_REVIEW",
      summary: "Operator review is recorded and delivery is not yet complete.",
      nextAction: "Record or review delivery state",
      nextActionHref: "/admin/delivery-queue",
    };
  }

  if (!hasEvidence) {
    return {
      status: "UNKNOWN",
      summary: "No meaningful evidence chain could be composed.",
      nextAction: "Capture evidence before making provenance claims",
    };
  }

  return {
    status: "UNKNOWN",
    summary: "Evidence exists, but no governed review or delivery chain is recorded.",
    nextAction: "Begin operator review",
    nextActionHref: "/admin/oversight-review",
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

export function buildDecisionProvenanceHash(
  record: Omit<DecisionProvenanceRecord, "provenanceHash">,
): string {
  const canonical = canonicalize({
    ...record,
    evidenceInputs: sortEvidenceInputs(record.evidenceInputs),
    governanceEvents: sortGovernanceEvents(record.governanceEvents),
    timeline: [...record.timeline].sort((left, right) =>
      left.date.localeCompare(right.date)
      || left.type.localeCompare(right.type)
      || left.event.localeCompare(right.event),
    ),
    provenanceGaps: sortGaps(record.provenanceGaps),
    unavailableSources: [...record.unavailableSources].sort(),
  });
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

export function buildAccountabilityStatement(
  record: Omit<DecisionProvenanceRecord, "accountabilityStatement" | "provenanceHash">,
): string {
  if (record.evidenceInputs.length === 0) {
    return "No evidence inputs have been recorded for this subject.";
  }

  const parts: string[] = [];
  parts.push(`${record.evidenceInputs.length} evidence input${record.evidenceInputs.length === 1 ? "" : "s"} captured`);

  const verifiedEvidence = record.evidenceInputs.filter((input) =>
    input.confidence === "OPERATOR_VERIFIED" || input.confidence === "THIRD_PARTY",
  );
  if (verifiedEvidence.length > 0) {
    parts.push(`${verifiedEvidence.length} evidence input${verifiedEvidence.length === 1 ? "" : "s"} operator or third-party verified`);
  }

  const operatorReviews = record.governanceEvents.filter((event) => event.type === "OPERATOR_REVIEWED").length;
  if (operatorReviews > 0) {
    parts.push(`${operatorReviews} operator review${operatorReviews === 1 ? "" : "s"} completed`);
  }

  const suppressions = record.governanceEvents.filter((event) => event.type === "SUPPRESSION_APPLIED").length;
  if (suppressions > 0) {
    parts.push(`${suppressions} field${suppressions === 1 ? "" : "s"} suppressed for safety`);
  }

  if (record.governanceEvents.some((event) => event.type === "COUNSEL_ESCALATED")) {
    parts.push("counsel escalation recorded");
  }
  if (record.governanceEvents.some((event) => event.type === "BOARDROOM_ESCALATED")) {
    parts.push("boardroom escalation recorded");
  }

  if (record.governanceEvents.some((event) => event.type === "DELIVERY_SENT")) {
    parts.push("delivery sent");
  } else {
    parts.push("delivery not yet recorded");
  }

  if (record.governanceEvents.some((event) => event.type === "OUTCOME_RECORDED")) {
    parts.push("outcome recorded");
  } else {
    parts.push("outcome not yet recorded");
  }

  if (record.provenanceGaps.length > 0) {
    parts.push(`${record.provenanceGaps.length} provenance gap${record.provenanceGaps.length === 1 ? "" : "s"} remain`);
  }

  return `${parts.join("; ")}.`;
}

export function composeDecisionProvenanceFromSources(
  data: DecisionProvenanceSourceData,
): DecisionProvenanceRecord {
  const evidenceInputs = composeEvidenceInputs(data);
  const governanceEvents = composeGovernanceEvents(data);
  const provenanceGaps = composeProvenanceGaps(data, evidenceInputs, governanceEvents);
  const timeline = composeTimeline(evidenceInputs, governanceEvents);
  const unavailableSources = [...(data.unavailableSources ?? [])].sort();

  const recordWithoutStatement = {
    version: 1 as const,
    id: `decision-provenance:v1:${data.subjectType}:${data.subjectId}`,
    subjectType: data.subjectType,
    subjectId: data.subjectId,
    evidenceInputs,
    governanceEvents,
    timeline,
    currentPosture: deriveCurrentPosture({ evidenceInputs, governanceEvents, provenanceGaps }),
    provenanceGaps,
    unavailableSources,
  };

  const accountabilityStatement = buildAccountabilityStatement(recordWithoutStatement);
  const recordWithoutHash: HashableDecisionProvenanceRecord = {
    ...recordWithoutStatement,
    accountabilityStatement,
  };

  return {
    ...recordWithoutHash,
    provenanceHash: buildDecisionProvenanceHash(recordWithoutHash),
  };
}

export const composeDecisionProvenanceRecord = composeDecisionProvenanceFromSources;

function composeStrategyRoomRecordPosture(input: {
  sessionStatus: string;
  decisionEvents: StrategyRoomProvenanceBackingRecord["decisionEvents"];
  checkpointCreatedAt?: string | null;
  provenanceGaps: DecisionProvenanceGap[];
}): DecisionProvenanceRecord["currentPosture"] {
  if (input.provenanceGaps.some((gap) => gap.severity === "CRITICAL")) {
    return {
      status: "BLOCKED",
      summary: "A critical Strategy Room provenance gap blocks completion.",
      nextAction: "Resolve the missing governed record component",
    };
  }

  if (input.decisionEvents.some((event) => event.status === "blocked")) {
    return {
      status: "BLOCKED",
      summary: "A recorded Strategy Room decision remains blocked.",
      nextAction: "Review the blocked decision in Strategy Room",
    };
  }

  if (input.sessionStatus === "completed") {
    return {
      status: "COMPLETE",
      summary: "The Strategy Room execution record is completed.",
    };
  }

  if (input.checkpointCreatedAt || input.decisionEvents.length > 0) {
    return {
      status: "IN_REVIEW",
      summary: "The Strategy Room record is live with governed execution activity recorded.",
      nextAction: input.checkpointCreatedAt ? "Respond to the checkpoint when due" : "Record the next governed move",
    };
  }

  return {
    status: "UNKNOWN",
    summary: "The Strategy Room record exists, but governed execution activity is still thin.",
    nextAction: "Record the first governed move",
  };
}

function composeStrategyRoomRecordGaps(
  record: StrategyRoomProvenanceBackingRecord,
): DecisionProvenanceGap[] {
  const gaps: DecisionProvenanceGap[] = [];

  function addGap(stage: string, description: string, severity: DecisionProvenanceGap["severity"]) {
    gaps.push({ stage, description, severity });
  }

  for (const source of record.unavailableSources ?? []) {
    addGap("Source availability", `${source} could not be loaded for this provenance record.`, "WARNING");
  }

  if (!record.admittedEvidenceAt) {
    addGap("Admitted evidence", "No admitted evidence record is linked to this Strategy Room record.", "WARNING");
  }
  if (record.decisionEvents.length === 0) {
    addGap("Decision record", "No governed decision event has been recorded yet.", "WARNING");
  }
  if (!record.authorityAssignedAt) {
    addGap("Authority", "No authority assignment is recorded on the Strategy Room record yet.", "WARNING");
  }
  if (!record.constraintRetainedAt) {
    addGap("Constraint retention", "No retained constraint or dissent marker is recorded yet.", "INFO");
  }
  if (!record.reviewTriggerAt) {
    addGap("Review trigger", "No review trigger is recorded yet.", "INFO");
  }
  if (!record.checkpointCreatedAt) {
    addGap("Checkpoint", "No checkpoint has been created for this Strategy Room record yet.", "WARNING");
  }

  return sortGaps(gaps);
}

function buildStrategyRoomRecordAccountabilityStatement(input: {
  evidenceInputs: DecisionProvenanceEvidenceInput[];
  governanceEvents: DecisionProvenanceEvent[];
  provenanceGaps: DecisionProvenanceGap[];
}): string {
  if (input.evidenceInputs.length === 0) {
    return "No evidence inputs have been recorded for this Strategy Room record.";
  }

  const parts: string[] = [];
  parts.push(`${input.evidenceInputs.length} evidence input${input.evidenceInputs.length === 1 ? "" : "s"} captured`);

  const decisions = input.governanceEvents.filter((event) => event.type === "DECISION_RECORDED").length;
  if (decisions > 0) {
    parts.push(`${decisions} decision${decisions === 1 ? "" : "s"} recorded`);
  }
  if (input.governanceEvents.some((event) => event.type === "AUTHORITY_ASSIGNED")) {
    parts.push("authority assignment recorded");
  }
  if (input.governanceEvents.some((event) => event.type === "CONSTRAINT_RETAINED")) {
    parts.push("constraint or dissent retained");
  }
  if (input.governanceEvents.some((event) => event.type === "REVIEW_TRIGGER_SET")) {
    parts.push("review trigger recorded");
  }
  if (input.governanceEvents.some((event) => event.type === "CHECKPOINT_CREATED")) {
    parts.push("checkpoint created");
  }
  if (input.governanceEvents.some((event) => event.type === "RETURN_BRIEF_STATUS_RECORDED")) {
    parts.push("return brief status recorded");
  }
  if (input.provenanceGaps.length > 0) {
    parts.push(`${input.provenanceGaps.length} provenance gap${input.provenanceGaps.length === 1 ? "" : "s"} remain`);
  }

  return `${parts.join("; ")}.`;
}

export function composeStrategyRoomRecordProvenanceFromBackingRecord(
  record: StrategyRoomProvenanceBackingRecord,
): DecisionProvenanceRecord {
  const evidenceInputs = sortEvidenceInputs([
    ...(record.admittedEvidenceAt
      ? [{
          type: "STRATEGY_ROOM_ADMISSION",
          label: "Admitted evidence record",
          evidencePosture: "SYSTEM_INFERRED",
          source: "strategy-room-execution-session",
          createdAt: record.admittedEvidenceAt,
          confidence: "SYSTEM_INFERRED" as const,
          confidenceEvidence: buildConfidenceEvidence("SYSTEM_INFERRED", "strategy-room-execution-session", record.admittedEvidenceAt),
        }]
      : []),
    {
      type: "STRATEGY_ROOM_RECORD",
      label: "Persisted Strategy Room record",
      evidencePosture: "SYSTEM_INFERRED",
      source: "strategy-room-execution-session",
      createdAt: record.createdAt,
      confidence: "SYSTEM_INFERRED" as const,
      confidenceEvidence: buildConfidenceEvidence("SYSTEM_INFERRED", "strategy-room-execution-session", record.createdAt),
    },
  ]);

  const governanceEvents = sortGovernanceEvents([
    ...(record.admittedEvidenceAt
      ? [{
          type: "EVIDENCE_ADMITTED" as const,
          label: "Evidence admitted to Strategy Room",
          occurredAt: record.admittedEvidenceAt,
          severity: "LOW" as const,
        }]
      : []),
    ...record.decisionEvents.map((decision) => ({
      type: "DECISION_RECORDED" as const,
      label: "Decision recorded",
      occurredAt: decision.createdAt,
      severity: decision.status === "blocked" ? "HIGH" as const : "LOW" as const,
    })),
    ...(record.authorityAssignedAt
      ? [{
          type: "AUTHORITY_ASSIGNED" as const,
          label: "Authority assignment recorded",
          occurredAt: record.authorityAssignedAt,
          severity: "LOW" as const,
        }]
      : []),
    ...(record.constraintRetainedAt
      ? [{
          type: "CONSTRAINT_RETAINED" as const,
          label: "Constraint or dissent retained",
          occurredAt: record.constraintRetainedAt,
          severity: "LOW" as const,
        }]
      : []),
    ...(record.reviewTriggerAt
      ? [{
          type: "REVIEW_TRIGGER_SET" as const,
          label: "Review trigger recorded",
          occurredAt: record.reviewTriggerAt,
          severity: "LOW" as const,
        }]
      : []),
    ...(record.checkpointCreatedAt
      ? [{
          type: "CHECKPOINT_CREATED" as const,
          label: "Checkpoint created",
          occurredAt: record.checkpointCreatedAt,
          severity: "LOW" as const,
        }]
      : []),
    ...(record.returnBriefStatus && record.returnBriefObservedAt
      ? [{
          type: "RETURN_BRIEF_STATUS_RECORDED" as const,
          label: `Return brief status: ${record.returnBriefStatus.toLowerCase()}`,
          occurredAt: record.returnBriefObservedAt,
          severity: "LOW" as const,
        }]
      : []),
  ]);

  const provenanceGaps = composeStrategyRoomRecordGaps(record);
  const timeline = composeTimeline(evidenceInputs, governanceEvents);
  const unavailableSources = [...(record.unavailableSources ?? [])].sort();
  const currentPosture = composeStrategyRoomRecordPosture({
    sessionStatus: record.sessionStatus,
    decisionEvents: record.decisionEvents,
    checkpointCreatedAt: record.checkpointCreatedAt,
    provenanceGaps,
  });

  const recordWithoutStatement = {
    version: 1 as const,
    id: `decision-provenance:v1:STRATEGY_ROOM_RECORD:${record.sessionId}`,
    subjectType: "STRATEGY_ROOM_RECORD" as const,
    subjectId: record.sessionId,
    evidenceInputs,
    governanceEvents,
    timeline,
    currentPosture,
    provenanceGaps,
    unavailableSources,
  };
  const accountabilityStatement = buildStrategyRoomRecordAccountabilityStatement({
    evidenceInputs,
    governanceEvents,
    provenanceGaps,
  });
  const recordWithoutHash: HashableDecisionProvenanceRecord = {
    ...recordWithoutStatement,
    accountabilityStatement,
  };

  return {
    ...recordWithoutHash,
    provenanceHash: buildDecisionProvenanceHash(recordWithoutHash),
  };
}

function unsupportedRecord(input: {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
  reason?: string;
}) {
  return composeDecisionProvenanceFromSources({
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    unsupportedReason: input.reason ?? "No provenance chain could be composed for this subject in v1.",
  });
}

async function loadOutcomesForSubject(input: {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
  cycle?: RetainedReviewCycle | null;
}): Promise<{ outcomes: OutcomeVerificationRecord[]; exactMatch: boolean }> {
  try {
    const { prisma } = await import("@/lib/prisma.server");

    // Prefer exact subjectType + subjectId match
    const exactRows = await prisma.outcomeVerificationRecord.findMany({
      where: {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    if (exactRows.length > 0) {
      return { outcomes: mapOutcomeRows(exactRows), exactMatch: true };
    }

    // Fall back to best-effort OR query for records without direct linkage
    const fallbackRows = await prisma.outcomeVerificationRecord.findMany({
      where: {
        OR: [
          { sessionId: input.subjectId },
          { decisionObjectId: input.subjectId },
          { organisationKey: input.cycle?.organisationId ?? undefined },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    return { outcomes: mapOutcomeRows(fallbackRows), exactMatch: false };
  } catch {
    return { outcomes: [], exactMatch: false };
  }
}

function mapOutcomeRows(rows: Array<{
  id: string;
  sessionId: string | null;
  outcomeClassification: string;
  createdAt: Date;
  payload: unknown;
}>): OutcomeVerificationRecord[] {
  return rows.map((row) => {
    const payload = row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? row.payload as Record<string, unknown>
      : {};
    return {
      verificationId: row.id,
      userEmail: typeof payload.userEmail === "string" ? payload.userEmail : "",
      userId: typeof payload.userId === "string" ? payload.userId : null,
      subjectType: typeof payload.subjectType === "string" ? payload.subjectType : null,
      subjectId: typeof payload.subjectId === "string" ? payload.subjectId : null,
      checkpointId: typeof payload.checkpointId === "string" ? payload.checkpointId : null,
      caseId: typeof payload.caseId === "string" ? payload.caseId : null,
      journeyId: typeof payload.journeyId === "string" ? payload.journeyId : null,
      strategyRoomSessionId: row.sessionId ?? null,
      executiveRunId: typeof payload.executiveRunId === "string" ? payload.executiveRunId : null,
      checkpointTitle: typeof payload.checkpointTitle === "string" ? payload.checkpointTitle : null,
      sourceSurface: typeof payload.sourceSurface === "string" ? payload.sourceSurface : null,
      sourceLabel: typeof payload.sourceLabel === "string" ? payload.sourceLabel : null,
      dueAt: typeof payload.dueAt === "string" ? payload.dueAt : null,
      status: typeof payload.status === "string" ? payload.status as OutcomeVerificationRecord["status"] : "COMPLETED",
      outcomeClassification: row.outcomeClassification as OutcomeVerificationRecord["outcomeClassification"],
      evidencePosture: typeof payload.evidencePosture === "string"
        ? payload.evidencePosture as OutcomeVerificationRecord["evidencePosture"]
        : "SYSTEM_INFERRED",
      didAct: typeof payload.didAct === "string" ? payload.didAct as OutcomeVerificationRecord["didAct"] : "PARTIAL",
      changedState: typeof payload.changedState === "string" ? payload.changedState as OutcomeVerificationRecord["changedState"] : "UNKNOWN",
      systemDiagnosisAccuracy: typeof payload.systemDiagnosisAccuracy === "string"
        ? payload.systemDiagnosisAccuracy as OutcomeVerificationRecord["systemDiagnosisAccuracy"]
        : "PARTIAL",
      requiredMoveUsefulness: typeof payload.requiredMoveUsefulness === "string"
        ? payload.requiredMoveUsefulness as OutcomeVerificationRecord["requiredMoveUsefulness"]
        : "PARTIAL",
      whatChanged: "",
      evidenceSummary: null,
      rememberNote: null,
      createdAt: row.createdAt.toISOString(),
      checkpointResponseStatus: typeof payload.checkpointResponseStatus === "string" ? payload.checkpointResponseStatus : null,
      proofLabels: [],
    };
  });
}

export async function composeDecisionProvenance(input: {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
}): Promise<DecisionProvenanceRecord> {
  const subjectId = input.subjectId.trim();
  if (!subjectId) {
    return unsupportedRecord({
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      reason: "No provenance chain could be composed because subjectId was empty.",
    });
  }

  if (!SUPPORTED_SUBJECT_TYPES.has(input.subjectType)) {
    return unsupportedRecord(input);
  }

  // ── EXECUTIVE_REPORT: load from ExecutiveReportingRun ──
  if (input.subjectType === "EXECUTIVE_REPORT") {
    return composeExecutiveReportProvenance(subjectId);
  }

  if (input.subjectType === "STRATEGY_ROOM_RECORD") {
    return composeStrategyRoomRecordProvenance(subjectId);
  }

  const [
    { listRetainedReviewCycles, loadCadenceHistory },
    { loadSuppressionLedger },
    { listAllDeliveries },
    { loadCounselHistory },
    { loadBoardroomArchiveSummary },
    { loadLatestOversightReviewDecision },
  ] = await Promise.all([
    import("@/lib/product/retained-cadence-service"),
    import("@/lib/product/suppression-ledger"),
    import("@/lib/product/oversight-delivery-service"),
    import("@/lib/product/counsel-history-loader"),
    import("@/lib/product/boardroom-archive"),
    import("@/lib/product/oversight-review-decision-ledger"),
  ]);

  const unavailableSources: string[] = [];
  let allCycles: RetainedReviewCycle[] = [];
  try {
    allCycles = await listRetainedReviewCycles();
  } catch {
    unavailableSources.push("retained-cadence");
  }

  const cycles = input.subjectType === "OVERSIGHT_CYCLE"
    ? allCycles.filter((cycle) => cycle.cycleId === subjectId)
    : input.subjectType === "RETAINER_ACCOUNT"
      ? allCycles.filter((cycle) => cycle.accountId === subjectId || cycle.organisationId === subjectId)
      : [];
  const primaryCycle = cycles[0] ?? null;
  const cycleIds = new Set(cycles.map((cycle) => cycle.cycleId));

  let cadenceHistory: CadenceHistoryEvent[] = [];
  if (input.subjectType !== "DELIVERY_ITEM") {
    const scopeId = input.subjectType === "RETAINER_ACCOUNT"
      ? subjectId
      : primaryCycle?.accountId ?? primaryCycle?.organisationId ?? subjectId;
    try {
      cadenceHistory = await loadCadenceHistory(scopeId);
      if (input.subjectType === "OVERSIGHT_CYCLE") {
        cadenceHistory = cadenceHistory.filter((event) => event.cycleId === subjectId || event.scopeId === scopeId);
      }
    } catch {
      unavailableSources.push("cadence-history");
    }
  }

  let suppressions: SuppressionEvent[] = [];
  try {
    const direct = await loadSuppressionLedger({ scopeId: subjectId, limit: 200 });
    suppressions = input.subjectType === "RETAINER_ACCOUNT"
      ? direct
      : direct.filter((event) => event.scopeId === subjectId);
  } catch {
    unavailableSources.push("suppression-ledger");
  }

  let deliveries: DeliveryRecord[] = [];
  try {
    const allDeliveries: DeliveryRecord[] = await listAllDeliveries();
    deliveries = allDeliveries.filter((delivery) => {
      if (input.subjectType === "DELIVERY_ITEM") {
        return delivery.id === subjectId || delivery.artifactId === subjectId;
      }
      if (input.subjectType === "OVERSIGHT_CYCLE") {
        return delivery.artifactId === subjectId;
      }
      return cycleIds.has(delivery.artifactId);
    });
  } catch {
    unavailableSources.push("delivery-queue");
  }

  let counselEntries: CounselHistoryEntry[] = [];
  if (input.subjectType !== "DELIVERY_ITEM") {
    try {
      const history = await loadCounselHistory(input.subjectType === "OVERSIGHT_CYCLE"
        ? { cycleId: subjectId }
        : {});
      counselEntries = input.subjectType === "RETAINER_ACCOUNT"
        ? (history.entries ?? []).filter((entry) => entry.cycleId ? cycleIds.has(entry.cycleId) : false)
        : history.entries ?? [];
    } catch {
      unavailableSources.push("counsel-history");
    }
  }

  let boardroomEntries: BoardroomArchiveEntry[] = [];
  if (input.subjectType !== "DELIVERY_ITEM") {
    try {
      const summary = await loadBoardroomArchiveSummary(input.subjectType === "OVERSIGHT_CYCLE"
        ? { cycleId: subjectId }
        : { organisationId: subjectId });
      boardroomEntries = summary.entries ?? [];
    } catch {
      unavailableSources.push("boardroom-archive");
    }
  }

  const decisionRecords: OversightReviewDecisionRecord[] = [];
  if (primaryCycle?.accountId && input.subjectType === "OVERSIGHT_CYCLE") {
    try {
      const decision = await loadLatestOversightReviewDecision({
        accountId: primaryCycle.accountId,
        organisationId: primaryCycle.organisationId ?? undefined,
      });
      if (decision?.cycleId === subjectId) decisionRecords.push(decision);
    } catch {
      unavailableSources.push("oversight-review-decision");
    }
  }

  const outcomeResult = await loadOutcomesForSubject({
    subjectType: input.subjectType,
    subjectId,
    cycle: primaryCycle,
  });

  const record = composeDecisionProvenanceFromSources({
    subjectType: input.subjectType,
    subjectId,
    cycles,
    cadenceHistory,
    suppressions,
    deliveries,
    outcomes: outcomeResult.outcomes,
    counselEntries,
    boardroomEntries,
    decisionRecords,
    unavailableSources,
  });

  // Update outcome linkage gap based on match quality
  if (outcomeResult.outcomes.length > 0 && !outcomeResult.exactMatch) {
    record.provenanceGaps.push({
      stage: "Outcome linkage",
      description: "Outcome records were matched via fallback query (sessionId/decisionObjectId/organisationKey) rather than direct subjectType/subjectId. Consider adding subject linkage to outcome creation paths for deterministic matching.",
      severity: "INFO",
      href: "/admin/outcome-verification",
    });
  }

  return record;
}

type StrategyRoomExecutionSessionRow = {
  id: string;
  sessionKey: string;
  strategyRoomSessionId: string | null;
  email: string | null;
  status: string;
  constraints: string | null;
  constraintMap: string | null;
  canonicalSnapshot: string | null;
  createdAt: Date;
  updatedAt: Date;
  decisions: Array<{
    status: string;
    createdAt: Date;
  }>;
};

function parseObject(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

function hasPersistedConstraint(input: {
  constraints: string | null;
  constraintMap: string | null;
  executionConstraint?: string | null;
}): boolean {
  return Boolean(
    input.executionConstraint?.trim()
    || input.constraints?.trim()
    || input.constraintMap?.trim(),
  );
}

async function composeStrategyRoomRecordProvenance(
  subjectId: string,
): Promise<DecisionProvenanceRecord> {
  const unavailableSources: string[] = [];
  let session: StrategyRoomExecutionSessionRow | null = null;

  try {
    const { prisma } = await import("@/lib/prisma.server");
    const result = await prisma.strategyRoomExecutionSession.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        sessionKey: true,
        strategyRoomSessionId: true,
        email: true,
        status: true,
        constraints: true,
        constraintMap: true,
        canonicalSnapshot: true,
        createdAt: true,
        updatedAt: true,
        decisions: {
          orderBy: { createdAt: "asc" },
          select: {
            status: true,
            createdAt: true,
          },
        },
      },
    });
    session = result
      ? {
          ...result,
          createdAt: result.createdAt instanceof Date ? result.createdAt : new Date(result.createdAt),
          updatedAt: result.updatedAt instanceof Date ? result.updatedAt : new Date(result.updatedAt),
          decisions: result.decisions.map((decision) => ({
            status: decision.status,
            createdAt: decision.createdAt instanceof Date ? decision.createdAt : new Date(decision.createdAt),
          })),
        }
      : null;
  } catch {
    unavailableSources.push("strategy-room-execution-session");
  }

  if (!session) {
    return unsupportedRecord({
      subjectType: "STRATEGY_ROOM_RECORD",
      subjectId,
      reason: "No persisted Strategy Room record was found for this subject ID.",
    });
  }

  const canonicalSnapshot = parseObject(session.canonicalSnapshot);
  const admission = canonicalSnapshot?.admission;
  const admittedEvidenceAt = admission && typeof admission === "object"
    ? session.createdAt.toISOString()
    : null;

  let authorityAssignedAt: string | null = null;
  let executionConstraint: string | null = null;
  try {
    const { findLatestStrategyExecutionRecord } = await import("@/lib/strategy-room/execution-record");
    const executionRecord = await findLatestStrategyExecutionRecord({
      sessionId: session.id,
      email: session.email,
    });
    authorityAssignedAt = executionRecord?.authority ? executionRecord.createdAt : null;
    executionConstraint = executionRecord?.conflictResolved ?? null;
  } catch {
    unavailableSources.push("strategy-room-execution-record");
  }

  let reviewTriggerAt: string | null = null;
  let checkpointCreatedAt: string | null = null;
  try {
    const { resolveCheckpointForResponse } = await import("@/lib/product/checkpoint-service");
    const checkpoint = await resolveCheckpointForResponse({
      strategyRoomSessionId: session.strategyRoomSessionId ?? session.sessionKey,
      email: session.email,
    });
    if (checkpoint) {
      checkpointCreatedAt = checkpoint.record.createdAt.toISOString();
      reviewTriggerAt = checkpoint.payload.dueAt ?? checkpoint.record.createdAt.toISOString();
    }
  } catch {
    unavailableSources.push("checkpoint-service");
  }

  let returnBriefStatus: StrategyRoomProvenanceBackingRecord["returnBriefStatus"] = null;
  let returnBriefObservedAt: string | null = null;
  try {
    const { queryReturnBriefStatus } = await import("@/lib/product/return-brief-query");
    const briefStatus = await queryReturnBriefStatus(session.id);
    if (briefStatus.available) {
      returnBriefStatus = "AVAILABLE";
      returnBriefObservedAt = briefStatus.generatedAt;
    }
  } catch {
    unavailableSources.push("strategy-room-return-brief");
  }

  return composeStrategyRoomRecordProvenanceFromBackingRecord({
    sessionId: session.id,
    sessionKey: session.sessionKey,
    sessionStatus: session.status,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    admittedEvidenceAt,
    decisionEvents: session.decisions.map((decision) => ({
      status: decision.status,
      createdAt: decision.createdAt.toISOString(),
    })),
    authorityAssignedAt,
    constraintRetainedAt: hasPersistedConstraint({
      constraints: session.constraints,
      constraintMap: session.constraintMap,
      executionConstraint,
    })
      ? authorityAssignedAt ?? session.createdAt.toISOString()
      : null,
    reviewTriggerAt,
    checkpointCreatedAt,
    returnBriefStatus,
    returnBriefObservedAt,
    unavailableSources,
  });
}

type ExecutiveReportRunRecord = {
  id: string;
  runKey: string;
  email: string;
  status: string;
  route: string | null;
  createdAt: Date;
};

async function composeExecutiveReportProvenance(
  subjectId: string,
): Promise<DecisionProvenanceRecord> {
  const unavailableSources: string[] = [];
  let run: ExecutiveReportRunRecord | null = null;

  try {
    const { prisma } = await import("@/lib/prisma.server");
    const result = await (prisma as any).executiveReportingRun.findFirst({
      where: {
        OR: [
          { runKey: subjectId },
          { id: subjectId },
        ],
      },
      select: { id: true, runKey: true, email: true, status: true, route: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    if (result) {
      run = {
        id: result.id,
        runKey: result.runKey,
        email: result.email,
        status: result.status,
        route: result.route ?? null,
        createdAt: result.createdAt instanceof Date ? result.createdAt : new Date(result.createdAt),
      };
    }
  } catch {
    unavailableSources.push("executive-reporting-run");
  }

  if (!run) {
    return composeDecisionProvenanceFromSources({
      subjectType: "EXECUTIVE_REPORT",
      subjectId,
      unsupportedReason: "No executive report record found for this subject ID.",
      unavailableSources,
    });
  }

  // Load deliveries matching this report
  let deliveries: DeliveryRecord[] = [];
  try {
    const { listAllDeliveries } = await import("@/lib/product/oversight-delivery-service");
    const allDeliveries = await listAllDeliveries();
    deliveries = allDeliveries.filter((d) => d.artifactId === run.id || d.artifactId === run.runKey);
  } catch {
    unavailableSources.push("delivery-queue");
  }

  // Load outcomes with exact subject match
  const outcomeResult = await loadOutcomesForSubject({
    subjectType: "EXECUTIVE_REPORT",
    subjectId: run.id,
  });

  const sourceData: DecisionProvenanceSourceData = {
    subjectType: "EXECUTIVE_REPORT",
    subjectId,
    deliveries,
    outcomes: outcomeResult.outcomes,
    unavailableSources,
  };

  // Add evidence input from the report record itself
  const evidenceInputs = composeEvidenceInputs(sourceData);
  evidenceInputs.push({
    type: "EXECUTIVE_REPORT",
    label: `Executive report: ${run.runKey}`,
    evidencePosture: run.route ? `route:${run.route}` : run.status,
    source: "executive-reporting-run",
    createdAt: run.createdAt.toISOString(),
    confidence: "SYSTEM_INFERRED",
  });

  const governanceEvents = composeGovernanceEvents(sourceData);
  const provenanceGaps = composeProvenanceGaps(sourceData, evidenceInputs, governanceEvents);
  const timeline = composeTimeline(evidenceInputs, governanceEvents);

  // Add outcome linkage gap if fallback was used
  if (outcomeResult.outcomes.length > 0 && !outcomeResult.exactMatch) {
    provenanceGaps.push({
      stage: "Outcome linkage",
      description: "Outcome records were matched via fallback query rather than direct subjectType/subjectId.",
      severity: "INFO",
      href: "/admin/outcome-verification",
    });
  }

  const recordWithoutStatement = {
    version: 1 as const,
    id: `decision-provenance:v1:EXECUTIVE_REPORT:${subjectId}`,
    subjectType: "EXECUTIVE_REPORT" as const,
    subjectId,
    evidenceInputs,
    governanceEvents,
    timeline,
    currentPosture: deriveCurrentPosture({ evidenceInputs, governanceEvents, provenanceGaps }),
    provenanceGaps,
    unavailableSources: [...unavailableSources].sort(),
  };

  const accountabilityStatement = buildAccountabilityStatement(recordWithoutStatement);
  const recordWithoutHash = { ...recordWithoutStatement, accountabilityStatement };

  return {
    ...recordWithoutHash,
    provenanceHash: buildDecisionProvenanceHash(recordWithoutHash),
  };
}
