import * as React from "react";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import { buildGmiBoardPulse } from "@/lib/intelligence/gmi-control-plane";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const pulse = buildGmiBoardPulse("GMI-Q2-2026");

const GmiBoardPulsePage: NextPage = () => {
  return (
    <Layout
      title="GMI Board Pulse | Abraham of London"
      description="The public executive one-page signal for Global Market Intelligence."
      canonicalUrl="/intelligence/gmi/board-pulse"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-[#C9A96E]/20 bg-[#C9A96E]/[0.04] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Board pulse
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              {pulse.currentThesis}
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.18em] text-white/38" style={mono}>
              Last updated {pulse.lastUpdatedTimestamp}
            </p>
          </header>

          <section className="grid gap-3 md:grid-cols-6">
            {pulse.operatorConsequenceIndex.map((item) => (
              <article key={item.dimension} className="border border-white/10 bg-white/[0.015] p-4">
                <p className="text-[8px] uppercase tracking-[0.14em] text-white/34" style={mono}>{item.dimension}</p>
                <p className="mt-3 text-3xl font-light text-[#E6C98C]">{item.score}</p>
                <p className="mt-2 text-xs leading-5 text-white/45">{item.decisionImplication}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <h2 className="font-serif text-xl text-white">Three Watch Signals</h2>
              <div className="mt-4 space-y-3">
                {pulse.watchSignals.map((signal) => (
                  <p key={signal.signal} className="text-sm leading-6 text-white/58">{signal.signal}: {signal.triggerThreshold}</p>
                ))}
              </div>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-5 lg:col-span-2">
              <h2 className="font-serif text-xl text-white">Five Board Decisions</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {pulse.boardDecisions.map((decision) => (
                  <div key={decision.decision} className="border border-white/8 bg-black/20 p-3">
                    <p className="text-sm leading-6 text-white/65">{decision.decision}</p>
                    <p className="mt-2 text-xs leading-5 text-white/38">{decision.suggestedOwner} · {decision.route}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <article className="border border-rose-500/15 bg-rose-500/[0.04] p-5">
              <p className="text-[8px] uppercase tracking-[0.18em] text-rose-100/50" style={mono}>Top falsification risk</p>
              <h2 className="mt-2 font-serif text-xl text-white">{pulse.topFalsificationRisk?.thesisStatement ?? "No rule registered"}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{pulse.whatWouldChangeTheView}</p>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <p className="text-[8px] uppercase tracking-[0.18em] text-white/34" style={mono}>Call ledger performance snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <p className="text-sm text-white/58">Calls issued: {pulse.performanceSnapshot.totalCallsIssued}</p>
                <p className="text-sm text-white/58">Reviewed: {pulse.performanceSnapshot.reviewedCallPercentage}%</p>
                <p className="text-sm text-white/58">Confirmed: {pulse.performanceSnapshot.confirmedCount}</p>
                <p className="text-sm text-white/58">Carry-forward: {pulse.performanceSnapshot.pendingCarryForwardCount}</p>
              </div>
            </article>
          </section>

          <section className="flex flex-wrap gap-3 border border-white/10 bg-black/25 p-5">
            {pulse.ctas.map((cta) => (
              <Link key={cta.href} href={cta.href} className="border border-white/12 bg-white/[0.03] px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-white/65" style={mono}>
                {cta.label}
              </Link>
            ))}
            <Link href="/api/gmi/board-pack?edition=GMI-Q2-2026&format=board-pulse-pdf" className="border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-[#E6C98C]" style={mono}>
              Download pulse PDF
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiBoardPulsePage;
