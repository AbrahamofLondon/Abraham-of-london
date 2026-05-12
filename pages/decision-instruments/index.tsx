// accessPosture: Free signal (open entry) or Paid instrument (gated by checkout)
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import CheckoutButton from "@/components/commercial/CheckoutButton";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";
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
  // ── Exposure & Risk ──
  {
    slug: "decision-exposure-instrument",
    title: "Decision Exposure Instrument",
    price: getProductDisplayPrice("decision_exposure_instrument"),
    outcome: "Quantifies the cost of being wrong before the market enforces it.",
    usedWhen: "Financial consequence is unclear but decision cannot wait.",
    time: "8 min",
    category: "Exposure & Risk",
  },
  {
    slug: "escalation-readiness-scorecard",
    title: "Escalation Readiness Scorecard",
    price: getProductDisplayPrice("escalation_readiness_scorecard"),
    outcome: "Classifies whether escalation is premature, warranted, or overdue.",
    usedWhen: "Escalation is considered but evidence is unclear.",
    time: "6 min",
    category: "Exposure & Risk",
  },
  {
    slug: "structural-failure-diagnostic-canvas",
    title: "Structural Failure Diagnostic Canvas",
    price: getProductDisplayPrice("structural_failure_diagnostic_canvas"),
    outcome: "Identifies whether the issue is structural or symptomatic.",
    usedWhen: "Problems recur despite repeated fixes.",
    time: "8 min",
    category: "Exposure & Risk",
  },
  {
    slug: "execution-risk-index",
    title: "Execution Risk Index",
    price: getProductDisplayPrice("execution_risk_index"),
    outcome: "Measures whether a decision can survive execution reality.",
    usedWhen: "Execution keeps failing despite approval.",
    time: "10 min",
    category: "Exposure & Risk",
  },

  // ── Alignment & Authority ──
  {
    slug: "team-alignment-gap-map",
    title: "Decision Alignment Gap Map",
    price: getProductDisplayPrice("team_alignment_gap_map"),
    outcome: "Maps where decision owners and operators diverge on reality.",
    usedWhen: "Agreement is assumed but actions diverge.",
    time: "10 min",
    category: "Alignment & Authority",
  },
  {
    slug: "mandate-clarity-framework",
    title: "Mandate Clarity Framework",
    price: getProductDisplayPrice("mandate_clarity_framework"),
    outcome: "Defines who decides\u2014and where authority is breaking.",
    usedWhen: "Ownership is unclear or contested.",
    time: "12 min",
    category: "Alignment & Authority",
  },
  {
    slug: "governance-drift-detector",
    title: "Governance Drift Detector",
    price: getProductDisplayPrice("governance_drift_detector"),
    outcome: "Detects whether governance is drifting from declared standards.",
    usedWhen: "Quarterly governance health review.",
    time: "12 min",
    category: "Alignment & Authority",
  },
  {
    slug: "strategic-priority-stack-builder",
    title: "Strategic Priority Stack Builder",
    price: getProductDisplayPrice("strategic_priority_stack_builder"),
    outcome: "Converts competing priorities into a governed execution sequence.",
    usedWhen: "Priority conflicts block execution.",
    time: "15 min",
    category: "Alignment & Authority",
  },

  // ── Board & Execution Grade ──
  {
    slug: "intervention-path-selector",
    title: "Intervention Path Selector",
    price: getProductDisplayPrice("intervention_path_selector"),
    outcome: "Determines the correct action when inaction is no longer viable.",
    usedWhen: "Action is required but direction is unclear.",
    time: "15 min",
    category: "Board & Execution Grade",
  },
  {
    slug: "board-brief-builder",
    title: "Board Brief Builder",
    price: getProductDisplayPrice("board_brief_builder"),
    outcome: "Produces a board-ready decision brief with structured objection handling.",
    usedWhen: "A decision must go to the board.",
    time: "20 min",
    category: "Board & Execution Grade",
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
      description="Ten governed instruments that score, classify, and map decision conditions. Each writes to institutional memory."
      canonicalUrl="/decision-instruments"
    >
      <Head>
        <meta name="description" content="Ten governed decision instruments that score, classify, and map decision conditions. Each writes to institutional memory and earns the next step." />
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
                Ten governed instruments that score exposure, classify authority, detect drift, rank priorities, and prepare board-ready briefs. Each writes to institutional memory.
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
                  href="/decision-instruments/signal"
                  style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}
                >
                  Free Decision Signal
                </Link>
                <Link
                  href="/decision-instruments/history"
                  style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}
                >
                  Your instrument history
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
                { pre: "Not advice", post: "Structured decision instruments" },
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

        {/* ── P3: SIGNAL PRIMER — What this system names and recognises ─── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12 py-8">
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "1rem" }}>
              What this system names and acts on
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  severity: "CRITICAL",
                  color: "rgba(239,68,68,0.70)",
                  bg: "rgba(239,68,68,0.04)",
                  condition: "Decision exposure compounding",
                  tag: "Unresolved cost is accumulating faster than correction is being applied — the window is narrowing.",
                },
                {
                  severity: "ALERT",
                  color: "rgba(249,115,22,0.68)",
                  bg: "rgba(249,115,22,0.04)",
                  condition: "Authority misalignment detected",
                  tag: "The mandate to act and the authority to act are not aligned — decisions made in this state carry delegation risk.",
                },
                {
                  severity: "CONCERN",
                  color: "rgba(251,191,36,0.65)",
                  bg: "rgba(251,191,36,0.03)",
                  condition: "Governance drift active",
                  tag: "Decision processes have drifted outside their designed boundaries — correction is achievable but the window narrows.",
                },
                {
                  severity: "WATCH",
                  color: "rgba(110,231,183,0.55)",
                  bg: "rgba(110,231,183,0.025)",
                  condition: "Structural health confirmed",
                  tag: "Fundamentals are within functional range — the instrument confirms trajectory and identifies the next maintenance requirement.",
                },
              ].map(({ severity, color, bg, condition, tag }) => (
                <div key={severity} style={{ border: `1px solid ${color}20`, backgroundColor: bg, padding: "0.85rem 1rem" }}>
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color, marginBottom: "0.4rem" }}>{severity}</p>
                  <p style={{ ...serif, fontSize: "0.9rem", lineHeight: 1.35, color: "rgba(255,255,255,0.78)", marginBottom: "0.4rem" }}>{condition}</p>
                  <p style={{ fontSize: "11px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>{tag}</p>
                </div>
              ))}
            </div>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)", marginTop: "0.75rem" }}>
              Each instrument returns a named condition, consequence path, and next admissible move — not a score alone.
            </p>
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
                      <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.04em", color: "#C9A96E", flexShrink: 0 }}>
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
                  <span style={{ ...mono, fontSize: "14px", letterSpacing: "0.04em", color: GOLD }}>{getProductDisplayPrice("operator_decision_pack")}</span>
                </div>

                <div className="mt-2" style={{ ...serif, fontSize: "0.82rem", color: "rgba(255,255,255,0.30)" }}>
                  Using one instrument without the others leaves the decision partially resolved. Partial resolution compounds risk.
                </div>

                <div className="mt-4">
                  <CheckoutButton
                    productCode="operator_decision_pack"
                    originPath="/decision-instruments"
                    onCheckoutStart={() => trackBundleClick("operator_decision_pack", 129)}
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
                  </CheckoutButton>
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
                Executive Reporting &middot; {getProductDisplayPrice("executive_reporting")}
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
