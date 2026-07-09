import * as React from "react";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import {
  getGmiBoardPulseData,
  getGmiFalsificationRules,
  getGmiPerformanceMetrics,
  getGmiProvenanceState,
  getGmiReleaseSnapshots,
  getGmiSourceAppendix,
} from "@/lib/intelligence/gmi-data-service.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  dashboard: {
    editionId: string;
    boardPackHref: string;
    callLedgerHref: string;
    redTeamHref: string;
    watchSignals: Array<{
      signal: string;
      evidencePosture: string;
      currentStatus: string;
      triggerThreshold: string;
      actionIfTriggered: string;
    }>;
    boardDecisions: Array<{
      decision: string;
      timingCondition: string;
      riskIfDelayed: string;
      ownerFunction: string;
      route: string;
    }>;
    scenarioProbabilities: Array<{ label: string; probability: number | string; methodNote: string }>;
    falsificationThresholds: Array<{ threshold: string; observableSignal: string; reviewTiming: string }>;
    provenance: Awaited<ReturnType<typeof getGmiProvenanceState>>["data"];
    latestSnapshotId: string | null;
    publicationState: string;
    methodologyVersion: string;
    rubricVersion: string;
  };
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const editionId = "GMI-Q2-2026";
  const [board, sources, falsification, performance, provenance, snapshots] = await Promise.all([
    getGmiBoardPulseData(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiPerformanceMetrics(editionId),
    getGmiProvenanceState(editionId),
    getGmiReleaseSnapshots(editionId),
  ]);
  const publishedSnapshot = snapshots.data.find((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt);
  const snapshotState = publishedSnapshot?.stateJson as any;
  const sourceRows = Array.isArray(snapshotState?.sources) && snapshotState.sources.length > 0
    ? snapshotState.sources
    : sources.data;
  const falsificationRows = Array.isArray(snapshotState?.falsificationRules) && snapshotState.falsificationRules.length > 0
    ? snapshotState.falsificationRules
    : falsification.data;
  const boardState = snapshotState?.boardPulse ?? board.data;
  // Merge canonical performance.data defaults with snapshot performance values.
  // Snapshot values take precedence where present, but the canonical record supplies
  // methodologyVersion, rubricVersion and other fields the snapshot may not include.
  const performanceState = { ...performance.data, ...(snapshotState?.performance ?? {}) };
  const decisions = boardState?.decisionsToMakeIn30Days ?? [];
  return {
    props: {
      dashboard: {
        editionId,
        boardPackHref: `/api/gmi/board-pack?edition=${editionId}&format=pdf`,
        callLedgerHref: "/intelligence/gmi/calls",
        redTeamHref: "/intelligence/gmi/red-team",
        watchSignals: sourceRows.slice(0, 3).map((source: any) => ({
          signal: source.claim,
          evidencePosture: source.confidence,
          currentStatus: source.status,
          triggerThreshold: source.methodNote ?? source.observationWindow,
          actionIfTriggered: source.adminJustification ?? "Review through Board Pulse cadence.",
        })),
        boardDecisions: decisions.map((decision: any) => ({
          decision: String(decision.decision ?? decision),
          timingCondition: String(decision.whyNow ?? "30-day decision window"),
          riskIfDelayed: String(decision.riskIfDelayed ?? "Delay compounds decision exposure."),
          ownerFunction: String(decision.suggestedOwner ?? "Board / Executive"),
          route: String(decision.route ?? "prepare"),
        })),
        scenarioProbabilities: sourceRows
          .filter((source: any) => source.evidenceClass === "SCENARIO_ASSUMPTION")
          .map((source: any) => ({
            label: source.claim,
            probability: "labelled assumption",
            methodNote: source.methodNote ?? source.confidenceBasis ?? "Scenario assumption requires public method note.",
          })),
        falsificationThresholds: falsificationRows.map((rule: any) => ({
          threshold: rule.thresholdValue,
          observableSignal: rule.observableIndicator,
          reviewTiming: rule.nextReviewDue ?? "Not scheduled",
        })),
        provenance: provenance.data,
        latestSnapshotId: publishedSnapshot?.id ?? snapshots.data[0]?.id ?? null,
        publicationState: publishedSnapshot ? "published snapshot" : board.data?.publicationStatus ?? "draft",
        methodologyVersion: performanceState.methodologyVersion,
        rubricVersion: performanceState.rubricVersion,
      },
    },
    revalidate: 1800,
  };
};

const GmiQ2OperatorDashboardPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ dashboard }) => {
  return (
    <Layout
      title="GMI Q2 2026 Operator Dashboard | Abraham of London"
      description="Static Global Market Intelligence operator dashboard for watch signals, board decisions, scenarios, and falsification thresholds."
      canonicalUrl="/intelligence/gmi/q2-2026"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Operator dashboard · {dashboard.editionId}
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              The decision message in ten seconds.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Editorial framing is separated from persisted operational state. Watch signals, board decisions, falsification thresholds, and performance posture below are derived from the GMI database or clearly labelled scenario methodology.
            </p>
            <p className="mt-3 text-xs leading-5 text-white/35">
              Data source: persisted GMI ledger/source appendix/falsification register. Publication state: {dashboard.publicationState}. Snapshot: {dashboard.latestSnapshotId ?? "current draft"}. Methodology {dashboard.methodologyVersion}. Rubric {dashboard.rubricVersion}.
            </p>
            {!dashboard.provenance.isDataDerived ? (
              <p className="mt-3 text-sm leading-6 text-amber-200/70">
                Provenance warning: this edition is not production-publishable until all operational state is backed by persisted DB records.
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={dashboard.boardPackHref} className="border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#E6C98C]" style={mono}>
                Download board pack shell
              </Link>
              <Link href={dashboard.callLedgerHref} className="border border-white/12 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/65" style={mono}>
                Call ledger
              </Link>
              <Link href={dashboard.redTeamHref} className="border border-white/12 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/65" style={mono}>
                Challenge a call
              </Link>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {dashboard.watchSignals.map((signal) => (
              <article key={signal.signal} className="border border-white/10 bg-white/[0.015] p-5">
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{signal.evidencePosture}</p>
                <h2 className="mt-3 font-serif text-xl text-white/88">{signal.signal}</h2>
                <p className="mt-3 text-xs leading-6 text-white/48">{signal.currentStatus}</p>
                <p className="mt-3 text-xs leading-6 text-white/42"><span className="text-white/62">Trigger:</span> {signal.triggerThreshold}</p>
                <p className="mt-3 text-xs leading-6 text-white/42"><span className="text-white/62">Action:</span> {signal.actionIfTriggered}</p>
              </article>
            ))}
          </section>

          <section className="border border-[#C9A96E]/20 bg-[#C9A96E]/[0.035] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Five board decisions
            </p>
            <div className="mt-4 space-y-3">
              {dashboard.boardDecisions.map((decision) => (
                <article key={decision.decision} className="border border-white/8 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-3xl text-sm leading-6 text-white/70">{decision.decision}</p>
                    <Link href={decision.route} className="shrink-0 text-[8px] uppercase tracking-[0.18em] text-[#E6C98C]" style={mono}>
                      {decision.route.replace("/", "").replace("-", " ")} →
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <p className="text-xs leading-5 text-white/42"><span className="text-white/62">Timing:</span> {decision.timingCondition}</p>
                    <p className="text-xs leading-5 text-white/42"><span className="text-white/62">Risk:</span> {decision.riskIfDelayed}</p>
                    <p className="text-xs leading-5 text-white/42"><span className="text-white/62">Owner:</span> {decision.ownerFunction}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="border border-white/10 bg-white/[0.015] p-6">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>Scenario framework</p>
              <div className="mt-4 space-y-3">
                {dashboard.scenarioProbabilities.map((scenario) => (
                  <div key={scenario.label} className="border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/70">{scenario.label}: {scenario.probability}%</p>
                    <p className="mt-2 text-xs leading-6 text-white/42">{scenario.methodNote}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-6">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>What would change the view</p>
              <div className="mt-4 space-y-3">
                {dashboard.falsificationThresholds.map((threshold) => (
                  <div key={threshold.threshold} className="border border-white/8 bg-black/20 p-4">
                    <p className="text-sm text-white/70">{threshold.threshold}</p>
                    <p className="mt-2 text-xs leading-6 text-white/42">{threshold.observableSignal}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/28" style={mono}>{threshold.reviewTiming}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiQ2OperatorDashboardPage;