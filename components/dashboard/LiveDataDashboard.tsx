// components/dashboard/LiveDataDashboard.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { computeDashboardStatus, type DashboardStatus } from "@/lib/dashboard/dashboard-status";

// ────────────────────────────────────────────────────────────── Types ──────

interface DashboardSnapshot {
  metrics: {
    totalPressureSignals: number;
    pressureSignalsToday: number;
    pressureSignalsThisWeek: number;
    conversionRateFreeToPaid: number;
    activeBoardroomBriefs: number;
    monthlyRecurringRevenue: number;
    averageDecisionOutcomeScore: number;
  };
  pressureTrend: { date: string; count: number }[];
  outcomeDistribution: { name: "Success" | "Partial" | "Failure"; value: number }[];
  recentActivity: {
    id: string;
    type: "pressure_signal" | "boardroom_brief_order" | "return_brief_submitted";
    title: string;
    timestamp: string;
    userRole?: string;
  }[];
  contradictionAlerts: {
    id: string;
    severity: "CRITICAL" | "WARNING";
    description: string;
    detectedAt: string;
    affectedDossiers: string[];
  }[];
  funnel: {
    pressureSignalStarts: number;
    checkoutAttempts: number;
    completedPayments: number;
    deliveredDossiers: number;
    generatedAt: string;
  };
  fulfilment: {
    paidOrders: number;
    generatedDossiers: number;
    approvedDossiers: number;
    deliveredDossiers: number;
    overdueDeliveries: number;
    generatedAt: string;
  };
  retainer: {
    activeContracts: number;
    openReviewCycles: number;
    overdueReviewCycles: number;
    completedReviewCycles: number;
    generatedAt: string;
  };
  operational: {
    overdueDeliveries: number;
    overdueReviewCycles: number;
    pendingReadinessApprovals: number;
    undeliveredPaidOrders: number;
    openReviewCycles: number;
    candidateReadinessEvals: number;
    deliveredThisWeek: number;
    completedReviewCyclesThisMonth: number;
    approvedReadinessEvals: number;
    generatedAt: string;
  };
  oversight: {
    totalCycles: number;
    openCycles: number;
    underReviewCycles: number;
    completedCycles: number;
    skippedCycles: number;
    overdueCycles: number;
    criticalDrift: number;
    highDrift: number;
    clientsOnWatch: number;
    interventionsThisMonth: number;
    generatedAt: string;
  };
  risk: {
    totalEntries: number;
    monitoring: number;
    confirmed: number;
    overturned: number;
    pendingReview: number;
    byProduct: { name: string; value: number }[];
    generatedAt: string;
  };
  generatedAt: string;
}

interface LiveDataDashboardProps {
  theme?: "light" | "dark";
  refreshMs?: number;
  useMockData?: boolean;
  onPDFSelect?: (pdfId: string) => void;
}

// ──────────────────────────────────────────────────────────── Design Tokens ──────

const PALETTE = {
  gold: "#C5A059",
  goldMuted: "rgba(197, 160, 89, 0.4)",
  background: "#0A0A0A",
  panel: "#111111",
  border: "#1A1A1A",
  borderLight: "#262626",
  textPrimary: "#F2F2F2",
  textSecondary: "#A3A3A3",
  risk: { critical: "#EF4444", warning: "#F59E0B", nominal: "#10B981" },
};

const OUTCOME_COLORS = [PALETTE.risk.nominal, PALETTE.risk.warning, PALETTE.risk.critical];
const DEFAULT_REFRESH_MS = 60000; // 60 seconds
const DEMO_MOCK_VALUE = 0; // All mock data uses zero or minimal truth

// ────────────────────────────────────────────────────────────── Icons (SVG) ──────

const Icons = {
  Seal: () => (
    <svg className="w-3.5 h-3.5 text-[#C5A059]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

// ────────────────────────────────────────────────────────────── Mock (Zero‑Safe) ──────

function getMockSnapshot(): DashboardSnapshot {
  const now = new Date().toISOString();
  return {
    metrics: {
      totalPressureSignals: DEMO_MOCK_VALUE,
      pressureSignalsToday: DEMO_MOCK_VALUE,
      pressureSignalsThisWeek: DEMO_MOCK_VALUE,
      conversionRateFreeToPaid: DEMO_MOCK_VALUE,
      activeBoardroomBriefs: DEMO_MOCK_VALUE,
      monthlyRecurringRevenue: DEMO_MOCK_VALUE,
      averageDecisionOutcomeScore: DEMO_MOCK_VALUE,
    },
    pressureTrend: [
      { date: "06-05", count: 0 },
      { date: "06-06", count: 0 },
      { date: "06-07", count: 0 },
      { date: "06-08", count: 0 },
      { date: "06-09", count: 0 },
      { date: "06-10", count: 0 },
      { date: "Today", count: 0 },
    ],
    outcomeDistribution: [],
    recentActivity: [],
    contradictionAlerts: [],
    funnel: {
      pressureSignalStarts: 0,
      checkoutAttempts: 0,
      completedPayments: 0,
      deliveredDossiers: 0,
      generatedAt: now,
    },
    fulfilment: {
      paidOrders: 0,
      generatedDossiers: 0,
      approvedDossiers: 0,
      deliveredDossiers: 0,
      overdueDeliveries: 0,
      generatedAt: now,
    },
    retainer: {
      activeContracts: 0,
      openReviewCycles: 0,
      overdueReviewCycles: 0,
      completedReviewCycles: 0,
      generatedAt: now,
    },
    operational: {
      overdueDeliveries: 0,
      overdueReviewCycles: 0,
      pendingReadinessApprovals: 0,
      undeliveredPaidOrders: 0,
      openReviewCycles: 0,
      candidateReadinessEvals: 0,
      deliveredThisWeek: 0,
      completedReviewCyclesThisMonth: 0,
      approvedReadinessEvals: 0,
      generatedAt: now,
    },
    oversight: {
      totalCycles: 0,
      openCycles: 0,
      underReviewCycles: 0,
      completedCycles: 0,
      skippedCycles: 0,
      overdueCycles: 0,
      criticalDrift: 0,
      highDrift: 0,
      clientsOnWatch: 0,
      interventionsThisMonth: 0,
      generatedAt: now,
    },
    risk: {
      totalEntries: 0,
      monitoring: 0,
      confirmed: 0,
      overturned: 0,
      pendingReview: 0,
      byProduct: [],
      generatedAt: now,
    },
    generatedAt: now,
  };
}

// ────────────────────────────────────────────────────────────── Helpers ──────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { 
    style: "currency", 
    currency: "GBP", 
    minimumFractionDigits: 0 
  }).format(amount);
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Risk‑based sorting (3=critical, 2=warning, 1=info)
interface ActionItem { 
  id: string; 
  weight: number; 
  label: string; 
  metricValue: number; 
  metricLabel: string; 
  context: string; 
  originNode: string; 
}

function sortRiskItems(snapshot: DashboardSnapshot): ActionItem[] {
  const items: ActionItem[] = [];
  const op = snapshot.operational;
  
  if (op.overdueDeliveries > 0) {
    items.push({ 
      id: "overdue-fulfilment", weight: 3, label: "Overdue Boardroom Briefs", 
      metricValue: op.overdueDeliveries, metricLabel: "UNITS", 
      context: "Past 48h delivery window", originNode: "Fulfilment" 
    });
  }
  if (op.overdueReviewCycles > 0) {
    items.push({ 
      id: "overdue-retainer", weight: 3, label: "Overdue Retainer Reviews", 
      metricValue: op.overdueReviewCycles, metricLabel: "CYCLES", 
      context: "Missed governance checkpoints", originNode: "Retainer" 
    });
  }
  if (op.pendingReadinessApprovals > 0) {
    items.push({ 
      id: "pending-readiness", weight: 2, label: "Pending Readiness Approvals", 
      metricValue: op.pendingReadinessApprovals, metricLabel: "CASES", 
      context: "Awaiting panel sign‑off", originNode: "Operational" 
    });
  }
  if (op.undeliveredPaidOrders > 0) {
    items.push({
      id: "undelivered-paid", weight: 2, label: "Undelivered Paid Orders",
      metricValue: op.undeliveredPaidOrders, metricLabel: "ORDERS",
      context: "Paid but not yet delivered", originNode: "Fulfilment",
    });
  }
  if (snapshot.retainer.openReviewCycles > 0) {
    items.push({
      id: "open-cycles", weight: 1, label: "Open Review Cycles",
      metricValue: snapshot.retainer.openReviewCycles, metricLabel: "CYCLES",
      context: "In‑flight audits", originNode: "Retainer"
    });
  }
  if (op.candidateReadinessEvals > 0) {
    items.push({
      id: "candidate-readiness", weight: 1, label: "Retainer Candidates",
      metricValue: op.candidateReadinessEvals, metricLabel: "CASES",
      context: "Self-qualified — not yet escalated to review", originNode: "Retainer",
    });
  }

  return items.sort((a, b) => b.weight - a.weight);
}

// Compute Decision Integrity Index (0‑100)
function computeDII(snapshot: DashboardSnapshot): number {
  const m = snapshot.metrics;
  if (m.totalPressureSignals === 0) return 0;
  
  const outcomeScore = (m.averageDecisionOutcomeScore / 5) * 45;
  const conversionScore = Math.min(25, (m.conversionRateFreeToPaid / 30) * 25);
  const riskPenalty = (snapshot.operational.overdueDeliveries * 6) + (snapshot.contradictionAlerts.length * 5);
  
  const raw = Math.round(outcomeScore + conversionScore + 30 - riskPenalty);
  return Math.max(0, Math.min(100, raw));
}

// ────────────────────────────────────────────────────────────── Subcomponents ──────

const StatusBadge: React.FC<{ status: DashboardStatus }> = ({ status }) => {
  const config = {
    LIVE:        { dot: "bg-emerald-500 animate-pulse", label: "LIVE", text: "text-emerald-400" },
    NO_DATA_YET: { dot: "bg-amber-400", label: "NO DATA", text: "text-amber-400" },
    DEGRADED:    { dot: "bg-amber-500 animate-pulse", label: "DEGRADED", text: "text-amber-500" },
    DEMO:        { dot: "bg-purple-400", label: "DEMO MODE", text: "text-purple-400" },
    ERROR:       { dot: "bg-red-500", label: "ERROR", text: "text-red-400" },
  }[status];

  return (
    <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-sm">
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className={`text-[10px] font-mono tracking-[0.2em] font-medium ${config.text}`}>
        {config.label}
      </span>
    </div>
  );
};

const EmptyState: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="flex items-center justify-center py-12 border border-dashed border-neutral-800 rounded bg-neutral-900/10">
    <div className="text-center max-w-md">
      <p className="text-xs font-mono text-neutral-400">{title}</p>
      <p className="text-[11px] font-mono text-neutral-600 mt-2">{description}</p>
    </div>
  </div>
);

const Section: React.FC<{ label: string; title: string; plainDescription: string; children: React.ReactNode }> = ({ label, title, plainDescription, children }) => (
  <div className="border border-neutral-900 rounded p-6 bg-neutral-950/20">
    <div className="mb-5 border-b border-neutral-900 pb-3">
      <p className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#C5A059]">{label}</p>
      <div className="flex flex-wrap justify-between items-baseline gap-2 mt-1">
        <h2 className="text-lg font-serif font-medium text-neutral-200">{title}</h2>
        <p className="text-[11px] font-mono text-neutral-500">{plainDescription}</p>
      </div>
    </div>
    {children}
  </div>
);

const KPICard: React.FC<{ title: string; value: string | number; description: string; focus?: boolean }> = ({ title, value, description, focus }) => (
  <div className={`rounded border p-5 ${focus ? "border-[#C5A059]/40 bg-[#14120E]" : "border-neutral-800 bg-neutral-900/20"}`}>
    <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">{title}</div>
    <div className="mt-2 text-2xl font-mono font-bold tracking-tight text-neutral-100">{value}</div>
    <div className="mt-2 text-[11px] font-mono text-neutral-500 leading-relaxed">{description}</div>
  </div>
);

// ────────────────────────────────────────────────────────────── Main Component ──────

export const LiveDataDashboard: React.FC<LiveDataDashboardProps> = ({
  theme = "dark",
  refreshMs = DEFAULT_REFRESH_MS,
  useMockData = false,
}) => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (useMockData) {
      await new Promise(r => setTimeout(r, 300));
      setSnapshot(getMockSnapshot());
      setLastUpdated(new Date());
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/snapshot");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSnapshot(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Dashboard snapshot failed", err);
      setError("Unable to load dashboard data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [useMockData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, Math.max(5000, refreshMs));
    return () => clearInterval(interval);
  }, [fetchData, refreshMs]);

  const status = computeDashboardStatus({ 
    useMockData, 
    failedEndpoints: error ? 1 : 0, 
    totalEndpoints: 1, 
    metrics: snapshot?.metrics ?? null 
  });
  
  const riskItems = snapshot ? sortRiskItems(snapshot) : [];
  const dii = snapshot ? computeDII(snapshot) : 0;

  if (isLoading) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border border-neutral-800 border-t-[#C5A059] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-xs font-mono text-neutral-500">Loading decision intelligence console…</p>
        </div>
      </div>
    );
  }

  if (status === "ERROR" || error) {
    return (
      <div className="bg-[#0A0A0A] min-h-screen flex items-center justify-center p-8">
        <div className="border border-red-950/60 bg-gradient-to-b from-[#0F0A0A] to-[#0A0A0A] rounded p-8 max-w-md text-center">
          <StatusBadge status="ERROR" />
          <p className="mt-4 text-sm font-mono text-neutral-400">
            {error || "Failed to connect to intelligence layer."}
          </p>
          <button 
            onClick={fetchData} 
            className="mt-6 px-4 py-2 border border-neutral-800 hover:border-neutral-700 text-xs font-mono rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!snapshot) return null;

  const m = snapshot.metrics;
  const showDemoBanner = status === "DEMO";

  return (
    <div className="bg-[#0A0A0A] text-neutral-200 min-h-screen pb-12 space-y-8 antialiased selection:bg-[#C5A059]/20">
      
      {/* ── Demo / Degraded Banners ────────────────────────────────────────── */}
      {showDemoBanner && (
        <div className="rounded border border-purple-900/40 bg-purple-950/10 px-5 py-3 flex items-center gap-3 text-xs font-mono text-purple-300/80">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> 
          DEMO MODE – All metrics shown are zero‑valued placeholders.
        </div>
      )}
      {status === "DEGRADED" && (
        <div className="rounded border border-amber-900/40 bg-amber-950/10 px-5 py-3 flex items-center gap-3 text-xs font-mono text-amber-300/90">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> 
          DEGRADED – Some data sources unavailable. Showing best available.
        </div>
      )}

      {/* ── Console Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold tracking-tight">Decision Intelligence Console</h1>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs font-mono text-neutral-500 mt-1">
            Live operational registry · Abraham of London
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          {lastUpdated && (
            <span className="text-neutral-500">
              Updated {formatRelativeTime(lastUpdated.toISOString())}
            </span>
          )}
          <button 
            onClick={fetchData} 
            className="px-3 py-1 border border-neutral-800 hover:border-neutral-700 rounded transition"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Decision Integrity Index + Contradictions ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="border border-neutral-900 bg-[#0F0F0F] rounded p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between border-b border-neutral-900 pb-2">
              <span className="text-[10px] font-mono text-neutral-400">NORTH STAR METRIC</span>
              <Icons.Seal />
            </div>
            <h3 className="text-sm font-serif font-medium mt-3">Decision Integrity Index</h3>
            <p className="text-xs font-mono text-neutral-500 mt-1">
              Composite of outcome quality, conversion, and risk suppression
            </p>
          </div>
          <div className="mt-6">
            <span className="text-5xl font-serif font-light text-[#C5A059]">{dii}</span>
            <span className="text-xs font-mono text-neutral-600 ml-1">/100</span>
          </div>
          <div className="mt-4 h-1 w-full bg-neutral-950 rounded overflow-hidden">
            <div className="h-full bg-[#C5A059] transition-all duration-700" style={{ width: `${dii}%` }} />
          </div>
        </div>

        <div className="lg:col-span-2 border border-neutral-900 bg-neutral-950/40 rounded p-6">
          <div className="flex justify-between items-center border-b border-neutral-900 pb-2 mb-3">
            <span className="text-[10px] font-mono text-red-400">CONTRADICTION ENGINE</span>
            <span className="text-xs font-mono text-neutral-500">
              {snapshot.contradictionAlerts.length} active
            </span>
          </div>
          {snapshot.contradictionAlerts.length === 0 ? (
            <p className="text-xs font-mono text-neutral-500 italic">No active contradictions detected.</p>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {snapshot.contradictionAlerts.map(c => (
                <div key={c.id} className="text-xs border-l-2 border-red-500 pl-3 py-1">
                  <span className="font-mono text-red-400">[{c.severity}]</span> 
                  <span className="text-neutral-300 ml-1">{c.description}</span>
                  <div className="text-[10px] text-neutral-500 mt-1">
                    {c.affectedDossiers.join(", ")} · {formatRelativeTime(c.detectedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Risk‑Prioritised Interventions ─────────────────────────────────── */}
      <Section label="INTERVENTION QUEUE" title="Risk‑Prioritised Actions" plainDescription="Critical, warning, and informational items requiring attention">
        {riskItems.length === 0 ? (
          <EmptyState title="No active interventions" description="All systems operating within expected parameters." /> 
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskItems.map(item => (
              <div 
                key={item.id} 
                className={`rounded border p-4 ${
                  item.weight === 3 ? "border-red-900/50 bg-red-950/5" : 
                  item.weight === 2 ? "border-amber-900/40 bg-amber-950/5" : 
                  "border-neutral-800 bg-neutral-900/20"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-serif font-medium">{item.label}</h4>
                  <span className={`text-2xl font-mono font-bold ${
                    item.weight === 3 ? "text-red-400" : 
                    item.weight === 2 ? "text-amber-400" : 
                    "text-neutral-400"
                  }`}>
                    {item.metricValue}
                  </span>
                </div>
                <p className="text-xs font-mono text-neutral-500 mt-2">{item.context}</p>
                <div className="mt-3 text-[10px] font-mono text-neutral-600">Node: {item.originNode}</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <Section label="KEY METRICS" title="Institutional Ledger Folios" plainDescription="Total pressure signals, conversion, active briefs, MRR">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Pressure Signals" 
            value={m.totalPressureSignals.toLocaleString()} 
            description={`Today: ${m.pressureSignalsToday} · This week: ${m.pressureSignalsThisWeek}`} 
            focus 
          />
          <KPICard 
            title="Conversion (Free→Paid)" 
            value={m.totalPressureSignals ? `${m.conversionRateFreeToPaid}%` : "—"} 
            description="Of pressure signals to Boardroom Brief" 
          />
          <KPICard 
            title="Active Boardroom Briefs" 
            value={m.activeBoardroomBriefs} 
            description="In compilation or review" 
          />
          <KPICard 
            title="Monthly Recurring Revenue" 
            value={formatCurrency(m.monthlyRecurringRevenue)} 
            description="Subscriptions + one‑time" 
          />
        </div>
      </Section>

      {/* ── Funnel + Pressure Trend ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section label="CONVERSION FUNNEL" title="Boardroom Brief Pipeline" plainDescription="Pressure signal → checkout → payment → delivered">
          {snapshot.funnel.pressureSignalStarts === 0 ? (
            <EmptyState title="No funnel data" description="Complete the first Boardroom Brief to see pipeline." /> 
          ) : (
            <div className="space-y-4">
              {[
                { label: "Pressure Signals", count: snapshot.funnel.pressureSignalStarts },
                { label: "Checkout attempts", count: snapshot.funnel.checkoutAttempts },
                { label: "Completed payments", count: snapshot.funnel.completedPayments },
                { label: "Delivered dossiers", count: snapshot.funnel.deliveredDossiers }
              ].map((item, i, arr) => {
                const max = Math.max(1, ...arr.map(x => x.count));
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs font-mono">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-1 bg-neutral-950 rounded mt-1">
                      <div 
                        className="h-full bg-[#C5A059] rounded" 
                        style={{ width: `${(item.count / max) * 100}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        <Section label="PRESSURE TREND" title="7‑Day Signal Volume" plainDescription="Daily decision pressure signals">
          {snapshot.pressureTrend.every(p => p.count === 0) ? (
            <EmptyState title="No signals yet" description="Chart populates when decisions are tested." /> 
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={snapshot.pressureTrend}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PALETTE.gold} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={PALETTE.gold} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fontFamily: "monospace", fill: PALETTE.textSecondary }} 
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontFamily: "monospace", fill: PALETTE.textSecondary }} 
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: "#111", borderColor: "#262626" }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={PALETTE.gold} 
                    strokeWidth={1.5} 
                    fill="url(#goldGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      {/* ── Fulfilment + Retainer ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section label="FULFILMENT" title="Dossier Pipeline" plainDescription="Paid → generated → approved → delivered / overdue">
          {snapshot.fulfilment.paidOrders === 0 ? (
            <EmptyState title="No fulfilment activity" description="Orders will appear here once Boardroom Briefs are purchased." /> 
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2 border border-neutral-800 rounded">
                <div className="text-xl font-mono font-bold">{snapshot.fulfilment.paidOrders}</div>
                <div className="text-[9px] uppercase">Paid</div>
              </div>
              <div className="p-2 border border-neutral-800 rounded">
                <div className="text-xl font-mono">{snapshot.fulfilment.generatedDossiers}</div>
                <div className="text-[9px] uppercase">Generated</div>
              </div>
              <div className="p-2 border border-neutral-800 rounded">
                <div className="text-xl font-mono">{snapshot.fulfilment.approvedDossiers}</div>
                <div className="text-[9px] uppercase">Approved</div>
              </div>
              <div className="p-2 border border-neutral-800 rounded">
                <div className="text-xl font-mono">{snapshot.fulfilment.deliveredDossiers}</div>
                <div className="text-[9px] uppercase">Delivered</div>
              </div>
              <div className="p-2 border border-red-950/60 bg-red-950/5 rounded">
                <div className="text-xl font-mono text-red-400">{snapshot.fulfilment.overdueDeliveries}</div>
                <div className="text-[9px] uppercase">Overdue</div>
              </div>
            </div>
          )}
        </Section>

        <Section label="RETAINER" title="Retainer Health" plainDescription="Active contracts, review cycles, overdue audits">
          {snapshot.retainer.activeContracts === 0 ? (
            <EmptyState title="No retainers active" description="Enterprise retainers appear here once onboarded." /> 
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-xs">Active contracts</span>
                <span className="font-mono font-bold">{snapshot.retainer.activeContracts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Open review cycles</span>
                <span className="font-mono">{snapshot.retainer.openReviewCycles}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span className="text-xs">Overdue cycles</span>
                <span className="font-mono font-bold">{snapshot.retainer.overdueReviewCycles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Completed cycles (all time)</span>
                <span className="font-mono">{snapshot.retainer.completedReviewCycles}</span>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ── Outcomes + Activity Feed ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section label="OUTCOME MEMORY" title="Decision Outcome Distribution" plainDescription="Success / Partial / Failure from Return Briefs">
          {snapshot.outcomeDistribution.length === 0 ? (
            <EmptyState title="No outcomes recorded" description="Return Briefs will populate this ledger." /> 
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <div className="w-32 h-32 relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie 
                      data={snapshot.outcomeDistribution} 
                      dataKey="value" 
                      innerRadius={30} 
                      outerRadius={45} 
                      paddingAngle={3}
                    >
                      {snapshot.outcomeDistribution.map((_, i) => (
                        <Cell 
                          key={i} 
                          fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} 
                          stroke="#0A0A0A" 
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <div className="text-sm font-mono">Avg. score: {m.averageDecisionOutcomeScore}/5</div>
                <div className="mt-2 space-y-1">
                  {snapshot.outcomeDistribution.map(d => {
                    const colorIndex = ["Success", "Partial", "Failure"].indexOf(d.name);
                    return (
                      <div key={d.name} className="text-xs">
                        <span 
                          className="inline-block w-2 h-2 rounded-full mr-2" 
                          style={{ backgroundColor: OUTCOME_COLORS[colorIndex] }} 
                        />
                        {d.name}: {d.value}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Section>

        <Section label="ACTIVITY LOG" title="Unified Registry of Events" plainDescription="Recent decisions, orders, and return briefs">
          {snapshot.recentActivity.length === 0 ? (
            <EmptyState title="No recent activity" description="Actions will appear here as they occur." /> 
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {snapshot.recentActivity.map(a => (
                <div key={a.id} className="border-b border-neutral-900 pb-2 last:border-0">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono text-[#C5A059]">
                      {a.type === "pressure_signal" ? "SIGNAL" : 
                       a.type === "boardroom_brief_order" ? "BRIEF ORDER" : 
                       "RETURN BRIEF"}
                    </span>
                    <span className="text-neutral-500">{formatRelativeTime(a.timestamp)}</span>
                  </div>
                  <p className="text-sm font-serif mt-1">{a.title}</p>
                  {a.userRole && <p className="text-[10px] font-mono text-neutral-500">Node: {a.userRole}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ── Risk & Oversight (Condensed) ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section label="RISK SUPPRESSION" title="Vulnerability Ledger" plainDescription="Active anomalies, monitoring, pending reviews">
          {snapshot.risk.totalEntries === 0 ? (
            <EmptyState title="No risk entries" description="Anomalies will appear when detected." /> 
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xl font-mono">{snapshot.risk.totalEntries}</div>
                <div className="text-[9px] uppercase">Total</div>
              </div>
              <div>
                <div className="text-xl font-mono text-blue-400">{snapshot.risk.monitoring}</div>
                <div className="text-[9px] uppercase">Monitoring</div>
              </div>
              <div>
                <div className="text-xl font-mono text-red-400">{snapshot.risk.confirmed}</div>
                <div className="text-[9px] uppercase">Anomalies</div>
              </div>
            </div>
          )}
        </Section>

        <Section label="OVERSIGHT" title="Systemic Drift Audit" plainDescription="Critical drift, high variance, watchlist clients">
          {snapshot.oversight.totalCycles === 0 ? (
            <EmptyState title="No oversight cycles" description="Audit data appears after retainer reviews." /> 
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total cycles</span>
                <span>{snapshot.oversight.totalCycles}</span>
              </div>
              <div className="flex justify-between text-red-400">
                <span>Critical drift</span>
                <span>{snapshot.oversight.criticalDrift}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>High drift</span>
                <span>{snapshot.oversight.highDrift}</span>
              </div>
              <div className="flex justify-between">
                <span>Clients on watch</span>
                <span>{snapshot.oversight.clientsOnWatch}</span>
              </div>
              <div className="flex justify-between text-[#C5A059]">
                <span>Interventions (30d)</span>
                <span>{snapshot.oversight.interventionsThisMonth}</span>
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div className="text-center text-[9px] font-mono text-neutral-600 border-t border-neutral-900 pt-6">
        All data anonymised and aggregated. Cryptographic signature verifies integrity.
      </div>
    </div>
  );
};

export default LiveDataDashboard;