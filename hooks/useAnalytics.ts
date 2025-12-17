// hooks/useAnalytics.ts
import { useEffect, useCallback } from "react";

interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  [key: string]: unknown;
}

/**
 * Unified Analytics Engine
 * Synchronizes GA4 with internal System Logs for the Kingdom Vault.
 */
export function useAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initialize dataLayer and gtag shim
    const win = window as any;
    win.dataLayer = win.dataLayer || [];
    if (!win.gtag) {
      win.gtag = function() { win.dataLayer.push(arguments); };
      win.gtag('js', new Date());
      // Configuration is typically handled in _document or _app via Script tag
    }

    // 2. Automated Page View Tracking
    const track = () => {
      const params: PageViewParams = {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      };
      win.gtag("event", "page_view", params);
    };

    track(); // Initial load

    // 3. SPA Navigation Support
    const handlePopState = () => setTimeout(track, 150);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  /**
   * Universal Event Tracker
   * Sends data to both GA4 and a private internal API in production.
   */
  const trackEvent = useCallback((event: string, params: Record<string, unknown> = {}) => {
    if (typeof window === "undefined") return;
    const win = window as any;

    const enhancedParams = {
      ...params,
      timestamp: new Date().toISOString(),
      platform: "web",
    };

    // GA4 Tracking
    if (win.gtag) {
      win.gtag("event", event, enhancedParams);
    }

    // Internal System Log (Production Only)
    if (process.env.NODE_ENV === "production") {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event, ...enhancedParams }),
        keepalive: true, // Ensures the request finishes even if the page unloads
      }).catch(() => {}); // Fail silently
    } else {
      console.log(`📊 [Analytics] ${event}`, enhancedParams);
    }
  }, []);

  const trackError = useCallback((error: Error, context: Record<string, unknown> = {}) => {
    trackEvent("system_error", {
      message: error.message,
      name: error.name,
      ...context,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackError,
  };
}

export default useAnalytics;