/**
 * lib/demo/record-journey-event.ts
 *
 * §12 client recorder — posts a flagship-journey funnel event to the durable store via
 * /api/demo/funnel-event. Client-safe: it imports ONLY the FunnelEventType *type* (erased
 * at compile), so the server-only better-sqlite3 store is never pulled into a page bundle.
 * A per-tab session id is generated locally (no PII). Never sends decision text.
 */

import type { FunnelEventType } from "./funnel-event-store";

function sessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.sessionStorage.getItem("aol_journey_sid");
    if (!id) {
      id = (window.crypto?.randomUUID?.() ?? `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
      window.sessionStorage.setItem("aol_journey_sid", id);
    }
    return id;
  } catch { return `s_${Date.now().toString(36)}`; }
}

export interface JourneyEventExtra {
  productCode?: string;
  recommendationId?: string;
  tenantId?: string;
  caseId?: string;
}

export function recordJourneyEvent(eventType: FunnelEventType, extra: JourneyEventExtra = {}): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({ eventType, sessionId: sessionId(), sourceRoute: window.location.pathname, ...extra });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/demo/funnel-event", new Blob([body], { type: "application/json" }));
      return;
    }
  } catch { /* fall through to fetch */ }
  void fetch("/api/demo/funnel-event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}
