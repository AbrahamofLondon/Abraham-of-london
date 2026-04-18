/**
 * lib/analytics/track.ts — Thin GA4 event wrapper
 *
 * Single utility for all funnel instrumentation.
 * Degrades safely if gtag is unavailable.
 * Never throws. Never blocks rendering.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

/**
 * Fire a GA4 custom event. Safe to call server-side (no-ops).
 */
export function track(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === "function") {
      gtag("event", event, params);
    }
  } catch {
    // Silent — analytics must never break the app
  }
}

/**
 * Fire a GA4 event and also log to console in development.
 */
export function trackDev(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[track] ${event}`, params);
  }

  track(event, params);
}
