import * as React from "react";
import Head from "next/head";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { AlertTriangle, CheckCircle2, Clock3, FileText, ShieldAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { AdminMetricCard } from "@/components/admin/AdminMetricCard";
import { AdminStatusBadge, type AdminBadgeTone } from "@/components/admin/AdminStatusBadge";
import { requireAdminPage } from "@/lib/access/server";
import { buildGmiQuarterlyReviewPack } from "@/lib/intelligence/gmi-quarterly-review-pack";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-state-resolver";
import { getMarketIntelligenceRecord } from "@/lib/intelligence/market-intelligence-lifecycle";
import { getCallsForReport, getCallsPendingReview } from "@/lib/intelligence/market-intelligence-call-ledger";
import { validateLinkedInOutboundItem, type LinkedInOutboundItem } from "@/lib/outbound/linkedin-outbound-governance";

type ReportCard = {
  id: string;
  lifecycle: string;
  coverage: string;
  decisionWindow: string;
  purchasable: boolean;
  publicVisible: boolean;
};

type ConsoleViewModel = {
  activeReport: string;
  draftReport: string;
  currentReleaseState: string;
  releaseReady: boolean;
  reportCards: ReportCard[];
  blockers: string[];
  priorCalls: {
    total: number;
    dueInQ2: number;
    carriedToQ3: number;
    reviewed: number;
    pending: number;
  };
  sourceCoverage: {
    totalRows: number;
    verifiedRows: number;
    pendingRows: number;
    blockerRows: number;
    coverageScore: number;
    releaseSafe: boolean;
  };
  qualityGate: {
    overallScore: number;
    releaseReady: boolean;
    criticalFailures: string[];
    warnings: string[];
    dimensionsBelowThreshold: string[];
  };
  outbound: {
    title: string;
    status: string;
    lifecycleGated: boolean;
    publishable: boolean;
  };
  nextActions: string[];
  mutatingActions: string[];
};

const REQUIRED_NEXT_ACTIONS = [
  "Complete Q2 source collection log.",
  "Review and score Q1 calls due in Q2.",
  "Resolve release-blocking source rows.",
  "Finalise Q2 confidence posture.",
  "Run quality gate.",
  "Promote lifecycle only after release conditions pass.",
];

function reportCard(id: string): ReportCard {
  const record = getMarketIntelligenceRecord(id);
  if (!record) {
    return {
      id,
      lifecycle: "MISSING",
      coverage: "Unavailable",
      decisionWindow: "Unavailable",
      purchasable: false,
      publicVisible: false,
    };
  }

  return {
    id,
    lifecycle: record.lifecycleState,
    coverage: record.coveragePeriod,
    decisionWindow: record.decisionWindow,
    purchasable: record.purchasable,
    publicVisible: record.publicVisible,
  };
}

function buildQ2OutboundState(): ConsoleViewModel["outbound"] {
  const item: LinkedInOutboundItem = {
    title: "A new market reality — why Q2 2026 matters",
    status: "draft",
    draft: true,
    published: false,
    channel: "linkedin",
    contentType: "article",
    date: "2026-07-08",
    category: "Outbound",
    tier: "public",
    linkedReportId: "GMI-Q2-2026",
    requiresLifecycleCheck: true,
    publicationGate: "Publish only after GMI-Q2-2026 lifecycle is ACTIVE_UNTIL_SUPERSEDED and public report surface is live",
    claimRisk: "MEDIUM",
    body: "The Q2 report remains in preparation.",
  };
  const result = validateLinkedInOutboundItem(item);

  return {
    title: item.title ?? "Q2 LinkedIn market-reality post",
    status: String(item.status),
    lifecycleGated: item.requiresLifecycleCheck === true,
    publishable: result.errors.length === 0 && item.published === true && item.status !== "draft",
  };
}

export function buildGmiReleaseConsoleViewModel(): ConsoleViewModel {
  const releaseState = resolveGmiReleaseState("GMI-Q2-2026");
  const reviewPack = buildGmiQuarterlyReviewPack("GMI-Q2-2026");
  const q1Calls = getCallsForReport("GMI-Q1-2026");
  const dueInQ2 = q1Calls.filter((call) => call.expectedReviewWindow === "Q2 2026");
  const carriedToQ3 = q1Calls.filter((call) => call.expectedReviewWindow === "Q3 2026");
  const pendingQ2 = getCallsPendingReview("Q2 2026");
  const dimensionsBelowThreshold = releaseState.qualityGate.scores
    .filter((score) => score.score < 8)
    .map((score) => `${score.dimension}: ${score.score}/10`);
  const warnings = reviewPack.sourceCoverage.coverageScore < 90
    ? ["Source coverage below paid institutional warning threshold."]
    : [];

  return {
    activeReport: "GMI-Q1-2026",
    draftReport: "GMI-Q2-2026",
    currentReleaseState: `${releaseState.state} / Draft`,
    releaseReady: releaseState.releaseReady,
    reportCards: [reportCard("GMI-Q1-2026"), reportCard("GMI-Q2-2026")],
    blockers: [
      ...releaseState.blockers,
      ...(releaseState.qualityGate.releaseReady ? [] : ["Quality gate not release-ready"]),
    ],
    priorCalls: {
      total: q1Calls.length,
      dueInQ2: dueInQ2.length,
      carriedToQ3: carriedToQ3.length,
      reviewed: dueInQ2.length - pendingQ2.length,
      pending: pendingQ2.length,
    },
    sourceCoverage: reviewPack.sourceCoverage,
    qualityGate: {
      overallScore: releaseState.qualityGate.overallScore,
      releaseReady: releaseState.qualityGate.releaseReady,
      criticalFailures: releaseState.qualityGate.criticalFailures,
      warnings,
      dimensionsBelowThreshold,
    },
    outbound: buildQ2OutboundState(),
    nextActions: REQUIRED_NEXT_ACTIONS,
    mutatingActions: [],
  };
}

type PageProps = {
  consoleState: ConsoleViewModel;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const guard = await requireAdminPage<PageProps>(ctx);
  if (!guard.authorized) return guard.redirect as never;

  return {
    props: {
      consoleState: buildGmiReleaseConsoleViewModel(),
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

        <div className="grid gap-6 xl:grid-cols-2">
          <CardSection title="Prior-Call Review Status">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AdminMetricCard label="Q1 material calls" value={consoleState.priorCalls.total} variant="inner" />
              <AdminMetricCard label="Due in Q2" value={consoleState.priorCalls.dueInQ2} tone="warning" variant="inner" />
              <AdminMetricCard label="Carried to Q3" value={consoleState.priorCalls.carriedToQ3} tone="info" variant="inner" />
              <AdminMetricCard label="Reviewed" value={consoleState.priorCalls.reviewed} tone="muted" variant="inner" />
              <AdminMetricCard label="Pending" value={consoleState.priorCalls.pending} tone="danger" variant="inner" />
            </div>
          </CardSection>

          <CardSection title="Source Appendix Coverage">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AdminMetricCard label="Total rows" value={consoleState.sourceCoverage.totalRows} variant="inner" />
              <AdminMetricCard label="Verified rows" value={consoleState.sourceCoverage.verifiedRows} tone="success" variant="inner" />
              <AdminMetricCard label="Pending rows" value={consoleState.sourceCoverage.pendingRows} tone="warning" variant="inner" />
              <AdminMetricCard label="Release-blocker rows" value={consoleState.sourceCoverage.blockerRows} tone="danger" variant="inner" />
              <AdminMetricCard label="Coverage score" value={`${consoleState.sourceCoverage.coverageScore}%`} tone={consoleState.sourceCoverage.coverageScore >= 80 ? "warning" : "danger"} variant="inner" />
              <AdminMetricCard label="Release safe" value={consoleState.sourceCoverage.releaseSafe ? "Yes" : "No"} tone={toneForBoolean(consoleState.sourceCoverage.releaseSafe)} variant="inner" />
            </div>
          </CardSection>
        </div>

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
