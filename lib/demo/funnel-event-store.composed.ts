export { isFunnelEvent, FUNNEL_EVENTS, JOURNEY_VERSION } from "./funnel-event-store.shared";
export type { FunnelEventInput, FunnelEventRecord, FunnelEventType, FunnelSummary } from "./funnel-event-store.shared";

function isProd(): boolean { return process.env.NODE_ENV === "production"; }
async function adapter() { return isProd() ? import("./funnel-event-store.prisma") : import("./funnel-event-store"); }

export async function recordFunnelEvent(input: import("./funnel-event-store.shared").FunnelEventInput, now = new Date().toISOString()) {
  return (await adapter()).recordFunnelEvent(input, now);
}
export async function summarizeFunnel(opts: { from?: string; to?: string; journeyVersion?: string } = {}) {
  return (await adapter()).summarizeFunnel(opts);
}
