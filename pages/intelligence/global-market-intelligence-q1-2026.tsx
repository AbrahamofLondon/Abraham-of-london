// pages/intelligence/global-market-intelligence-q1-2026.tsx
// The highest-authority intelligence surface on the platform.
// Design: Sovereign Research Desk — The Economist meets a private briefing room.
// Every element signals institutional weight. Nothing decorative that doesn't earn its place.
// Typography: Cormorant Garamond display · JetBrains Mono data labels
// Palette: Deep navy base (#070E18) · softGold (#C9A96E) accent · precision opacity steps

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Globe,
  Lock,
  Scale,
  ShieldCheck,
  TrendingUp,
  Building2,
  LineChart,
  Landmark,
  Presentation,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Compass,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const ROUTES = {
  publicBrief:          "/artifacts/global-market-outlook-q1-2026-public",
  institutionalEdition: "/artifacts/global-market-intelligence-report-q1-2026",
  boardDeck:            "/artifacts/global-market-intelligence-board-deck-q1-2026",
  boardroomPdf:         "/artifacts/global-market-intelligence-report-q1-2026",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD   = "#C9A96E";
const BASE   = "#070E18";   // deep navy — intelligence desk base
const LIFT   = "#0B1523";   // lifted surface
const VOID   = "#040A12";   // deepest layer

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.80, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

const stagger = (d = 0.10) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={cn("h-px w-full", soft
      ? "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "bg-gradient-to-r from-transparent via-[#C9A96E]/32 to-transparent"
    )} />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}60` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8px",
        letterSpacing: "0.42em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA — SCENARIO PROBABILITIES
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id:   "A",
    label: "De-escalation",
    prob: 18,
    body: "Rapid bilateral concessions. Tariffs reduced below ~50%. Requires political will that current signals do not support.",
    tone: "low",
  },
  {
    id:   "B",
    label: "Managed fragmentation",
    prob: 43,
    body: "Base case. Elevated tariffs persist. Slow supply-chain restructuring. Extended monetary constraint. Markets reprice to new normal.",
    tone: "base",
  },
  {
    id:   "C",
    label: "Escalation spiral",
    prob: 27,
    body: "Broader retaliation cycles. Secondary sanctions risk. Systemic credit stress. Equity correction deepens beyond Q1 levels.",
    tone: "high",
  },
  {
    id:   "D",
    label: "Confidence fracture",
    prob: 12,
    body: "Non-linear systemic event. Dollar reserve status questioned. Coordinated institutional response required.",
    tone: "critical",
  },
] as const;

const MACRO_SIGNALS = [
  { label: "Global growth revised",    value: "~2.5–2.8%",  sub: "IMF revisions Q1",             icon: TrendingUp,  warn: true  },
  { label: "US recession probability", value: "40–60%",      sub: "12-month window, inst. median", icon: BarChart3,   warn: true  },
  { label: "S&P 500 correction",       value: "~10–12%",     sub: "From recent highs, early Apr",  icon: LineChart,   warn: true  },
  { label: "US 10yr yield",            value: "~4.5%",       sub: "Intraday peak, April 2026",     icon: Scale,       warn: false },
  { label: "US tariffs on China",      value: "145%",        sub: "Effective rate, April 2026",    icon: AlertTriangle, warn: true },
  { label: "China tariffs on US",      value: "125%",        sub: "Retaliatory rate",              icon: AlertTriangle, warn: true },
] as const;

const EDITIONS = [
  {
    eyebrow: "Public Brief",
    title:   "Global Market Outlook Q1 2026",
    body:    "A refined public reading for serious readers who want the shape of the quarter without the full institutional edge.",
    href:    ROUTES.publicBrief,
    cta:     "Read public brief",
    icon:    FileText,
    primary: true,
    gold:    false,
  },
  {
    eyebrow: "Institutional Edition",
    title:   "Full intelligence briefing",
    body:    "The £59 decision-support intelligence brief for operators navigating structural fragmentation. Full country analysis, scenarios, board actions, and case evidence.",
    href:    ROUTES.institutionalEdition,
    cta:     "Unlock decision brief",
    icon:    Lock,
    primary: false,
    gold:    true,
  },
  {
    eyebrow: "Board Briefing Deck",
    title:   "Executive presentation",
    body:    "A premium deck for board presentation flow, executive framing, and rapid internal circulation.",
    href:    ROUTES.boardDeck,
    cta:     "Board deck",
    icon:    Presentation,
    primary: false,
    gold:    false,
  },
  {
    eyebrow: "Boardroom PDF",
    title:   "Portable executive copy",
    body:    "A clean boardroom PDF for portability, quick circulation, and leadership review.",
    href:    ROUTES.boardroomPdf,
    cta:     "Boardroom PDF",
    icon:    Scale,
    primary: false,
    gold:    false,
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
      {/* Atmospheric layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Primary gold nebula */}
        <div className="absolute" style={{
          left: "-5%", top: "-8%",
          width: "800px", height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${GOLD}14 0%, ${GOLD}06 28%, ${GOLD}02 50%, transparent 70%)`,
          filter: "blur(130px)",
        }} />
        {/* Cool white nebula right */}
        <div className="absolute" style={{
          right: "0%", top: "10%",
          width: "500px", height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 65%)",
          filter: "blur(110px)",
        }} />
        {/* Bottom fill */}
        <div className="absolute inset-x-0 bottom-0 h-40" style={{
          background: `linear-gradient(to top, ${BASE}, transparent)`,
        }} />
        {/* Grid overlay — barely visible */}
        <div className="absolute inset-0 opacity-[0.018]" style={{
          backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.08) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.06) 0.5px, transparent 0.5px)",
          backgroundSize: "80px 80px",
        }} />
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.022]" style={GRAIN} />
      </div>

      {/* Top gold rule */}
      <div className="absolute inset-x-0 top-0 h-px" style={{
        background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)`,
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="pt-36 md:pt-44 lg:pt-52" />

        <motion.div
          variants={stagger(0.09)}
          initial="hidden"
          animate="show"
        >
          {/* Classification badge */}
          <motion.div variants={fadeUp}>
            <div className="inline-flex items-center gap-3 px-4 py-2" style={{
              border: `1px solid ${GOLD}30`,
              backgroundColor: `${GOLD}0A`,
            }}>
              <ShieldCheck style={{ width: "12px", height: "12px", color: `${GOLD}AA` }} />
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: `${GOLD}BB`,
              }}>
                GMI-Q1-2026 · Restricted · v2.0.0 · April 8, 2026
              </span>
            </div>
          </motion.div>

          {/* Display title */}
          <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(2.8rem, 6vw, 6.2rem)",
              lineHeight: 0.92,
              letterSpacing: "-0.040em",
              color: "rgba(255,255,255,0.94)",
            }}>
              A disciplined reading
              <br />
              <span style={{ color: "rgba(255,255,255,0.38)" }}>of a harder market.</span>
            </h1>
          </motion.div>

          {/* Subhead — the thesis in one line */}
          <motion.p variants={fadeUp} style={{
            marginTop: "1.5rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.05rem, 1.5vw, 1.30rem)",
            lineHeight: 1.68,
            color: "rgba(255,255,255,0.50)",
            maxWidth: "52ch",
          }}>
            Markets are no longer pricing growth within globalisation.
            They are pricing <em style={{ color: `${GOLD}CC`, fontStyle: "normal" }}>survivability within fragmentation</em>.
          </motion.p>

          <motion.div variants={fadeUp} style={{
            marginTop: "1.5rem",
            maxWidth: "54ch",
            borderLeft: `1px solid ${GOLD}55`,
            paddingLeft: "1rem",
          }}>
            <p style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              lineHeight: 1.85,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.72)",
            }}>
              This is not a research report.
              <br />
              This is a decision-support intelligence brief used by operators navigating structural fragmentation.
            </p>
          </motion.div>

          {/* CTA row */}
          <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
            <div className="flex flex-wrap gap-3">
              <Link href={ROUTES.publicBrief}
                className="group inline-flex items-center gap-3 transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  color: "rgb(4 10 18)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,1)"}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.96)"}
              >
                Read public brief
                <ArrowRight style={{ width: "13px", height: "13px" }} />
              </Link>

              <Link href={ROUTES.institutionalEdition}
                className="group inline-flex items-center gap-3 transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  border: `1px solid ${GOLD}45`,
                  backgroundColor: `${GOLD}0E`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}45`; el.style.backgroundColor = `${GOLD}0E`; }}
              >
                <Lock style={{ width: "12px", height: "12px" }} />
                Unlock decision brief — £59
              </Link>

              <Link href={ROUTES.boardDeck}
                className="group inline-flex items-center gap-3 transition-all duration-300"
                style={{
                  padding: "14px 28px",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.52)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.30em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.75)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.10)"; el.style.color = "rgba(255,255,255,0.52)"; }}
              >
                <Presentation style={{ width: "12px", height: "12px" }} />
                Board deck
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <div className="pb-20 md:pb-24" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACRO SIGNALS STRIP
// The data board — the kind a CIO would see on their morning screen
// ─────────────────────────────────────────────────────────────────────────────

function MacroSignalsStrip() {
  return (
    <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid grid-cols-2 divide-x divide-y md:grid-cols-3 lg:grid-cols-6"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {MACRO_SIGNALS.map((sig) => {
            const Icon = sig.icon;
            return (
              <div key={sig.label} className="px-5 py-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon style={{
                    width: "11px", height: "11px",
                    color: sig.warn ? "rgba(239,68,68,0.65)" : `${GOLD}80`,
                  }} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px",
                    letterSpacing: "0.36em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                  }}>
                    {sig.label}
                  </span>
                </div>
                <div style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontSize: "1.65rem",
                  fontWeight: 300,
                  lineHeight: 1,
                  color: sig.warn ? "rgba(252,165,165,0.90)" : "rgba(255,255,255,0.88)",
                }}>
                  {sig.value}
                </div>
                <div style={{
                  marginTop: "0.4rem",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "6.5px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}>
                  {sig.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE THESIS SECTION
// ─────────────────────────────────────────────────────────────────────────────

function CoreThesis() {
  return (
    <section style={{ backgroundColor: BASE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-start">

          {/* Left — the thesis */}
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp}>
              <Eyebrow>Q1 2026 Core Thesis</Eyebrow>
            </motion.div>

            <motion.h2 variants={fadeUp} style={{
              marginTop: "1.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.028em",
              color: "rgba(255,255,255,0.92)",
            }}>
              Q1 opened under controlled instability.
              <br />
              <span style={{ color: "rgba(255,255,255,0.35)" }}>It closed under structural inflection.</span>
            </motion.h2>

            <motion.p variants={fadeUp} style={{
              marginTop: "1.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1rem, 1.2vw, 1.10rem)",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.48)",
              maxWidth: "46ch",
            }}>
              Capital is now pricing four variables simultaneously: survivability under
              supply chain disruption, strategic optionality across jurisdictions, policy
              credibility of host economies, and durability of revenue models under trade
              friction.
            </motion.p>

            {/* The shift */}
            <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
              <div style={{
                padding: "1.5rem",
                border: `1px solid ${GOLD}22`,
                backgroundColor: `${GOLD}07`,
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "1rem",
                }}>
                  The structural shift
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Efficiency", "Resilience"],
                    ["Expansion",  "Preservation"],
                    ["Integration", "Fragmentation"],
                  ].map(([from, to]) => (
                    <div key={from} className="flex items-center gap-2">
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        color: "rgba(255,255,255,0.28)",
                        textDecoration: "line-through",
                        letterSpacing: "0.10em",
                      }}>{from}</span>
                      <ArrowRight style={{ width: "10px", height: "10px", color: `${GOLD}60`, flexShrink: 0 }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontSize: "1.05rem",
                        color: "rgba(255,255,255,0.80)",
                        fontWeight: 300,
                      }}>{to}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Operator translation */}
            <motion.div variants={fadeUp} style={{ marginTop: "1.5rem" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.22)",
                marginBottom: "0.75rem",
              }}>
                Operator translation
              </div>
              <div className="space-y-2">
                {[
                  "Growth assumptions are no longer primary drivers of valuation.",
                  "Supply chain design is now a capital markets variable.",
                  "Policy risk directly affects enterprise value.",
                  "Optionality — not optimisation — is the new strategic premium.",
                ].map((line, i) => (
                  <div key={i} className="flex items-start gap-3" style={{
                    padding: "0.85rem 1rem",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <ChevronRight style={{ width: "12px", height: "12px", color: `${GOLD}70`, flexShrink: 0, marginTop: "2px" }} />
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.98rem",
                      lineHeight: 1.55,
                      color: "rgba(255,255,255,0.65)",
                    }}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right — scenario framework */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.12 }}
          >
            <div style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: LIFT,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: `linear-gradient(to right, ${GOLD}08, transparent)`,
              }}>
                <Eyebrow>Scenario framework · Q2 2026</Eyebrow>
              </div>

              {/* Scenarios */}
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {SCENARIOS.map((sc) => {
                  const isBase = sc.tone === "base";
                  const barColor =
                    sc.tone === "critical" ? "rgba(239,68,68,0.55)"
                    : sc.tone === "high"   ? "rgba(251,146,60,0.55)"
                    : sc.tone === "base"   ? `${GOLD}BB`
                    : "rgba(134,239,172,0.55)";

                  return (
                    <div
                      key={sc.id}
                      style={{
                        padding: "1.25rem 1.5rem",
                        backgroundColor: isBase ? `${GOLD}06` : "transparent",
                        borderLeft: isBase ? `2px solid ${GOLD}60` : "2px solid transparent",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.36em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.22)",
                            }}>
                              Scenario {sc.id}
                            </span>
                            {isBase && (
                              <span style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: "6.5px",
                                letterSpacing: "0.28em",
                                textTransform: "uppercase",
                                padding: "1px 6px",
                                border: `1px solid ${GOLD}35`,
                                backgroundColor: `${GOLD}10`,
                                color: `${GOLD}CC`,
                              }}>
                                Base case
                              </span>
                            )}
                          </div>
                          <div style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.05rem",
                            lineHeight: 1.2,
                            color: "rgba(255,255,255,0.85)",
                            marginBottom: "0.6rem",
                          }}>
                            {sc.label}
                          </div>
                          <p style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.875rem",
                            lineHeight: 1.60,
                            color: "rgba(255,255,255,0.40)",
                          }}>
                            {sc.body}
                          </p>
                        </div>

                        {/* Probability circle */}
                        <div style={{
                          flexShrink: 0,
                          textAlign: "center",
                          padding: "0.75rem",
                          border: "1px solid rgba(255,255,255,0.07)",
                          minWidth: "60px",
                        }}>
                          <div style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.6rem",
                            lineHeight: 1,
                            color: barColor,
                          }}>
                            {sc.prob}
                          </div>
                          <div style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6px",
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.20)",
                            marginTop: "3px",
                          }}>
                            %
                          </div>
                        </div>
                      </div>

                      {/* Probability bar */}
                      <div style={{
                        marginTop: "0.85rem",
                        height: "2px",
                        backgroundColor: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${sc.prob}%`,
                          height: "100%",
                          backgroundColor: barColor,
                          transition: "width 800ms ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Method note */}
              <div style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                backgroundColor: "rgba(255,255,255,0.01)",
              }}>
                <p style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.18)",
                  lineHeight: 1.60,
                }}>
                  Derived from market-implied volatility, policy trajectory analysis,
                  and cross-institution scenario clustering.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISION USE SECTION
// ─────────────────────────────────────────────────────────────────────────────

function DecisionUseSection() {
  const whenToUse = [
    "Board or leadership review is due within 30 days.",
    "Supplier exposure needs repricing below country level.",
    "Supply chain strategy is still optimised for efficiency.",
    "Cash policy assumes stable credit and benign demand.",
    "Policy risk is not yet a standing board variable.",
  ];

  const outputs = [
    "Growth assumptions repriced against tariff-adjusted conditions.",
    "Supplier-node exposure mapped before margin compression appears.",
    "Supply chain posture shifted from optimisation to optionality.",
    "Cash positioning moved from efficiency to protection.",
    "Policy risk elevated into board-level decision cadence.",
  ];

  return (
    <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Decision support</Eyebrow>
            <h2 style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.9rem, 3.2vw, 3rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.92)",
            }}>
              Use it when the decision cannot wait for perfect certainty.
            </h2>
            <p style={{
              marginTop: "1rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "1.05rem",
              lineHeight: 1.78,
              color: "rgba(255,255,255,0.58)",
              maxWidth: "48ch",
            }}>
              Free = tension. Paid = resolution. The institutional brief converts the market condition into board-level operating moves.
            </p>
            <Link href={ROUTES.institutionalEdition}
              className="mt-8 inline-flex items-center gap-3 transition-all duration-300"
              style={{
                padding: "14px 28px",
                border: `1px solid ${GOLD}50`,
                backgroundColor: `${GOLD}12`,
                color: GOLD,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
            >
              <Lock style={{ width: "12px", height: "12px" }} />
              Unlock decision advantage — £59
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
            <div style={{
              padding: "1.75rem",
              border: "1px solid rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.035)",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
                marginBottom: "1.1rem",
              }}>
                When to use this
              </div>
              <div className="space-y-3">
                {whenToUse.map((line) => (
                  <div key={line} className="flex gap-3">
                    <AlertTriangle style={{ width: "13px", height: "13px", color: `${GOLD}80`, flexShrink: 0, marginTop: "4px" }} />
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontSize: "0.98rem",
                      lineHeight: 1.58,
                      color: "rgba(255,255,255,0.72)",
                    }}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: "1.75rem",
              border: `1px solid ${GOLD}24`,
              backgroundColor: `${GOLD}08`,
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: `${GOLD}AA`,
                marginBottom: "1.1rem",
              }}>
                What this changes
              </div>
              <div className="space-y-3">
                {outputs.map((line) => (
                  <div key={line} className="flex gap-3">
                    <ShieldCheck style={{ width: "13px", height: "13px", color: `${GOLD}90`, flexShrink: 0, marginTop: "4px" }} />
                    <span style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontSize: "0.98rem",
                      lineHeight: 1.58,
                      color: "rgba(255,255,255,0.76)",
                    }}>
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITION LADDER
// ─────────────────────────────────────────────────────────────────────────────

function EditionLadder() {
  return (
    <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Reading layers</Eyebrow>
            <h2 style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.90)",
            }}>
              Four editions. One standard of seriousness.
            </h2>
            <p style={{
              marginTop: "0.85rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "1.05rem",
              lineHeight: 1.70,
              color: "rgba(255,255,255,0.38)",
              maxWidth: "48ch",
            }}>
              Each layer serves a different reading context without diluting the core signal.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} style={{ marginTop: "3rem" }}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {EDITIONS.map((ed, i) => {
                const Icon = ed.icon;
                return (
                  <Link key={ed.eyebrow} href={ed.href} className="group block">
                    <div
                      className="h-full transition-all duration-350"
                      style={{
                        border: ed.gold
                          ? `1px solid ${GOLD}28`
                          : "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: ed.primary ? "rgba(255,255,255,0.04)" : (ed.gold ? `${GOLD}07` : "rgba(255,255,255,0.015)"),
                        padding: "1.75rem",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = ed.gold ? `${GOLD}50` : "rgba(255,255,255,0.12)";
                        el.style.backgroundColor = ed.gold ? `${GOLD}0F` : "rgba(255,255,255,0.03)";
                        el.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = ed.gold ? `${GOLD}28` : "rgba(255,255,255,0.06)";
                        el.style.backgroundColor = ed.primary ? "rgba(255,255,255,0.04)" : (ed.gold ? `${GOLD}07` : "rgba(255,255,255,0.015)");
                        el.style.transform = "translateY(0)";
                      }}
                    >
                      {/* Edition number */}
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "2.8rem",
                        lineHeight: 1,
                        color: "rgba(255,255,255,0.06)",
                        marginBottom: "1rem",
                      }}>
                        {String(i + 1).padStart(2, "0")}
                      </div>

                      {/* Eyebrow */}
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: ed.gold ? `${GOLD}AA` : "rgba(255,255,255,0.24)",
                        marginBottom: "0.75rem",
                      }}>
                        {ed.eyebrow}
                      </div>

                      <Icon style={{
                        width: "18px", height: "18px",
                        color: ed.gold ? `${GOLD}CC` : "rgba(255,255,255,0.28)",
                        marginBottom: "1rem",
                      }} />

                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.92rem",
                        lineHeight: 1.62,
                        color: "rgba(255,255,255,0.42)",
                      }}>
                        {ed.body}
                      </p>

                      <div style={{
                        marginTop: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: ed.gold ? `${GOLD}BB` : "rgba(255,255,255,0.28)",
                        transition: "gap 300ms ease",
                      }}
                      className="group-hover:[gap:0.75rem]"
                      >
                        {ed.cta}
                        <ArrowRight style={{ width: "11px", height: "11px" }} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WHO IT'S FOR SECTION
// ─────────────────────────────────────────────────────────────────────────────

function UtilitySection() {
  const cards = [
    {
      icon: Landmark,
      title: "For boards",
      body: "Use as a macro-political context pack for strategy, risk, and capital allocation review. The scenario framework maps directly onto board-level risk oversight.",
    },
    {
      icon: LineChart,
      title: "For operators",
      body: "Reframe assumptions around pricing, flow, financing, and jurisdictional exposure. Every jurisdiction reading includes a board instruction.",
    },
    {
      icon: Compass,
      title: "For serious readers",
      body: "Orient thinking without wading through market theatre and disposable opinion. Signal without noise. Judgment without prescription.",
    },
  ];

  return (
    <section style={{ backgroundColor: BASE }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={stagger(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Quiet utility</Eyebrow>
            <h2 style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.90)",
            }}>
              Built to support review,
              <span style={{ color: "rgba(255,255,255,0.32)" }}> not theatre.</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title} style={{
                    padding: "2rem",
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: LIFT,
                  }}>
                    <Icon style={{ width: "20px", height: "20px", color: `${GOLD}AA`, marginBottom: "1.25rem" }} />
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.25rem",
                      color: "rgba(255,255,255,0.85)",
                      marginBottom: "0.75rem",
                    }}>
                      {card.title}
                    </h3>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.92rem",
                      lineHeight: 1.70,
                      color: "rgba(255,255,255,0.42)",
                    }}>
                      {card.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────────────────────────────────────────

function CloseSection() {
  return (
    <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Gold mark */}
          <div className="mx-auto mb-8" style={{
            width: "40px",
            height: "1px",
            background: `linear-gradient(to right, transparent, ${GOLD}50, transparent)`,
          }} />

          <Eyebrow>Closing position</Eyebrow>

          <h2 style={{
            marginTop: "1.5rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.88)",
          }}>
            Serious readers do not need louder information.
            <span style={{ color: "rgba(255,255,255,0.32)" }}> They need cleaner judgment.</span>
          </h2>

          <p style={{
            marginTop: "1.25rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "1.05rem",
            lineHeight: 1.72,
            color: "rgba(255,255,255,0.40)",
            maxWidth: "42ch",
            margin: "1.25rem auto 0",
          }}>
            The public brief is open. The institutional edition is available.
            Choose the layer that fits the seriousness of the task.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href={ROUTES.publicBrief}
              className="inline-flex items-center gap-3 transition-all duration-300"
              style={{
                padding: "13px 26px",
                backgroundColor: "rgba(255,255,255,0.94)",
                color: "rgb(4 10 18)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,1)"}
              onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.94)"}
            >
              Public brief
              <FileText style={{ width: "12px", height: "12px" }} />
            </Link>

            <Link href={ROUTES.institutionalEdition}
              className="inline-flex items-center gap-3 transition-all duration-300"
              style={{
                padding: "13px 26px",
                border: `1px solid ${GOLD}45`,
                backgroundColor: `${GOLD}0D`,
                color: GOLD,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}60`; el.style.backgroundColor = `${GOLD}15`; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}45`; el.style.backgroundColor = `${GOLD}0D`; }}
            >
              <Lock style={{ width: "12px", height: "12px" }} />
              Institutional edition
            </Link>

            <Link href={ROUTES.boardDeck}
              className="inline-flex items-center gap-3 transition-all duration-300"
              style={{
                padding: "13px 26px",
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(255,255,255,0.02)",
                color: "rgba(255,255,255,0.45)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.70)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Presentation style={{ width: "12px", height: "12px" }} />
              Board deck
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const IntelligenceLandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Global Market Intelligence Q1 2026 | Abraham of London</title>
        <meta name="description" content="A disciplined intelligence surface for the Q1 2026 market environment. Markets are no longer pricing growth within globalisation — they are pricing survivability within fragmentation." />
        <meta property="og:title" content="Global Market Intelligence Q1 2026 | Abraham of London" />
        <meta property="og:description" content="A disciplined reading of a harder market. Four editions: public brief, institutional report, board deck, boardroom PDF." />
      </Head>

      <Layout headerTransparent fullWidth>
        <HeroSection />
        <MacroSignalsStrip />
        <CoreThesis />
        <DecisionUseSection />
        <EditionLadder />
        <UtilitySection />
        <CloseSection />
      </Layout>
    </>
  );
};

export default IntelligenceLandingPage;
