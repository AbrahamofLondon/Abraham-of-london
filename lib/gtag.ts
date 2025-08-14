// lib/gtag.ts
import { siteConfig } from "./siteConfig";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaMeasurementId || "";

export const gaEnabled = Boolean(GA_MEASUREMENT_ID);

// GA4 pageview
export const pageview = (url: string) => {
  if (!gaEnabled || typeof window === "undefined") return;
  // @ts-ignore
  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

// GA4 custom event
export const gaEvent = (action: string, params: Record<string, any> = {}) => {
  if (!gaEnabled || typeof window === "undefined") return;
  // @ts-ignore
  window.gtag?.("event", action, params);
};

// Types for global (optional)
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}




