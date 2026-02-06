// components/dashboard/PDFDataDashboard.tsx - FIXED VERSION
import React, { useMemo, useCallback } from "react";
import type { ErrorInfo } from "react";

import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingState } from "@/components/ui/LoadingState";

import LiveDataDashboard from "./LiveDataDashboard";
import PDFDashboard from "@/components/PDFDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

import { getAllPDFItems } from "@/lib/pdf/registry";

interface PDFDataDashboardProps {
  view?: "dashboard" | "analytics" | "live";
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;
  enableAnalytics?: boolean;
  enableSharing?: boolean;
  enableAnnotations?: boolean;
  autoRefresh?: boolean;
  initialCategory?: string;
  maxItems?: number;
}

export const PDFDataDashboard: React.FC<PDFDataDashboardProps> = ({
  view = "dashboard",
  theme = "light",
  onPDFSelect,
  enableAnalytics = true,
  enableSharing = false,
  enableAnnotations = false,
  autoRefresh = true,
  initialCategory = "all",
  maxItems = 50,
}) => {
  // Pre-fetch PDF registry for better perceived performance
  const preloadedPDFs = useMemo(() => {
    return getAllDashboardPDFs();
  }, []);

  // Handle PDF selection with validation
  const handlePDFSelect = useCallback(
    (pdfId: string) => {
      const pdf = getDashboardPDFById(pdfId);
      if (!pdf) {
        console.warn(`PDF with ID ${pdfId} not found in registry`);
        return;
      }

      onPDFSelect?.(pdfId);

      if (enableAnalytics && typeof window !== "undefined") {
        console.log("PDF selected:", { pdfId, title: pdf.title });
      }
    },
    [onPDFSelect, enableAnalytics]
  );

  // Dashboard props based on view
  const dashboardProps = useMemo(() => {
    const baseProps = {
      enableAnalytics,
      enableSharing,
      enableAnnotations,
      defaultCategory: initialCategory,
      onPDFOpen: handlePDFSelect,
    };

    switch (view) {
      case "live":
        return {
          ...baseProps,
          initialViewMode: "detail" as const,
          enableAnalytics: true,
        };
      case "analytics":
        return {
          ...baseProps,
          initialViewMode: "grid" as const,
          enableAnalytics: true,
          enableSharing: true,
        };
      default:
        return {
          ...baseProps,
          initialViewMode: "list" as const,
        };
    }
  }, [view, enableAnalytics, enableSharing, enableAnnotations, initialCategory, handlePDFSelect]);

  // Error fallback
  const errorFallback = useMemo(() => {
    return (
      <div
        className={`min-h-[400px] flex items-center justify-center p-8 ${
          theme === "dark" ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-700"
        }`}
      >
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Dashboard Error</h3>
          <p className="mb-4">
            Unable to load the PDF dashboard. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={`px-4 py-2 rounded-lg font-medium ${
              theme === "dark" ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            Reload Dashboard
          </button>
        </div>
      </div>
    );
  }, [theme]);

  // Correct ErrorBoundary signature
  const handleBoundaryError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      console.error("PDFDataDashboard error:", error, errorInfo);

      if (enableAnalytics && typeof window !== "undefined") {
        console.error("Dashboard error:", {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }
    },
    [enableAnalytics]
  );

  // Loading state
  if (!preloadedPDFs || preloadedPDFs.length === 0) {
    return (
      <LoadingState
        message="Loading PDF dashboard..."
        theme={theme}
        subMessage="Preparing your documents"
        showProgress
      />
    );
  }

  return (
    <ErrorBoundary fallback={errorFallback} onError={handleBoundaryError}>
      <AnalyticsProvider enabled={enableAnalytics}>
        <PDFDashboardProvider>
          {view === "live" ? (
            <LiveDataDashboard theme={theme} onPDFSelect={handlePDFSelect} />
          ) : view === "analytics" ? (
            <AnalyticsDashboard
              theme={theme}
              timeRange="7d"
              metrics={["generations", "views", "downloads", "errors"]}
              showComparisons
              exportEnabled
              onExport={(data) => {
                if (enableAnalytics) {
                  console.log("Analytics exported:", data);
                }
              }}
            />
          ) : (
            <PDFDashboard
              {...dashboardProps}
              onPDFGenerated={(pdfId) => {
                console.log(`PDF generated: ${pdfId}`);

                if (enableAnalytics && typeof window !== "undefined") {
                  console.log("PDF generation event:", { pdfId });
                }
              }}
              onError={(error) => {
                console.error("PDFDashboard error:", error);
              }}
            />
          )}
        </PDFDashboardProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

PDFDataDashboard.displayName = "PDFDataDashboard";
export default PDFDataDashboard;