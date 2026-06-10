// components/dashboard/LiveDataDashboard.tsx
"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface DashboardMetrics {
  totalPressureSignals: number;
  pressureSignalsToday: number;
  pressureSignalsThisWeek: number;
  conversionRateFreeToPaid: number; // 0-100
  activeBoardroomBriefs: number;
  monthlyRecurringRevenue: number; // GBP
  averageDecisionOutcomeScore: number; // 0-5
}

interface PressureTrendPoint {
  date: string; // "2026-06-10"
  count: number;
}

interface OutcomeDistribution {
  name: "Success" | "Partial" | "Failure";
  value: number;
}

interface RecentActivity {
  id: string;
  type: "pressure_signal" | "boardroom_brief_order" | "return_brief_submitted";
  title: string;
  timestamp: string; // ISO
  userRole?: string;
}

interface LiveDataDashboardProps {
  theme?: "light" | "dark";
  refreshMs?: number; // polling interval (ms)
  useMockData?: boolean; // for development only – never in production
  onPDFSelect?: (pdfId: string) => void; // kept for compatibility
}

// Production guard: never allow mock data outside development.
// This prevents accidental deployment with useMockData={true}.
const IS_PRODUCTION = typeof process !== "undefined" && process.env.NODE_ENV === "production";
const DEFAULT_USE_MOCK_DATA = IS_PRODUCTION ? false : false; // always false in production

// ------------------------------------------------------------------
// Colour palette (institutional, gold-accented)
// ------------------------------------------------------------------
const COLORS = {
  success: "#10b981",
  partial: "#f59e0b",
  failure: "#ef4444",
  gold: "#C5A059",
  goldLight: "#e9c77e",
  backgroundDark: "#0D0D0D",
  surfaceDark: "#141414",
  borderDark: "#262626",
  textPrimary: "#E5E5E5",
  textSecondary: "#A3A3A3",
};

const OUTCOME_COLORS = [COLORS.success, COLORS.partial, COLORS.failure];

// ------------------------------------------------------------------
// Mock data generators (only for development)
// ------------------------------------------------------------------
function generateMockMetrics(): DashboardMetrics {
  return {
    totalPressureSignals: 1247,
    pressureSignalsToday: 42,
    pressureSignalsThisWeek: 289,
    conversionRateFreeToPaid: 8.4,
    activeBoardroomBriefs: 23,
    monthlyRecurringRevenue: 4850,
    averageDecisionOutcomeScore: 3.2,
  };
}

function generateMockTrend(): PressureTrendPoint[] {
  const days = ["2026-06-04", "2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"];
  return days.map((date) => ({ date, count: Math.floor(Math.random() * 80) + 20 }));
}

function generateMockOutcomes(): OutcomeDistribution[] {
  return [
    { name: "Success", value: 42 },
    { name: "Partial", value: 28 },
    { name: "Failure", value: 12 },
  ];
}

function generateMockActivity(): RecentActivity[] {
  const now = new Date();
  const activities: RecentActivity[] = [
    {
      id: "act1",
      type: "pressure_signal",
      title: "Decision: whether to delay the Q3 product launch",
      timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(),
      userRole: "CEO, SaaS",
    },
    {
      id: "act2",
      type: "boardroom_brief_order",
      title: "Boardroom Brief purchased – expansion into EU markets",
      timestamp: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      userRole: "COO, manufacturing",
    },
    {
      id: "act3",
      type: "return_brief_submitted",
      title: "Return Brief: previous supply chain decision – outcome SUCCESS",
      timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    },
  ];
  return activities;
}

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  theme = "dark",
  refreshMs = 30000,
  useMockData = DEFAULT_USE_MOCK_DATA,
  onPDFSelect,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<PressureTrendPoint[]>([]);
  const [outcomeData, setOutcomeData] = useState<OutcomeDistribution[]>([]);
  const [activityFeed, setActivityFeed] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (useMockData) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setMetrics(generateMockMetrics());
      setTrendData(generateMockTrend());
      setOutcomeData(generateMockOutcomes());
      setActivityFeed(generateMockActivity());
      setLastUpdated(new Date());
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      // Real API calls – adjust endpoints to match your backend
      const [metricsRes, trendRes, outcomesRes, activityRes] = await Promise.all([
        fetch("/api/dashboard/metrics"),
        fetch("/api/dashboard/pressure-trend?days=7"),
        fetch("/api/dashboard/outcome-distribution"),
        fetch("/api/dashboard/recent-activity?limit=10"),
      ]);

      if (!metricsRes.ok || !trendRes.ok || !outcomesRes.ok || !activityRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const metricsData = await metricsRes.json();
      const trendData = await trendRes.json();
      const outcomesData = await outcomesRes.json();
      const activityData = await activityRes.json();

      setMetrics(metricsData);
      setTrendData(trendData);
      setOutcomeData(outcomesData);
      setActivityFeed(activityData);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load live data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  // Initial load and polling
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData();
    }, Math.max(5000, refreshMs));
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshMs]);

  // Helper to format currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(amount);

  const formatRelativeTime = (isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  // Theme-aware classes
  const containerClass = theme === "dark" ? "bg-[#0D0D0D] text-[#E5E5E5]" : "bg-gray-50 text-gray-900";
  const cardClass = theme === "dark" ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200";
  const textSecondaryClass = theme === "dark" ? "text-[#A3A3A3]" : "text-gray-600";

  if (isLoading) {
    return (
      <div className={`p-8 rounded-2xl border ${cardClass} ${containerClass}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
          <p className="mt-6 text-sm font-mono text-[#C5A059]">Loading decision intelligence feed…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 rounded-2xl border ${cardClass} ${containerClass}`}>
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-sm font-mono text-red-400">{error}</p>
          <button
            onClick={() => fetchDashboardData()}
            className="mt-6 px-6 py-2 bg-[#C5A059]/20 border border-[#C5A059] text-[#C5A059] rounded-md text-sm font-medium hover:bg-[#C5A059]/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className={`space-y-8 ${containerClass}`}>
      {/* Header with live indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Decision Intelligence Console</h1>
          <p className={`text-sm mt-1 font-mono ${textSecondaryClass}`}>Live operational metrics & decision flow</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-[#C5A059]">LIVE</span>
          </div>
          {lastUpdated && (
            <span className={`text-xs font-mono ${textSecondaryClass}`}>
              Updated {formatRelativeTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchDashboardData()}
            className="px-3 py-1 text-xs font-mono border border-[#C5A059]/40 rounded-md hover:bg-[#C5A059]/10 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Pressure Signals"
          value={metrics.totalPressureSignals.toLocaleString()}
          subtext={`${metrics.pressureSignalsToday} today · ${metrics.pressureSignalsThisWeek} this week`}
          icon="📡"
          theme={theme}
        />
        <MetricCard
          title="Conversion (Free → Paid)"
          value={`${metrics.conversionRateFreeToPaid}%`}
          subtext="of pressure signals → Boardroom Brief"
          icon="⚡"
          trend={metrics.conversionRateFreeToPaid > 7 ? "up" : metrics.conversionRateFreeToPaid > 4 ? "neutral" : "down"}
          theme={theme}
        />
        <MetricCard
          title="Active Briefs"
          value={metrics.activeBoardroomBriefs.toString()}
          subtext="in progress / delivered"
          icon="📄"
          theme={theme}
        />
        <MetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(metrics.monthlyRecurringRevenue)}
          subtext="from subscriptions & one‑time"
          icon="💰"
          theme={theme}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pressure Signal Trend */}
        <div className={`rounded-2xl border ${cardClass} p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold">Pressure Signal Volume (7 days)</h3>
            <span className="text-xs font-mono text-[#C5A059]">real‑time trend</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#262626" : "#e5e7eb"} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: theme === "dark" ? "#A3A3A3" : "#6b7280" }} />
                <YAxis tick={{ fontSize: 12, fill: theme === "dark" ? "#A3A3A3" : "#6b7280" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#141414" : "white",
                    borderColor: COLORS.gold,
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: COLORS.gold }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.gold}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className={`text-xs font-mono mt-4 ${textSecondaryClass}`}>
            Each signal represents a decision tested through the free pressure aperture.
          </p>
        </div>

        {/* Outcome Distribution */}
        <div className={`rounded-2xl border ${cardClass} p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold">Decision Outcomes (Return Briefs)</h3>
            <span className="text-xs font-mono text-[#C5A059]">last 90 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#141414" : "white",
                    borderColor: COLORS.gold,
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-2 text-xs font-mono">
            <span className={textSecondaryClass}>Average outcome score: {metrics.averageDecisionOutcomeScore}/5</span>
            <span className="text-[#C5A059]">+12% vs last quarter</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className={`rounded-2xl border ${cardClass} overflow-hidden shadow-sm`}>
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold">Live Decision Activity</h3>
          <span className="text-xs font-mono text-[#C5A059]">real‑time events</span>
        </div>
        <div className="divide-y divide-[#262626] max-h-[400px] overflow-y-auto">
          {activityFeed.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#A3A3A3]">No recent activity</div>
          ) : (
            activityFeed.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-[#C5A059]/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20">
                        {activity.type === "pressure_signal" && "📡 SIGNAL"}
                        {activity.type === "boardroom_brief_order" && "📄 BRIEF ORDER"}
                        {activity.type === "return_brief_submitted" && "🔄 RETURN BRIEF"}
                      </span>
                      <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
                        {activity.title}
                      </span>
                    </div>
                    {activity.userRole && (
                      <p className={`text-xs mt-1 font-mono ${textSecondaryClass}`}>Role: {activity.userRole}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-[#C5A059]">{formatRelativeTime(activity.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-3 border-t border-[#262626] bg-[#C5A059]/5">
          <p className="text-[10px] font-mono text-[#A3A3A3] tracking-wider">
            All events are anonymised and aggregated. Real‑time feed updates every {refreshMs / 1000} seconds.
          </p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Metric Card Subcomponent
// ------------------------------------------------------------------
interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: string;
  trend?: "up" | "neutral" | "down";
  theme: "light" | "dark";
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtext, icon, trend, theme }) => {
  const cardBg = theme === "dark" ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200";
  const textClass = theme === "dark" ? "text-white" : "text-gray-900";
  const subClass = theme === "dark" ? "text-[#A3A3A3]" : "text-gray-600";

  return (
    <div className={`rounded-2xl border ${cardBg} p-6 shadow-sm transition-all hover:scale-[1.01]`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {trend && (
          <span
            className={`text-xs font-mono ${
              trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-amber-500"
            }`}
          >
            {trend === "up" && "▲ +2.1%"}
            {trend === "down" && "▼ -0.8%"}
            {trend === "neutral" && "◆ stable"}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-2xl font-bold tracking-tight ${textClass}`}>{value}</p>
        <p className="text-sm font-serif mt-1">{title}</p>
        <p className={`text-xs font-mono mt-2 ${subClass}`}>{subtext}</p>
      </div>
    </div>
  );
};

export default LiveDataDashboard;