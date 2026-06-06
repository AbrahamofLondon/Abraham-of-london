import * as React from "react";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import { GMI_METHODOLOGY } from "@/lib/intelligence/gmi-methodology";
import { buildGmiOperatorDashboard, GMI_ESTATE_INTEGRATION_MAP } from "@/lib/intelligence/gmi-instrument";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const dashboard = buildGmiOperatorDashboard("GMI-Q2-2026");

const GmiHomePage: NextPage = () => {
  return (
    <Layout
      title="Global Market Intelligence | Abraham of London"
      description="A verifiable macro intelligence instrument with call review, evidence posture, falsification thresholds, and operator decisions."
      canonicalUrl="/intelligence/gmi"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Global Market Intelligence
            </p>
            <h1 className="mt-3 max-w-4xl" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.5rem)", lineHeight: 1.02 }}>
              Verifiable macro intelligence for operator decisions.
            </h1>
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58">
              {GMI_METHODOLOGY.principle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/intelligence/gmi/operator-brief" className="border border-[#C9A96E]/35 bg-[#C9A96E]/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#E6C98C]" style={mono}>
                Read operator brief
              </Link>
              <Link href="/intelligence/gmi/calls" className="border border-white/12 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/65" style={mono}>
                Inspect call ledger
              </Link>
              <Link href="/intelligence/gmi/methodology" className="border border-white/12 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/65" style={mono}>
                View methodology
              </Link>
            </div>
          </header>

          <section className="grid gap-5 md:grid-cols-3">
            {[
              { label: "Watch signals", value: dashboard.watchSignals.length, text: "Named triggers with evidence posture and action if triggered." },
              { label: "Board decisions", value: dashboard.boardDecisions.length, text: "Specific operating decisions routed to the right product layer." },
              { label: "Prior-call record", value: dashboard.priorCallSummary.totalCalls, text: "Calls registered for review rather than buried in past reports." },
            ].map((item) => (
              <article key={item.label} className="border border-white/10 bg-white/[0.015] p-5">
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>{item.label}</p>
                <p className="mt-3 text-3xl font-light text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-white/48">{item.text}</p>
              </article>
            ))}
          </section>

          <section className="border border-[#C9A96E]/20 bg-[#C9A96E]/[0.04] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Estate integration
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">
              GMI sits above Intelligence Briefs as time-bound, scored, reviewed intelligence. It strengthens Boardroom Brief and Strategy Room by turning market uncertainty into named operator decisions.
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

