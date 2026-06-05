/* pages/editorials/intelligence-briefs.tsx
   Editorial front door for the Intelligence Briefs.
   Shows thesis, launch collection, current cluster, reading path.
   Does NOT render all 50 briefs. */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { trackBriefSeriesViewed } from "@/lib/analytics/briefs-analytics";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─── Launch Collection (S1 — 8 briefs) ───────────────────────────────────────

const LAUNCH_SET = [
  {
    id: "IA-003",
    series: "institutional-alpha",
    title: "The Hidden Cost of Flattering Data",
    description: "How polished reporting, softened escalations, and status-preserving summaries distort executive judgment.",
    href: "/briefs/institutional-alpha-the-hidden-cost-of-flattering-data",
    accent: "#7CB8E8",
  },
  {
    id: "IA-021",
    series: "institutional-alpha",
    title: "Why Executive Summaries Mislead",
    description: "The hidden risks of executive-summary culture and what it costs when decision-critical nuance disappears.",
    href: "/briefs/institutional-alpha-why-executive-summaries-mislead",
    accent: "#7CB8E8",
  },
  {
    id: "IA-045",
    series: "institutional-alpha",
    title: "Why Leaders Stop Hearing Reality",
    description: "The gradual conditions that cause leaders to lose accurate contact with what is operationally true.",
    href: "/briefs/institutional-alpha-why-leaders-stop-hearing-reality",
    accent: "#7CB8E8",
  },
  {
    id: "IA-069",
    series: "institutional-alpha",
    title: "When the Board Sees a Different Company",
    description: "Board-level intelligence drift and the risks of briefing directors on a company that no longer exists in practice.",
    href: "/briefs/institutional-alpha-when-the-board-sees-a-different-company",
    accent: "#7CB8E8",
  },
  {
    id: "SI-002",
    series: "sovereign-intelligence",
    title: "Dependence Disguised as Partnership",
    description: "The slow loss of sovereign leverage when critical relationships become dependencies masquerading as normal partnership.",
    href: "/briefs/sovereign-intelligence-dependence-disguised-as-partnership",
    accent: "#9B8EC4",
  },
  {
    id: "SI-017",
    series: "sovereign-intelligence",
    title: "Alignment Without Sovereignty",
    description: "How organisations can look aligned externally while real decision ownership has dissolved into ambiguity or appeasement.",
    href: "/briefs/sovereign-intelligence-alignment-without-sovereignty",
    accent: "#9B8EC4",
  },
  {
    id: "SI-038",
    series: "sovereign-intelligence",
    title: "The Vulnerability of Narrative Capture",
    description: "How media, investor, and stakeholder narratives quietly become an institution's real operating master.",
    href: "/briefs/sovereign-intelligence-the-vulnerability-of-narrative-capture",
    accent: "#9B8EC4",
  },
  {
    id: "SI-065",
    series: "sovereign-intelligence",
    title: "Why Power Concentrates Around the Decisive",
    description: "The way decisive people and centres of clarity accumulate authority, whether governance intends it or not.",
    href: "/briefs/sovereign-intelligence-why-power-concentrates-around-the-decisive",
    accent: "#9B8EC4",
  },
];

// ─── Reading path ─────────────────────────────────────────────────────────────

const READING_PATH = [
  { step: "1", label: "Start with the Evidence Base", sub: "Read the launch set of 8 briefs.", href: null },
  { step: "2", label: "Explore a series", sub: "Go deep on Institutional Alpha or Sovereign Intelligence.", href: null },
  { step: "3", label: "Read the Foundational Canon", sub: "The doctrine from which the briefs derive their standards.", href: "/vault/briefs" },
  { step: "4", label: "Run a Diagnostic", sub: "Apply the framework to your institution through Decision Infrastructure.", href: "/diagnostic" },
  { step: "5", label: "Join the Inner Circle", sub: "Where the Canon and Evidence Base are applied to real cases.", href: "/inner-circle" },
];

// ─── Series ───────────────────────────────────────────────────────────────────

const SERIES = [
  {
    id: "institutional-alpha",
    label: "Institutional Alpha",
    count: 25,
    accent: "#7CB8E8",
    cluster: "Reporting Integrity · Leadership Intelligence · Decision Infrastructure",
    description: "Examines the conditions under which institutional intelligence fails — how reporting decays, confidence misreads aggregated data, and the discipline required to produce decision-grade insight.",
    href: "/briefs/institutional-alpha",
  },
  {
    id: "sovereign-intelligence",
    label: "Sovereign Intelligence",
    count: 25,
    accent: "#9B8EC4",
    cluster: "Sovereignty Structure · Institutional Identity · Power and Influence",
    description: "Examines the structural conditions that erode institutional sovereignty — dependence, narrative capture, outsourced judgment, and the discipline required to govern from a position of real autonomy.",
    href: "/briefs/sovereign-intelligence",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const IntelligenceBriefsEditorialPage: NextPage = () => {
  React.useEffect(() => {
    trackBriefSeriesViewed("editorial-front-door");
  }, []);

  return (
    <Layout
      title="Intelligence Briefs | Abraham of London Editorial"
      description="The editorial thesis behind the Abraham of London Intelligence Briefs — 50 public analytical briefs proving the diagnostic method across Institutional Alpha and Sovereign Intelligence."
      canonicalUrl="/editorial/intelligence-briefs"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href="/editorial/intelligence-briefs" />
      </Head>

      <main className="min-h-screen px-6 py-24 text-white" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-5xl space-y-20">

          {/* ── Editorial header ──────────────────────────────────── */}
          <header className="border-b border-white/10 pb-14">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.3em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Abraham of London — Editorial
            </p>
            <h1 className="mt-5" style={{ ...serif, fontSize: "clamp(2rem,5vw,3.5rem)", color: "rgba(255,255,255,0.92)", lineHeight: 1.15 }}>
              Intelligence Briefs
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">
              50 public analytical briefs. Two series of 25. Each brief examines a specific pattern
              of institutional failure, sovereign exposure, or decision-intelligence breakdown — drawn
              from the diagnostic framework used across Abraham of London engagements.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/45">
              Intelligence Briefs are the public evidence base. Vault sequences such as Frontier
              Resilience sit inside the Vault as structured framework material.
            </p>
          </header>

          {/* ── Editorial thesis ──────────────────────────────────── */}
          <section className="grid gap-10 md:grid-cols-2">
            <div>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "1rem" }}>
                Why these briefs exist
              </p>
              <h2 style={{ ...serif, fontSize: "1.5rem", color: "rgba(255,255,255,0.88)" }}>
                Public content proves authority.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/55">
                These briefs make the diagnostic visible. Not to give away the application, but to
                demonstrate that the method is rigorous, named, and repeatable. A reader who studies
                these briefs understands what kind of institution Abraham of London is built to work
                with — and what categories of failure it is built to find.
              </p>
            </div>
            <div>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "1rem" }}>
                What remains restricted
              </p>
              <h2 style={{ ...serif, fontSize: "1.5rem", color: "rgba(255,255,255,0.88)" }}>
                Restricted access delivers application.
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/55">
                The briefs diagnose the pattern. The Inner Circle is where the pattern is applied to
                specific institutions, families, and leaders — through private diagnostics, scorecards,
                case interpretation, and implementation paths. Joining the Inner Circle does not give
                you more essays. It gives you the framework applied to your situation.
              </p>
            </div>
          </section>

          {/* ── Launch collection ─────────────────────────────────── */}
          <section>
            <div className="mb-8">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}BB`, marginBottom: "0.5rem" }}>
                Launch Collection
              </p>
              <h2 style={{ ...serif, fontSize: "1.8rem", color: "rgba(255,255,255,0.9)" }}>
                8 briefs. Two series. One diagnostic method.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-white/48">
                These are the 8 strongest authority-demonstration briefs from across the series.
                Start here.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {LAUNCH_SET.map((brief) => (
                <Link
                  key={brief.id}
                  href={brief.href}
                  className="block border border-white/10 bg-white/[0.015] p-5 transition hover:bg-white/[0.025]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="border px-2 py-0.5 text-[7px] uppercase tracking-[0.18em]"
                      style={{ ...mono, borderColor: `${brief.accent}30`, backgroundColor: `${brief.accent}10`, color: brief.accent }}
                    >
                      {brief.series === "institutional-alpha" ? "Institutional Alpha" : "Sovereign Intelligence"}
                    </span>
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                      {brief.id}
                    </span>
                  </div>
                  <h3 className="mt-3 font-serif text-lg leading-tight text-white">{brief.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-white/50">{brief.description}</p>
                  <span
                    className="mt-3 inline-flex items-center gap-1.5"
                    style={{ ...mono, fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}BB` }}
                  >
                    Read brief <span>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Two series ────────────────────────────────────────── */}
          <section>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "1.5rem" }}>
              The Two Series
            </p>
            <div className="space-y-5">
              {SERIES.map((s) => (
                <Link
                  key={s.id}
                  href={s.href}
                  className="block border border-white/10 bg-white/[0.015] p-7 transition hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: s.accent }}>
                          {s.count} briefs
                        </p>
                        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                          {s.cluster}
                        </span>
                      </div>
                      <h3 className="mt-3 font-serif text-2xl text-white">{s.label}</h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">{s.description}</p>
                    </div>
                    <span style={{ color: `${GOLD}CC`, fontSize: "18px", flexShrink: 0 }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Reading path ──────────────────────────────────────── */}
          <section>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", marginBottom: "1.5rem" }}>
              Reading path
            </p>
            <div className="space-y-3">
              {READING_PATH.map((item) => (
                <div key={item.step} className="flex items-start gap-5 border border-white/8 bg-white/[0.01] p-4">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center border border-white/15 font-mono text-[10px] text-white/40"
                  >
                    {item.step}
                  </span>
                  <div className="flex-1">
                    <p className="font-serif text-base text-white/85">{item.label}</p>
                    <p className="mt-0.5 text-sm text-white/42">{item.sub}</p>
                  </div>
                  {item.href ? (
                    <Link
                      href={item.href}
                      style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99`, flexShrink: 0 }}
                      className="self-center transition hover:opacity-80"
                    >
                      Go →
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          {/* ── Canon bridge ──────────────────────────────────────── */}
          <section className="border border-white/10 bg-white/[0.02] p-7">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "1rem" }}>
              Foundational Canon
            </p>
            <h2 style={{ ...serif, fontSize: "1.5rem", color: "rgba(255,255,255,0.88)" }}>
              The standard these briefs measure against
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
              The 12 Pillar Briefs establish the doctrine, standards, and worldview that underwrite
              the diagnostic criteria in every Intelligence Brief. The evidence base gains full force
              within the Canon's framework of order, sovereignty, and institutional health. Vault
              sequences such as Frontier Resilience preserve structured application material rather
              than public diagnostic evidence.
            </p>
            <Link
              href="/vault/briefs"
              className="mt-6 inline-flex items-center gap-2 border border-white/15 px-5 py-2.5 text-white/65 transition hover:border-white/30 hover:text-white"
              style={mono}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Explore the Canon</span>
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          {/* ── Inner Circle ──────────────────────────────────────── */}
          <section className="border border-white/10 bg-white/[0.02] p-7">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "1rem" }}>
              Inner Circle
            </p>
            <h2 style={{ ...serif, fontSize: "1.5rem", color: "rgba(255,255,255,0.88)" }}>
              Diagnosis is public. Application is not.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
              Public briefs identify the pattern. Inner Circle membership is where the framework is
              applied — to your institution, household, or leadership situation — through private
              diagnostics, scorecards, case interpretation, implementation paths, and live briefings.
              The value is not in recognising the pattern. It is in knowing whether you carry it,
              and what to do about it.
            </p>
            <Link
              href="/inner-circle"
              className="mt-6 inline-flex items-center gap-2 border px-5 py-2.5 transition hover:opacity-90"
              style={{ ...mono, borderColor: `${GOLD}40`, color: `${GOLD}DD` }}
            >
              <span style={{ fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Join Inner Circle</span>
              <span aria-hidden="true">→</span>
            </Link>
          </section>

          {/* ── Footer nav ────────────────────────────────────────── */}
          <footer className="grid gap-5 border-t border-white/10 pt-8 md:grid-cols-4">
            {[
              { label: "Full Library", href: "/briefs", sub: "Intelligence Briefs" },
              { label: "Institutional Alpha", href: "/briefs/institutional-alpha", sub: "Series I · 25 briefs" },
              { label: "Sovereign Intelligence", href: "/briefs/sovereign-intelligence", sub: "Series II · 25 briefs" },
              { label: "Foundational Canon", href: "/vault/briefs", sub: "12 pillars · vault sequences" },
            ].map(({ label, href, sub }) => (
              <Link key={href} href={href} className="border border-white/10 p-4 transition hover:bg-white/[0.02]">
                <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.4rem" }}>
                  {sub}
                </p>
                <p style={{ ...serif, fontSize: "1rem", color: "rgba(255,255,255,0.82)" }}>{label} →</p>
              </Link>
            ))}
          </footer>

        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceBriefsEditorialPage;
