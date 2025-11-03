// lib/gtag.ts
import { siteConfig } from "./siteConfig";

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaMeasurementId || "";

/* 👇 add this line to keep _app.tsx happy */
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
