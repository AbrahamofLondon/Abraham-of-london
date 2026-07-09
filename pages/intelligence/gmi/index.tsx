/* pages/intelligence/gmi/index.tsx — GMI Home: Falsification-First Positioning */
import * as React from "react";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { GMI_ESTATE_INTEGRATION_MAP } from "@/lib/intelligence/gmi-instrument";
import {
  getGmiCallLedger,
  getGmiFalsificationRules,
  getGmiPerformanceMetrics,
  type GmiFalsificationRuleData,
  type GmiPerformanceMetricsData,
} from "@/lib/intelligence/gmi-data-service.server";
import {
  getCurrentPublishedMarketIntelligenceReport,
  getUpcomingMarketIntelligenceReport,
  getPublishedArchiveMarketIntelligenceReports,
} from "@/lib/intelligence/market-intelligence-lifecycle";

const GOLD = "#C9A96E";
const BLUE = "#7CB8E8";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function formatTargetDate(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime())
    ? d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : iso;
}

// Serializable issue references derived from the lifecycle authority.
type IssueRef = { id: string; title: string; decisionWindow: string; href: string | null; publicationTarget: string | null };

type Props = {
  falsificationRules: GmiFalsificationRuleData[];
  performance: GmiPerformanceMetricsData;
  currentIssue: IssueRef | null;
  upcomingIssue: IssueRef | null;
  archiveIssues: IssueRef[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Current published / forthcoming / archive are DERIVED from the lifecycle
  // authority — never from a hand-maintained registry boolean.
  const current = getCurrentPublishedMarketIntelligenceReport();
  const upcoming = getUpcomingMarketIntelligenceReport();
  const archive = getPublishedArchiveMarketIntelligenceReports();

  // Metrics reflect the current published edition.
  const currentEditionId = current?.id ?? "GMI-Q1-2026";
  const [calls, falsification, performance] = await Promise.all([
    getGmiCallLedger(currentEditionId),
    getGmiFalsificationRules(currentEditionId),
    getGmiPerformanceMetrics(currentEditionId),
  ]);

  const toRef = (r: typeof current): IssueRef | null =>
    r ? { id: r.id, title: r.title, decisionWindow: r.decisionWindow, href: r.publicHref ?? null, publicationTarget: r.publicationTarget ?? null } : null;

  return {
    props: {
      falsificationRules: falsification.data,
      performance: {
        ...performance.data,
        totalCallsIssued: calls.data.length,
      },
      currentIssue: toRef(current),
      upcomingIssue: toRef(upcoming),
      archiveIssues: archive.map((r) => toRef(r)).filter((x): x is IssueRef => x !== null),
    },
    revalidate: 1800,
  };
};

const GmiHomePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ falsificationRules, performance, currentIssue, upcomingIssue, archiveIssues }) => {
  const avgScore = performance.averageScore === null ? "-" : performance.averageScore.toFixed(1);
  return (
    <Layout
      title="Global Market Intelligence | Abraham of London"
      description="Market intelligence that tells you what would prove it wrong. GMI registers calls, scores outcomes, publishes evidence, and converts uncertainty into board decisions."
      canonicalUrl="/intelligence/gmi"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:image" content="https://www.abrahamoflondon.org/assets/images/covers/briefs/intelligence-briefs-cover.webp" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-12">
          {/* Hero — Falsification First */}
          <header className="border p-8" style={{ borderColor: "rgba(201,169,110,0.15)", backgroundColor: "rgba(201,169,110,0.03)" }}>
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Global Market Intelligence
            </p>
            <h1 className="mt-4 max-w-4xl" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 1.02 }}>
              Market intelligence that tells you what would prove it wrong.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58">
              GMI registers calls, scores outcomes, publishes evidence, and converts uncertainty into board decisions.
              Every thesis has a falsification condition. Every call has a review date. Every score has evidence.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/intelligence/gmi/calls" className="border px-5 py-2.5 text-xs uppercase tracking-[0.18em]" style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}>
                View the Call Ledger
              </Link>
              <Link href="/intelligence/gmi/falsification" className="border px-5 py-2.5 text-xs uppercase tracking-[0.18em]" style={{ ...mono, borderColor: `${BLUE}44`, color: BLUE, backgroundColor: `${BLUE}10` }}>
                See What Would Change Our View
              </Link>
              <Link href="/intelligence/gmi/operator-brief" className="border px-5 py-2.5 text-xs uppercase tracking-[0.18em]" style={{ ...mono, borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.65)" }}>
                Read the Operator Brief
              </Link>
              <Link href="/boardroom-brief" className="border px-5 py-2.5 text-xs uppercase tracking-[0.18em]" style={{ ...mono, borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.40)" }}>
                Get Boardroom Brief
              </Link>
            </div>
          </header>

          {/* Falsification Summary */}
          <div className="border p-6" style={{ borderColor: `${BLUE}20`, backgroundColor: `${BLUE}04` }}>
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: BLUE }}>
              What Would Change Our View
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              Every major thesis in GMI has a published falsification condition — an observable trigger that, if met, would require us to revise or abandon the view. This is not standard market intelligence practice. It is the core of GMI's accountability discipline.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {falsificationRules.slice(0, 4).map((rule) => (
                <div key={rule.id} className="border p-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">{rule.thesisId}</p>
                  <p className="mt-1 text-sm text-white/70">{rule.thesisStatement}</p>
                  <p className="mt-2 text-xs text-white/40 italic">Would be proved wrong if: {rule.falsificationCondition}</p>
                </div>
              ))}
            </div>
            <Link href="/intelligence/gmi/falsification" className="mt-4 inline-block font-mono text-[8px] uppercase tracking-[0.16em] text-white/50 transition hover:text-white">
              View full falsification register →
            </Link>
          </div>

          {/* Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Calls registered", value: performance.totalCallsIssued },
              { label: "Scored", value: performance.totalCallsReviewed },
              { label: "Average score", value: avgScore },
              { label: "Falsification rules", value: falsificationRules.length },
            ].map((m) => (
              <div key={m.label} className="border p-5" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="font-mono text-[7px] uppercase tracking-[0.16em] text-white/30">{m.label}</p>
                <p className="mt-2 font-serif text-3xl italic text-white/80">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Estate Integration */}
          <section className="border p-6" style={{ borderColor: `${GOLD}20`, backgroundColor: `${GOLD}04` }}>
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              GMI Estate
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              GMI sits above Intelligence Briefs as time-bound, scored, reviewed intelligence. It strengthens Boardroom Brief and Strategy Room by turning market uncertainty into named operator decisions with falsification conditions.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {GMI_ESTATE_INTEGRATION_MAP.map((item) => (
                <Link key={item.route} href={item.route} className="border border-white/8 bg-black/20 p-4 transition hover:bg-white/[0.035]">
                  <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{item.route}</p>
                  <p className="mt-2 text-xs leading-6 text-white/45">{item.role}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* Quarterly product line — current issue, archive, access model */}
          <section className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              The quarterly product line
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              Global Market Intelligence publishes on a quarterly release rhythm. Each issue registers
              calls with falsification conditions and is reviewed and scored after its decision window.
              The current issue is the active release; prior issues remain in the verified archive.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {currentIssue && (
                currentIssue.href ? (
                  <Link href={currentIssue.href} className="border border-white/8 bg-black/20 p-4 transition hover:bg-white/[0.035]">
                    <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>Current issue</p>
                    <p className="mt-2 text-sm text-white/70">{currentIssue.title}</p>
                    <p className="mt-1 text-xs leading-6 text-white/45">The current published issue. Current decision window: {currentIssue.decisionWindow}.</p>
                  </Link>
                ) : (
                  <div className="border border-white/8 bg-black/20 p-4">
                    <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>Current issue</p>
                    <p className="mt-2 text-sm text-white/70">{currentIssue.title}</p>
                    <p className="mt-1 text-xs leading-6 text-white/45">The current published issue. Current decision window: {currentIssue.decisionWindow}.</p>
                  </div>
                )
              )}
              {upcomingIssue && (
                <div className="border border-white/8 bg-black/20 p-4">
                  <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Forthcoming</p>
                  <p className="mt-2 text-sm text-white/70">{upcomingIssue.title}</p>
                  <p className="mt-1 text-xs leading-6 text-white/45">
                    Release candidate{upcomingIssue.publicationTarget ? ` — scheduled publication ${formatTargetDate(upcomingIssue.publicationTarget)}` : ""}. Not yet the current published issue.
                  </p>
                </div>
              )}
            </div>
            {archiveIssues.length > 0 && (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {archiveIssues.map((a) =>
                  a.href ? (
                    <Link key={a.id} href={a.href} className="border border-white/8 bg-black/20 p-4 transition hover:bg-white/[0.035]">
                      <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Verified archive</p>
                      <p className="mt-2 text-sm text-white/70">{a.title}</p>
                    </Link>
                  ) : (
                    <div key={a.id} className="border border-white/8 bg-black/20 p-4">
                      <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Verified archive</p>
                      <p className="mt-2 text-sm text-white/70">{a.title}</p>
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="border border-white/[0.06] p-4">
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Access model</p>
                <p className="mt-2 text-xs leading-6 text-white/50">Entitlement-controlled. Access to the current issue and the archive is governed by the GMI product family, not sold issue-by-issue by default.</p>
              </div>
              <div className="border border-white/[0.06] p-4">
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Distribution</p>
                <p className="mt-2 text-xs leading-6 text-white/50">Restricted distribution. Intelligence is shared under controlled access, not published as open market commentary.</p>
              </div>
              <div className="border border-white/[0.06] p-4">
                <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Not investment advice</p>
                <p className="mt-2 text-xs leading-6 text-white/50">GMI is decision intelligence under a call-review methodology. It is not investment advice and does not direct the allocation of capital.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiHomePage;
