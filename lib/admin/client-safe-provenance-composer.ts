import type { DecisionProvenanceRecord } from "./decision-provenance-record";
import type {
  ClientSafeConfidenceBand,
  ClientSafeConfidenceLevel,
  ClientSafeDeliveryPosture,
  ClientSafeGapSeverity,
  ClientSafeOutcomePosture,
  ClientSafeProvenanceSummary,
  ClientSafeTimelineEntry,
} from "@/lib/product/client-safe-provenance-contract";

const ALLOWED_CONFIDENCE_LEVELS = new Set<string>([
  "USER_REPORTED",
  "SYSTEM_INFERRED",
  "OPERATOR_VERIFIED",
  "THIRD_PARTY",
]);

function deriveDeliveryPosture(record: DecisionProvenanceRecord): ClientSafeDeliveryPosture {
  if (record.governanceEvents.some((e) => e.type === "DELIVERY_SENT")) return "DELIVERED";
  if (record.governanceEvents.some((e) => e.type === "DELIVERY_APPROVED")) return "APPROVED";
  if (record.evidenceInputs.some((i) => i.type === "DELIVERY")) return "PENDING";
  return "UNKNOWN";
}

function deriveOutcomePosture(record: DecisionProvenanceRecord): ClientSafeOutcomePosture {
  if (record.governanceEvents.some((e) => e.type === "OUTCOME_RECORDED")) return "RECORDED";
  if (record.currentPosture.status === "COMPLETE") return "RECORDED";
  return "PENDING";
}

function extractGapClasses(record: DecisionProvenanceRecord): ClientSafeGapSeverity[] {
  const seen = new Set<ClientSafeGapSeverity>();
  for (const gap of record.provenanceGaps) {
    seen.add(gap.severity);
  }
  const order: ClientSafeGapSeverity[] = ["CRITICAL", "WARNING", "INFO"];
  return order.filter((s) => seen.has(s));
}

function extractConfidenceBands(record: DecisionProvenanceRecord): ClientSafeConfidenceBand[] {
  const counts = new Map<ClientSafeConfidenceLevel, number>();
  for (const input of record.evidenceInputs) {
    if (!ALLOWED_CONFIDENCE_LEVELS.has(input.confidence)) continue;
    const level = input.confidence as ClientSafeConfidenceLevel;
    counts.set(level, (counts.get(level) ?? 0) + 1);
  }
  const order: ClientSafeConfidenceLevel[] = [
    "OPERATOR_VERIFIED",
    "THIRD_PARTY",
    "SYSTEM_INFERRED",
    "USER_REPORTED",
  ];
  return order
    .filter((level) => counts.has(level))
    .map((level) => ({ level, count: counts.get(level)! }));
}

function extractTimelineSummary(record: DecisionProvenanceRecord): ClientSafeTimelineEntry[] {
  const entries: ClientSafeTimelineEntry[] = [];

  const firstInput = record.timeline.find((t) => t.type === "INPUT");
  if (firstInput) {
    entries.push({
      milestone: "EVIDENCE_CAPTURED",
      occurredAt: firstInput.date,
      label: "Evidence captured",
    });
  }

  const firstReview = record.timeline.find((t) => t.type === "REVIEW");
  if (firstReview) {
    entries.push({
      milestone: "REVIEW_COMPLETED",
      occurredAt: firstReview.date,
      label: "Governance review completed",
    });
  }

  const deliverySent = record.governanceEvents.find((e) => e.type === "DELIVERY_SENT");
  if (deliverySent?.occurredAt) {
    entries.push({
      milestone: "DELIVERY_SENT",
      occurredAt: deliverySent.occurredAt,
      label: "Oversight brief delivered",
    });
  }

  const outcomeRecorded = record.governanceEvents.find((e) => e.type === "OUTCOME_RECORDED");
  if (outcomeRecorded?.occurredAt) {
    entries.push({
      milestone: "OUTCOME_RECORDED",
      occurredAt: outcomeRecorded.occurredAt,
      label: "Outcome verified",
    });
  }

  return entries.sort((a, b) => (a.occurredAt ?? "").localeCompare(b.occurredAt ?? ""));
}

export function composeClientSafeProvenance(
  record: DecisionProvenanceRecord,
  options?: { composedAt?: string },
): ClientSafeProvenanceSummary {
  return {
    version: 1,
    subjectId: record.subjectId,
    accountabilityStatement: record.accountabilityStatement,
    provenanceHash: record.provenanceHash,
    deliveryPosture: deriveDeliveryPosture(record),
    outcomePosture: deriveOutcomePosture(record),
    gapCount: record.provenanceGaps.length,
    gapClasses: extractGapClasses(record),
    confidenceBands: extractConfidenceBands(record),
    timelineSummary: extractTimelineSummary(record),
    composedAt: options?.composedAt ?? new Date().toISOString(),
  };
}

export async function loadClientSafeProvenance(input: {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
}): Promise<ClientSafeProvenanceSummary> {
  const { composeDecisionProvenance } = await import("./decision-provenance-record");
  const record = await composeDecisionProvenance(input);
  return composeClientSafeProvenance(record);
}
