/* eslint-disable prefer-rest-params */
// hooks/useAnalytics.ts
import { useEffect, useCallback } from '...';

interface AnalyticsEvent {
  event: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}

interface PageViewParams {
  page_title?: string;
  page_location?: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

export function useAnalytics() {
  // Initialize analytics
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialize dataLayer if it doesn't exist
    if (!window.dataLayer) {
      window.dataLayer = [];
    }

    // Enhanced gtag function
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
    }

    // Track page views automatically
    const trackPageView = () => {
      const pageParams: PageViewParams = {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      };

      window.gtag("event", "page_view", pageParams);
    };

    // Track initial page view
    trackPageView();

    // Track subsequent route changes (for SPAs)
    const handleRouteChange = () => {
      setTimeout(trackPageView, 100);
    };

    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  const trackEvent = useCallback(
    (event: string, params: Record<string, any> = {}) => {
      if (typeof window === "undefined" || !window.gtag) {
        // Fallback logging for development
        if (process.env.NODE_ENV === "development") {
          console.log("📊 Analytics Event:", event, params);
        }
        return;
      }

      const enhancedParams = {
        ...params,
        event_timestamp: new Date().toISOString(),
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      };

      window.gtag("event", event, enhancedParams);

      // Also send to custom analytics endpoint if needed
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
          // Silent fail for analytics
        });
      }
    },
    [],
  );

  const trackPageView = useCallback(
    (pageName: string, additionalParams: Record<string, any> = {}) => {
      if (typeof window === "undefined" || !window.gtag) return;

      const pageParams: PageViewParams = {
        page_title: pageName,
        page_location:
          typeof window !== "undefined" ? window.location.href : "",
        page_path:
          typeof window !== "undefined" ? window.location.pathname : "",
        ...additionalParams,
      };

      window.gtag("event", "page_view", pageParams);
    },
    [],
  );

  const trackError = useCallback(
    (error: Error, context: Record<string, any> = {}) => {
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
    (metricName: string, value: number, context: Record<string, any> = {}) => {
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
