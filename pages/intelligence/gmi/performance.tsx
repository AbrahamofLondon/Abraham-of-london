import * as React from "react";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import {
  getGmiPerformanceMetrics,
  getGmiReleaseSnapshots,
  type GmiDataProvenance,
  type GmiPerformanceMetricsData,
} from "@/lib/intelligence/gmi-data-service.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  performance: GmiPerformanceMetricsData;
  provenance: GmiDataProvenance;
  latestSnapshotId: string | null;
  latestSnapshotAt: string | null;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const [performance, snapshots] = await Promise.all([
    getGmiPerformanceMetrics("GMI-Q2-2026"),
    getGmiReleaseSnapshots("GMI-Q2-2026"),
  ]);
  return {
    props: {
      performance: performance.data,
      provenance: performance.provenance,
      latestSnapshotId: snapshots.data[0]?.id ?? null,
      latestSnapshotAt: snapshots.data[0]?.createdAt ?? null,
    },
    revalidate: 1800,
  };
};

const GmiPerformancePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ performance, provenance, latestSnapshotId, latestSnapshotAt }) => {
  return (
    <Layout
      title="GMI Performance Centre | Abraham of London"
      description="Public Global Market Intelligence performance centre with score distribution, carried-forward calls, and disconfirmed calls."
      canonicalUrl="/intelligence/gmi/performance"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Public performance centre
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              The track record is visible before the paid depth layer.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Score 2 is separated from confirmation. Disconfirmed and weakly supported calls remain visible and count in the distribution.
            </p>
            <p className="mt-3 text-xs leading-5 text-white/35">
              Data source: {provenance.sourceName} ({provenance.sourceType}). Ledger update {performance.lastLedgerUpdateTimestamp ?? "not available"}. Snapshot {latestSnapshotId ?? "none"} {latestSnapshotAt ? `created ${latestSnapshotAt}` : ""}.
            </p>
            {performance.totalCallsReviewed === 0 ? (
              <p className="mt-3 text-sm leading-6 text-amber-200/70">No reviewed calls yet.</p>
            ) : null}
          </header>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              ["Total calls", performance.totalCallsIssued],
              ["Reviewed", performance.totalCallsReviewed],
              ["Average score", performance.averageScore ?? "Not scored"],
              ["Reviewed %", `${performance.reviewedCallPercentage}%`],
            ].map(([label, value]) => (
              <article key={String(label)} className="border border-white/10 bg-white/[0.015] p-5">
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>{label}</p>
                <p className="mt-3 text-2xl font-light text-white">{value}</p>
              </article>
            ))}
          </section>

          <section className="border border-white/10 bg-white/[0.015] p-6">
            <h2 className="font-serif text-2xl text-white">Score Distribution</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-6">
              {([5, 4, 3, 2, 1, 0] as const).map((score) => (
                <div key={score} className="border border-white/10 bg-black/25 p-4">
                  <p className="text-3xl font-light text-[#E6C98C]">{score}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45" style={mono}>{performance.scoreDistribution[score]} calls</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <article className="border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(167,243,208,0.72)" }}>Confirmed</p>
              <p className="mt-3 text-3xl font-light">{performance.confirmedCount}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Scores 4 and 5 only.</p>
            </article>
            <article className="border border-amber-500/15 bg-amber-500/[0.04] p-5">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(252,211,77,0.72)" }}>Pending / carried forward</p>
              <p className="mt-3 text-3xl font-light">{performance.pendingCarryForwardCount}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Score 2 is not confirmation.</p>
            </article>
            <article className="border border-rose-500/15 bg-rose-500/[0.04] p-5">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(254,205,211,0.72)" }}>Weak / disconfirmed</p>
              <p className="mt-3 text-3xl font-light">{performance.weakDisconfirmedCount}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">Scores 1 and 0 remain in the public record.</p>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <h2 className="font-serif text-xl text-white">Disconfirmed Calls</h2>
              <div className="mt-4 space-y-3">
                {performance.disconfirmedCalls.length === 0 ? (
                  <p className="text-sm text-white/45">No disconfirmed calls currently recorded.</p>
                ) : performance.disconfirmedCalls.map((call) => (
                  <p key={call.callId} className="text-sm leading-6 text-white/58">{call.callId}: {call.callStatement}</p>
                ))}
              </div>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <h2 className="font-serif text-xl text-white">Carried Forward</h2>
              <div className="mt-4 space-y-3">
                {performance.carriedForwardCalls.map((call) => (
                  <p key={call.callId} className="text-sm leading-6 text-white/58">{call.callId}: next review {call.nextReviewDue ?? "not set"}</p>
                ))}
              </div>
            </article>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-4 border border-white/10 bg-black/25 p-5">
            <p className="text-xs leading-5 text-white/42">
              Methodology {performance.methodologyVersion}. Rubric {performance.rubricVersion}. Average score includes scored calls only; score 2 is shown separately as carried-forward/pending.
            </p>
            <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.16em]" style={mono}>
              <Link className="text-[#E6C98C]" href="/intelligence/gmi/calls">Call ledger</Link>
              <Link className="text-white/55" href="/intelligence/gmi/methodology">Methodology</Link>
              <Link className="text-white/55" href="/intelligence/gmi/operator-brief">Operator brief</Link>
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export default GmiPerformancePage;
