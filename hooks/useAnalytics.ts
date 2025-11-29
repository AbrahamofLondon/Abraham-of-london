// hooks/useAnalytics.ts
import { useEffect, useCallback } from "react";

interface PageViewParams {
  page_title?: string;
  page_location?: string;
  page_path?: string;
  [key: string]: unknown;
}

export function useAnalytics() {
  // Initialise analytics + auto page-view tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure dataLayer exists with proper type checking
    if (!('dataLayer' in window)) {
      (window as any).dataLayer = [];
    }

    // Define a basic gtag shim if GA hasn't injected one yet
    if (!('gtag' in window)) {
      (window as any).gtag = (...args: unknown[]) => {
        // Push into dataLayer in GA-compatible format
        (window as any).dataLayer.push(args);
      };
    }

    const trackPageView = () => {
      if (typeof document === "undefined" || typeof window === "undefined") {
        return;
      }

      const pageParams: PageViewParams = {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      };

      (window as any).gtag("event", "page_view", pageParams);
    };

    // Initial page view
    trackPageView();

    // SPA-style navigation: basic support via popstate
    const handleRouteChange = () => {
      // Small delay so title / URL stabilise
      setTimeout(trackPageView, 100);
    };

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const trackEvent = useCallback(
    (event: string, params: Record<string, unknown> = {}) => {
      if (typeof window === "undefined" || !(window as any).gtag) {
        if (process.env.NODE_ENV === "development") {
          // Fallback logging in dev so you still see signals
          console.log("📊 Analytics Event (fallback):", event, params);
        }
        return;
      }

      const enhancedParams: Record<string, unknown> = {
        ...params,
        event_timestamp: new Date().toISOString(),
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      };

      (window as any).gtag("event", event, enhancedParams);

      // Optional: also send to a custom analytics endpoint in production
      if (process.env.NODE_ENV === "production") {
        fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event,
            ...enhancedParams,
          }),
        }).catch(() => {
          // Silent fail – analytics must never break UX
        });
      }
    },
    [],
  );

  const trackPageView = useCallback(
    (pageName: string, additionalParams: Record<string, unknown> = {}) => {
      if (typeof window === "undefined" || !(window as any).gtag) return;

      const pageParams: PageViewParams = {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalParams,
      };

      (window as any).gtag("event", "page_view", pageParams);
    },
    [],
  );

  const trackError = useCallback(
    (error: Error, context: Record<string, unknown> = {}) => {
      trackEvent("error_occurred", {
        error_message: error.message,
        error_stack: error.stack,
        error_name: error.name,
        ...context,
      });
    },
    [trackEvent],
  );

  const trackPerformance = useCallback(
    (
      metricName: string,
      value: number,
      context: Record<string, unknown> = {},
    ) => {
      trackEvent("performance_metric", {
        metric_name: metricName,
        metric_value: value,
        ...context,
      });
    },
    [trackEvent],
  );

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackPerformance,
  };
}

export default useAnalytics;