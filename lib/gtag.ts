// lib/gtag.ts
import { siteConfig } from "./siteConfig";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaMeasurementId || "";

const IS_PROD = process.env.NODE_ENV === "production";
export const gaEnabled = Boolean(GA_MEASUREMENT_ID) && IS_PROD;

// Define a safe window type
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Small safe wrapper so calls never throw
function gtagSafe(...args: unknown[]) {
  if (!gaEnabled || typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag(...args);
}

// Pageview (GA4)
export const pageview = (url: string) => {
  gtagSafe("config", GA_MEASUREMENT_ID, { page_path: url });
};

// Custom event (GA4)
export const gaEvent = (action: string, params: Record<string, unknown> = {}) => {
  gtagSafe("event", action, params);
};

// Outbound link helper (optional)
export const trackOutbound = (url: string, label?: string) => {
  gaEvent("click", {
    event_category: "outbound",
    event_label: label ?? url,
    transport_type: "beacon",
  });
};

// Consent helper (optional)
export const setConsent = (granted: boolean) => {
  gtagSafe("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
};
