import type { GmiReleaseEvent, GmiReleaseEventType } from "./gmi-release-events";

export type GmiReleaseEventSummary = {
  reportId: string;
  totalEvents: number;
  lastQualityGateRun: string | null;
  lastReleaseBlockedReason: string | null;
  lastSourceVerification: string | null;
  lastCallReview: string | null;
  lastOutboundGateCheck: string | null;
  emptyState: string | null;
};

function latestEvent(
  events: readonly GmiReleaseEvent[],
  eventTypes: readonly GmiReleaseEventType[],
): GmiReleaseEvent | null {
  return events
    .filter((event) => eventTypes.includes(event.eventType))
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))[0] ?? null;
}

function formatEvent(event: GmiReleaseEvent | null): string | null {
  if (!event) return null;
  return `${event.occurredAt} - ${event.summary}`;
}

export function buildGmiReleaseEventSummary(
  reportId: string,
  events: readonly GmiReleaseEvent[] = [],
): GmiReleaseEventSummary {
  const reportEvents = events.filter((event) => event.reportId === reportId);
  const lastQualityGateRun = latestEvent(reportEvents, ["GMI_QUALITY_GATE_RUN"]);
  const lastReleaseBlocked = latestEvent(reportEvents, ["GMI_RELEASE_BLOCKED"]);
  const lastSourceVerification = latestEvent(reportEvents, [
    "GMI_SOURCE_ROW_VERIFIED",
    "GMI_SOURCE_ROW_REJECTED",
  ]);
  const lastCallReview = latestEvent(reportEvents, [
    "GMI_CALL_REVIEWED",
    "GMI_CALL_CARRIED_FORWARD",
  ]);
  const lastOutboundGateCheck = latestEvent(reportEvents, ["GMI_OUTBOUND_GATE_RUN"]);

  return {
    reportId,
    totalEvents: reportEvents.length,
    lastQualityGateRun: formatEvent(lastQualityGateRun),
    lastReleaseBlockedReason: formatEvent(lastReleaseBlocked),
    lastSourceVerification: formatEvent(lastSourceVerification),
    lastCallReview: formatEvent(lastCallReview),
    lastOutboundGateCheck: formatEvent(lastOutboundGateCheck),
    emptyState: reportEvents.length === 0 ? "No release events recorded yet." : null,
  };
}
