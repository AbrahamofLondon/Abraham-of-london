// components/dashboard/PDFDataDashboard.tsx
import React from "react";
import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import LiveDataDashboard from "./LiveDataDashboard";
import PDFDashboard from "@/components/PDFDashboard";

interface PDFDataDashboardProps {
  view?: "dashboard" | "analytics" | "live";
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;
}

export const PDFDataDashboard: React.FC<PDFDataDashboardProps> = ({
  view = "dashboard",
  theme = "light",
  onPDFSelect,
}) => {
  return (
    <AnalyticsProvider>
      <PDFDashboardProvider>
        {view === "live" ? (
          <LiveDataDashboard
            theme={theme}
            // ✅ exactOptionalPropertyTypes-safe: only pass when defined
            {...(onPDFSelect ? { onPDFSelect } : {})}
          />
        ) : view === "analytics" ? (
          <div className={`p-6 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">PDF Analytics</h2>
                <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  Insights, usage patterns, generation performance and operational trends.
                </p>
              </div>
            </div>

            <div className={`rounded-xl border p-6 ${theme === "dark" ? "border-gray-800 bg-gray-950" : "border-gray-200 bg-gray-50"}`}>
              <p className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                Analytics modules can plug in here (charts, cohorts, failure rates, latency).
              </p>
            </div>
          </div>
        ) : (
          <PDFDashboard />
        )}
      </PDFDashboardProvider>
    </AnalyticsProvider>
  );
};

export default PDFDataDashboard;