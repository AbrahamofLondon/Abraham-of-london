// hooks/usePDFAnalytics.tsx
import { useCallback } from "react";
import type React from "react";

interface UsePDFAnalyticsOptions {
  enabled?: boolean;
}

type TrackEvent = (event: string, data?: any) => void;

// ✅ Overloaded: supports BOTH usages
// 1) trackError("message", details?)
// 2) trackError(error, errorInfo?)  <-- for ErrorBoundary
type TrackError = {
  (message: string, details?: any): void;
  (error: Error, errorInfo?: React.ErrorInfo): void;
};

export const usePDFAnalytics = ({ enabled = true }: UsePDFAnalyticsOptions = {}) => {
  const trackEvent: TrackEvent = useCallback(
    (event, data) => {
      if (!enabled) return;
      if (typeof window === "undefined") return;

      console.log("Analytics Event:", event, data);
      // TODO: replace with actual analytics implementation
    },
    [enabled]
  );

  const trackError: TrackError = useCallback(
    ((arg1: string | Error, arg2?: any) => {
      if (!enabled) return;
      if (typeof window === "undefined") return;

      // If called by ErrorBoundary: (error, errorInfo)
      if (arg1 instanceof Error) {
        const error = arg1;
        const errorInfo = arg2 as React.ErrorInfo | undefined;

        console.error("Analytics Error:", error.message, {
          name: error.name,
          stack: error.stack,
          componentStack: errorInfo?.componentStack,
        });

        // TODO: replace with actual error tracking (Sentry, GA, etc.)
        return;
      }

      // If called manually: (message, details?)
      const message = arg1;
      const details = arg2;

      console.error("Analytics Error:", message, details);
      // TODO: replace with actual error tracking
    }) as TrackError,
    [enabled]
  );

  return { trackEvent, trackError };
};