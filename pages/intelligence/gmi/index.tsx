/* pages/intelligence/gmi/index.tsx — GMI Home: Falsification-First Positioning */
import * as React from "react";
import Link from "next/link";
import type { NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { GMI_METHODOLOGY } from "@/lib/intelligence/gmi-methodology";
import { buildGmiOperatorDashboard, GMI_ESTATE_INTEGRATION_MAP } from "@/lib/intelligence/gmi-instrument";
import { buildGmiFalsificationRegister } from "@/lib/intelligence/gmi-control-plane";
import { getPublicGmiCallLedger } from "@/lib/intelligence/gmi-instrument";

const GOLD = "#C9A96E";
const BLUE = "#7CB8E8";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const dashboard = buildGmiOperatorDashboard("GMI-Q2-2026");
const falsificationRules = buildGmiFalsificationRegister("GMI-Q2-2026");
const calls = getPublicGmiCallLedger();
const scoredCalls = calls.filter((c) => c.currentScore !== null);
const avgScore = scoredCalls.length > 0
  ? (scoredCalls.reduce((s, c) => s + (c.currentScore ?? 0), 0) / scoredCalls.length).toFixed(1)
  : "—";

const GmiHomePage: NextPage = () => {
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
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
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
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: BLUE }}>
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
              { label: "Calls registered", value: calls.length },
              { label: "Scored", value: scoredCalls.length },
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
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              GMI Estate
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              GMI sits above Intelligence Briefs as time-bound, scored, reviewed intelligence. It strengthens Boardroom Brief and Strategy Room by turning market uncertainty into named operator decisions with falsification conditions.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {GMI_ESTATE_INTEGRATION_MAP.map((item) => (
                <Link key={item.route} href={item.route} className="border border-white/8 bg-black/20 p-4 transition hover:bg-white/[0.035]">
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{item.route}</p>
                  <p className="mt-2 text-xs leading-6 text-white/45">{item.role}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiHomePage;