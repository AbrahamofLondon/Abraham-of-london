// lib/gtag.ts
// GA4 lightweight helpers. Safe to import in both server & client (no side-effects).

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_ID ||
  process.env.GA_MEASUREMENT_ID ||
  "G-R2Y3YMY8F8"; // fallback from your memory log

export const pageview = (url: string) => {
  if (typeof window === "undefined") return;
  if (!(window as any).gtag) return;
  (window as any).gtag("config", GA_MEASUREMENT_ID, { page_path: url });
};

export const event = (action: string, params: Record<string, any> = {}) => {
  if (typeof window === "undefined") return;
  if (!(window as any).gtag) return;
  (window as any).gtag("event", action, params);
};