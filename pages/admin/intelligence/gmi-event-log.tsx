import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { Activity, Clock, AlertTriangle, CheckCircle2, BookOpen, RefreshCw } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import type { GmiReleaseEvent } from "@/lib/intelligence/gmi-release-events";
import type { MarketCallRecord } from "@/lib/intelligence/market-intelligence-call-ledger";

type PageProps = {
  events: GmiReleaseEvent[];
  pendingCalls: MarketCallRecord[];
  reportId: string;
  totalEvents: number;
};

function eventTone(severity: string): "success" | "warning" | "danger" | "muted" {
  if (severity === "BLOCKER") return "danger";
  if (severity === "WARNING") return "warning";
  if (severity === "APPROVAL") return "muted";
  return "success";
}

function callConfidenceTone(confidence: string): "success" | "warning" | "muted" {
  if (confidence === "HIGH") return "success";
  if (confidence === "MEDIUM") return "warning";
  return "muted";
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  const reportId = typeof ctx.query.reportId === "string" ? ctx.query.reportId : "GMI-Q2-2026";

  const [{ getGmiEventsForReport }, { getCallsPendingReview }] = await Promise.all([
    import("@/lib/intelligence/gmi-event-store"),
    import("@/lib/intelligence/market-intelligence-call-ledger"),
  ]);

  const [events, pendingCalls] = await Promise.all([
    getGmiEventsForReport(reportId, 100),
    Promise.resolve(getCallsPendingReview("Q2 2026")),
  ]);

  return {
    props: {
      events,
      pendingCalls,
      reportId,
      totalEvents: events.length,
    },
  };
};

export default function GmiEventLogPage({
  events,
  pendingCalls,
  reportId,
  totalEvents,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="GMI Event Log">
      <Head>
        <title>GMI Event Log | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-8">

        {/* Header */}
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-6">
          <div className="flex items-start gap-4">
            <Activity className="mt-1 h-5 w-5 text-amber-400/70 shrink-0" />
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/60">
                GMI Release Governance — Event Ledger
              </p>
              <h1 className="mt-2 font-serif text-3xl text-white">Intelligence Event Log</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Every quarterly report reviews the material calls from the previous quarter before
                issuing the next one. This intelligence line compounds through verification, not just
                publication.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <AdminStatusBadge label={`Report: ${reportId}`} tone="info" />
            <AdminStatusBadge label={`${totalEvents} recorded events`} tone={totalEvents > 0 ? "success" : "muted"} />
            <AdminStatusBadge label={`${pendingCalls.length} calls pending review`} tone={pendingCalls.length > 0 ? "warning" : "success"} />
          </div>
        </section>

        {/* Pending call review list */}
        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <div className="mb-5 flex items-center gap-3">
            <BookOpen className="h-4 w-4 text-amber-400/70" />
            <h2 className="font-serif text-xl text-white">Prior-Quarter Calls Pending Review</h2>
          </div>
          {pendingCalls.length === 0 ? (
            <div className="flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <p className="text-sm text-emerald-200/70">All prior-quarter calls have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingCalls.map((call) => (
                <div
                  key={call.id}
                  className="border border-amber-500/15 bg-amber-500/[0.04] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400/60">
                          {call.id}
                        </span>
                        <span className="text-[9px] font-mono text-white/30">·</span>
                        <span className="text-[9px] font-mono uppercase text-white/40">
                          {call.callType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-white/70">{call.statement}</p>
                      {call.outcomeSummary && (
                        <p className="mt-2 text-xs text-white/40 italic">{call.outcomeSummary}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <AdminStatusBadge
                        label={call.originalConfidence}
                        tone={callConfidenceTone(call.originalConfidence)}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[9px] font-mono text-white/30">
                    <span>Review window: {call.expectedReviewWindow}</span>
                    <span>Status: {(call.outcomeStatus ?? "PENDING_REVIEW").replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))}
              <div className="mt-3 border border-white/5 bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-amber-400/50" />
                  <p className="text-[10px] font-mono text-white/35">
                    Record call reviews via POST /api/admin/intelligence/gmi/record-event with action: CALL_REVIEW
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Release event log */}
        <section className="border border-white/10 bg-zinc-950/70 p-6">
          <div className="mb-5 flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-400/70" />
            <h2 className="font-serif text-xl text-white">Release Event Ledger</h2>
          </div>
          {events.length === 0 ? (
            <div className="border border-white/10 bg-black/20 p-6 text-center">
              <RefreshCw className="mx-auto mb-3 h-6 w-6 text-white/20" />
              <p className="text-sm text-white/40">
                No release events recorded yet for {reportId}.
              </p>
              <p className="mt-2 text-xs text-white/25">
                Events are recorded when quality gates run, calls are reviewed, or lifecycle
                transitions are proposed.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {events.map((event, i) => (
                <div
                  key={`${event.occurredAt}-${i}`}
                  className="grid grid-cols-12 gap-3 border border-white/5 bg-black/10 px-4 py-3 text-xs"
                >
                  <div className="col-span-2 font-mono text-white/35 text-[10px]">
                    {new Date(event.occurredAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="col-span-1">
                    <AdminStatusBadge
                      label={event.severity}
                      tone={eventTone(event.severity)}
                      size="sm"
                    />
                  </div>
                  <div className="col-span-3 font-mono text-[10px] uppercase tracking-wider text-amber-400/70 truncate">
                    {event.eventType.replace(/^GMI_/, "").replace(/_/g, " ")}
                  </div>
                  <div className="col-span-5 text-white/55 truncate">
                    {event.summary}
                  </div>
                  <div className="col-span-1 text-right text-[9px] font-mono text-white/25">
                    {event.actor ?? "SYSTEM"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-white/5 bg-black/20 p-4">
          <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/25">
            Read-only view. Events are written by the GMI publication service. No publish or lifecycle mutation controls present.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
