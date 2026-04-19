/**
 * lib/analytics/track.ts — GA4 event wrapper with auto-enrichment
 *
 * Every event is automatically enriched with:
 * - user_type (personal / operator / unknown)
 * - session_depth (current funnel stage)
 * - device (mobile / desktop)
 * - returning_user (true / false)
 * - traffic_source (direct / linkedin / referral / etc.)
 * - origin (purpose_alignment / direct / etc.)
 *
 * Degrades safely if gtag/sessionStorage/localStorage unavailable.
 * Never throws. Never blocks rendering.
 */

type EventParams = Record<string, string | number | boolean | null | undefined>;

function safeSessionGet(key: string): string {
  try { return sessionStorage.getItem(key) || ""; } catch { return ""; }
}

function safeLocalGet(key: string): string {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

function safeLocalSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}

function deriveUserType(): string {
  const origin = safeSessionGet("aol_diagnostics_origin");
  const stage = safeSessionGet("aol_funnel_stage");
  if (origin === "purpose_alignment") return "personal";
  if (stage.includes("team") || stage.includes("enterprise")) return "operator";
  if (stage.includes("constitutional")) return "institutional";
  return "unknown";
}

function deriveDevice(): string {
  if (typeof window === "undefined") return "unknown";
  return window.innerWidth < 768 ? "mobile" : "desktop";
}

function deriveSource(): string {
  if (typeof document === "undefined") return "direct";
  const ref = document.referrer.toLowerCase();
  if (!ref) return "direct";
  if (ref.includes("linkedin")) return "linkedin";
  if (ref.includes("twitter") || ref.includes("x.com")) return "twitter";
  if (ref.includes("google")) return "google";
  if (ref.includes("facebook")) return "facebook";
  return "referral";
}

function isReturning(): boolean {
  const flag = safeLocalGet("aol_returning_user");
  if (flag === "true") return true;
  safeLocalSet("aol_returning_user", "true");
  return false;
}

/**
 * Fire a GA4 custom event with auto-enriched context.
 * Safe to call server-side (no-ops).
 */
export function track(event: string, params: EventParams = {}): void {
  if (typeof window === "undefined") return;

  try {
    const gtag = (window as any).gtag;
    if (typeof gtag !== "function") return;

    const enriched: EventParams = {
      ...params,
      user_type: params.user_type ?? deriveUserType(),
      session_depth: params.session_depth ?? safeSessionGet("aol_funnel_stage"),
      device: params.device ?? deriveDevice(),
      returning_user: params.returning_user ?? isReturning(),
      traffic_source: params.traffic_source ?? deriveSource(),
      origin: params.origin ?? (safeSessionGet("aol_diagnostics_origin") || "direct"),
    };

    gtag("event", event, enriched);
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
