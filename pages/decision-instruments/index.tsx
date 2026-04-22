import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import { trackLanding, trackBundleClick } from "@/lib/analytics/journey-client";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const INSTRUMENTS = [
  {
    slug: "decision-exposure-instrument",
    title: "Decision Exposure Instrument",
    price: "\u00a329",
    outcome: "Quantifies the cost of being wrong before the market enforces it.",
    usedWhen: "Financial consequence is unclear but decision cannot wait.",
    time: "15 min",
  },
  {
    slug: "mandate-clarity-framework",
    title: "Mandate Clarity Framework",
    price: "\u00a349",
    outcome: "Defines who decides\u2014and where authority is breaking.",
    usedWhen: "Ownership is unclear or contested.",
    time: "20 min",
  },
  {
    slug: "intervention-path-selector",
    title: "Intervention Path Selector",
    price: "\u00a379",
    outcome: "Determines the correct action when inaction is no longer viable.",
    usedWhen: "Action is required but direction is unclear.",
    time: "15\u201325 min",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
        {children}
      </span>
    </div>
  );
}

function Rule() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DecisionInstrumentsPage() {
  React.useEffect(() => { trackLanding("/decision-instruments"); }, []);

  return (
    <Layout
      title="Decision Instruments | Abraham of London"
      description="Three instruments used under pressure to quantify exposure, define authority, and determine action."
      canonicalUrl="/decision-instruments"
    >
      <Head>
        <meta name="description" content="Decision instruments: structured tools used under pressure to quantify exposure, define authority, and determine action." />
      </Head>

      <div style={{ backgroundColor: VOID }}>

        {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="pt-14 pb-10 lg:pt-20 lg:pb-12">
              <Eyebrow>Decision Instruments</Eyebrow>
              <h1 style={{
                ...serif,
                marginTop: "0.85rem",
                fontSize: "clamp(1.9rem, 7vw, 3.2rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "36ch",
                fontStyle: "italic",
              }}>
                Make the decision before the market makes it for you.
              </h1>
              <p style={{
                ...serif,
                marginTop: "0.85rem",
                fontSize: "1rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.45)",
                maxWidth: "56ch",
              }}>
                Three instruments used under pressure to quantify exposure, define authority, and determine action.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <a
                  href="#instruments"
                  className="inline-flex items-center gap-2 transition-all duration-200"
                  style={{
                    padding: "9px 18px",
                    border: `1px solid ${AMBER}42`,
                    color: AMBER,
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${AMBER}65`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${AMBER}42`; }}
                >
                  View instruments
                  <ArrowRight style={{ width: 10, height: 10 }} />
                </a>
                <Link
                  href="/diagnostics/executive-reporting"
                  style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}
                >
                  Go to Executive Reporting (&pound;95)
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. POSITIONING STRIP ────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid gap-px md:grid-cols-3 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.04)" }}>
              {[
                { pre: "Not advice", post: "Structured decision tools" },
                { pre: "Not analysis", post: "Immediate use" },
                { pre: "Not content", post: "Outputs that force action" },
              ].map((item) => (
                <div key={item.pre} style={{ backgroundColor: VOID, padding: "0.85rem 1rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    {item.pre}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    {" \u2192 "}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                    {item.post}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. CORE GRID ────────────────────────────────────────────────── */}
        <section id="instruments">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10 lg:py-14">
              <p style={{ ...serif, fontSize: "0.85rem", color: "rgba(252,165,165,0.40)", fontStyle: "italic", marginBottom: "1rem" }}>
                If you cannot delay the decision, use one of these now.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {INSTRUMENTS.map((inst) => (
                  <div
                    key={inst.slug}
                    className="flex flex-col"
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      padding: "1.15rem",
                    }}
                  >
                    {/* Outcome first */}
                    <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
                      {inst.outcome}
                    </p>

                    {/* Title + price */}
                    <div className="mt-2 flex items-baseline justify-between gap-2">
                      <h3 style={{ ...serif, fontSize: "1.1rem", lineHeight: 1.12, color: "rgba(255,255,255,0.88)" }}>
                        {inst.title}
                      </h3>
                      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.30)", flexShrink: 0 }}>
                        {inst.price}
                      </span>
                    </div>

                    {/* Used when */}
                    <div style={{ marginTop: "0.6rem" }}>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        Used when
                      </span>
                      <p style={{ ...serif, marginTop: "0.15rem", fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.38)" }}>
                        {inst.usedWhen}
                      </p>
                    </div>

                    {/* Time */}
                    <div style={{ ...mono, marginTop: "0.5rem", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                      {inst.time}
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: "auto", paddingTop: "0.85rem" }}>
                      <Link
                        href={`/decision-instruments/${inst.slug}`}
                        onClick={() => trackBundleClick(inst.slug, parseInt(inst.price.replace(/\D/g, ""), 10) || 0)}
                        className="inline-flex w-full items-center justify-center gap-2 transition-all duration-200"
                        style={{
                          padding: "8px 14px",
                          border: `1px solid ${AMBER}30`,
                          color: AMBER,
                          ...mono,
                          fontSize: "7.5px",
                          letterSpacing: "0.20em",
                          textTransform: "uppercase",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${AMBER}55`; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${AMBER}30`; }}
                      >
                        Use instrument
                        <ArrowRight style={{ width: 9, height: 9 }} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Rule />

        {/* ── 4. BUNDLE PANEL ─────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10 lg:py-12">
              <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80` }}>
                      Operator Decision Pack
                    </div>
                    <div style={{ ...serif, marginTop: "0.35rem", fontSize: "0.92rem", color: "rgba(255,255,255,0.45)" }}>
                      Resolve the decision fully. Exposure, authority, and intervention in one pass.
                    </div>
                  </div>
                  <span style={{ ...mono, fontSize: "14px", letterSpacing: "0.04em", color: GOLD }}>&pound;129</span>
                </div>

                <div className="mt-2" style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.30)" }}>
                  Using one instrument without the others leaves the decision partially resolved. Partial resolution compounds risk.
                </div>

                <div className="mt-4">
                  <Link
                    href="/api/checkout?bundle=operator-decision-pack"
                    onClick={() => trackBundleClick("operator-decision-pack", 129)}
                    className="inline-flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "9px 18px",
                      border: `1px solid ${GOLD}35`,
                      backgroundColor: `${GOLD}08`,
                      color: GOLD,
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${GOLD}55`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                  >
                    Get the Operator Pack
                    <ArrowRight style={{ width: 10, height: 10 }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Rule />

        {/* ── 5. HOW THEY WORK ────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8 lg:py-10">
              <div className="grid gap-px md:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                {[
                  { n: "01", label: "Quantify exposure" },
                  { n: "02", label: "Resolve authority" },
                  { n: "03", label: "Select action" },
                ].map((step) => (
                  <div key={step.n} className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: VOID }}>
                    <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.06em", color: `${GOLD}45` }}>{step.n}</span>
                    <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Rule />

        {/* ── 6. SYSTEM BRIDGE ────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8 lg:py-10 flex flex-wrap items-center justify-between gap-4">
              <p style={{ ...serif, fontSize: "0.92rem", color: "rgba(255,255,255,0.40)", maxWidth: "44ch" }}>
                Used independently or as inputs into Executive Reporting.
              </p>
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 transition-all duration-200"
                style={{
                  padding: "9px 18px",
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}06`,
                  color: GOLD,
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.20em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${GOLD}50`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${GOLD}30`; }}
              >
                Executive Reporting &middot; &pound;95
                <ArrowRight style={{ width: 10, height: 10 }} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── BACK ────────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8">
              <Link href="/" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                Back to home
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
