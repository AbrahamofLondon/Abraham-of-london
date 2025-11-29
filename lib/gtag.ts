// lib/gtag.ts
// GA4 lightweight helpers. Safe to import in both server & client (no side-effects).

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>
    ) => void;
  }
}

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.GA_MEASUREMENT_ID ||
  "G-R2Y3YMY8F8"; // fallback from your memory log

export const pageview = (url: string): void => {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
};

export const event = (action: string, params: Record<string, unknown> = {}): void => {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("event", action, params);
};