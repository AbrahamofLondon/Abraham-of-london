// components/dashboard/LiveDataDashboard.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import {
  computeDashboardStatus,
  type DashboardStatus,
} from "@/lib/dashboard/dashboard-status";
import type { BoardroomFunnelData } from "@/pages/api/dashboard/boardroom-funnel";
import type { FulfilmentStateData } from "@/pages/api/dashboard/fulfilment-state";
import type { RetainerHealthData } from "@/pages/api/dashboard/retainer-health";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardMetrics {
  totalPressureSignals: number;
  pressureSignalsToday: number;
  pressureSignalsThisWeek: number;
  conversionRateFreeToPaid: number; // 0–100
  activeBoardroomBriefs: number;
  monthlyRecurringRevenue: number; // GBP
  averageDecisionOutcomeScore: number; // 0–5
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
  refreshMs?: number;
  useMockData?: boolean; // design preview only — never in production
  onPDFSelect?: (pdfId: string) => void; // kept for compatibility
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL_ENDPOINTS = 7;

// Production guard: mock data must never be active in production.
const IS_PRODUCTION = typeof process !== "undefined" && process.env.NODE_ENV === "production";
const DEFAULT_USE_MOCK_DATA = IS_PRODUCTION ? false : false;

const COLORS = {
  gold: "#C5A059",
  success: "#10b981",
  partial: "#f59e0b",
  failure: "#ef4444",
  border: "#262626",
  textSecondary: "#A3A3A3",
};

const OUTCOME_COLORS = [COLORS.success, COLORS.partial, COLORS.failure];

// ── Mock data (design preview only — deliberately small and clearly fictional) ─
// Rules: no real-looking revenue figures, no specific-looking signal counts,
// no fake traction. These values are intentionally minimal.

function generateMockMetrics(): DashboardMetrics {
  return {
    totalPressureSignals: 7,
    pressureSignalsToday: 1,
    pressureSignalsThisWeek: 4,
    conversionRateFreeToPaid: 0,
    activeBoardroomBriefs: 0,
    monthlyRecurringRevenue: 0,
    averageDecisionOutcomeScore: 0,
  };
}

function generateMockTrend(): PressureTrendPoint[] {
  return [
    { date: "day -6", count: 0 },
    { date: "day -5", count: 1 },
    { date: "day -4", count: 0 },
    { date: "day -3", count: 2 },
    { date: "day -2", count: 1 },
    { date: "day -1", count: 2 },
    { date: "today", count: 1 },
  ];
}

function generateMockOutcomes(): OutcomeDistribution[] {
  return [
    { name: "Success", value: 0 },
    { name: "Partial", value: 0 },
    { name: "Failure", value: 0 },
  ];
}

function generateMockActivity(): RecentActivity[] {
  return [
    {
      id: "mock-1",
      type: "pressure_signal",
      title: "[DEMO] Pressure signal — preview data only",
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ];
}

function generateMockFunnel(): BoardroomFunnelData {
  return {
    pressureSignalStarts: 7,
    checkoutAttempts: 0,
    completedPayments: 0,
    deliveredDossiers: 0,
    generatedAt: new Date().toISOString(),
  };
}

function generateMockFulfilment(): FulfilmentStateData {
  return {
    paidOrders: 0,
    generatedDossiers: 0,
    approvedDossiers: 0,
    deliveredDossiers: 0,
    overdueDeliveries: 0,
    generatedAt: new Date().toISOString(),
  };
}

function generateMockRetainer(): RetainerHealthData {
  return {
    activeContracts: 0,
    openReviewCycles: 0,
    overdueReviewCycles: 0,
    completedReviewCycles: 0,
    generatedAt: new Date().toISOString(),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  return `${Math.floor(hr / 24)} days ago`;
}

// ── Status badge config ────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DashboardStatus,
  { dot: string; label: string; text: string }
> = {
  LIVE:        { dot: "bg-emerald-500 animate-pulse", label: "LIVE",        text: "text-emerald-400" },
  NO_DATA_YET: { dot: "bg-amber-400",                 label: "NO DATA YET", text: "text-amber-400" },
  DEGRADED:    { dot: "bg-amber-500",                 label: "DEGRADED",    text: "text-amber-500" },
  DEMO:        { dot: "bg-purple-400",                label: "DEMO",        text: "text-purple-400" },
  ERROR:       { dot: "bg-red-500",                   label: "ERROR",       text: "text-red-400" },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DashboardStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-mono tracking-widest ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10 border border-dashed border-[#262626] rounded-lg">
      <p className="text-xs font-mono text-[#A3A3A3] text-center max-w-[48ch] px-6 leading-relaxed">
        {message}
      </p>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: string;
  /** API-derived label string, or null to show nothing. Never hardcoded. */
  trendLabel?: string | null;
  theme: "light" | "dark";
}

function MetricCard({ title, value, subtext, icon, trendLabel, theme }: MetricCardProps) {
  const cardBg = theme === "dark" ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200";
  const textClass = theme === "dark" ? "text-white" : "text-gray-900";
  const subClass = theme === "dark" ? "text-[#A3A3A3]" : "text-gray-600";

  return (
    <div className={`rounded-2xl border ${cardBg} p-6 shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        {trendLabel != null && (
          <span className="text-xs font-mono text-[#A3A3A3]">{trendLabel}</span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-2xl font-bold tracking-tight ${textClass}`}>{value}</p>
        <p className={`text-sm font-serif mt-1 ${textClass}`}>{title}</p>
        <p className={`text-xs font-mono mt-2 ${subClass}`}>{subtext}</p>
      </div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (count / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs font-mono text-[#A3A3A3]">{label}</span>
        <span className="text-xs font-mono text-[#E5E5E5]">{count.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function StatPill({
  label,
  count,
  alert = false,
}: {
  label: string;
  count: number;
  alert?: boolean;
}) {
  const isAlerted = alert && count > 0;
  return (
    <div
      className={`rounded-lg border p-4 text-center ${
        isAlerted
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-[#262626] bg-[#141414]"
      }`}
    >
      <p className={`text-2xl font-bold tracking-tight ${isAlerted ? "text-amber-400" : "text-[#E5E5E5]"}`}>
        {count}
      </p>
      <p className="text-xs font-mono text-[#A3A3A3] mt-1 leading-tight">{label}</p>
    </div>
  );
}

function Section({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-5">
        <p className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#C5A059]/70">{label}</p>
        <h2 className="text-lg font-serif font-semibold text-[#E5E5E5] mt-0.5">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  theme = "dark",
  refreshMs = 30_000,
  useMockData = DEFAULT_USE_MOCK_DATA,
  onPDFSelect: _onPDFSelect,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<PressureTrendPoint[]>([]);
  const [outcomeData, setOutcomeData] = useState<OutcomeDistribution[]>([]);
  const [activityFeed, setActivityFeed] = useState<RecentActivity[]>([]);
  const [funnelData, setFunnelData] = useState<BoardroomFunnelData | null>(null);
  const [fulfilmentData, setFulfilmentData] = useState<FulfilmentStateData | null>(null);
  const [retainerData, setRetainerData] = useState<RetainerHealthData | null>(null);
  const [failedEndpoints, setFailedEndpoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (useMockData) {
      await new Promise((r) => setTimeout(r, 400));
      setMetrics(generateMockMetrics());
      setTrendData(generateMockTrend());
      setOutcomeData(generateMockOutcomes());
      setActivityFeed(generateMockActivity());
      setFunnelData(generateMockFunnel());
      setFulfilmentData(generateMockFulfilment());
      setRetainerData(generateMockRetainer());
      setFailedEndpoints(0);
      setLastUpdated(new Date());
      setIsLoading(false);
      return;
    }

    let failed = 0;

    async function safeFetch<T>(url: string): Promise<T | null> {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          failed++;
          return null;
        }
        return (await res.json()) as T;
      } catch {
        failed++;
        return null;
      }
    }

    const [
      newMetrics,
      newTrend,
      newOutcomes,
      newActivity,
      newFunnel,
      newFulfilment,
      newRetainer,
    ] = await Promise.all([
      safeFetch<DashboardMetrics>("/api/dashboard/metrics"),
      safeFetch<PressureTrendPoint[]>("/api/dashboard/pressure-trend?days=7"),
      safeFetch<OutcomeDistribution[]>("/api/dashboard/outcome-distribution"),
      safeFetch<RecentActivity[]>("/api/dashboard/recent-activity?limit=10"),
      safeFetch<BoardroomFunnelData>("/api/dashboard/boardroom-funnel"),
      safeFetch<FulfilmentStateData>("/api/dashboard/fulfilment-state"),
      safeFetch<RetainerHealthData>("/api/dashboard/retainer-health"),
    ]);

    setMetrics(newMetrics);
    setTrendData(newTrend ?? []);
    setOutcomeData(newOutcomes ?? []);
    setActivityFeed(newActivity ?? []);
    setFunnelData(newFunnel);
    setFulfilmentData(newFulfilment);
    setRetainerData(newRetainer);
    setFailedEndpoints(failed);
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [useMockData]);

  useEffect(() => {
    void fetchDashboardData();
    const interval = setInterval(() => { void fetchDashboardData(); }, Math.max(5_000, refreshMs));
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshMs]);

  const containerClass =
    theme === "dark" ? "bg-[#0D0D0D] text-[#E5E5E5]" : "bg-gray-50 text-gray-900";
  const cardClass =
    theme === "dark" ? "bg-[#141414] border-[#262626]" : "bg-white border-gray-200";
  const textSecondaryClass =
    theme === "dark" ? "text-[#A3A3A3]" : "text-gray-600";

  const dashboardStatus = computeDashboardStatus({
    useMockData,
    failedEndpoints,
    totalEndpoints: TOTAL_ENDPOINTS,
    metrics,
  });

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className={`p-8 rounded-2xl border ${cardClass} ${containerClass}`}>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#C5A059]/30 border-t-[#C5A059] rounded-full animate-spin" />
          <p className="mt-6 text-sm font-mono text-[#C5A059]">
            Connecting to decision intelligence feed…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (dashboardStatus === "ERROR") {
    return (
      <div className={`p-8 rounded-2xl border ${cardClass} ${containerClass}`}>
        <div className="text-center py-12">
          <StatusBadge status="ERROR" />
          <p className="mt-4 text-sm font-mono text-[#A3A3A3] max-w-[50ch] mx-auto">
            Core dashboard endpoint unavailable. Check Netlify environment and Prisma connection.
          </p>
          <button
            onClick={() => { void fetchDashboardData(); }}
            className="mt-6 px-6 py-2 bg-[#C5A059]/20 border border-[#C5A059] text-[#C5A059] rounded-md text-sm font-medium hover:bg-[#C5A059]/30 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const allOutcomesZero = outcomeData.every((d) => d.value === 0);
  const funnelMax = funnelData?.pressureSignalStarts ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`space-y-10 ${containerClass}`}>

      {/* DEMO banner */}
      {dashboardStatus === "DEMO" && (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
          <p className="text-xs font-mono text-purple-300">
            DEMO MODE — all figures are fictional design-preview data. This is not production.
          </p>
        </div>
      )}

      {/* DEGRADED banner */}
      {dashboardStatus === "DEGRADED" && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-5 py-3 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <p className="text-xs font-mono text-amber-300">
            DEGRADED — {failedEndpoints} of {TOTAL_ENDPOINTS} endpoints unavailable. Partial data shown.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">
            Decision Intelligence Console
          </h1>
          <p className={`text-sm mt-1 font-mono ${textSecondaryClass}`}>
            Operational command centre — Abraham of London
          </p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <StatusBadge status={dashboardStatus} />
          {lastUpdated && (
            <span className={`text-xs font-mono ${textSecondaryClass}`}>
              Updated {formatRelativeTime(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={() => { void fetchDashboardData(); }}
            className="px-3 py-1 text-xs font-mono border border-[#C5A059]/40 rounded-md hover:bg-[#C5A059]/10 transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── 1. Estate Pulse ─────────────────────────────────────────────── */}
      {metrics && (
        <Section label="Estate Pulse" title="Core metrics">
          {dashboardStatus === "NO_DATA_YET" ? (
            <EmptyState message="No activity yet. Metrics will appear once pressure signals, orders, and entitlements are recorded." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Pressure Signals"
                value={metrics.totalPressureSignals.toLocaleString()}
                subtext={`${metrics.pressureSignalsToday} today · ${metrics.pressureSignalsThisWeek} this week`}
                icon="📡"
                trendLabel={null}
                theme={theme}
              />
              <MetricCard
                title="Conversion (Free → Paid)"
                value={
                  metrics.totalPressureSignals > 0
                    ? `${metrics.conversionRateFreeToPaid}%`
                    : "—"
                }
                subtext={
                  metrics.totalPressureSignals > 0
                    ? "pressure signals → Boardroom Brief"
                    : "No baseline yet"
                }
                icon="⚡"
                trendLabel={null}
                theme={theme}
              />
              <MetricCard
                title="Active Briefs"
                value={metrics.activeBoardroomBriefs.toString()}
                subtext="paid, in review or delivered"
                icon="📄"
                trendLabel={null}
                theme={theme}
              />
              <MetricCard
                title="Revenue (30-day)"
                value={formatCurrency(metrics.monthlyRecurringRevenue)}
                subtext={
                  metrics.monthlyRecurringRevenue > 0
                    ? "subscriptions + recent one-time"
                    : "No revenue recorded yet"
                }
                icon="💷"
                trendLabel={null}
                theme={theme}
              />
            </div>
          )}
        </Section>
      )}

      {/* ── 2. Revenue Path: Boardroom Brief funnel ─────────────────────── */}
      <Section label="Revenue Path" title="Boardroom Brief conversion funnel">
        {!funnelData ? (
          <EmptyState message="Funnel data unavailable." />
        ) : funnelData.pressureSignalStarts === 0 && funnelData.completedPayments === 0 ? (
          <EmptyState message="No funnel activity yet. Pressure signals and Boardroom Brief payments will appear here once recorded." />
        ) : (
          <div className={`rounded-2xl border ${cardClass} p-6 space-y-5`}>
            <FunnelBar
              label="Pressure signal starts"
              count={funnelData.pressureSignalStarts}
              max={funnelMax}
              color={COLORS.gold}
            />
            <FunnelBar
              label="Checkout attempts"
              count={funnelData.checkoutAttempts}
              max={funnelMax}
              color="#a78bfa"
            />
            <FunnelBar
              label="Completed payments"
              count={funnelData.completedPayments}
              max={funnelMax}
              color={COLORS.success}
            />
            <FunnelBar
              label="Delivered dossiers"
              count={funnelData.deliveredDossiers}
              max={funnelMax}
              color="#38bdf8"
            />
            <p className={`text-[10px] font-mono ${textSecondaryClass}`}>
              From database at {new Date(funnelData.generatedAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </Section>

      {/* ── 3. Decision Pressure trend ──────────────────────────────────── */}
      <Section label="Decision Pressure" title="Pressure signal volume (7 days)">
        {trendData.length === 0 || trendData.every((d) => d.count === 0) ? (
          <EmptyState message="No pressure signals recorded yet. The chart will populate as decisions are tested." />
        ) : (
          <div className={`rounded-2xl border ${cardClass} p-6`}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.gold} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: COLORS.textSecondary }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: COLORS.textSecondary }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
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
            <p className={`text-xs font-mono mt-3 ${textSecondaryClass}`}>
              Daily counts from PressureSignalEvent — all real decisions.
            </p>
          </div>
        )}
      </Section>

      {/* ── 4. Boardroom Fulfilment pipeline ────────────────────────────── */}
      <Section label="Boardroom Fulfilment" title="Delivery pipeline state">
        {!fulfilmentData ? (
          <EmptyState message="Fulfilment data unavailable." />
        ) : fulfilmentData.paidOrders === 0 ? (
          <EmptyState message="No paid Boardroom Brief orders yet. Pipeline will appear once the first payment is processed." />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatPill label="Paid orders" count={fulfilmentData.paidOrders} />
              <StatPill label="Dossier generated" count={fulfilmentData.generatedDossiers} />
              <StatPill label="Approved" count={fulfilmentData.approvedDossiers} />
              <StatPill label="Delivered" count={fulfilmentData.deliveredDossiers} />
              <StatPill label="Overdue (>48 h)" count={fulfilmentData.overdueDeliveries} alert />
            </div>
            <p className={`text-[10px] font-mono mt-3 ${textSecondaryClass}`}>
              From database at {new Date(fulfilmentData.generatedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </Section>

      {/* ── 5. Outcome Memory ───────────────────────────────────────────── */}
      <Section label="Outcome Memory" title="Decision outcomes (Return Briefs)">
        {allOutcomesZero ? (
          <EmptyState message="No verified outcomes yet. Outcome data appears once Return Briefs are submitted and classified." />
        ) : (
          <div className={`rounded-2xl border ${cardClass} p-6`}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {outcomeData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#141414",
                      borderColor: COLORS.gold,
                      borderRadius: "8px",
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {metrics && metrics.averageDecisionOutcomeScore > 0 && (
              <p className={`text-xs font-mono mt-3 ${textSecondaryClass}`}>
                Average outcome score: {metrics.averageDecisionOutcomeScore}/5
                — from verified OutcomeVerificationRecord entries.
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ── 6. Retainer Oversight ───────────────────────────────────────── */}
      <Section label="Retainer Oversight" title="Contract health">
        {!retainerData ? (
          <EmptyState message="Retainer health data unavailable." />
        ) : retainerData.activeContracts === 0 ? (
          <EmptyState message="No active retainer contracts. Contract health will appear once retainer agreements are established." />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatPill label="Active contracts" count={retainerData.activeContracts} />
              <StatPill label="Open cycles" count={retainerData.openReviewCycles} />
              <StatPill label="Overdue cycles" count={retainerData.overdueReviewCycles} alert />
              <StatPill label="Completed cycles" count={retainerData.completedReviewCycles} />
            </div>
            <p className={`text-[10px] font-mono mt-3 ${textSecondaryClass}`}>
              From database at {new Date(retainerData.generatedAt).toLocaleTimeString()}
            </p>
          </>
        )}
      </Section>

      {/* ── 7. Recent Verified Activity ─────────────────────────────────── */}
      <Section label="Recent Verified Activity" title="Latest decision infrastructure events">
        <div className={`rounded-2xl border ${cardClass} overflow-hidden`}>
          {activityFeed.length === 0 ? (
            <div className="p-8">
              <EmptyState message="No recent activity. Events will appear as pressure signals, orders, and return briefs are recorded." />
            </div>
          ) : (
            <>
              <div className="divide-y divide-[#262626] max-h-[360px] overflow-y-auto">
                {activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-4 hover:bg-[#C5A059]/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 shrink-0">
                            {item.type === "pressure_signal" && "SIGNAL"}
                            {item.type === "boardroom_brief_order" && "BRIEF ORDER"}
                            {item.type === "return_brief_submitted" && "RETURN BRIEF"}
                          </span>
                          <span className="text-sm font-medium text-[#E5E5E5] truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.userRole && (
                          <p className={`text-xs mt-1 font-mono ${textSecondaryClass}`}>
                            {item.userRole}
                          </p>
                        )}
                      </div>
                      <p className="text-xs font-mono text-[#C5A059] shrink-0">
                        {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-[#262626]">
                <p className={`text-[10px] font-mono ${textSecondaryClass} tracking-wider`}>
                  All events anonymised and aggregated. Data from database — not synthetic.
                </p>
              </div>
            </>
          )}
        </div>
      </Section>

    </div>
  );
};

export default LiveDataDashboard;
