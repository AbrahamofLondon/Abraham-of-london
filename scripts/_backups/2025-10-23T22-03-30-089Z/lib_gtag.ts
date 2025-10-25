// lib/gtag.ts
import { siteConfig } from "./siteConfig";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaMeasurementId || "";

/* Ãƒ°Ã...¸Ã¢â‚¬ËœÃ¢â‚¬¡ add this line to keep _app.tsx happy */
export const GA_ID = GA_MEASUREMENT_ID;

const IS_PROD = process.env.NODE_ENV === "production";
export const gaEnabled = Boolean(GA_MEASUREMENT_ID) && IS_PROD;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function gtagSafe(...args: unknown[]) {
  if (!gaEnabled || typeof window === "undefined") return;
  if (typeof window.gtag === "function") window.gtag(...args);
}

export const pageview = (url: string) => {
  gtagSafe("config", GA_MEASUREMENT_ID, { page_path: url });
};

export const gaEvent = (
  action: string,
  params: Record<string, unknown> = {},
) => {
  gtagSafe("event", action, params);
};

export const trackOutbound = (url: string, label?: string) => {
  gaEvent("click", {
    event_category: "outbound",
    event_label: label ?? url,
    transport_type: "beacon",
  });
};

export const setConsent = (granted: boolean) => {
  gtagSafe("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
  });
};
