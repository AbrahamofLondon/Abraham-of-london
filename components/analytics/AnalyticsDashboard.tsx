// components/analytics/AnalyticsDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import type { DashboardStats } from "@/types/pdf-dashboard";

import { getAllDashboardPDFs, getDashboardStats } from "@/utils/pdf-stats-converter";
import { LoadingState } from "@/components/ui/LoadingState";
import { safeFirstChar, safeSlice, safeCapitalize } from "@/lib/utils/safe";

type MetricType = "generations" | "views" | "downloads" | "errors" | "size" | "categories";

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
 * Local analytics view-model.
 * We intentionally normalize here so we never depend on whatever shape
 * getAllDashboardPDFs() returns (lib/pdf/types vs types/pdf-dashboard etc).
 */
type PDFAnalyticsItem = {
  id: string;
  title: string;

  exists: boolean;
  error?: string;

  category: string;
  tier?: string;

  fileSize?: string;
  lastModified?: string;
  updatedAt?: string;
};

function normalizePDF(input: any): PDFAnalyticsItem {
  const id = String(input?.id ?? "");
  const title = String(input?.title ?? "Untitled PDF");

  const exists = Boolean(input?.exists);
  const error = typeof input?.error === "string" ? input.error : undefined;

  const category =
    typeof input?.category === "string" && input.category.trim()
      ? input.category.trim()
      : "uncategorized";

  const tier = typeof input?.tier === "string" ? input.tier : undefined;

  const fileSize = typeof input?.fileSize === "string" ? input.fileSize : undefined;

  // prefer lastModified then updatedAt; tolerate Date
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

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const raw = getAllDashboardPDFs?.() ?? [];
        const normalized: PDFAnalyticsItem[] = Array.isArray(raw) ? raw.map(normalizePDF) : [];
        setPdfs(normalized);

        const pdfStats = (getDashboardStats?.() as DashboardStats | null) ?? null;
        setStats(
          pdfStats ?? {
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
      } catch (error) {
        console.error("Failed to load analytics data:", error);
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
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [metrics]);

  useEffect(() => {
    if (metrics.length > 0 && metrics[0]) setSelectedMetric(metrics[0]);
  }, [metrics]);

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

    const totalSize = pdfs.reduce((sum, pdf) => {
      if (!pdf.fileSize) return sum;
      const sizeStr = pdf.fileSize.toLowerCase().trim();
      const n = Number.parseFloat(sizeStr);
      if (!Number.isFinite(n)) return sum;

      let bytes = 0;
      if (sizeStr.includes("kb")) bytes = n * 1024;
      else if (sizeStr.includes("mb")) bytes = n * 1024 * 1024;
      else if (sizeStr.includes("gb")) bytes = n * 1024 * 1024 * 1024;
      else bytes = n;

      return sum + bytes;
    }, 0);

    const tierDistribution = pdfs.reduce<Record<string, number>>((acc, pdf) => {
      if (pdf.tier) acc[pdf.tier] = (acc[pdf.tier] || 0) + 1;
      return acc;
    }, {});

    const categoryEntries = Object.entries(categoryDistribution);
    const mostPopularCategory =
      categoryEntries.length > 0 ? categoryEntries.sort(([, a], [, b]) => b - a)[0]?.[0] || "None" : "None";

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
      pdfs: pdfs.map((pdf) => ({
        id: pdf.id,
        title: pdf.title,
        category: pdf.category,
        tier: pdf.tier,
        fileSize: pdf.fileSize,
        exists: pdf.exists,
        lastModified: pdf.lastModified,
        updatedAt: pdf.updatedAt,
        error: pdf.error,
      })),
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

  if (!pdfs.length) {
    return (
      <div
        className={`p-8 text-center ${
          theme === "dark" ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-700"
        } rounded-xl`}
      >
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
        <p>No PDFs found to generate analytics. Please check your PDF registry.</p>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme === "dark" ? "bg-gradient-to-br from-gray-900 to-gray-950 text-white" : "bg-gradient-to-br from-white to-gray-50 text-gray-900"} ${className} rounded-2xl shadow-2xl`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
            PDF Analytics Dashboard
          </h2>
          <p className={`mt-2 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
            Insights, usage patterns, generation performance and operational trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {metrics.length > 0 && (
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className={`px-4 py-2.5 rounded-xl border ${
                theme === "dark" 
                  ? "bg-gray-800/50 border-gray-700/50 text-white backdrop-blur-sm" 
                  : "bg-white/80 border-gray-300 text-gray-900 backdrop-blur-sm"
              } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
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
              className={`px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white transition-all duration-300 shadow-lg hover:shadow-blue-500/30`}
            >
              Export Data
            </button>
          )}

          <div className="text-sm px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-200 font-medium">
            {pdfs.length} PDFs
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
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

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Category Distribution */}
        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm ${
            theme === "dark" 
              ? "border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40" 
              : "border-gray-200/80 bg-gradient-to-br from-white/80 to-gray-50/80"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300 dark:text-gray-300">
            <span>📊</span> Category Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData?.categoryDistribution &&
              Object.entries(analyticsData.categoryDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium text-gray-300 dark:text-gray-300">{category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-700/30 dark:bg-gray-800/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 rounded-full" 
                          style={{ width: `${(count / pdfs.length) * 100}%` }} 
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right text-gray-300 dark:text-gray-300">{count}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Tier Distribution */}
        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm ${
            theme === "dark" 
              ? "border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40" 
              : "border-gray-200/80 bg-gradient-to-br from-white/80 to-gray-50/80"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300 dark:text-gray-300">
            <span>🎯</span> Tier Distribution
          </h3>
          <div className="space-y-3">
            {analyticsData?.tierDistribution &&
              Object.entries(analyticsData.tierDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([tier, count]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                        tier === "free"
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300"
                          : tier === "member"
                          ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
                          : tier === "architect"
                          ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-700 dark:text-purple-300"
                          : "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-700 dark:text-yellow-300"
                      }`}
                    >
                      {tier}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-700/30 dark:bg-gray-800/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-400 dark:to-emerald-400 rounded-full" 
                          style={{ width: `${(count / pdfs.length) * 100}%` }} 
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right text-gray-300 dark:text-gray-300">{count}</span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div
          className={`rounded-2xl border p-6 lg:col-span-2 backdrop-blur-sm ${
            theme === "dark" 
              ? "border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40" 
              : "border-gray-200/80 bg-gradient-to-br from-white/80 to-gray-50/80"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-300 dark:text-gray-300">📈 Recent Activity</h3>
          <div className="space-y-3">
            {safeSlice(
              [...pdfs].sort((a, b) => {
                const dateA = new Date(a.lastModified || a.updatedAt || 0).getTime();
                const dateB = new Date(b.lastModified || b.updatedAt || 0).getTime();
                return dateB - dateA;
              }),
              0,
              5
            ).map((pdf) => (
                <div
                  key={pdf.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-800/20 to-gray-900/10 dark:from-gray-800/10 dark:to-gray-900/5 hover:from-gray-800/30 hover:to-gray-900/20 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        pdf.exists 
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20" 
                          : pdf.error 
                            ? "bg-gradient-to-r from-red-500/20 to-rose-500/20" 
                            : "bg-gradient-to-r from-yellow-500/20 to-amber-500/20"
                      }`}
                    >
                      {pdf.exists ? "✅" : pdf.error ? "❌" : "⏳"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-300 dark:text-gray-300 group-hover:text-white transition-colors duration-300">{pdf.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pdf.category} • {pdf.tier || "No tier"} • {pdf.fileSize || "Unknown size"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(pdf.lastModified || pdf.updatedAt || Date.now()).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(pdf.lastModified || pdf.updatedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div
          className={`rounded-2xl border p-6 backdrop-blur-sm ${
            theme === "dark" 
              ? "border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40" 
              : "border-gray-200/80 bg-gradient-to-br from-white/80 to-gray-50/80"
          } shadow-lg`}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-300 dark:text-gray-300">📋 Quick Stats</h3>
          <div className="space-y-4">
            <StatItem
              label="Largest PDF"
              value={analyticsData?.largestPDF?.title || "None"}
              subvalue={analyticsData?.largestPDF?.fileSize || "0KB"}
              theme={theme}
            />
            <StatItem
              label="Most Popular Category"
              value={analyticsData?.mostPopularCategory || "None"}
              subvalue={`${analyticsData?.categoryDistribution?.[analyticsData?.mostPopularCategory || ""] || 0} PDFs`}
              theme={theme}
            />
            <StatItem
              label="Generation Rate"
              value={`${Math.round(((analyticsData?.generated || 0) / pdfs.length) * 100)}%`}
              subvalue={`${analyticsData?.generated || 0} of ${pdfs.length}`}
              theme={theme}
            />
            <StatItem
              label="Error Rate"
              value={`${Math.round(((analyticsData?.errors || 0) / pdfs.length) * 100)}%`}
              subvalue={`${analyticsData?.errors || 0} errors`}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------- Helper Components --------------------

const MetricCard: React.FC<{
  title: string;
  value: number | string;
  change: string;
  theme: "light" | "dark";
  icon: string;
}> = ({ title, value, change, theme, icon }) => (
  <div
    className={`rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm ${
      theme === "dark" 
        ? "border-gray-700/50 bg-gradient-to-br from-gray-800/40 to-gray-900/40 hover:border-gray-600/50" 
        : "border-gray-200/80 bg-gradient-to-br from-white/80 to-gray-50/80 hover:border-gray-300"
    } shadow-lg hover:shadow-xl`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className="text-3xl">{icon}</div>
      {change ? (
        <span
          className={`text-sm px-3 py-1.5 rounded-full ${
            change.startsWith("+")
              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-300"
              : change.startsWith("-")
              ? "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-700 dark:text-red-300"
              : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300"
          } font-medium`}
        >
          {change}
        </span>
      ) : null}
    </div>
    <h3 className={`text-2xl font-bold mb-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{value}</h3>
    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>{title}</p>
  </div>
);

const StatItem: React.FC<{
  label: string;
  value: string;
  subvalue: string;
  theme: "light" | "dark";
}> = ({ label, value, subvalue, theme }) => (
  <div className="p-3 rounded-xl bg-gradient-to-r from-gray-800/10 to-gray-900/5 dark:from-gray-800/5 dark:to-gray-900/2 hover:from-gray-800/20 hover:to-gray-900/10 transition-all duration-300">
    <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-1`}>{label}</p>
    <p className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"} mb-1`}>{value}</p>
    <p className="text-xs text-gray-500">{subvalue}</p>
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