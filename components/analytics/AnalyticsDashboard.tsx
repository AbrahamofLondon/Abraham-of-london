"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LoadingState } from "@/components/ui/LoadingState";
import { safeCapitalize } from "@/lib/utils/safe";

import type { DashboardStats, PDFAnalyticsItem, MetricType } from "@/types/pdf-dashboard";

interface AnalyticsDashboardProps {
  theme?: "light" | "dark";
  timeRange?: "24h" | "7d" | "30d" | "90d" | "all";
  metrics?: MetricType[];
  showComparisons?: boolean;
  exportEnabled?: boolean;
  onExport?: (data: any) => void;
  className?: string;
}

/**
 * Normalizes data coming from the API endpoint.
 */
function normalizePDF(input: any): PDFAnalyticsItem {
  const id = String(input?.id ?? "");
  const title = String(input?.title ?? "Untitled PDF");
  const exists = Boolean(input?.exists);
  const error = typeof input?.error === "string" ? input.error : undefined;

  const category =
    typeof input?.category === "string" && input.category.trim() ? input.category.trim() : "uncategorized";

  const tier = typeof input?.tier === "string" ? input.tier : undefined;
  const fileSize = typeof input?.fileSize === "string" ? input.fileSize : undefined;

  const lastModified =
    typeof input?.lastModified === "string"
      ? input.lastModified
      : input?.lastModified instanceof Date
      ? input.lastModified.toISOString()
      : undefined;

  const updatedAt =
    typeof input?.updatedAt === "string"
      ? input.updatedAt
      : input?.updatedAt instanceof Date
      ? input.updatedAt.toISOString()
      : undefined;

  return { id, title, exists, error, category, tier, fileSize, lastModified, updatedAt };
}

async function fetchInstitutionalAnalytics(timeRange: string, signal?: AbortSignal) {
  // If you later support server-side filtering, you already have the query param wired.
  const url = `/api/admin/institutional-analytics?timeRange=${encodeURIComponent(timeRange)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ""}`);
  }

  return res.json();
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  theme = "light",
  timeRange = "7d",
  metrics = ["generations", "views", "downloads", "errors"],
  showComparisons = true,
  exportEnabled = true,
  onExport,
  className = "",
}) => {
  const [pdfs, setPdfs] = useState<PDFAnalyticsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("generations");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setIsLoading(true);
      setErrorMsg(null);

      try {
        const result = await fetchInstitutionalAnalytics(timeRange, controller.signal);

        if (!result?.success || !result?.data) {
          throw new Error(result?.error || "Failed to fetch analytics");
        }

        const normalized: PDFAnalyticsItem[] = Array.isArray(result.data.rawPdfs)
          ? result.data.rawPdfs.map(normalizePDF)
          : [];

        setPdfs(normalized);

        setStats(
          (result.data.stats as DashboardStats | null) ?? {
            totalPDFs: normalized.length,
            availablePDFs: normalized.filter((p) => p.exists).length,
            missingPDFs: normalized.filter((p) => !p.exists && !p.error).length,
            categories: Array.from(new Set(normalized.map((p) => p.category))),
            generated: normalized.filter((p) => p.exists).length,
            errors: normalized.filter((p) => Boolean(p.error)).length,
            generating: normalized.filter((p) => !p.exists && !p.error).length,
            lastUpdated: new Date().toISOString(),
          }
        );

        if (metrics.length > 0 && metrics[0]) setSelectedMetric(metrics[0]);
      } catch (e: any) {
        if (controller.signal.aborted) return;

        console.error("Failed to load analytics data:", e);
        setPdfs([]);
        setStats({
          totalPDFs: 0,
          availablePDFs: 0,
          missingPDFs: 0,
          categories: [],
          generated: 0,
          errors: 0,
          generating: 0,
          lastUpdated: new Date().toISOString(),
        });

        setErrorMsg(typeof e?.message === "string" ? e.message : "Failed to load analytics");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadData();

    return () => controller.abort();
  }, [metrics, timeRange]);

  const analyticsData = useMemo(() => {
    if (!pdfs.length) return null;

    const generatedPDFs = pdfs.filter((p) => p.exists);
    const missingPDFs = pdfs.filter((p) => !p.exists && !p.error);
    const errorPDFs = pdfs.filter((p) => Boolean(p.error));

    const categoryDistribution = pdfs.reduce<Record<string, number>>((acc, pdf) => {
      const key = pdf.category || "uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const parseBytes = (fileSize?: string) => {
      if (!fileSize) return 0;
      const s = fileSize.toLowerCase().trim();
      const n = Number.parseFloat(s);
      if (!Number.isFinite(n)) return 0;
      if (s.includes("kb")) return n * 1024;
      if (s.includes("mb")) return n * 1024 * 1024;
      if (s.includes("gb")) return n * 1024 * 1024 * 1024;
      return n;
    };

    const totalSize = pdfs.reduce((sum, pdf) => sum + parseBytes(pdf.fileSize), 0);

    const tierDistribution = pdfs.reduce<Record<string, number>>((acc, pdf) => {
      if (pdf.tier) acc[pdf.tier] = (acc[pdf.tier] || 0) + 1;
      return acc;
    }, {});

    const categoryEntries = Object.entries(categoryDistribution);
    const mostPopularCategory =
      categoryEntries.length > 0 ? categoryEntries.sort(([, a], [, b]) => b - a)[0]?.[0] || "None" : "None";

    const largestPDF =
      pdfs.length > 0
        ? pdfs.reduce((largest, pdf) => (parseBytes(pdf.fileSize) > parseBytes(largest.fileSize) ? pdf : largest), pdfs[0]!)
        : undefined;

    return {
      total: pdfs.length,
      generated: generatedPDFs.length,
      missing: missingPDFs.length,
      errors: errorPDFs.length,
      categories: Object.keys(categoryDistribution).length,
      avgSize: pdfs.length ? totalSize / pdfs.length : 0,
      categoryDistribution,
      tierDistribution,
      mostPopularCategory,
      largestPDF,
    };
  }, [pdfs]);

  const recentPdfs = useMemo(() => {
    return [...pdfs]
      .sort(
        (a, b) =>
          new Date(b.lastModified || b.updatedAt || 0).getTime() -
          new Date(a.lastModified || a.updatedAt || 0).getTime()
      )
      .slice(0, 5);
  }, [pdfs]);

  const handleExport = () => {
    if (!analyticsData || !onExport) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      metrics,
      summary: {
        totalPDFs: pdfs.length,
        generatedPDFs: analyticsData.generated,
        missingPDFs: analyticsData.missing,
        errorPDFs: analyticsData.errors,
        categories: analyticsData.categories,
      },
      categoryDistribution: analyticsData.categoryDistribution,
      tierDistribution: analyticsData.tierDistribution,
      stats,
      pdfs: pdfs.map((pdf) => ({ ...pdf })),
    };

    onExport(exportData);
  };

  if (isLoading) {
    return (
      <LoadingState
        message="Loading analytics..."
        theme={theme}
        subMessage="Gathering PDF insights"
        showProgress={false}
      />
    );
  }

  if (errorMsg) {
    return (
      <div
        className={`p-8 text-center rounded-xl ${
          theme === "dark" ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-700"
        }`}
      >
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold mb-2">Analytics Unavailable</h3>
        <p className="text-sm opacity-70 mb-4">{errorMsg}</p>
        <p className="text-xs opacity-50">
          If this is an admin page, ensure the API route exists at <code>/pages/api/admin/institutional-analytics.ts</code>.
        </p>
      </div>
    );
  }

  if (!pdfs.length) {
    return (
      <div
        className={`p-8 text-center rounded-xl ${
          theme === "dark" ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-700"
        }`}
      >
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
        <p className="text-sm opacity-70">No PDFs found to generate analytics. Please check your PDF registry.</p>
      </div>
    );
  }

  return (
    <div
      className={`p-6 rounded-2xl shadow-2xl ${
        theme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-950 text-white"
          : "bg-gradient-to-br from-white to-gray-50 text-gray-900"
      } ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            PDF Analytics Dashboard
          </h2>
          <p className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Insights, usage patterns, and operational trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {metrics.length > 0 && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className={`px-4 py-2.5 rounded-xl border backdrop-blur-sm focus:ring-2 focus:ring-blue-500 outline-none ${
                theme === "dark"
                  ? "bg-gray-800/50 border-gray-700/50 text-white"
                  : "bg-white/80 border-gray-300 text-gray-900"
              }`}
            >
              {metrics.map((metric) => (
                <option key={metric} value={metric}>
                  {safeCapitalize(metric)}
                </option>
              ))}
            </select>
          )}

          {exportEnabled && (
            <button
              onClick={handleExport}
              className="px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all shadow-lg"
            >
              Export Data
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total PDFs" value={pdfs.length} change="" theme={theme} icon="📄" />
        <MetricCard
          title="Generated"
          value={analyticsData?.generated || 0}
          change={`${Math.round(((analyticsData?.generated || 0) / pdfs.length) * 100)}%`}
          theme={theme}
          icon="✅"
        />
        <MetricCard
          title="Categories"
          value={analyticsData?.categories || 0}
          change={analyticsData?.mostPopularCategory || "None"}
          theme={theme}
          icon="🏷️"
        />
        <MetricCard title="Avg. Size" value={formatBytes(analyticsData?.avgSize || 0)} change="" theme={theme} icon="💾" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm shadow-lg ${
            theme === "dark" ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200/80 bg-white/80"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Category Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData?.categoryDistribution &&
              Object.entries(analyticsData.categoryDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium opacity-80">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-700/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                          style={{ width: `${(count / pdfs.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm shadow-lg ${
            theme === "dark" ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200/80 bg-white/80"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span> Tier Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData?.tierDistribution &&
              Object.entries(analyticsData.tierDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tier === "architect" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {tier}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-700/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: `${(count / pdfs.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className={`rounded-2xl border p-6 lg:col-span-2 backdrop-blur-sm shadow-lg ${
            theme === "dark" ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200/80 bg-white/80"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">📈 Recent Activity</h3>
          <div className="space-y-3">
            {recentPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-800/10 hover:bg-gray-800/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${pdf.exists ? "bg-green-500/20" : pdf.error ? "bg-red-500/20" : "bg-yellow-500/20"}`}>
                    {pdf.exists ? "✅" : pdf.error ? "❌" : "⏳"}
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-blue-400 transition-colors">{pdf.title}</p>
                    <p className="text-xs opacity-50">
                      {pdf.category} • {pdf.fileSize || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs opacity-50">
                  <div>{new Date(pdf.lastModified || pdf.updatedAt || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm shadow-lg ${
            theme === "dark" ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200/80 bg-white/80"
          }`}
        >
          <h3 className="text-lg font-semibold mb-4">📋 Quick Stats</h3>
          <div className="space-y-4">
            <StatItem label="Largest PDF" value={analyticsData?.largestPDF?.title || "None"} subvalue={analyticsData?.largestPDF?.fileSize || "0KB"} theme={theme} />
            <StatItem label="Generation Rate" value={`${Math.round(((analyticsData?.generated || 0) / pdfs.length) * 100)}%`} subvalue={`${analyticsData?.generated || 0} of ${pdfs.length}`} theme={theme} />
            <StatItem label="Error Rate" value={`${Math.round(((analyticsData?.errors || 0) / pdfs.length) * 100)}%`} subvalue={`${analyticsData?.errors || 0} errors`} theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: number | string;
  change: string;
  theme: "light" | "dark";
  icon: string;
}> = ({ title, value, change, theme, icon }) => (
  <div
    className={`rounded-2xl border p-6 transition-all hover:scale-[1.02] backdrop-blur-sm shadow-lg ${
      theme === "dark" ? "border-gray-700/50 bg-gray-800/40" : "border-gray-200/80 bg-white/80"
    }`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="text-3xl">{icon}</div>
      {change && (
        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">{change}</span>
      )}
    </div>
    <h3 className="text-2xl font-bold mb-1">{value}</h3>
    <p className="text-sm opacity-60">{title}</p>
  </div>
);

const StatItem: React.FC<{
  label: string;
  value: string;
  subvalue: string;
  theme: "light" | "dark";
}> = ({ label, value, subvalue }) => (
  <div className="p-3 rounded-xl bg-gray-800/10 hover:bg-gray-800/20 transition-all">
    <p className="text-xs opacity-50 mb-1">{label}</p>
    <p className="text-md font-semibold mb-1 truncate">{value}</p>
    <p className="text-[10px] opacity-40">{subvalue}</p>
  </div>
);

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = bytes / Math.pow(k, i);
  return `${parseFloat(v.toFixed(2))} ${sizes[i]}`;
}

AnalyticsDashboard.displayName = "AnalyticsDashboard";
export default AnalyticsDashboard;