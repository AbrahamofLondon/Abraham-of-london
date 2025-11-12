<<<<<<< HEAD
=======
// lib/gtag.ts

/* ---------- Google Analytics Event Types ---------- */
export interface GAEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  nonInteraction?: boolean;
}

/* ---------- Tracking Functions ---------- */

/**
 * Track page views
 */
export const pageview = (url: string, trackingId?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    const gaId = trackingId || process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }
};

/**
 * Track custom events
 */
export const gaEvent = ({ action, category, label, value, nonInteraction = false }: GAEvent) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      non_interaction: nonInteraction,
    });
  }
};

/**
 * Common event categories for consistent tracking
 */
export const EVENT_CATEGORIES = {
  ENGAGEMENT: 'Engagement',
  NAVIGATION: 'Navigation',
  DOWNLOAD: 'Download',
  SHARE: 'Share',
  SUBSCRIPTION: 'Subscription',
  CONTACT: 'Contact',
  ECOMMERCE: 'Ecommerce'
} as const;

/**
 * Pre-defined events for common actions
 */
export const trackDownload = (fileName: string, method: string = 'direct') => {
  gaEvent({
    action: 'download',
    category: EVENT_CATEGORIES.DOWNLOAD,
    label: `${fileName} - ${method}`,
    value: 1
  });
};

export const trackShare = (contentType: string, platform: string) => {
  gaEvent({
    action: 'share',
    category: EVENT_CATEGORIES.SHARE,
    label: `${contentType} - ${platform}`,
    value: 1
  });
};

export const trackContact = (method: string, topic?: string) => {
  gaEvent({
    action: 'contact',
    category: EVENT_CATEGORIES.CONTACT,
    label: topic ? `${method} - ${topic}` : method,
    value: 1
  });
};// lib/gtag.ts
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
>>>>>>> test-netlify-fix
