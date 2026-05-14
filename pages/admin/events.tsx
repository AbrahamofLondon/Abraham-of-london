/**
 * pages/admin/events.tsx — Unified Admin Event Log
 *
 * Operational view across all available event/audit sources:
 *   - System Audit Log (system_audit_logs)
 *   - Governance Log   (governance_logs)
 *   - Access Audit Log (access_audit_logs)
 *   - Download Events  (download_audit_events)
 *   - Webhook events   → not yet connected (honest unavailable state)
 *
 * Each source fails independently. Source errors are surfaced inline.
 * This page complements /admin/audit (forensic ledger) — it focuses on
 * operational visibility across all event categories, not deep forensics.
 */

import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import {
  Activity,
  AlertTriangle,
  Clock3,
  RefreshCcw,
  ShieldAlert,
  Webhook,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { requireAdminPage } from "@/lib/access/server";
import { AdminStatusBadge, toneForStatus } from "@/components/admin/AdminStatusBadge";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import type {
  AdminEvent,
  AdminEventSource,
  AdminEventSeverity,
  EventLogSummary,
} from "@/lib/admin/event-log";

type PageProps = {
  summary: EventLogSummary;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const { buildEventLogSummary } = await import("@/lib/admin/event-log");
  const summary = await buildEventLogSummary({ limit: 200 });

  return { props: { summary } };
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const SOURCE_LABEL: Record<AdminEventSource, string> = {
  system_audit: "System",
  governance:   "Governance",
  access_audit: "Access",
  download:     "Download",
  webhook:      "Webhook",
};

const SOURCE_TONE: Record<AdminEventSource, string> = {
  system_audit: "border border-white/10 bg-white/5 text-white/50",
  governance:   "border border-blue-500/20 bg-blue-500/10 text-blue-300",
  access_audit: "border border-amber-500/25 bg-amber-500/10 text-amber-400",
  download:     "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  webhook:      "border border-purple-500/20 bg-purple-500/10 text-purple-300",
};

const SEVERITY_DOT: Record<AdminEventSeverity, string> = {
  debug:    "bg-white/20",
  info:     "bg-white/35",
  warn:     "bg-amber-400",
  error:    "bg-rose-400",
  critical: "bg-red-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: AdminEventSource }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${SOURCE_TONE[source]}`}
    >
      {SOURCE_LABEL[source]}
    </span>
  );
}

function EventRow({ event }: { event: AdminEvent }) {
  return (
    <tr className="border-t border-white/5 align-top transition-colors hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <span className={`mt-1 inline-block h-2 w-2 rounded-full ${SEVERITY_DOT[event.severity]}`} />
      </td>
      <td className="px-4 py-3">
        <SourceBadge source={event.source} />
      </td>
      <td className="px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-white/80">
          {event.eventType}
        </p>
        {event.category && (
          <p className="mt-0.5 font-mono text-[9px] text-white/30">{event.category}</p>
        )}
      </td>
      <td className="max-w-xs px-4 py-3">
        <p className="truncate text-xs text-white/60" title={event.message}>
          {event.message}
        </p>
        {event.resourceName && (
          <p className="mt-0.5 truncate font-mono text-[9px] text-white/35">
            {event.resourceType ? `${event.resourceType}: ` : ""}
            {event.resourceName}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-white/55">
          {event.actorEmail ?? event.actorType ?? "—"}
        </p>
      </td>
      <td className="px-4 py-3">
        <AdminStatusBadge
          label={event.status}
          tone={toneForStatus(event.status)}
        />
      </td>
      <td className="px-4 py-3 font-mono text-[10px] text-white/35">
        {formatEventTime(event.createdAt)}
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminEventsPage({
  summary,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const [filterSource, setFilterSource] = React.useState<AdminEventSource | "all">("all");
  const [filterSeverity, setFilterSeverity] = React.useState<AdminEventSeverity | "all">("all");
  const [filterStatus, setFilterStatus] = React.useState<"success" | "failure" | "pending" | "unknown" | "all">("all");

  const generatedAt = new Date(summary.generatedAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const filtered = summary.events.filter((ev) => {
    if (filterSource !== "all" && ev.source !== filterSource) return false;
    if (filterSeverity !== "all" && ev.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && ev.status !== filterStatus) return false;
    return true;
  });

  const sourceErrorEntries = Object.entries(summary.sourceErrors) as Array<
    [AdminEventSource, string]
  >;

  return (
    <AdminLayout title="Event Log">
      <Head>
        <title>Event Log | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <section className="border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500/60">
                  Unified Event Log
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">Admin Event Log</h1>
              <p className="mt-2 max-w-3xl text-sm text-white/55">
                Operational visibility across system audit, governance, access, and delivery events.
                Each source is queried independently. Specialist forensic detail lives in the{" "}
                <a href="/admin/audit" className="text-amber-400/70 underline underline-offset-2 hover:text-amber-300">
                  Audit Ledger
                </a>.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 border border-white/10 bg-black/20 px-3 py-2 md:flex">
              <Clock3 className="h-3.5 w-3.5 text-white/30" />
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/35">
                {generatedAt}
              </span>
            </div>
          </div>
        </section>

        {/* Source errors */}
        {sourceErrorEntries.length > 0 && (
          <div className="space-y-2">
            {sourceErrorEntries.map(([source, err]) => (
              <div
                key={source}
                className="flex items-start gap-3 border border-amber-500/20 bg-amber-500/10 px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-100/75">
                  <span className="font-mono uppercase tracking-wider">
                    {SOURCE_LABEL[source]}
                  </span>{" "}
                  source unavailable: {err}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Webhook placeholder */}
        <div className="flex items-start gap-3 border border-white/10 bg-zinc-950/70 px-5 py-4">
          <Webhook className="mt-0.5 h-4 w-4 shrink-0 text-white/20" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">
              Webhook Events
            </p>
            <p className="mt-0.5 text-sm text-white/40">
              Webhook event delivery log not yet connected. When wired, outbound
              webhook delivery attempts and retries will appear here.
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider text-white/30">
            Not connected
          </span>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <AdminMetricCard
            label="Total Events"
            value={summary.totalCount}
            detail={`from ${Object.values(summary.sourceCounts).filter(Boolean).length} sources`}
          />
          <AdminMetricCard
            label="Critical / Error"
            value={summary.criticalCount}
            tone={summary.criticalCount > 0 ? "danger" : "neutral"}
          />
          <AdminMetricCard
            label="Failures"
            value={summary.failureCount}
            tone={summary.failureCount > 0 ? "warning" : "neutral"}
          />
          <AdminMetricCard
            label="Source Errors"
            value={sourceErrorEntries.length}
            tone={sourceErrorEntries.length > 0 ? "warning" : "neutral"}
          />
        </div>

        {/* Source count summary */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(summary.sourceCounts) as Array<[AdminEventSource, number]>)
            .filter(([, count]) => count > 0)
            .map(([source, count]) => (
              <button
                key={source}
                onClick={() =>
                  setFilterSource((prev) => (prev === source ? "all" : source))
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                  filterSource === source
                    ? SOURCE_TONE[source]
                    : "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                }`}
              >
                {SOURCE_LABEL[source]}
                <span className="opacity-70">{count}</span>
              </button>
            ))}
          {filterSource !== "all" && (
            <button
              onClick={() => setFilterSource("all")}
              className="inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider text-white/30 hover:text-white/60"
            >
              <XCircle className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as AdminEventSeverity | "all")}
            className="border border-white/10 bg-zinc-900/50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/60 focus:border-amber-500/30 focus:outline-none"
          >
            <option value="all">All severities</option>
            {(["critical", "error", "warn", "info", "debug"] as const).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="border border-white/10 bg-zinc-900/50 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.12em] text-white/60 focus:border-amber-500/30 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="pending">Pending</option>
            <option value="unknown">Unknown</option>
          </select>

          <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-white/30">
            {filtered.length} of {summary.totalCount} shown
          </span>

          <button
            onClick={() => window.location.reload()}
            className="ml-auto inline-flex items-center gap-2 border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>

        {/* Event table */}
        <section className="border border-white/10 bg-zinc-950/70">
          {filtered.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-white/35">
              {summary.totalCount === 0
                ? "No events recorded yet. Events will appear as admin actions are taken."
                : "No events match the current filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30">
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Sev
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Source
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Event type
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Message
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-white/5 pt-4">
          <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/20">
            Events are read-only. Specialist surfaces remain the source of action.
          </p>
          <a
            href="/admin/audit"
            className="text-[9px] font-mono uppercase tracking-widest text-white/25 transition-colors hover:text-white/50"
          >
            Forensic Ledger →
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
