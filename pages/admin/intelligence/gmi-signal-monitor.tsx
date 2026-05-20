import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AlertTriangle, Eye, Info, Clock3, ShieldAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import {
  GMI_MONITORING_SIGNALS,
  getSignalsBySeverity,
  getSignalsByStatus,
  type GmiMonitoringSignal,
  type GmiSignalSeverity,
  type GmiSignalStatus,
} from "@/lib/intelligence/gmi-monitoring-signals";
import {
  GMI_ALERT_THRESHOLDS,
} from "@/lib/intelligence/gmi-alert-thresholds";
import {
  buildGrowthScenarioComparison,
  GMI_2026_GROWTH_INPUTS,
  type GrowthScenarioComparison,
} from "@/lib/intelligence/gmi-growth-scenario-model";

// ─────────────────────────────────────────────────────────────────────────────
// View model
// ─────────────────────────────────────────────────────────────────────────────

type SignalViewModel = GmiMonitoringSignal & {
  thresholdSummary?: string;
};

type GrowthInputRow = {
  source: string;
  label: string;
  estimate: string;
  evidenceClass: string;
  pendingConfirmation: boolean;
  notes: string;
};

type SignalMonitorViewModel = {
  reportId: string;
  signals: SignalViewModel[];
  byStatus: Record<GmiSignalStatus, SignalViewModel[]>;
  bySeverity: Record<GmiSignalSeverity, SignalViewModel[]>;
  totalActive: number;
  totalMonitoring: number;
  totalDeferred: number;
  evidenceItemsRequired: number;
  growthComparison: GrowthScenarioComparison;
  growthInputRows: GrowthInputRow[];
  thresholds: {
    us10y: { watch: string; elevated: string; critical: string };
    tariff: { watch: string; elevated: string; critical: string };
    usdStress: { watch: string; elevated: string; critical: string };
    credit: { watch: string; elevated: string; critical: string };
    growth: { watch: string; elevated: string; critical: string };
  };
};

// Formats a yield number to 1–2 decimal places, never dropping below 1 decimal.
// 4.5 → "4.5", 4.75 → "4.75", 5.0 → "5.0"
function formatYield(v: number): string {
  return v.toFixed(2).replace(/0$/, "");
}

function buildThresholdSummary(signal: GmiMonitoringSignal): string | undefined {
  if (signal.id === "GMI-MONITOR-US10Y") {
    const t = GMI_ALERT_THRESHOLDS.us10yYieldSpike;
    return `Watch ≥ ${formatYield(t.watch)}% · Elevated ≥ ${formatYield(t.elevated)}% · Critical ≥ ${formatYield(t.critical)}%`;
  }
  if (signal.id === "GMI-MONITOR-USCN-TARIFF" || signal.id === "GMI-MONITOR-PAUSE-STATUS") {
    return GMI_ALERT_THRESHOLDS.tariffEscalation.watch;
  }
  if (signal.id === "GMI-MONITOR-USD-STRESS") {
    return GMI_ALERT_THRESHOLDS.usdStress.watch;
  }
  if (signal.id === "GMI-MONITOR-CREDIT") {
    return GMI_ALERT_THRESHOLDS.creditSpreadWidening.watch;
  }
  return undefined;
}

export function buildGmiSignalMonitorViewModel(): SignalMonitorViewModel {
  const reportId = "GMI-Q2-2026";
  const signals: SignalViewModel[] = GMI_MONITORING_SIGNALS.filter(
    (s) => s.linkedReportId === reportId,
  ).map((s) => ({
    ...s,
    thresholdSummary: buildThresholdSummary(s),
  }));

  const byStatus: Record<GmiSignalStatus, SignalViewModel[]> = {
    ACTIVE: signals.filter((s) => s.status === "ACTIVE"),
    MONITORING: signals.filter((s) => s.status === "MONITORING"),
    RESOLVED: signals.filter((s) => s.status === "RESOLVED"),
    DEFERRED: signals.filter((s) => s.status === "DEFERRED"),
  };

  const bySeverity: Record<GmiSignalSeverity, SignalViewModel[]> = {
    ELEVATED: signals.filter((s) => s.severity === "ELEVATED"),
    WATCH: signals.filter((s) => s.severity === "WATCH"),
    INFO: signals.filter((s) => s.severity === "INFO"),
    CRITICAL: signals.filter((s) => s.severity === "CRITICAL"),
  };

  const growthComparison = buildGrowthScenarioComparison(GMI_2026_GROWTH_INPUTS);
  const growthInputRows: GrowthInputRow[] = GMI_2026_GROWTH_INPUTS.map((input) => ({
    source: input.source,
    label: input.label,
    estimate:
      input.globalGrowthEstimate !== null
        ? `${input.globalGrowthEstimate.toFixed(1)}%`
        : "Qualitative only",
    evidenceClass: input.evidenceClass,
    pendingConfirmation:
      input.source !== "IMF" &&
      input.source !== "AOL_SCENARIO" &&
      input.globalGrowthEstimate !== null,
    notes: input.notes,
  }));

  return {
    reportId,
    signals,
    byStatus,
    bySeverity,
    totalActive: byStatus.ACTIVE.length,
    totalMonitoring: byStatus.MONITORING.length,
    totalDeferred: byStatus.DEFERRED.length,
    evidenceItemsRequired: signals.reduce(
      (sum, s) => sum + s.evidenceRequired.length,
      0,
    ),
    growthComparison,
    growthInputRows,
    thresholds: {
      us10y: {
        watch: `≥ ${formatYield(GMI_ALERT_THRESHOLDS.us10yYieldSpike.watch)}%`,
        elevated: `≥ ${formatYield(GMI_ALERT_THRESHOLDS.us10yYieldSpike.elevated)}%`,
        critical: `≥ ${formatYield(GMI_ALERT_THRESHOLDS.us10yYieldSpike.critical)}%`,
      },
      tariff: {
        watch: GMI_ALERT_THRESHOLDS.tariffEscalation.watch,
        elevated: GMI_ALERT_THRESHOLDS.tariffEscalation.elevated,
        critical: GMI_ALERT_THRESHOLDS.tariffEscalation.critical,
      },
      usdStress: {
        watch: GMI_ALERT_THRESHOLDS.usdStress.watch,
        elevated: GMI_ALERT_THRESHOLDS.usdStress.elevated,
        critical: GMI_ALERT_THRESHOLDS.usdStress.critical,
      },
      credit: {
        watch: GMI_ALERT_THRESHOLDS.creditSpreadWidening.watch,
        elevated: GMI_ALERT_THRESHOLDS.creditSpreadWidening.elevated,
        critical: GMI_ALERT_THRESHOLDS.creditSpreadWidening.critical,
      },
      growth: {
        watch: GMI_ALERT_THRESHOLDS.growthForecastRevision.watch,
        elevated: GMI_ALERT_THRESHOLDS.growthForecastRevision.elevated,
        critical: GMI_ALERT_THRESHOLDS.growthForecastRevision.critical,
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page props
// ─────────────────────────────────────────────────────────────────────────────

type PageProps = {
  viewModel: SignalMonitorViewModel;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;
  return { props: { viewModel: buildGmiSignalMonitorViewModel() } };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CardSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-white/10 bg-zinc-950/70 p-6">
      <div className="mb-5">
        <h2 className="font-serif text-xl text-white">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-white/45">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

const SEVERITY_CONFIG: Record<
  GmiSignalSeverity,
  { label: string; border: string; bg: string; dot: string; badge: string }
> = {
  CRITICAL: {
    label: "Critical",
    border: "border-rose-500/30",
    bg: "bg-rose-500/8",
    dot: "bg-rose-400/80",
    badge: "text-rose-300/80",
  },
  ELEVATED: {
    label: "Elevated",
    border: "border-amber-500/25",
    bg: "bg-amber-500/6",
    dot: "bg-amber-400/70",
    badge: "text-amber-300/70",
  },
  WATCH: {
    label: "Watch",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    dot: "bg-blue-400/60",
    badge: "text-blue-300/65",
  },
  INFO: {
    label: "Info",
    border: "border-white/8",
    bg: "bg-black/20",
    dot: "bg-white/25",
    badge: "text-white/35",
  },
};

const STATUS_CONFIG: Record<GmiSignalStatus, { label: string; color: string }> = {
  ACTIVE:     { label: "Active",     color: "text-amber-300/70" },
  MONITORING: { label: "Monitoring", color: "text-blue-300/55" },
  RESOLVED:   { label: "Resolved",   color: "text-emerald-300/55" },
  DEFERRED:   { label: "Deferred",   color: "text-white/30" },
};

const CATEGORY_LABEL: Record<string, string> = {
  TRADE_POLICY:     "Trade policy",
  TARIFF_ESCALATION: "Tariff escalation",
  TREASURY_YIELD:   "Treasury yield",
  FX_STRESS:        "FX stress",
  CREDIT_STRESS:    "Credit stress",
  AI_PRODUCTIVITY:  "AI productivity",
  GROWTH_FORECAST:  "Growth forecast",
  CAPITAL_FLOW:     "Capital flow",
  COMMODITY_STRESS: "Commodity stress",
};

function SignalCard({ signal }: { signal: SignalViewModel }) {
  const sev = SEVERITY_CONFIG[signal.severity];
  const st = STATUS_CONFIG[signal.status];

  return (
    <article
      className={`border ${sev.border} ${sev.bg} p-4`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${sev.dot}`} />
          <div>
            <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/28">
              {signal.id} · {CATEGORY_LABEL[signal.category] ?? signal.category}
            </p>
            <h3 className="mt-0.5 text-sm font-normal text-white/88">
              {signal.label}
            </h3>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className={`text-[8px] font-mono uppercase tracking-[0.14em] ${sev.badge}`}>
            {sev.label}
          </span>
          <span className={`text-[8px] font-mono uppercase tracking-[0.12em] ${st.color}`}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-2.5 text-xs leading-5 text-white/52">
        {signal.description}
      </p>

      {/* Threshold note */}
      {signal.thresholdSummary && (
        <div className="mt-2.5 border-l-2 border-amber-400/20 pl-3">
          <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Threshold basis
          </p>
          <p className="mt-0.5 text-[10px] text-white/40">
            {signal.thresholdSummary}
          </p>
        </div>
      )}

      {/* Evidence required */}
      <div className="mt-3">
        <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/25">
          Evidence required
        </p>
        <ul className="mt-1.5 space-y-1">
          {signal.evidenceRequired.map((item) => (
            <li key={item} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/18" />
              <span className="text-[10px] leading-5 text-white/42">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Linked calls */}
      {signal.linkedCallIds && signal.linkedCallIds.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/22">
            Linked calls
          </p>
          <div className="flex flex-wrap gap-1.5">
            {signal.linkedCallIds.map((callId) => (
              <span
                key={callId}
                className="border border-white/8 bg-black/20 px-1.5 py-0.5 text-[7px] font-mono uppercase tracking-[0.12em] text-white/30"
              >
                GMI-Q1-2026-{callId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Observation window */}
      <p className="mt-2.5 text-[8px] font-mono text-white/20">
        Window: {signal.observationWindow}
      </p>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function GmiSignalMonitorPage({
  viewModel,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { bySeverity, byStatus } = viewModel;

  return (
    <AdminLayout title="GMI Signal Monitor">
      <Head>
        <title>GMI Signal Monitor | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="border border-amber-500/15 bg-gradient-to-br from-amber-500/8 to-transparent p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-amber-400/70" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/60">
                  Read-only signal register — no live data
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">
                GMI Signal Monitoring Register
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
                Monitored inputs for the Q2 2026 report cycle. These signals define what evidence must be collected and what thresholds, if crossed, would shift the report's analytical posture. No live market data is fetched. Status reflects the evidence collection state, not a real-time market reading.
              </p>
            </div>
            <div className="grid gap-2 text-right">
              <AdminStatusBadge label={`Report: ${viewModel.reportId}`} tone="warning" size="md" />
              <AdminStatusBadge label={`${viewModel.totalActive} Active`} tone="warning" size="md" />
              <AdminStatusBadge label={`${viewModel.totalMonitoring} Monitoring`} tone="info" size="md" />
              <AdminStatusBadge label={`${viewModel.totalDeferred} Deferred`} tone="muted" size="md" />
            </div>
          </div>
        </section>

        {/* ── Status summary ──────────────────────────────────────────────── */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <AdminMetricCard
            label="Elevated signals"
            value={bySeverity.ELEVATED.length}
            tone="warning"
            detail="Require attention at Q2 close"
          />
          <AdminMetricCard
            label="Watch signals"
            value={bySeverity.WATCH.length}
            tone="info"
            detail="Monitoring for threshold breach"
          />
          <AdminMetricCard
            label="Info signals"
            value={bySeverity.INFO.length}
            tone="muted"
            detail="Contextual / background monitoring"
          />
          <AdminMetricCard
            label="Evidence items required"
            value={viewModel.evidenceItemsRequired}
            tone="neutral"
            detail="Across all monitored signals"
          />
        </div>

        {/* ── Elevated signals ────────────────────────────────────────────── */}
        {bySeverity.ELEVATED.length > 0 && (
          <CardSection
            title="Elevated — Policy Signals"
            description="These signals require active evidence collection. Their outcome directly determines the scenario probability distribution and core thesis posture for Q2."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {bySeverity.ELEVATED.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </CardSection>
        )}

        {/* ── Watch signals ───────────────────────────────────────────────── */}
        {bySeverity.WATCH.length > 0 && (
          <CardSection
            title="Watch — Market Condition Signals"
            description="Market-implied signals being monitored for evidence of threshold crossing. Current status is MONITORING — not confirmed as a regime break or systemic event."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {bySeverity.WATCH.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </CardSection>
        )}

        {/* ── Info signals ────────────────────────────────────────────────── */}
        {bySeverity.INFO.length > 0 && (
          <CardSection
            title="Info — Contextual Inputs"
            description="Background signals that inform the analytical picture but do not individually trigger a posture shift. Collected as supporting context."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {bySeverity.INFO.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </CardSection>
        )}

        {/* ── Deferred signals ────────────────────────────────────────────── */}
        {byStatus.DEFERRED.length > 0 && (
          <CardSection
            title="Deferred — Later Review Window"
            description="Signals with a review window beyond Q2 2026. Evidence collection begins but assessment is deferred to the indicated window."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {byStatus.DEFERRED.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </CardSection>
        )}

        {/* ── Alert thresholds ────────────────────────────────────────────── */}
        <CardSection
          title="Configured Alert Thresholds"
          description="Thresholds define what evidence would change a signal's severity classification. These are not automated triggers — they frame what to look for in the evidence."
        >
          <div className="space-y-5">
            {/* US 10Y — numerical */}
            <div>
              <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
                US 10-Year Treasury Yield (numerical)
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["watch", "elevated", "critical"] as const).map((level) => (
                  <div
                    key={level}
                    className={`border p-3 ${
                      level === "critical"
                        ? "border-rose-500/20 bg-rose-500/5"
                        : level === "elevated"
                          ? "border-amber-500/20 bg-amber-500/5"
                          : "border-blue-500/15 bg-blue-500/4"
                    }`}
                  >
                    <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/28">
                      {level}
                    </p>
                    <p
                      className={`mt-2 font-serif text-2xl font-light ${
                        level === "critical"
                          ? "text-rose-300"
                          : level === "elevated"
                            ? "text-amber-300"
                            : "text-blue-300"
                      }`}
                    >
                      {viewModel.thresholds.us10y[level]}
                    </p>
                    <p className="mt-1 text-[8px] font-mono text-white/20">
                      sustained yield spike
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Qualitative thresholds */}
            {(
              [
                { key: "tariff", label: "Tariff escalation" },
                { key: "usdStress", label: "USD stress" },
                { key: "credit", label: "Credit spread widening" },
                { key: "growth", label: "Growth forecast revision" },
              ] as const
            ).map(({ key, label }) => (
              <div key={key}>
                <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
                  {label} (qualitative)
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(["watch", "elevated", "critical"] as const).map((level) => (
                    <div key={level} className="border border-white/5 bg-black/15 p-3">
                      <p className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/25">
                        {level}
                      </p>
                      <p className="mt-1.5 text-[10px] leading-4 text-white/42">
                        {viewModel.thresholds[key][level]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardSection>

        {/* ── Institutional growth forecast comparison ──────────────────── */}
        <CardSection
          title="Institutional Growth Forecast Comparison — 2026"
          description="Seeded institutional inputs for the global growth scenario model. Source confirmation required for Goldman Sachs and Morgan Stanley before Q2 release."
        >
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminMetricCard
                label="Institutional range (confirmed)"
                value={viewModel.growthComparison.model.baseRange}
                tone="neutral"
                detail="Low–high across confirmed institutional sources"
                variant="inner"
              />
              <AdminMetricCard
                label="Institutional midpoint"
                value={`${viewModel.growthComparison.institutionalMidpoint.toFixed(2)}%`}
                tone="neutral"
                detail="Average of confirmed point estimates"
                variant="inner"
              />
              <AdminMetricCard
                label="AoL scenario assumption"
                value={viewModel.growthComparison.model.downsideRange}
                tone="warning"
                detail="Below consensus — must remain labelled SCENARIO_ASSUMPTION"
                variant="inner"
              />
            </div>

            <div>
              <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
                Input rows
              </p>
              <div className="space-y-1.5">
                {viewModel.growthInputRows.map((row) => (
                  <div
                    key={row.source}
                    className="border border-white/5 bg-black/15 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/30">
                            {row.source}
                          </p>
                          {row.pendingConfirmation && (
                            <span className="text-[7px] font-mono uppercase tracking-[0.12em] text-amber-300/50">
                              source confirmation required
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-white/55">{row.label}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`font-serif text-xl font-light ${
                          row.source === "AOL_SCENARIO"
                            ? "text-amber-300/70"
                            : row.estimate === "Qualitative only"
                              ? "text-white/25"
                              : "text-white/75"
                        }`}>
                          {row.estimate}
                        </p>
                        <p className="mt-0.5 text-[7px] font-mono uppercase text-white/20">
                          {row.evidenceClass.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[9px] leading-4 text-white/32">
                      {row.notes}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-amber-500/15 bg-amber-500/4 p-3">
              <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-amber-300/55">
                Release note
              </p>
              <p className="mt-1 text-xs leading-5 text-white/42">
                {viewModel.growthComparison.releaseNote}
              </p>
            </div>
          </div>
        </CardSection>

        {/* ── Interpretation ──────────────────────────────────────────────── */}
        <CardSection
          title="Current Analytical Interpretation"
          description="Working interpretation of the monitored signal set as of current preparation state. Not for release. Subject to revision as evidence is collected."
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-white/55">
              {viewModel.growthComparison.model.interpretation}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="border border-white/5 bg-black/15 p-3">
                <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
                  Trade headwind severity
                </p>
                <p className="mt-2 text-base font-mono text-amber-300/70">
                  {viewModel.growthComparison.model.tradeHeadwindSeverity}
                </p>
              </div>
              <div className="border border-white/5 bg-black/15 p-3">
                <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
                  AI productivity offset
                </p>
                <p className="mt-2 text-base font-mono text-blue-300/60">
                  {viewModel.growthComparison.model.aiProductivityOffset}
                </p>
              </div>
              <div className="border border-white/5 bg-black/15 p-3">
                <p className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
                  Upside offset
                </p>
                <p className="mt-2 text-xs leading-4 text-white/38">
                  {viewModel.growthComparison.model.upsideOffset}
                </p>
              </div>
            </div>
          </div>
        </CardSection>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <section className="border border-white/8 bg-black/30 p-4">
          <div className="flex items-start gap-2">
            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                Read-only v0 — evidence collection state, not live market data
              </p>
              <p className="mt-1 text-xs text-white/28">
                These signals are monitored inputs that inform evidence collection for the Q2 2026 report. No market data is fetched automatically. Signal severity is set by the evidence standard, not by automated inference. This is not a market prediction system.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
