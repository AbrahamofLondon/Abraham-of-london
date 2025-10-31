// lib/gtag.ts

import { siteConfig } from "./siteConfig";
import { isExternal } from "./siteConfig"; // Reusing helper from siteConfig

// --- Configuration ---

// Prioritize environment variable, then siteConfig, then fallback to empty string
export const GA_MEASUREMENT_ID: string =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || siteConfig.gaMeasurementId || "";

/** The public ID used for script injection (often aliased as GA_ID) */
export const GA_ID = GA_MEASUREMENT_ID;

const IS_PROD = process.env.NODE_ENV === "production";

/** Flag to check if GA tracking is enabled and in a production environment */
export const gaEnabled = Boolean(GA_MEASUREMENT_ID) && IS_PROD;


// --- Window Interface Augmentation ---

// Define the required properties for the global window object when using gtag
declare global {
  interface Window {
    // The gtag function used to send data
    gtag?: (...args: unknown[]) => void; 
    // The array where gtag pushes commands before the script loads
    dataLayer?: unknown[]; 
  }
}

// --- Core Wrapper ---

/**
 * Safely calls the global gtag function only in the browser and when GA is enabled.
 * Ensures the dataLayer is present before calling gtag.
 */
function gtagSafe(...args: unknown[]) {
  if (!gaEnabled || typeof window === "undefined") return;

  // Ensure dataLayer is initialized if gtag is not yet fully loaded
  if (!window.dataLayer) {
    window.dataLayer = [];
  }
  
  if (typeof window.gtag === "function") {
    window.gtag(...args);
  } else {
    // Fallback: push to dataLayer if gtag function isn't ready (standard snippet behavior)
    window.dataLayer.push(args);
  }
}

// --- Tracking Functions ---

/**
 * Tracks a page view for a given URL path.
 * @param url The canonical URL path (e.g., '/blog/my-post').
 */
export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;
  gtagSafe("config", GA_MEASUREMENT_ID, {
    page_path: url,
    // Recommended: disable sending page_view events automatically if manually tracking
    send_page_view: false, 
  });
};

/**
 * Sends a custom GA event.
 * @param action The name of the event (e.g., 'download_file').
 * @param params The event parameters.
 */
export const gaEvent = (action: string, params: Record<string, unknown> = {}) => {
  gtagSafe("event", action, params);
};


/**
 * Tracks an outbound link click event, typically used on external links.
 * Checks if the URL is actually external before tracking as 'outbound'.
 * @param url The destination URL.
 * @param label Optional event label. Defaults to the URL.
 */
export const trackOutbound = (url: string, label?: string) => {
  if (!isExternal(url)) return; // Use the check from siteConfig

  gaEvent("click", {
    event_category: "outbound",
    event_label: label ?? url,
    // Use 'beacon' transport for reliable tracking during page unload
    transport_type: "beacon", 
  });
};


// --- Consent Management ---

export type ConsentStatus = "granted" | "denied";

/**
 * Updates the user's consent status for GA.
 * @param granted True to grant consent, false to deny.
 */
export const setConsent = (granted: boolean) => {
  const status: ConsentStatus = granted ? "granted" : "denied";
  
  gtagSafe("consent", "update", {
    ad_storage: status,
    analytics_storage: status,
  });
  console.info(`GA Consent updated: analytics_storage=${status}`);
};

/**
 * Sets the *initial* default consent status for all users before any update.
 * Crucial for GDPR/CCPA compliance by setting denial first.
 */
export const setDefaultConsent = (defaultStatus: ConsentStatus = "denied") => {
    gtagSafe("consent", "default", {
      ad_storage: defaultStatus,
      analytics_storage: defaultStatus,
    });
    console.info(`GA Default Consent set to: ${defaultStatus}`);
};