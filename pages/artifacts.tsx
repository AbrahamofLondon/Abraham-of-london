// pages/intelligence/global-market-intelligence-q1-2026.tsx
// Global Market Intelligence Q1 2026
// Rebuilt for sharper hierarchy, cleaner conversion flow, stronger institutional tone,
// better mobile behavior, and less decorative noise.
// This version keeps your intent but fixes the weak spots:
// - tighter hero information architecture
// - cleaner scenario board
// - stronger edition ladder with explicit priority order
// - more coherent data strip
// - better route framing
// - more premium close
// - reduced visual clutter while keeping authority

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Lock,
  Scale,
  ShieldCheck,
  TrendingUp,
  LineChart,
  Landmark,
  Presentation,
  ChevronRight,
  AlertTriangle,
  BarChart3,
  Compass,
  Globe,
  Building2,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

const ROUTES = {
  publicBrief: "/artifacts/global-market-outlook-q1-2026-public",
  institutionalEdition: "/artifacts/global-market-intelligence-report-q1-2026",
  boardDeck: "/artifacts/global-market-intelligence-board-deck-q1-2026",
  boardroomPdf: "/artifacts/global-market-intelligence-report-q1-2026",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "#070E18";
const LIFT = "#0B1523";
const VOID = "#040A12";
const PANEL = "#0A1320";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

const GRID: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(255,255,255,0.08) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.06) 0.5px, transparent 0.5px)",
  backgroundSize: "88px 88px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = (d = 0.09) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: d },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "bg-gradient-to-r from-transparent via-[#C9A96E]/32 to-transparent",
      )}
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}60` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function SectionShell({
  children,
  surface = BASE,
  topBorder = false,
  bottomBorder = false,
}: {
  children: React.ReactNode;
  surface?: string;
  topBorder?: boolean;
  bottomBorder?: boolean;
}) {
  return (
    <section
      style={{
        backgroundColor: surface,
        borderTop: topBorder ? "1px solid rgba(255,255,255,0.04)" : undefined,
        borderBottom: bottomBorder ? "1px solid rgba(255,255,255,0.04)" : undefined,
      }}
    >
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: "A",
    label: "De-escalation",
    prob: 18,
    body: "Rapid bilateral concessions. Tariffs fall meaningfully below current extremes. This requires political discipline that present signals do not support.",
    tone: "low",
  },
  {
    id: "B",
    label: "Managed fragmentation",
    prob: 43,
    body: "Base case. Elevated tariffs persist. Supply chains restructure slowly. Monetary pressure remains. Markets adjust to a harder operating normal.",
    tone: "base",
  },
  {
    id: "C",
    label: "Escalation spiral",
    prob: 27,
    body: "Broader retaliation cycles. Higher sanctions risk. Greater credit stress. Equity weakness extends beyond a contained correction.",
    tone: "high",
  },
  {
    id: "D",
    label: "Confidence fracture",
    prob: 12,
    body: "A non-linear systemic event. Confidence in reserve architecture and institutional coordination comes under direct strain.",
    tone: "critical",
  },
] as const;

const MACRO_SIGNALS = [
  {
    label: "Global growth revised",
    value: "~2.5–2.8%",
    sub: "IMF revisions · Q1",
    icon: TrendingUp,
    warn: true,
  },
  {
    label: "US recession probability",
    value: "40–60%",
    sub: "12-month window",
    icon: BarChart3,
    warn: true,
  },
  {
    label: "S&P 500 correction",
    value: "~10–12%",
    sub: "From recent highs",
    icon: LineChart,
    warn: true,
  },
  {
    label: "US 10yr yield",
    value: "~4.5%",
    sub: "April peak zone",
    icon: Scale,
    warn: false,
  },
  {
    label: "US tariffs on China",
    value: "145%",
    sub: "Effective rate",
    icon: AlertTriangle,
    warn: true,
  },
  {
    label: "China tariffs on US",
    value: "125%",
    sub: "Retaliatory rate",
    icon: AlertTriangle,
    warn: true,
  },
] as const;

const EDITIONS = [
  {
    n: "01",
    eyebrow: "Public Brief",
    title: "Global Market Intelligence Q1 2026",
    body: "The open edition for serious readers who want the shape of the quarter without the full institutional edge.",
    href: ROUTES.publicBrief,
    cta: "Read public brief",
    icon: FileText,
    accent: "light",
  },
  {
    n: "02",
    eyebrow: "Institutional Edition",
    title: "Full intelligence briefing",
    body: "The restricted document for strategic operators. Deeper implications, stronger framing, higher board utility.",
    href: ROUTES.institutionalEdition,
    cta: "Institutional edition",
    icon: Lock,
    accent: "gold",
  },
  {
    n: "03",
    eyebrow: "Board Briefing Deck",
    title: "Executive presentation",
    body: "A premium deck for board presentation flow, internal circulation, and executive framing.",
    href: ROUTES.boardDeck,
    cta: "Board deck",
    icon: Presentation,
    accent: "light",
  },
  {
    n: "04",
    eyebrow: "Boardroom PDF",
    title: "Portable executive copy",
    body: "A clean portable edition for circulation, review, and rapid decision-room use.",
    href: ROUTES.boardroomPdf,
    cta: "Boardroom PDF",
    icon: Scale,
    accent: "light",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute"
          style={{
            left: "-5%",
            top: "-10%",
            width: "850px",
            height: "620px",
            borderRadius: "50%",
            background: `radial-gradient(ellipse at center, ${GOLD}15 0%, ${GOLD}06 28%, ${GOLD}02 52%, transparent 72%)`,
            filter: "blur(130px)",
          }}
        />
        <div
          className="absolute"
          style={{
            right: "-4%",
            top: "8%",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, transparent 65%)",
            filter: "blur(110px)",
          }}
        />
        <div className="absolute inset-0 opacity-[0.014]" style={GRID} />
        <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
        />
      </div>

      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="pt-36 md:pt-44 lg:pt-52" />

        <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
          <motion.div variants={fadeUp}>
            <div
              className="inline-flex items-center gap-3 px-4 py-2"
              style={{
                border: `1px solid ${GOLD}30`,
                backgroundColor: `${GOLD}0A`,
              }}
            >
              <ShieldCheck style={{ width: "12px", height: "12px", color: `${GOLD}AA` }} />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.42em",
                  textTransform: "uppercase",
                  color: `${GOLD}BB`,
                }}
              >
                GMI-Q1-2026 · Restricted · v2.0.0 · April 8, 2026
              </span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} style={{ marginTop: "2rem" }}>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2.8rem, 6vw, 6.4rem)",
                lineHeight: 0.92,
                letterSpacing: "-0.040em",
                color: "rgba(255,255,255,0.94)",
                maxWidth: "14ch",
              }}
            >
              A disciplined reading
              <br />
              <span style={{ color: "rgba(255,255,255,0.36)" }}>of a harder market.</span>
            </h1>
          </motion.div>

          <motion.p
            variants={fadeUp}
            style={{
              marginTop: "1.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.05rem, 1.5vw, 1.30rem)",
              lineHeight: 1.68,
              color: "rgba(255,255,255,0.50)",
              maxWidth: "52ch",
            }}
          >
            Markets are no longer pricing growth within globalisation. They are
            pricing{" "}
            <em style={{ color: `${GOLD}CC`, fontStyle: "normal" }}>
              survivability within fragmentation
            </em>
            .
          </motion.p>
          <motion.p
            variants={fadeUp}
            style={{
              marginTop: "1rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "rgba(201,169,110,0.72)",
              maxWidth: "68ch",
            }}
          >
            Intelligence for operators who need context before diagnostic or escalation decisions.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end"
          >
            <div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={ROUTES.publicBrief}
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
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255,255,255,1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255,255,255,0.96)";
                  }}
                >
                  Read public brief
                  <ArrowRight style={{ width: "13px", height: "13px" }} />
                </Link>

                <Link
                  href={ROUTES.institutionalEdition}
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
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}65`;
                    el.style.backgroundColor = `${GOLD}16`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}45`;
                    el.style.backgroundColor = `${GOLD}0E`;
                  }}
                >
                  <Lock style={{ width: "12px", height: "12px" }} />
                  Institutional edition
                </Link>

                <Link
                  href={ROUTES.boardDeck}
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
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.18)";
                    el.style.color = "rgba(255,255,255,0.75)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.10)";
                    el.style.color = "rgba(255,255,255,0.52)";
                  }}
                >
                  <Presentation style={{ width: "12px", height: "12px" }} />
                  Board deck
                </Link>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: "rgba(255,255,255,0.018)",
                padding: "1.2rem 1.35rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.34em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  marginBottom: "0.7rem",
                }}
              >
                Desk summary
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.96rem",
                  lineHeight: 1.62,
                  color: "rgba(255,255,255,0.56)",
                }}
              >
                The quarter is best understood as a transition from manageable
                instability to structural repricing. The central issue is not noise.
                It is regime change.
              </p>
            </div>
          </motion.div>
        </motion.div>

        <div className="pb-20 md:pb-24 lg:pb-28" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACRO SIGNALS STRIP
// ─────────────────────────────────────────────────────────────────────────────

function MacroSignalsStrip() {
  return (
    <SectionShell surface={BASE} topBorder bottomBorder>
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div
          className="grid grid-cols-2 divide-x divide-y md:grid-cols-3 lg:grid-cols-6"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {MACRO_SIGNALS.map((sig) => {
            const Icon = sig.icon;

            return (
              <div
                key={sig.label}
                className="px-5 py-6"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Icon
                    style={{
                      width: "11px",
                      height: "11px",
                      color: sig.warn ? "rgba(239,68,68,0.65)" : `${GOLD}80`,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                    }}
                  >
                    {sig.label}
                  </span>
                </div>

                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontSize: "1.7rem",
                    fontWeight: 300,
                    lineHeight: 1,
                    color: sig.warn
                      ? "rgba(252,165,165,0.90)"
                      : "rgba(255,255,255,0.88)",
                  }}
                >
                  {sig.value}
                </div>

                <div
                  style={{
                    marginTop: "0.45rem",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "6.5px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.20)",
                  }}
                >
                  {sig.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE THESIS
// ─────────────────────────────────────────────────────────────────────────────

function CoreThesis() {
  return (
    <SectionShell surface={BASE}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_0.92fr] lg:items-start">
          <motion.div
            variants={stagger(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp}>
              <Eyebrow>Q1 2026 Core Thesis</Eyebrow>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2rem, 3.5vw, 3.2rem)",
                lineHeight: 1,
                letterSpacing: "-0.028em",
                color: "rgba(255,255,255,0.92)",
                maxWidth: "18ch",
              }}
            >
              Q1 opened under controlled instability.
              <br />
              <span style={{ color: "rgba(255,255,255,0.34)" }}>
                It closed under structural inflection.
              </span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              style={{
                marginTop: "1.5rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1rem, 1.2vw, 1.10rem)",
                lineHeight: 1.75,
                color: "rgba(255,255,255,0.48)",
                maxWidth: "47ch",
              }}
            >
              Capital is now pricing four variables simultaneously: survivability
              under supply chain disruption, strategic optionality across
              jurisdictions, policy credibility of host economies, and durability of
              revenue models under trade friction.
            </motion.p>

            <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
              <div
                style={{
                  padding: "1.5rem",
                  border: `1px solid ${GOLD}22`,
                  backgroundColor: `${GOLD}07`,
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "1rem",
                  }}
                >
                  The structural shift
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Efficiency", "Resilience"],
                    ["Expansion", "Preservation"],
                    ["Integration", "Fragmentation"],
                  ].map(([from, to]) => (
                    <div key={from} className="flex items-center gap-2">
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "9px",
                          color: "rgba(255,255,255,0.28)",
                          textDecoration: "line-through",
                          letterSpacing: "0.10em",
                        }}
                      >
                        {from}
                      </span>
                      <ArrowRight
                        style={{
                          width: "10px",
                          height: "10px",
                          color: `${GOLD}60`,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontSize: "1.05rem",
                          color: "rgba(255,255,255,0.82)",
                          fontWeight: 300,
                        }}
                      >
                        {to}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} style={{ marginTop: "1.5rem" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  marginBottom: "0.75rem",
                }}
              >
                Operator translation
              </div>

              <div className="space-y-2">
                {[
                  "Growth assumptions are no longer primary drivers of valuation.",
                  "Supply chain design is now a capital markets variable.",
                  "Policy risk directly affects enterprise value.",
                  "Optionality — not optimisation — is the new strategic premium.",
                ].map((line, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3"
                    style={{
                      padding: "0.9rem 1rem",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <ChevronRight
                      style={{
                        width: "12px",
                        height: "12px",
                        color: `${GOLD}70`,
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.98rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.65)",
                      }}
                    >
                      {line}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.12 }}
          >
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.07)",
                backgroundColor: LIFT,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: `linear-gradient(to right, ${GOLD}08, transparent)`,
                }}
              >
                <Eyebrow>Scenario framework · Q2 2026</Eyebrow>
              </div>

              <div
                className="divide-y"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                {SCENARIOS.map((sc) => {
                  const isBase = sc.tone === "base";
                  const barColor =
                    sc.tone === "critical"
                      ? "rgba(239,68,68,0.55)"
                      : sc.tone === "high"
                        ? "rgba(251,146,60,0.55)"
                        : sc.tone === "base"
                          ? `${GOLD}BB`
                          : "rgba(134,239,172,0.55)";

                  return (
                    <div
                      key={sc.id}
                      style={{
                        padding: "1.25rem 1.5rem",
                        backgroundColor: isBase ? `${GOLD}06` : "transparent",
                        borderLeft: isBase
                          ? `2px solid ${GOLD}60`
                          : "2px solid transparent",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-1.5 flex items-center gap-2.5">
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                fontSize: "7px",
                                letterSpacing: "0.36em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.22)",
                              }}
                            >
                              Scenario {sc.id}
                            </span>

                            {isBase && (
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                                  fontSize: "6.5px",
                                  letterSpacing: "0.28em",
                                  textTransform: "uppercase",
                                  padding: "1px 6px",
                                  border: `1px solid ${GOLD}35`,
                                  backgroundColor: `${GOLD}10`,
                                  color: `${GOLD}CC`,
                                }}
                              >
                                Base case
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "1.08rem",
                              lineHeight: 1.2,
                              color: "rgba(255,255,255,0.85)",
                              marginBottom: "0.6rem",
                            }}
                          >
                            {sc.label}
                          </div>

                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.89rem",
                              lineHeight: 1.60,
                              color: "rgba(255,255,255,0.40)",
                            }}
                          >
                            {sc.body}
                          </p>
                        </div>

                        <div
                          style={{
                            flexShrink: 0,
                            textAlign: "center",
                            padding: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.07)",
                            minWidth: "64px",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "1.7rem",
                              lineHeight: 1,
                              color: barColor,
                            }}
                          >
                            {sc.prob}
                          </div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6px",
                              letterSpacing: "0.26em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.20)",
                              marginTop: "3px",
                            }}
                          >
                            %
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: "0.85rem",
                          height: "2px",
                          backgroundColor: "rgba(255,255,255,0.06)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${sc.prob}%`,
                            height: "100%",
                            backgroundColor: barColor,
                            transition: "width 800ms ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid rgba(255,255,255,0.04)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.16em",
                    color: "rgba(255,255,255,0.18)",
                    lineHeight: 1.60,
                  }}
                >
                  Scenario weights are derived from policy trajectory analysis,
                  market-implied stress, and cross-institution scenario clustering.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITION LADDER
// ─────────────────────────────────────────────────────────────────────────────

function EditionLadder() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionShell surface={VOID} topBorder bottomBorder>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Reading layers</Eyebrow>
            <h2
              style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}
            >
              Four editions. One standard of seriousness.
            </h2>
            <p
              style={{
                marginTop: "0.85rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                lineHeight: 1.70,
                color: "rgba(255,255,255,0.38)",
                maxWidth: "48ch",
              }}
            >
              Each layer serves a different reading context without diluting the
              signal.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} style={{ marginTop: "3rem" }}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {EDITIONS.map((ed) => {
                const Icon = ed.icon;
                const isGold = ed.accent === "gold";
                const isLight = ed.accent === "light";
                const isPriority = ed.n === "02";

                return (
                  <Link key={ed.eyebrow} href={ed.href} className="group block">
                    <div
                      className="h-full transition-all duration-350"
                      style={{
                        border: isGold
                          ? `1px solid ${GOLD}28`
                          : "1px solid rgba(255,255,255,0.06)",
                        backgroundColor: isGold
                          ? `${GOLD}07`
                          : isPriority
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(255,255,255,0.015)",
                        padding: "1.75rem",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = isGold
                          ? `${GOLD}50`
                          : "rgba(255,255,255,0.12)";
                        el.style.backgroundColor = isGold
                          ? `${GOLD}0F`
                          : "rgba(255,255,255,0.03)";
                        el.style.transform = reduceMotion ? "none" : "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLDivElement;
                        el.style.borderColor = isGold
                          ? `${GOLD}28`
                          : "rgba(255,255,255,0.06)";
                        el.style.backgroundColor = isGold
                          ? `${GOLD}07`
                          : isPriority
                            ? "rgba(255,255,255,0.03)"
                            : "rgba(255,255,255,0.015)";
                        el.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "2.8rem",
                          lineHeight: 1,
                          color: "rgba(255,255,255,0.06)",
                          marginBottom: "1rem",
                        }}
                      >
                        {ed.n}
                      </div>

                      <div
                        className="mb-3 flex items-center justify-between gap-3"
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.34em",
                          textTransform: "uppercase",
                        }}
                      >
                        <span
                          style={{
                            color: isGold ? `${GOLD}AA` : "rgba(255,255,255,0.24)",
                          }}
                        >
                          {ed.eyebrow}
                        </span>
                        {isPriority && (
                          <span
                            style={{
                              padding: "2px 6px",
                              border: `1px solid ${GOLD}28`,
                              backgroundColor: `${GOLD}0B`,
                              color: `${GOLD}B8`,
                              fontSize: "6px",
                            }}
                          >
                            Priority
                          </span>
                        )}
                      </div>

                      <Icon
                        style={{
                          width: "18px",
                          height: "18px",
                          color: isGold ? `${GOLD}CC` : isLight ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.28)",
                          marginBottom: "1rem",
                        }}
                      />

                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.28rem",
                          lineHeight: 1.12,
                          color: "rgba(255,255,255,0.86)",
                          marginBottom: "0.7rem",
                        }}
                      >
                        {ed.title}
                      </h3>

                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.92rem",
                          lineHeight: 1.62,
                          color: "rgba(255,255,255,0.42)",
                        }}
                      >
                        {ed.body}
                      </p>

                      <div
                        style={{
                          marginTop: "1.5rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: isGold ? `${GOLD}BB` : "rgba(255,255,255,0.28)",
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
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE USE CASES
// ─────────────────────────────────────────────────────────────────────────────

function UtilitySection() {
  const cards = [
    {
      icon: Landmark,
      title: "For boards",
      body: "Use as macro-political context for risk oversight, capital allocation, and strategic review. The scenario framework translates directly into board discussion.",
    },
    {
      icon: Building2,
      title: "For operators",
      body: "Reframe assumptions around pricing, financing, flow, and jurisdictional exposure. Each reading implies an operating posture.",
    },
    {
      icon: Globe,
      title: "For serious readers",
      body: "Orient judgment without wading through disposable market theatre. Signal without noise. Judgment without performative certainty.",
    },
  ];

  return (
    <SectionShell surface={BASE}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={stagger(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          <motion.div variants={fadeUp}>
            <Eyebrow>Quiet utility</Eyebrow>
            <h2
              style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}
            >
              Built to support review,
              <span style={{ color: "rgba(255,255,255,0.32)" }}> not theatre.</span>
            </h2>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    style={{
                      padding: "2rem",
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: LIFT,
                    }}
                  >
                    <Icon
                      style={{
                        width: "20px",
                        height: "20px",
                        color: `${GOLD}AA`,
                        marginBottom: "1.25rem",
                      }}
                    />
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.25rem",
                        color: "rgba(255,255,255,0.85)",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {card.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.92rem",
                        lineHeight: 1.70,
                        color: "rgba(255,255,255,0.42)",
                      }}
                    >
                      {card.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </SectionShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLOSE
// ─────────────────────────────────────────────────────────────────────────────

function CloseSection() {
  return (
    <SectionShell surface={VOID} topBorder>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-4xl"
        >
          <div
            style={{
              border: `1px solid ${GOLD}20`,
              backgroundColor: `${GOLD}06`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              className="pointer-events-none absolute right-0 top-0"
              style={{
                width: "420px",
                height: "420px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at top right, ${GOLD}10 0%, transparent 70%)`,
                filter: "blur(90px)",
              }}
            />
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)`,
              }}
            />

            <div className="relative z-10 px-8 py-14 md:px-12">
              <div
                className="mb-8 h-px w-10"
                style={{
                  background: `linear-gradient(to right, transparent, ${GOLD}50, transparent)`,
                }}
              />

              <Eyebrow>Closing position</Eyebrow>

              <h2
                style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.88)",
                  maxWidth: "20ch",
                }}
              >
                Serious readers do not need louder information.
                <span style={{ color: "rgba(255,255,255,0.32)" }}>
                  {" "}
                  They need cleaner judgment.
                </span>
              </h2>

              <p
                style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "44ch",
                }}
              >
                The public brief remains available as the open reference surface. The institutional edition remains active for Q2 decision use and is available through restricted access until superseded by the Q2 2026 report.
                Select the layer that matches the seriousness of the task.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href={ROUTES.publicBrief}
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
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255,255,255,1)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                      "rgba(255,255,255,0.94)";
                  }}
                >
                  Public brief
                  <FileText style={{ width: "12px", height: "12px" }} />
                </Link>

                <Link
                  href={ROUTES.institutionalEdition}
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
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}60`;
                    el.style.backgroundColor = `${GOLD}15`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = `${GOLD}45`;
                    el.style.backgroundColor = `${GOLD}0D`;
                  }}
                >
                  <Lock style={{ width: "12px", height: "12px" }} />
                  Institutional edition
                </Link>

                <Link
                  href={ROUTES.boardDeck}
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
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.16)";
                    el.style.color = "rgba(255,255,255,0.70)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.borderColor = "rgba(255,255,255,0.09)";
                    el.style.color = "rgba(255,255,255,0.45)";
                  }}
                >
                  <Presentation style={{ width: "12px", height: "12px" }} />
                  Board deck
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionShell>
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
        <meta
          name="description"
          content="A disciplined intelligence surface for the Q1 2026 market environment. Markets are no longer pricing growth within globalisation — they are pricing survivability within fragmentation."
        />
        <meta
          property="og:title"
          content="Global Market Intelligence Q1 2026 | Abraham of London"
        />
        <meta
          property="og:description"
          content="A disciplined reading of a harder market. Four editions: public brief, institutional report, board deck, boardroom PDF."
        />
      </Head>

      <Layout headerTransparent fullWidth>
        <HeroSection />
        <MacroSignalsStrip />
        <CoreThesis />
        <EditionLadder />
        <UtilitySection />
        <CloseSection />
      </Layout>
    </>
  );
};

export default IntelligenceLandingPage;
