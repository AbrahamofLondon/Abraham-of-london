import { prisma } from "@/lib/prisma";
import {
  emptyFunnelCounts,
  isFunnelEvent,
  JOURNEY_VERSION,
  newFunnelEventId,
  summarizeFromCounts,
  type FunnelEventInput,
  type FunnelEventRecord,
  type FunnelEventType,
  type FunnelSummary,
} from "./funnel-event-store.shared";

export { isFunnelEvent, FUNNEL_EVENTS, JOURNEY_VERSION } from "./funnel-event-store.shared";
export type { FunnelEventInput, FunnelEventRecord, FunnelEventType, FunnelSummary };

export async function recordFunnelEvent(input: FunnelEventInput, now = new Date().toISOString()): Promise<FunnelEventRecord> {
  if (!isFunnelEvent(input.eventType)) throw new Error(`[FUNNEL] unknown event type: ${input.eventType}`);
  const data = {
    eventId: newFunnelEventId(),
    occurredAt: new Date(now),
    eventType: input.eventType,
    journeyVersion: input.journeyVersion ?? JOURNEY_VERSION,
    sessionId: input.sessionId,
    sourceRoute: input.sourceRoute,
    tenantId: input.tenantId ?? null,
    caseId: input.caseId ?? null,
    productCode: input.productCode ?? null,
    recommendationId: input.recommendationId ?? null,
  };
  const row = await prisma.funnelJourneyEvent.create({ data });
  return { ...row, occurredAt: row.occurredAt.toISOString(), eventType: row.eventType as FunnelEventType };
}

export async function summarizeFunnel(opts: { from?: string; to?: string; journeyVersion?: string } = {}): Promise<FunnelSummary> {
  const where = {
    ...(opts.from || opts.to ? { occurredAt: { ...(opts.from ? { gte: new Date(opts.from) } : {}), ...(opts.to ? { lte: new Date(opts.to) } : {}) } } : {}),
    ...(opts.journeyVersion ? { journeyVersion: opts.journeyVersion } : {}),
  };
  const rows = await prisma.funnelJourneyEvent.groupBy({ by: ["eventType"], where, _count: { _all: true } });
  const counts = emptyFunnelCounts();
  let total = 0;
  for (const row of rows) {
    if (isFunnelEvent(row.eventType)) {
      counts[row.eventType] = row._count._all;
      total += row._count._all;
    }
  }
  return summarizeFromCounts(counts, total);
}
