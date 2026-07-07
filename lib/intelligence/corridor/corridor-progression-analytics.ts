/**
 * lib/intelligence/corridor/corridor-progression-analytics.ts
 *
 * §8 — Corridor Progression Analytics.
 *
 * Instruments: entry product, recommended next move, recommendation viewed,
 * recommendation accepted, qualification started, qualification accepted/declined,
 * product started, product completed, corridor stall, checkpoint missed, return after intervention.
 *
 * No manipulative dark-pattern retention. Used for friction detection,
 * stalled-path assistance, product-path effectiveness, recommendation usefulness.
 * No cross-client leakage. No sensitive decision content in analytics events.
 */
export type AnalyticsEventType =
  | "corridor_entry"
  | "recommendation_viewed"
  | "recommendation_accepted"
  | "qualification_started"
  | "qualification_accepted"
  | "qualification_declined"
  | "product_started"
  | "product_completed"
  | "corridor_stall"
  | "checkpoint_missed"
  | "return_after_intervention";

export interface CorridorAnalyticsEvent {
  eventId: string;
  customerId: string;
  eventType: AnalyticsEventType;
  productCode: string;
  sourceProductCode: string | null;
  timestamp: string;
  metadata: Record<string, string>;
}

export interface CorridorAnalyticsSummary {
  totalCustomers: number;
  totalEvents: number;
  entryProducts: Array<{ productCode: string; count: number }>;
  mostViewedRecommendations: Array<{ productCode: string; viewCount: number }>;
  mostAcceptedRecommendations: Array<{ productCode: string; acceptCount: number }>;
  qualificationConversionRate: number;
  stallRate: number;
  averageCompletionRate: number;
}

const events: CorridorAnalyticsEvent[] = [];

export function recordCorridorEvent(event: Omit<CorridorAnalyticsEvent, "eventId" | "timestamp">): CorridorAnalyticsEvent {
  const recorded: CorridorAnalyticsEvent = {
    ...event,
    eventId: `ce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  events.push(recorded);
  return recorded;
}

export function getCorridorEvents(customerId?: string): CorridorAnalyticsEvent[] {
  if (customerId) return events.filter(e => e.customerId === customerId);
  return [...events];
}

export function getCorridorAnalyticsSummary(): CorridorAnalyticsSummary {
  const uniqueCustomers = new Set(events.map(e => e.customerId));
  const entryProducts = new Map<string, number>();
  const viewedRecs = new Map<string, number>();
  const acceptedRecs = new Map<string, number>();
  let qualificationsStarted = 0, qualificationsAccepted = 0, stalls = 0, completions = 0, starts = 0;

  for (const e of events) {
    if (e.eventType === "corridor_entry") entryProducts.set(e.productCode, (entryProducts.get(e.productCode) ?? 0) + 1);
    if (e.eventType === "recommendation_viewed") viewedRecs.set(e.productCode, (viewedRecs.get(e.productCode) ?? 0) + 1);
    if (e.eventType === "recommendation_accepted") acceptedRecs.set(e.productCode, (acceptedRecs.get(e.productCode) ?? 0) + 1);
    if (e.eventType === "qualification_started") qualificationsStarted++;
    if (e.eventType === "qualification_accepted") qualificationsAccepted++;
    if (e.eventType === "corridor_stall") stalls++;
    if (e.eventType === "product_completed") completions++;
    if (e.eventType === "product_started") starts++;
  }

  return {
    totalCustomers: uniqueCustomers.size,
    totalEvents: events.length,
    entryProducts: Array.from(entryProducts.entries()).map(([productCode, count]) => ({ productCode, count })).sort((a, b) => b.count - a.count),
    mostViewedRecommendations: Array.from(viewedRecs.entries()).map(([productCode, viewCount]) => ({ productCode, viewCount })).sort((a, b) => b.viewCount - a.viewCount),
    mostAcceptedRecommendations: Array.from(acceptedRecs.entries()).map(([productCode, acceptCount]) => ({ productCode, acceptCount })).sort((a, b) => b.acceptCount - a.acceptCount),
    qualificationConversionRate: qualificationsStarted > 0 ? qualificationsAccepted / qualificationsStarted : 0,
    stallRate: starts > 0 ? stalls / starts : 0,
    averageCompletionRate: starts > 0 ? completions / starts : 0,
  };
}
