/**
 * lib/admin/decision-provenance-record.ts
 *
 * Unified Decision Provenance Record — the accountability spine.
 *
 * Composes a read-only, normalised provenance record from existing data sources
 * without modifying any schema, inventing data, or duplicating storage.
 *
 * Primary anchor: retained cadence cycleId.
 *
 * Sources consumed (all read-only):
 *   - RetainedReviewCycle          (retained-cadence-service)
 *   - CadenceHistoryEvent[]        (retained-cadence-service.loadCadenceHistory)
 *   - SuppressionEvent[]           (suppression-ledger.loadSuppressionLedger)
 *   - DeliveryRecord[]             (oversight-delivery-service.listAllDeliveries)
 *   - CounselHistoryEntry[]        (counsel-history-loader.loadCounselHistory)
 *   - BoardroomArchiveEntry[]      (boardroom-archive.loadBoardroomArchiveSummary)
 *   - OversightReviewDecisionRecord (oversight-review-decision-ledger)
 *
 * Missing or failed sources are marked as unavailable — never inferred.
 * The accountability statement only claims what is documented.
 */

import type { RetainedReviewCycle, CadenceHistoryEvent } from "@/lib/product/retained-cadence-contract";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { CounselHistoryEntry } from "@/lib/product/counsel-history-contract";
import type { BoardroomArchiveEntry } from "@/lib/product/boardroom-archive-contract";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";

// ─── Public types ─────────────────────────────────────────────────────────────

export type ProvenanceSubjectType =
  | "OVERSIGHT_CYCLE"
  | "EXECUTIVE_REPORT"
  | "DECISION_CASE"
  | "RETAINER_ACCOUNT"
  | "DELIVERY_ITEM";

export type GovernanceEventType =
  | "SIGNAL_DETECTED"
  | "OPERATOR_REVIEWED"
  | "SUPPRESSION_APPLIED"
  | "COUNSEL_ESCALATED"
  | "BOARDROOM_ESCALATED"
  | "DELIVERY_APPROVED"
  | "DELIVERY_SENT"
  | "OUTCOME_RECORDED"
  | "MEMORY_UPDATED";

export type ProvenanceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ProvenancePostureStatus =
  | "COMPLETE"
  | "IN_REVIEW"
  | "BLOCKED"
  | "ESCALATED"
  | "DELIVERED"
  | "UNVERIFIED"
  | "UNKNOWN";

export type EvidenceInput = {
  type: string;
  label: string;
  evidencePosture?: string | null;
  source?: string | null;
  createdAt?: string | null;
};

export type GovernanceEvent = {
  type: GovernanceEventType;
  label: string;
  actor?: string | null;
  occurredAt?: string | null;
  severity?: ProvenanceSeverity;
  href?: string;
};

export type DecisionProvenanceRecord = {
  id: string;
  subjectType: ProvenanceSubjectType;
  subjectId: string;
  evidenceInputs: EvidenceInput[];
  governanceEvents: GovernanceEvent[];
  currentPosture: {
    status: ProvenancePostureStatus;
    summary: string;
    nextAction?: string;
    nextActionHref?: string;
  };
  accountabilityStatement: string;
  unavailableSources: string[];
};

// ─── Source data bundle (pure functions take this, not raw DB) ────────────────

export type ProvenanceSourceData = {
  cycleId: string;
  cycle: RetainedReviewCycle | null;
  cadenceHistory: CadenceHistoryEvent[];
  suppressions: SuppressionEvent[];
  deliveries: DeliveryRecord[];
  counselEntries: CounselHistoryEntry[];
  boardroomEntries: BoardroomArchiveEntry[];
  decisionRecord: OversightReviewDecisionRecord | null;
  unavailableSources: string[];
};

// ─── Posture classification ───────────────────────────────────────────────────

const CADENCE_STATE_POSTURE: Partial<Record<string, ProvenancePostureStatus>> = {
  NOT_CONFIGURED:         "UNKNOWN",
  CONFIGURED:             "UNKNOWN",
  SCHEDULED:              "UNKNOWN",
  DUE_SOON:               "UNVERIFIED",
  REVIEW_DUE:             "UNVERIFIED",
  REVIEW_IN_PROGRESS:     "IN_REVIEW",
  MANUAL_OPERATOR_REVIEW: "IN_REVIEW",
  OVERDUE:                "BLOCKED",
  CADENCE_BROKEN:         "BLOCKED",
  ESCALATED:              "ESCALATED",
  COMPLETED:              "COMPLETE",
  REVIEW_COMPLETED:       "COMPLETE",
  SKIPPED_WITH_REASON:    "COMPLETE",
  REVIEW_SKIPPED:         "COMPLETE",
};

export function classifyPosture(
  cycle: RetainedReviewCycle | null,
  events: GovernanceEvent[],
  unavailableCount: number,
): { status: ProvenancePostureStatus; summary: string; nextAction?: string; nextActionHref?: string } {
  if (!cycle) {
    return {
      status: "UNKNOWN",
      summary: unavailableCount > 0
        ? `Cycle record unavailable — ${unavailableCount} data source${unavailableCount !== 1 ? "s" : ""} could not be loaded.`
        : "No cadence cycle record found for this subject.",
      nextAction: "Create a cadence cycle to begin governed oversight.",
      nextActionHref: "/admin/retained-cadence",
    };
  }

  const hasDelivery = events.some((e) => e.type === "DELIVERY_SENT");
  const isEscalated = events.some(
    (e) => e.type === "COUNSEL_ESCALATED" || e.type === "BOARDROOM_ESCALATED",
  );

  if (hasDelivery && cycle.cadenceState === "REVIEW_COMPLETED") {
    return {
      status: "DELIVERED",
      summary: "Oversight cycle reviewed and client-safe brief delivered.",
    };
  }

  if (isEscalated) {
    return {
      status: "ESCALATED",
      summary: "Cycle has active counsel or boardroom escalation. Resolve before delivery.",
      nextAction: "Review escalation status",
      nextActionHref: "/admin/oversight-review",
    };
  }

  const mapped = CADENCE_STATE_POSTURE[cycle.cadenceState] ?? "UNKNOWN";

  const summaryMap: Record<ProvenancePostureStatus, string> = {
    COMPLETE:   "Cycle review complete.",
    IN_REVIEW:  "Operator review in progress.",
    BLOCKED:    "Cycle is overdue or broken — operator action required.",
    ESCALATED:  "Escalated to counsel or boardroom.",
    DELIVERED:  "Brief delivered.",
    UNVERIFIED: "Cycle is due — not yet in operator review.",
    UNKNOWN:    unavailableCount > 0
      ? `Posture unclear — ${unavailableCount} source${unavailableCount !== 1 ? "s" : ""} unavailable.`
      : "Cycle state is not yet actionable.",
  };

  const nextActionMap: Partial<Record<ProvenancePostureStatus, { action: string; href: string }>> = {
    BLOCKED:    { action: "Start overdue review", href: "/admin/retained-cadence" },
    UNVERIFIED: { action: "Begin operator review", href: "/admin/oversight-review" },
    IN_REVIEW:  { action: "Continue review", href: "/admin/oversight-review" },
  };

  const next = nextActionMap[mapped];
  return {
    status: mapped,
    summary: summaryMap[mapped],
    nextAction: next?.action,
    nextActionHref: next?.href,
  };
}

// ─── Evidence input composer ──────────────────────────────────────────────────

export function composeEvidenceInputs(data: ProvenanceSourceData): EvidenceInput[] {
  const inputs: EvidenceInput[] = [];

  if (data.cycle) {
    inputs.push({
      type: "CADENCE_CYCLE",
      label: `Retained review cycle (${data.cycle.cadenceType ?? "custom"})`,
      evidencePosture: data.cycle.evidencePosture ?? null,
      source: "retained-cadence-service",
      createdAt: data.cycle.createdAt ?? null,
    });
  }

  for (const suppression of data.suppressions) {
    inputs.push({
      type: "SUPPRESSION",
      label: `Suppression: ${suppression.fieldName} on ${suppression.surface}`,
      evidencePosture: suppression.evidencePosture ?? suppression.originalPosture ?? null,
      source: "suppression-ledger",
      createdAt: suppression.suppressedAt ?? null,
    });
  }

  for (const delivery of data.deliveries) {
    inputs.push({
      type: "DELIVERY",
      label: `Delivery: ${delivery.artifactType} to ${delivery.recipientEmail}`,
      evidencePosture: delivery.evidencePosture ?? null,
      source: "oversight-delivery-service",
      createdAt: delivery.createdAt ?? null,
    });
  }

  if (data.decisionRecord) {
    inputs.push({
      type: "OPERATOR_DECISION",
      label: `Operator decision: ${data.decisionRecord.decision}`,
      evidencePosture: data.decisionRecord.efficacyGrade ?? null,
      source: "oversight-review-decision-ledger",
      createdAt: data.decisionRecord.createdAt ?? null,
    });
  }

  return inputs;
}

// ─── Governance event composer ────────────────────────────────────────────────

export function composeGovernanceEvents(data: ProvenanceSourceData): GovernanceEvent[] {
  const events: GovernanceEvent[] = [];

  // Cadence history events
  for (const hist of data.cadenceHistory) {
    events.push({
      type: "SIGNAL_DETECTED",
      label: `Cadence: ${hist.action}`,
      actor: hist.operatorId ?? null,
      occurredAt: hist.timestamp ?? null,
      severity: "LOW",
      href: "/admin/retained-cadence",
    });
  }

  // Operator decision
  if (data.decisionRecord) {
    events.push({
      type: "OPERATOR_REVIEWED",
      label: `Decision: ${data.decisionRecord.decision}`,
      actor: data.decisionRecord.operatorId ?? null,
      occurredAt: data.decisionRecord.createdAt ?? null,
      severity: data.decisionRecord.deliveryAllowed ? "LOW" : "HIGH",
      href: "/admin/oversight-review",
    });
  }

  // Suppressions
  for (const s of data.suppressions) {
    const isHighRisk = /privacy|legal|counsel|risk|unsafe/i.test(
      `${s.suppressionRule} ${s.suppressionReason}`,
    );
    events.push({
      type: "SUPPRESSION_APPLIED",
      label: `Suppressed: ${s.fieldName} — ${s.suppressionReason}`,
      actor: s.reviewedByOperator ?? (s.suppressedBySystem ? "system" : null),
      occurredAt: s.suppressedAt ?? null,
      severity: isHighRisk ? "HIGH" : "MEDIUM",
      href: "/admin/suppression-ledger",
    });
  }

  // Counsel escalations — distinct from boardroom
  for (const counsel of data.counselEntries) {
    events.push({
      type: "COUNSEL_ESCALATED",
      label: `Counsel escalation: ${counsel.triggerReason}`,
      actor: counsel.assignedTo ?? null,
      occurredAt: counsel.triggeredAt ?? null,
      severity: "HIGH",
      href: "/admin/counsel-review",
    });

    // Disposition event if resolved
    if (counsel.operatorDisposition && counsel.operatorDisposition !== "PENDING") {
      events.push({
        type: "OPERATOR_REVIEWED",
        label: `Counsel disposition: ${counsel.operatorDisposition}`,
        actor: counsel.assignedTo ?? null,
        occurredAt: counsel.triggeredAt ?? null,
        severity: "MEDIUM",
        href: "/admin/counsel-review",
      });
    }
  }

  // Boardroom escalations — distinct from counsel
  for (const br of data.boardroomEntries) {
    events.push({
      type: "BOARDROOM_ESCALATED",
      label: `Boardroom escalation: ${br.triggerReason}`,
      actor: null,
      occurredAt: br.qualifiedAt ?? null,
      severity: "CRITICAL",
      href: "/admin/boardroom-archive",
    });
  }

  // Delivery events
  for (const delivery of data.deliveries) {
    if (delivery.approvedBy) {
      events.push({
        type: "DELIVERY_APPROVED",
        label: `Delivery approved for ${delivery.recipientEmail}`,
        actor: delivery.approvedBy,
        occurredAt: delivery.createdAt ?? null,
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    }

    if (delivery.status === "DELIVERED" && delivery.deliveredAt) {
      events.push({
        type: "DELIVERY_SENT",
        label: `Delivered to ${delivery.recipientEmail} via ${delivery.deliveryMethod}`,
        actor: delivery.deliveredBy ?? null,
        occurredAt: delivery.deliveredAt,
        severity: "LOW",
        href: "/admin/delivery-queue",
      });
    } else if (delivery.status === "FAILED") {
      events.push({
        type: "DELIVERY_SENT",
        label: `Delivery failed: ${delivery.failureReason ?? "unknown reason"}`,
        actor: delivery.deliveredBy ?? null,
        occurredAt: delivery.latestAttemptAt ?? delivery.createdAt ?? null,
        severity: "HIGH",
        href: "/admin/delivery-queue",
      });
    }
  }

  // Sort chronologically, nulls last
  events.sort((a, b) => {
    if (!a.occurredAt && !b.occurredAt) return 0;
    if (!a.occurredAt) return 1;
    if (!b.occurredAt) return -1;
    return new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
  });

  return events;
}

// ─── Accountability statement ─────────────────────────────────────────────────

/**
 * Builds a restrained, evidence-only accountability statement.
 * Claims only what is actually documented — no inferences.
 */
export function buildAccountabilityStatement(
  cycleId: string,
  cycle: RetainedReviewCycle | null,
  events: GovernanceEvent[],
  unavailableSources: string[],
): string {
  if (!cycle) {
    if (unavailableSources.length > 0) {
      return `Provenance for cycle ${cycleId} is incomplete. ${unavailableSources.length} data source${unavailableSources.length !== 1 ? "s" : ""} could not be loaded. No accountability claim can be made.`;
    }
    return `No cycle record found for ${cycleId}. Accountability chain cannot be established.`;
  }

  const parts: string[] = [];

  // State
  parts.push(`Cadence cycle in state ${cycle.cadenceState}.`);

  // Operator
  if (cycle.operatorId) {
    const completedAt = cycle.completedAt ?? cycle.skippedAt;
    if (completedAt) {
      parts.push(`Reviewed by operator ${cycle.operatorId} on ${new Date(completedAt).toLocaleDateString("en-GB")}.`);
    } else {
      parts.push(`Assigned to operator ${cycle.operatorId}.`);
    }
  } else {
    parts.push("No operator recorded for this cycle.");
  }

  // Suppressions
  const suppressionEvents = events.filter((e) => e.type === "SUPPRESSION_APPLIED");
  if (suppressionEvents.length > 0) {
    parts.push(`${suppressionEvents.length} suppression event${suppressionEvents.length !== 1 ? "s" : ""} applied and recorded.`);
  }

  // Counsel
  const counselEvents = events.filter((e) => e.type === "COUNSEL_ESCALATED");
  if (counselEvents.length > 0) {
    parts.push(`Escalated to counsel (${counselEvents.length} escalation${counselEvents.length !== 1 ? "s" : ""}).`);
  }

  // Boardroom
  const boardroomEvents = events.filter((e) => e.type === "BOARDROOM_ESCALATED");
  if (boardroomEvents.length > 0) {
    parts.push(`Escalated to boardroom (${boardroomEvents.length} escalation${boardroomEvents.length !== 1 ? "s" : ""}).`);
  }

  // Delivery
  const deliveredEvents = events.filter(
    (e) => e.type === "DELIVERY_SENT" && !e.label.toLowerCase().includes("failed"),
  );
  if (deliveredEvents.length > 0) {
    parts.push(`Brief delivered (${deliveredEvents.length} delivery record${deliveredEvents.length !== 1 ? "s" : ""}).`);
  } else {
    parts.push("No confirmed delivery on record.");
  }

  // Unavailable caveat
  if (unavailableSources.length > 0) {
    parts.push(`Note: ${unavailableSources.length} source${unavailableSources.length !== 1 ? "s" : ""} unavailable — statement may be incomplete.`);
  }

  return parts.join(" ");
}

// ─── Record composer (pure) ───────────────────────────────────────────────────

export function composeDecisionProvenanceRecord(
  data: ProvenanceSourceData,
): DecisionProvenanceRecord {
  const evidenceInputs = composeEvidenceInputs(data);
  const governanceEvents = composeGovernanceEvents(data);
  const posture = classifyPosture(data.cycle, governanceEvents, data.unavailableSources.length);
  const accountabilityStatement = buildAccountabilityStatement(
    data.cycleId,
    data.cycle,
    governanceEvents,
    data.unavailableSources,
  );

  return {
    id: `provenance:${data.cycleId}`,
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: data.cycleId,
    evidenceInputs,
    governanceEvents,
    currentPosture: posture,
    accountabilityStatement,
    unavailableSources: data.unavailableSources,
  };
}

// ─── Server-side loader ───────────────────────────────────────────────────────

export async function loadDecisionProvenanceRecord(
  cycleId: string,
): Promise<DecisionProvenanceRecord> {
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

  // Load cycle record
  let cycle: RetainedReviewCycle | null = null;
  try {
    const all = await listRetainedReviewCycles();
    cycle = all.find((c) => c.cycleId === cycleId) ?? null;
  } catch {
    unavailableSources.push("retained-cadence");
  }

  // Load cadence history (scoped by accountId/organisationId as scopeId)
  let cadenceHistory: CadenceHistoryEvent[] = [];
  if (cycle) {
    const scopeId = cycle.accountId ?? cycle.organisationId ?? cycleId;
    try {
      cadenceHistory = await loadCadenceHistory(scopeId);
    } catch {
      unavailableSources.push("cadence-history");
    }
  }

  // Load suppressions scoped to this cycle
  let suppressions: SuppressionEvent[] = [];
  try {
    suppressions = await loadSuppressionLedger({ scopeId: cycleId, limit: 200 });
  } catch {
    unavailableSources.push("suppression-ledger");
  }

  // Load deliveries; filter to those referencing this cycleId as artifactId
  let deliveries: DeliveryRecord[] = [];
  try {
    const all = await listAllDeliveries();
    deliveries = all.filter((d) => d.artifactId === cycleId);
  } catch {
    unavailableSources.push("delivery-queue");
  }

  // Load counsel history scoped to this cycle
  let counselEntries: CounselHistoryEntry[] = [];
  try {
    const history = await loadCounselHistory({ cycleId });
    counselEntries = history.entries ?? [];
  } catch {
    unavailableSources.push("counsel-history");
  }

  // Load boardroom archive scoped to this cycle
  let boardroomEntries: BoardroomArchiveEntry[] = [];
  try {
    const summary = await loadBoardroomArchiveSummary({ cycleId });
    boardroomEntries = summary.entries ?? [];
  } catch {
    unavailableSources.push("boardroom-archive");
  }

  // Load operator decision record (needs accountId)
  let decisionRecord: OversightReviewDecisionRecord | null = null;
  if (cycle?.accountId) {
    try {
      decisionRecord = await loadLatestOversightReviewDecision({
        accountId: cycle.accountId,
        organisationId: cycle.organisationId ?? undefined,
      });
      // Confirm it actually belongs to this cycle
      if (decisionRecord && decisionRecord.cycleId !== cycleId) {
        decisionRecord = null;
      }
    } catch {
      unavailableSources.push("oversight-review-decision");
    }
  }

  return composeDecisionProvenanceRecord({
    cycleId,
    cycle,
    cadenceHistory,
    suppressions,
    deliveries,
    counselEntries,
    boardroomEntries,
    decisionRecord,
    unavailableSources,
  });
}
