/**
 * pages/admin/report-state.tsx — Unified Report State Dashboard
 *
 * Single operational command view answering:
 * "What reports exist, what is pending, what failed, what needs delivery,
 *  and what is blocked?"
 *
 * Does not duplicate specialist page functionality. Links to specialist surfaces.
 * Each section fails independently. If a metric cannot be loaded, shows
 * "Unavailable," not zero.
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Send,
  FileWarning,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import type {
  ReportStateDashboard,
  ReportStateMetricTone,
  ReportStateSection,
} from "@/lib/admin/report-state-dashboard";

type PageProps = {
  dashboard: ReportStateDashboard;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { buildReportStateDashboard } = await import("@/lib/admin/report-state-dashboard");
  const dashboard = await buildReportStateDashboard();

  return { props: { dashboard } };
};

// ─── Design tokens ─────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Helpers ───────────────────────────────────────────────────────────────

function toneClass(tone?: ReportStateMetricTone): string {
  switch (tone) {
    case "risk":
      return "text-rose-300";
    case "attention":
      return "text-amber-300";
    case "good":
      return "text-emerald-300";
    default:
      return "text-white";
  }
}

function MetricValue({ value }: { value: number | null }) {
  return <>{typeof value === "number" ? value : "Unavailable"}</>;
}

function sectionIcon(id: string) {
  switch (id) {
    case "report-production":
      return <FileText className="h-5 w-5 text-amber-500/80" />;
    case "delivery-state":
      return <Send className="h-5 w-5 text-amber-500/80" />;
    case "pdf-export-state":
      return <Download className="h-5 w-5 text-amber-500/80" />;
    case "executive-reports":
      return <FileSpreadsheet className="h-5 w-5 text-amber-500/80" />;
    default:
      return <FileWarning className="h-5 w-5 text-amber-500/80" />;
  }
}

// ─── Components ────────────────────────────────────────────────────────────

function SectionCard({ section }: { section: ReportStateSection }) {
  const isUnavailable = section.status === "unavailable";

  return (
    <section
      className={`border ${
        isUnavailable
          ? "border-white/5"
          : section.metrics.some((m) => m.tone === "risk")
            ? "border-rose-500/20"
            : section.metrics.some((m) => m.tone === "attention")
              ? "border-amber-500/15"
              : "border-white/10"
      } bg-zinc-950/70 p-6`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{sectionIcon(section.id)}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl text-white">{section.title}</h2>
              {isUnavailable && (
                <AdminStatusBadge label="Unavailable" tone="warning" />
              )}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-white/50">{section.description}</p>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {section.metrics.map((metric) => (
          <div
            key={`${section.id}-${metric.label}`}
            className="border border-white/5 bg-black/20 p-3"
          >
            <p className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/30">
              {metric.label}
            </p>
            <p className={`mt-2 text-lg font-light ${toneClass(metric.tone)}`}>
              <MetricValue value={metric.value} />
            </p>
            {metric.detail ? (
              <p className="mt-1 text-[10px] text-white/30">{metric.detail}</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Note */}
      {section.note ? (
        <div className="mt-4 flex items-start gap-2 rounded border border-amber-500/10 bg-amber-500/5 p-3">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400/70" />
          <p className="text-xs text-amber-200/60">{section.note}</p>
        </div>
      ) : null}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        {section.actions.map((action) => (
          <Link
            key={`${section.id}-${action.href}`}
            href={action.href}
            className="inline-flex items-center gap-1.5 border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-amber-500/25 hover:text-amber-200"
            title={action.description}
          >
            {action.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ReportStatePage({
  dashboard,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const generatedAt = new Date(dashboard.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const totalMetrics = dashboard.sections.reduce(
    (acc, s) => {
      if (s.status === "unavailable") acc.unavailable++;
      else if (s.metrics.some((m) => m.tone === "risk")) acc.risk++;
      else if (s.metrics.some((m) => m.tone === "attention")) acc.attention++;
      else acc.healthy++;
      return acc;
    },
    { healthy: 0, attention: 0, risk: 0, unavailable: 0 },
  );

  return (
    <AdminLayout title="Report State Dashboard">
      <Head>
        <title>Report State Dashboard | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-500/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Unified Report State Dashboard
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Report operations at a glance</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                What reports exist, what is pending, what failed, what needs delivery, and what is
                blocked. Each section draws from live data independently. Specialist surfaces remain
                the source of action.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 md:flex">
              <Clock3 className="h-3.5 w-3.5 text-white/30" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
                {generatedAt}
              </span>
            </div>
          </div>

          {/* Summary badges */}
          <div className="mt-5 flex flex-wrap gap-3">
            {totalMetrics.healthy > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {totalMetrics.healthy} section{totalMetrics.healthy !== 1 ? "s" : ""} healthy
              </span>
            )}
            {totalMetrics.attention > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {totalMetrics.attention} section{totalMetrics.attention !== 1 ? "s" : ""} needs attention
              </span>
            )}
            {totalMetrics.risk > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-rose-300">
                <ShieldAlert className="h-3 w-3" />
                {totalMetrics.risk} section{totalMetrics.risk !== 1 ? "s" : ""} requires investigation
              </span>
            )}
            {totalMetrics.unavailable > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-mono uppercase tracking-wider text-white/40">
                {totalMetrics.unavailable} section{totalMetrics.unavailable !== 1 ? "s" : ""} unavailable
              </span>
            )}
          </div>
        </section>

        {/* Section cards */}
        <div className="space-y-4">
          {dashboard.sections.map((section) => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[9px] font-mono uppercase tracking-[0.18em] text-white/20">
          Specialist surfaces remain the source of action. This dashboard provides operational
          visibility only.
        </p>
      </div>
    </AdminLayout>
  );
}
