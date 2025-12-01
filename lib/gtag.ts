// lib/gtag.ts
// GA4 lightweight helpers. Safe to import in both server & client (no side-effects).

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.GA_MEASUREMENT_ID ||
  "G-R2Y3YMY8F8";

export const pageview = (url: string): void => {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: url });
};

export const event = (
  action: string,
  params: Record<string, unknown> = {}
): void => {
  if (typeof window === "undefined") return;
  if (!window.gtag) return;
  window.gtag("event", action, params);
};
