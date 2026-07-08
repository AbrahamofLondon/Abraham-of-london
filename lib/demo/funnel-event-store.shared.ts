import crypto from "node:crypto";

export const FUNNEL_EVENTS = [
  "SIGNAL_LANDING_VIEWED", "SIGNAL_STARTED", "SIGNAL_COMPLETED", "SIGNAL_RESULT_VIEWED",
  "EXAMPLE_VIEWED", "NEXT_MOVE_VIEWED", "NEXT_MOVE_ACCEPTED", "CORRIDOR_VIEWED",
  "PILOT_VIEWED", "PILOT_STARTED", "PILOT_SUBMITTED", "PILOT_MORE_INFO_REQUIRED", "PILOT_STATUS_VIEWED",
  "PILOT_RESUBMITTED", "PILOT_ACCEPTED", "PILOT_DECLINED",
  "COMMERCIAL_CONTINUATION_STARTED", "COMMERCIAL_CONTINUATION_COMPLETED",
] as const;
export type FunnelEventType = (typeof FUNNEL_EVENTS)[number];
export const JOURNEY_VERSION = "flagship-1";

export interface FunnelEventInput {
  eventType: FunnelEventType;
  sessionId: string;
  sourceRoute: string;
  journeyVersion?: string;
  tenantId?: string | null;
  caseId?: string | null;
  productCode?: string | null;
  recommendationId?: string | null;
}

export interface FunnelEventRecord extends Required<Omit<FunnelEventInput, "tenantId" | "caseId" | "productCode" | "recommendationId">> {
  eventId: string;
  occurredAt: string;
  tenantId: string | null;
  caseId: string | null;
  productCode: string | null;
  recommendationId: string | null;
}

export interface FunnelSummary {
  counts: Record<FunnelEventType, number>;
  signal: { views: number; starts: number; completions: number; completionRate: number };
  pilot: { views: number; starts: number; submissions: number; moreInfo: number; accepted: number; declined: number };
  commercial: { continuationStarted: number; continuationCompleted: number };
  biggestDropOff: { from: FunnelEventType; to: FunnelEventType; lost: number } | null;
  totalEvents: number;
}

export function newFunnelEventId(): string { return `fev_${crypto.randomBytes(8).toString("hex")}`; }
export function isFunnelEvent(x: unknown): x is FunnelEventType { return typeof x === "string" && (FUNNEL_EVENTS as readonly string[]).includes(x); }
export function rate(n: number, d: number): number { return d === 0 ? 0 : Math.round((n / d) * 100); }
export function emptyFunnelCounts(): Record<FunnelEventType, number> { return Object.fromEntries(FUNNEL_EVENTS.map((e) => [e, 0])) as Record<FunnelEventType, number>; }
export function summarizeFromCounts(counts: Record<FunnelEventType, number>, totalEvents: number): FunnelSummary {
  const ordered: FunnelEventType[] = ["SIGNAL_LANDING_VIEWED", "SIGNAL_STARTED", "SIGNAL_COMPLETED", "NEXT_MOVE_ACCEPTED", "PILOT_VIEWED", "PILOT_SUBMITTED", "PILOT_ACCEPTED"];
  let biggest: FunnelSummary["biggestDropOff"] = null;
  for (let i = 0; i < ordered.length - 1; i++) {
    const from = ordered[i]!, to = ordered[i + 1]!;
    const lost = Math.max(0, counts[from] - counts[to]);
    if (!biggest || lost > biggest.lost) biggest = { from, to, lost };
  }
  return {
    counts,
    signal: { views: counts.SIGNAL_LANDING_VIEWED, starts: counts.SIGNAL_STARTED, completions: counts.SIGNAL_COMPLETED, completionRate: rate(counts.SIGNAL_COMPLETED, counts.SIGNAL_STARTED) },
    pilot: { views: counts.PILOT_VIEWED, starts: counts.PILOT_STARTED, submissions: counts.PILOT_SUBMITTED, moreInfo: counts.PILOT_MORE_INFO_REQUIRED, accepted: counts.PILOT_ACCEPTED, declined: counts.PILOT_DECLINED },
    commercial: { continuationStarted: counts.COMMERCIAL_CONTINUATION_STARTED, continuationCompleted: counts.COMMERCIAL_CONTINUATION_COMPLETED },
    biggestDropOff: biggest,
    totalEvents,
  };
}
