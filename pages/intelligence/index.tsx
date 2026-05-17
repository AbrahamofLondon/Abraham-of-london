import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const cards = [
  {
    title: "Memory",
    body: "Decision memory: what changed, what carried forward, and what the record now knows.",
    href: "/intelligence/memory",
  },
  {
    title: "Contradictions",
    body: "Contradiction visibility: user-safe signals where the record no longer agrees with itself.",
    href: "/intelligence/contradictions",
  },
  {
    title: "Market",
    body: "Market reading: public briefs, restricted intelligence lines, and quarterly governed artifacts.",
    href: "/intelligence/market",
  },
  {
    title: "Reports",
    body: "Structured reports: intelligence products tied to identity, access, and governed use.",
    href: "/intelligence/reports",
  },
] as const;

const IntelligenceIndexPage: NextPage = () => {
  return (
    <Layout
      title="Intelligence | Abraham of London"
      description="Decision intelligence, memory, contradictions, and market reading."
      canonicalUrl="/intelligence"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Intelligence</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Intelligence is not the accumulation of information.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              It is the disciplined reading of consequence before consequence becomes unavoidable.
              This estate is for leaders, operators, boards, founders, and institutions working through
              decisions that should not be reduced to generic commentary or noise.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/42">
              If you are new here, begin with the featured public brief below. If it names a live
              condition, move from reading into governed action.
            </p>
          </header>

          <section
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]"
            aria-label="Featured intelligence entry"
          >
            <div className="border border-white/10 bg-white/[0.015] p-5">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                How to read the estate
              </p>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">
                Read Intelligence as a diagnostic field, not a feed. Its value is not novelty.
                Its value is recognising the pressure already forming around a consequential decision.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Recognise the pattern",
                    body: "Name the pressure before it becomes structure.",
                    href: "/tools/decision-delay-exposure",
                  },
                  {
                    title: "Test one real decision",
                    body: "Use a diagnostic when recognition becomes case-worthy.",
                    href: "/diagnostics/fast",
                  },
                  {
                    title: "Preserve it as a governed case",
                    body: "Decision Centre is where the record continues.",
                    href: "/decision-centre",
                  },
                ].map((step) => (
                  <Link
                    key={step.title}
                    href={step.href}
                    className="border border-white/8 bg-black/20 p-4 transition hover:bg-white/[0.03]"
                  >
                    <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                      {step.title}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-white/42">{step.body}</p>
                  </Link>
                ))}
              </div>
            </div>

            <article className="border border-[#C9A96E]/25 bg-[#C9A96E]/[0.045] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border border-[#C9A96E]/30 bg-[#C9A96E]/10 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-[#E6C98C]" style={mono}>
                  Start here
                </span>
                <span className="border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[8px] uppercase tracking-[0.2em] text-emerald-200" style={mono}>
                  Public intelligence
                </span>
              </div>
              <h2 className="mt-4 font-serif text-2xl leading-tight text-white">
                When Delay Becomes a Governance Cost
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/58">
                A public decision-intelligence brief on how unresolved decisions create hidden governance cost,
                execution drag, and avoidable exposure before they become visible failures.
              </p>
              <Link
                href="/intelligence/decision-delay-governance-cost"
                className="mt-5 inline-flex items-center gap-2 text-sm transition hover:opacity-80"
                style={{ color: `${GOLD}DD` }}
              >
                <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                  Read public intelligence
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
              >
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{card.body}</p>
              </Link>
            ))}
          </section>

          <nav className="flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-5 text-sm text-white/45" aria-label="Secondary intelligence links">
            <Link href="/library" className="transition hover:text-white">Library</Link>
            <Link href="/intelligence/market" className="transition hover:text-white">Market Intelligence</Link>
            <Link href="/provenance/demo" className="transition hover:text-white">Provenance Demo</Link>
            <Link href="/trust" className="transition hover:text-white">Trust Center</Link>
          </nav>
        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceIndexPage;
