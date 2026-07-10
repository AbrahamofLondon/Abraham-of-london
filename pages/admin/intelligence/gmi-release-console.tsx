import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AlertTriangle, CheckCircle2, Clock3, FileText, ShieldAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { buildGmiQuarterlyReviewPack } from "@/lib/intelligence/gmi-quarterly-review-pack";
import { buildGmiReleaseEventSummary, type GmiReleaseEventSummary } from "@/lib/intelligence/gmi-release-event-summary";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-state-resolver";
import { getMarketIntelligenceRecord } from "@/lib/intelligence/market-intelligence-lifecycle";
import { getCallsForReport, getCallsPendingReview } from "@/lib/intelligence/market-intelligence-call-ledger";
import { validateLinkedInOutboundItem, type LinkedInOutboundItem } from "@/lib/outbound/linkedin-outbound-governance";
import { GmiPriorCallScorecard, type GmiPriorCallScorecardData } from "@/components/Intelligence/GmiPriorCallScorecard";
import { GmiEvidenceRoom } from "@/components/Intelligence/GmiEvidenceRoom";
import { getSourceRowsForReport } from "@/lib/intelligence/gmi-source-appendix-registry";
import {
  getBlockingChecklistItems,
  type GmiReleaseChecklist,
} from "@/lib/intelligence/gmi-release-candidate-checklist";
// Type-only import (erased at compile) so the server-only view-model module and
// its durable-resolver chain never enter this page's client bundle.
import type { ConsoleViewModel } from "@/lib/intelligence/gmi-release-console-view-model.server";

type PageProps = {
  consoleState: ConsoleViewModel;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  // Fetch persisted GMI events from the audit log and wire into the summary
  const { getGmiEventsForReport } = await import("@/lib/intelligence/gmi-event-store");
  const storedEvents = await getGmiEventsForReport("GMI-Q2-2026");

  // Server-only: dynamically imported inside getServerSideProps (stripped from
  // the client bundle), keeping the durable-resolver chain off the browser.
  const { buildGmiReleaseConsoleViewModel } = await import("@/lib/intelligence/gmi-release-console-view-model.server");
  const base = await buildGmiReleaseConsoleViewModel();
  const { buildGmiReleaseEventSummary: buildSummary } = await import("@/lib/intelligence/gmi-release-event-summary");
  const eventSummary = buildSummary("GMI-Q2-2026", storedEvents);

  return {
    props: {
      consoleState: { ...base, eventSummary },
    },
  };
};

function toneForBoolean(value: boolean): AdminBadgeTone {
  return value ? "success" : "danger";
}

function lifecycleTone(lifecycle: string): AdminBadgeTone {
  if (lifecycle === "ACTIVE_UNTIL_SUPERSEDED") return "success";
  if (lifecycle === "DRAFT") return "warning";
  return "muted";
}

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
        {description ? <p className="mt-1 max-w-3xl text-sm text-white/45">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function GmiReleaseConsolePage({
  consoleState,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <AdminLayout title="GMI Release Console">
      <Head>
        <title>GMI Release Console | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <section className="border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400/80" />
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400/70">
                  Read-only release governance view
                </p>
              </div>
              <h1 className="mt-3 font-serif text-3xl text-white">
                Global Market Intelligence Release Console
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
                Internal status view for lifecycle state, source coverage, prior-call review, quality gate, outbound gating, and required next actions. No unpublished report body or release controls are exposed here.
              </p>
            </div>
            <div className="grid gap-2 text-right">
              <AdminStatusBadge label={`Active report: ${consoleState.activeReport}`} tone="success" size="md" />
              <AdminStatusBadge label={`Draft report: ${consoleState.draftReport}`} tone="warning" size="md" />
              <AdminStatusBadge label={`Current release state: ${consoleState.currentReleaseState}`} tone="info" size="md" />
              <AdminStatusBadge label={`Release ready: ${consoleState.releaseReady ? "Yes" : "No"}`} tone={toneForBoolean(consoleState.releaseReady)} size="md" />
            </div>
          </div>
        </section>

        <CardSection title="Current Report Cards">
          <div className="grid gap-4 lg:grid-cols-2">
            {consoleState.reportCards.map((report) => (
              <article key={report.id} className="border border-white/10 bg-black/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/35">{report.id}</p>
                    <h3 className="mt-2 font-serif text-2xl text-white">{report.id}</h3>
                  </div>
                  <AdminStatusBadge label={report.lifecycle} tone={lifecycleTone(report.lifecycle)} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <AdminMetricCard label="Coverage" value={report.coverage} variant="inner" />
                  <AdminMetricCard label="Decision window" value={report.decisionWindow} variant="inner" />
                  <AdminMetricCard label="Purchasable" value={String(report.purchasable)} tone={report.purchasable ? "success" : "warning"} variant="inner" />
                  <AdminMetricCard label="Public visible" value={String(report.publicVisible)} tone={report.publicVisible ? "success" : "warning"} variant="inner" />
                </div>
              </article>
            ))}
          </div>
        </CardSection>

        <CardSection title="Q2 Release Blockers" description="Release blockers are generated from the release-state resolver and quality gate.">
          <div className="space-y-2">
            {consoleState.blockers.map((blocker) => (
              <div key={blocker} className="flex items-start gap-2 border border-rose-500/15 bg-rose-500/5 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400/80" />
                <p className="text-sm text-rose-100/70">{blocker}</p>
              </div>
            ))}
          </div>
        </CardSection>

        <CardSection
          title="Prior-Call Review Scorecard"
          description="Q1 material calls recorded in the verification ledger and their Q2 review status. Calls are TOO_EARLY_TO_ASSESS until Q2 closes and evidence is assembled."
        >
          <GmiPriorCallScorecard
            data={consoleState.scorecardData}
            mode="admin"
            calls={getCallsForReport("GMI-Q1-2026")}
          />
        </CardSection>

        <CardSection
          title="Evidence Room — Source Appendix Coverage"
          description="Source appendix row status for GMI-Q2-2026. Release requires all blocker rows to be verified and coverage ≥ 80%."
        >
          <GmiEvidenceRoom
            reportId="GMI-Q2-2026"
            coverage={consoleState.sourceCoverage}
            mode="admin"
            rows={getSourceRowsForReport("GMI-Q2-2026")}
          />
        </CardSection>

        <CardSection title="Quality Gate Summary">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label="Overall score" value={consoleState.qualityGate.overallScore} tone={consoleState.qualityGate.releaseReady ? "success" : "danger"} variant="inner" />
            <AdminMetricCard label="Release ready" value={consoleState.qualityGate.releaseReady ? "true" : "false"} tone={toneForBoolean(consoleState.qualityGate.releaseReady)} variant="inner" />
            <AdminMetricCard label="Critical failures" value={consoleState.qualityGate.criticalFailures.length} tone="danger" variant="inner" />
            <AdminMetricCard label="Warnings" value={consoleState.qualityGate.warnings.length} tone={consoleState.qualityGate.warnings.length ? "warning" : "success"} variant="inner" />
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">Critical failures</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {consoleState.qualityGate.criticalFailures.map((failure) => (
                  <AdminStatusBadge key={failure} label={failure} tone="danger" />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">Warnings</p>
              <div className="mt-2 space-y-1">
                {consoleState.qualityGate.warnings.map((warning) => (
                  <p key={warning} className="text-xs text-amber-200/65">{warning}</p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/35">Dimensions below threshold</p>
              <div className="mt-2 space-y-1">
                {consoleState.qualityGate.dimensionsBelowThreshold.map((dimension) => (
                  <p key={dimension} className="text-xs text-white/50">{dimension}</p>
                ))}
              </div>
            </div>
          </div>
        </CardSection>

        <CardSection
          title="Release Candidate Checklist"
          description="Read-only checklist derived from release standard and current data. No release or publish controls are present here."
        >
          {(() => {
            const checklist = consoleState.releaseChecklist;
            const blockers = getBlockingChecklistItems(checklist);
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <AdminStatusBadge
                    label={`Clearance: ${checklist.releaseClearance}`}
                    tone={checklist.releaseClearance === "CLEAR" ? "success" : checklist.releaseClearance === "BLOCKED" ? "danger" : "warning"}
                  />
                  <AdminStatusBadge label={`${checklist.completedCount}/${checklist.totalCount} complete`} tone="muted" />
                  <AdminStatusBadge label={`${checklist.blockerCount} release blocker(s)`} tone={checklist.blockerCount > 0 ? "danger" : "success"} />
                </div>

                {blockers.length > 0 && (
                  <div>
                    <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
                      Release-blocking items outstanding
                    </p>
                    <div className="space-y-1.5">
                      {blockers.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 border border-rose-500/15 bg-rose-500/5 p-3">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400/70" />
                          <div>
                            <p className="text-xs text-rose-100/65">{item.description}</p>
                            {item.note && (
                              <p className="mt-0.5 text-[9px] font-mono text-rose-300/40">{item.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[9px] font-mono uppercase tracking-[0.22em] text-white/30">
                    All checklist items
                  </p>
                  <div className="space-y-1">
                    {checklist.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 border border-white/[0.04] bg-black/15 px-3 py-2"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                              item.status === "COMPLETE"        ? "bg-emerald-400/60" :
                              item.status === "BLOCKED"         ? "bg-rose-400/60" :
                              item.status === "PENDING"         ? "bg-amber-400/60" :
                              item.status === "IN_PROGRESS"     ? "bg-blue-400/60" :
                              "bg-white/20"
                            }`}
                          />
                          <div>
                            <p className="text-xs text-white/55">{item.description}</p>
                            {item.note && (
                              <p className="mt-0.5 text-[8px] font-mono text-white/25">{item.note}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={`text-[8px] font-mono uppercase tracking-[0.12em] ${
                              item.status === "COMPLETE"        ? "text-emerald-300/70" :
                              item.status === "BLOCKED"         ? "text-rose-300/70" :
                              item.status === "PENDING"         ? "text-amber-300/70" :
                              item.status === "IN_PROGRESS"     ? "text-blue-300/70" :
                              "text-white/25"
                            }`}
                          >
                            {item.status.replace("_", " ")}
                          </span>
                          {item.releaseBlocker && item.status !== "COMPLETE" && item.status !== "NOT_APPLICABLE" && (
                            <span className="text-[7px] font-mono uppercase text-rose-400/50">
                              blocker
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </CardSection>

        <div className="grid gap-6 xl:grid-cols-2">
          <CardSection title="Outbound Linked Assets">
            <div className="border border-white/10 bg-black/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">LinkedIn / GMI</p>
                  <h3 className="mt-2 font-serif text-xl text-white">{consoleState.outbound.title}</h3>
                </div>
                <AdminStatusBadge label={consoleState.outbound.status} tone="warning" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <AdminMetricCard label="Lifecycle gated" value={consoleState.outbound.lifecycleGated ? "yes" : "no"} tone="warning" variant="inner" />
                <AdminMetricCard label="Publishable" value={consoleState.outbound.publishable ? "yes" : "no"} tone={toneForBoolean(consoleState.outbound.publishable)} variant="inner" />
              </div>
            </div>
          </CardSection>

          <CardSection title="Release Event Ledger" description="Console-safe summary of recorded release governance events.">
            {consoleState.eventSummary.emptyState ? (
              <div className="border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white/30" />
                  <p className="text-sm text-white/55">{consoleState.eventSummary.emptyState}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AdminMetricCard label="Recorded events" value={consoleState.eventSummary.totalEvents} variant="inner" />
                <AdminMetricCard label="Last quality gate run" value={consoleState.eventSummary.lastQualityGateRun ?? "None"} variant="inner" />
                <AdminMetricCard label="Last release blocker" value={consoleState.eventSummary.lastReleaseBlockedReason ?? "None"} tone="danger" variant="inner" />
                <AdminMetricCard label="Last source verification" value={consoleState.eventSummary.lastSourceVerification ?? "None"} variant="inner" />
                <AdminMetricCard label="Last call review" value={consoleState.eventSummary.lastCallReview ?? "None"} variant="inner" />
                <AdminMetricCard label="Last outbound gate check" value={consoleState.eventSummary.lastOutboundGateCheck ?? "None"} variant="inner" />
              </div>
            )}
          </CardSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <CardSection title="Required Next Actions">
            <ol className="space-y-2">
              {consoleState.nextActions.map((action, index) => (
                <li key={action} className="flex items-start gap-3 border border-white/5 bg-black/20 p-3">
                  <span className="text-[10px] font-mono text-amber-300/80">{index + 1}.</span>
                  <span className="text-sm text-white/62">{action}</span>
                </li>
              ))}
            </ol>
          </CardSection>
        </div>

        <section className="border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-white/30" />
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/35">
              Read-only v0. No release, publish, or lifecycle mutation controls are present.
            </p>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
