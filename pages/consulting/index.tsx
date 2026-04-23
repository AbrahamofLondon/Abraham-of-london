// pages/consulting/index.tsx
// Design: Institutional Monumentalism — matches platform design system
// All amber-400/amber-500 replaced with #C9A96E softGold
// All rounded-full badges replaced with sharp platform pills
// RailLabel/RailDivider updated to platform Eyebrow/GoldRule
// bg-black replaced with canonical tokens
// engagement cards use platform sharp panel system

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Users as UsersIcon,
  Target as TargetIcon,
  Globe,
  Workflow,
  Mic2,
  Compass,
  Scale,
  Key,
  Eye,
  Crown,
  Building2,
  Activity,
  Briefcase,
  FileText,
  Gavel,
  Radar,
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Pill        = { icon: React.ComponentType<any>; title: string; desc: string };
type Deliverable = { title: string; icon: React.ComponentType<any> };
type Step        = { step: string; desc: string };
type Engagement  = {
  label: "Engagement";
  title: string;
  desc:  string;
  href:  string;
  tier:  "diagnostic" | "private" | "public";
  icon:  React.ComponentType<any>;
  bullets: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const DOMAINS: Pill[] = [
  { icon: UsersIcon,  title: "Board strategy",   desc: "Governance, operating cadence, decision hygiene, and legitimacy under scrutiny." },
  { icon: TargetIcon, title: "Founder advisory", desc: "Confidential counsel for scale, inflection points, and high-stakes trade-offs." },
  { icon: Globe,      title: "Frontier markets", desc: "Execution strategy for operators engaging African growth markets with real constraints." },
];

const DELIVERABLES: Deliverable[] = [
  { title: "Enforced decision pathways",    icon: Gavel },
  { title: "Documented strategic logic",   icon: FileText },
  { title: "Execution drift measured and enforced",      icon: Radar },
  { title: "Governance and cadence",       icon: Workflow },
  { title: "Leadership alignment",         icon: Scale },
  { title: "Next-step architecture",       icon: Briefcase },
];

const HOW: Step[] = [
  { step: "Diagnostic",           desc: "Where appropriate, the work begins with a structured reading of the real problem before counsel is applied." },
  { step: "Decision environment", desc: "Context, trade-offs, decision owners, and execution realities are brought into one disciplined frame." },
  { step: "Documented output",    desc: "The engagement produces required actions, explicit logic, and next-step enforcement points." },
];

const ENGAGEMENTS: Engagement[] = [
  {
    label: "Engagement", title: "Diagnostics First",
    desc:  "A structured reading before advisory begins, where clarity is still more valuable than speed.",
    href:  "/diagnostics", tier: "diagnostic", icon: Activity,
    bullets: ["Pressure, drift, and misalignment surfaced", "Fit established before escalation", "Correction priority clarified"],
  },
  {
    label: "Engagement", title: "Strategy Room",
    desc:  "A controlled decision environment for founders, boards, and institutions facing high-consequence choices.",
    href:  "/consulting/strategy-room", tier: "private", icon: ShieldCheck,
    bullets: ["Constraint-aware options + explicit trade-offs", "Artifacts: memo, matrix, cadence, controls", "Designed for irreversible decisions"],
  },
  {
    label: "Engagement", title: "Private Advisory",
    desc:  "Ongoing strategic counsel for leaders operating under sustained complexity, scrutiny, or consequence.",
    href:  "/contact?source=consulting&intent=consultation", tier: "private", icon: Crown,
    bullets: ["Governance and operating cadence", "Founder counsel under pressure", "Strategic oversight and alignment"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px",
        letterSpacing: "0.40em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-4">
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${GOLD}18, transparent)` }} />
      <div style={{ width: "4px", height: "4px", backgroundColor: `${GOLD}40` }} />
      <div className="h-px flex-1" style={{ background: `linear-gradient(to right, transparent, ${GOLD}18, transparent)` }} />
    </div>
  );
}

function TierBadge({ tier }: { tier: Engagement["tier"] }) {
  const config = {
    diagnostic: { label: "Diagnostic", border: "rgba(52,211,153,0.20)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.80)" },
    private:    { label: "Private",    border: `${GOLD}30`,              bg: `${GOLD}08`,              text: `${GOLD}BB` },
    public:     { label: "Public",     border: "rgba(255,255,255,0.09)", bg: "rgba(255,255,255,0.02)", text: "rgba(255,255,255,0.45)" },
  }[tier];

  return (
    <span style={{
      padding: "3px 10px",
      border: `1px solid ${config.border}`,
      backgroundColor: config.bg,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "7px",
      letterSpacing: "0.30em",
      textTransform: "uppercase",
      color: config.text,
    }}>
      {config.label}
    </span>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: "1rem" }}
      className="first:[border-left:none] first:[padding-left:0]"
    >
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)",
      }}>
        {label}
      </div>
      <div style={{
        marginTop: "0.5rem",
        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
        fontWeight: 300,
        fontSize: "1.15rem",
        color: "rgba(255,255,255,0.78)",
      }}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATMOSPHERE
// ─────────────────────────────────────────────────────────────────────────────

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute" style={{
        left: "10%", top: "6%",
        width: "30rem", height: "30rem",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${GOLD}06 0%, transparent 70%)`,
        filter: "blur(140px)",
      }} />
      <div className="absolute" style={{
        right: "8%", top: "22%",
        width: "26rem", height: "26rem",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,255,255,0.018) 0%, transparent 70%)",
        filter: "blur(120px)",
      }} />
      <div className="absolute inset-0 opacity-[0.016]" style={GRAIN} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ConsultingPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Advisory & Strategy | Abraham of London"
      description="Strategic counsel for leaders under consequence."
      canonicalUrl="/consulting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Atmosphere />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52 pb-24 lg:pb-32">
              <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr]">

                {/* Left */}
                <div className="max-w-4xl">
                  <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.80 }}>
                    <Eyebrow>Advisory</Eyebrow>
                  </motion.div>

                  <motion.h1
                    style={{
                      marginTop: "1.75rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(2.8rem, 6.5vw, 6.5rem)",
                      lineHeight: 0.90,
                      letterSpacing: "-0.048em",
                      color: "rgba(255,255,255,0.94)",
                      maxWidth: "12ch",
                    }}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.95, delay: 0.08 }}
                  >
                    Strategic counsel
                    <span style={{ display: "block", color: "rgba(255,255,255,0.30)", marginTop: "0.2rem" }}>
                      for leaders under consequence
                    </span>
                  </motion.h1>

                  <motion.p
                    style={{
                      marginTop: "1.75rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(1rem, 1.4vw, 1.22rem)",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.45)",
                      maxWidth: "46ch",
                    }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.90, delay: 0.18 }}
                  >
                    For founders, boards, and institutions facing decisions that carry
                    operational, financial, and reputational weight. This is not general advice.
                    It is structured enforcement applied to real decisions.
                  </motion.p>

                  <motion.div className="flex flex-wrap gap-3 mt-10"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.85, delay: 0.28 }}
                  >
                    <Link href="/consulting/strategy-room"
                      className="group inline-flex items-center gap-3 transition-all duration-300"
                      style={{
                        padding: "14px 28px",
                        backgroundColor: "rgba(255,255,255,0.96)",
                        color: "rgb(3 3 5)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,1)"}
                      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.96)"}
                    >
                      Enter strategy room
                      <ArrowRight style={{ width: "13px", height: "13px" }} />
                    </Link>

                    <Link href="/diagnostics"
                      className="group inline-flex items-center gap-3 transition-all duration-300"
                      style={{
                        padding: "14px 28px",
                        border: "1px solid rgba(255,255,255,0.10)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        color: "rgba(255,255,255,0.60)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.85)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.10)"; el.style.color = "rgba(255,255,255,0.60)"; }}
                    >
                      Start with diagnostics
                      <ArrowRight style={{ width: "13px", height: "13px", opacity: 0.60 }} />
                    </Link>
                  </motion.div>

                  <motion.div className="flex flex-wrap items-center gap-5 mt-10"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.90, delay: 0.36 }}
                  >
                    {[
                      { icon: Key, label: "Limited mandates" },
                      { icon: Eye, label: "Strict confidence" },
                    ].map((item, i, arr) => (
                      <React.Fragment key={item.label}>
                        <div className="inline-flex items-center gap-2">
                          <item.icon style={{ width: "12px", height: "12px", color: `${GOLD}50` }} />
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.24)",
                          }}>
                            {item.label}
                          </span>
                        </div>
                        {i < arr.length - 1 && <div className="h-3 w-px bg-white/[0.08]" />}
                      </React.Fragment>
                    ))}
                  </motion.div>
                </div>

                {/* Right — advisory profile panel */}
                <motion.div
                  className="relative self-end"
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.90, delay: 0.18 }}
                >
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    padding: "2rem",
                    boxShadow: "0 20px 80px -50px rgba(0,0,0,0.80)",
                  }}>
                    <div className="flex items-center justify-between mb-7">
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        Advisory profile
                      </span>
                      <Building2 style={{ width: "16px", height: "16px", color: `${GOLD}55` }} />
                    </div>

                    <div className="grid grid-cols-3 gap-5 py-5"
                      style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <MetricTile label="Mode"     value="Private" />
                      <MetricTile label="Bias"     value="Structured" />
                      <MetricTile label="Output"   value="Documented" />
                    </div>

                    <div className="mt-7 space-y-4">
                      {[
                        "Enforced decision pathways",
                        "Documented strategic logic",
                        "Execution drift measured and enforced",
                        "Governance and cadence under pressure",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <CheckCircle style={{ width: "14px", height: "14px", color: `${GOLD}80`, flexShrink: 0 }} />
                          <span style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.97rem",
                            color: "rgba(255,255,255,0.55)",
                          }}>
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </section>

        {/* ── MANDATE ───────────────────────────────────────────────────── */}
        <section className="relative py-24" style={{ backgroundColor: BASE }}>
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <MandateStatement />
          </div>
          <div className="relative mt-16">
            <StrategicFunnelStrip />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ backgroundColor: BASE }}>
          <SectionDivider />
        </div>

        {/* ── ENGAGEMENTS ───────────────────────────────────────────────── */}
        <section className="relative py-24" style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <Eyebrow>Engagement</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                Three engagement paths. Clear scope. Documented outputs.
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
                The work is structured to establish fit before pressure, complexity,
                and consequence are mishandled.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {ENGAGEMENTS.map((e, index) => {
                const Icon = e.icon;
                return (
                  <motion.article
                    key={e.title}
                    className="group relative overflow-hidden transition-all duration-400"
                    style={{
                      border: "1px solid rgba(255,255,255,0.062)",
                      backgroundColor: "rgb(5 5 7)",
                    }}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.65 }}
                    viewport={{ once: true }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = `${GOLD}20`;
                      el.style.transform = "translateY(-2px)";
                      el.style.boxShadow = "0 24px 60px -20px rgba(0,0,0,0.65)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,255,255,0.062)";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* Top thread */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: `linear-gradient(to right, transparent, ${GOLD}28, transparent)` }}
                    />

                    <div className="relative p-8 md:p-9">
                      <div className="flex items-start justify-between gap-4 mb-8">
                        <Icon style={{ width: "22px", height: "22px", color: `${GOLD}AA` }} />
                        <TierBadge tier={e.tier} />
                      </div>

                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "clamp(1.35rem, 1.9vw, 1.65rem)",
                        lineHeight: 1.06,
                        letterSpacing: "-0.022em",
                        color: "rgba(255,255,255,0.88)",
                        transition: "color 300ms ease",
                      }}
                      className="group-hover:[color:rgba(255,255,255,1)]"
                      >
                        {e.title}
                      </h3>

                      <p style={{
                        marginTop: "0.75rem",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.95rem",
                        lineHeight: 1.68,
                        color: "rgba(255,255,255,0.38)",
                        maxWidth: "32ch",
                      }}>
                        {e.desc}
                      </p>

                      <ul className="mt-7 space-y-2.5">
                        {e.bullets.map(b => (
                          <li key={b} className="flex items-start gap-2.5">
                            <ArrowRight style={{ width: "12px", height: "12px", flexShrink: 0, marginTop: "4px", color: `${GOLD}60` }} />
                            <span style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.90rem",
                              lineHeight: 1.55,
                              color: "rgba(255,255,255,0.42)",
                            }}>
                              {b}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex items-center justify-between mt-8 pt-5"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <Link href={e.href}
                          className="group/link inline-flex items-center gap-2 transition-all duration-300"
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "8.5px",
                            letterSpacing: "0.26em",
                            textTransform: "uppercase",
                            color: `${GOLD}90`,
                          }}
                        >
                          Open pathway
                          <ArrowRight style={{ width: "11px", height: "11px", transition: "transform 300ms ease" }}
                            className="group-hover/link:[transform:translateX(3px)]"
                          />
                        </Link>

                        <span style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.5rem",
                          color: "rgba(255,255,255,0.06)",
                          lineHeight: 1,
                        }}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── DOMAINS + DELIVERABLES ────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">

              {/* Domains */}
              <div>
                <Eyebrow>Domains</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}>
                  Engagement domains
                </h2>

                <div className="mt-10 space-y-6">
                  {DOMAINS.map((p, index) => {
                    const Icon = p.icon;
                    return (
                      <motion.div
                        key={p.title}
                        className="flex gap-5 pb-6"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.60 }}
                        viewport={{ once: true }}
                      >
                        <div style={{
                          flexShrink: 0,
                          marginTop: "3px",
                          width: "44px",
                          height: "44px",
                          border: "1px solid rgba(255,255,255,0.07)",
                          backgroundColor: "rgba(255,255,255,0.015)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Icon style={{ width: "18px", height: "18px", color: `${GOLD}80` }} />
                        </div>
                        <div>
                          <h3 style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.15rem",
                            color: "rgba(255,255,255,0.82)",
                          }}>
                            {p.title}
                          </h3>
                          <p style={{
                            marginTop: "0.4rem",
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.92rem",
                            lineHeight: 1.65,
                            color: "rgba(255,255,255,0.38)",
                          }}>
                            {p.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Deliverables */}
              <div>
                <Eyebrow>Outputs</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}>
                  What the work produces
                </h2>

                <div className="grid grid-cols-2 gap-4 mt-10">
                  {DELIVERABLES.map((o, index) => {
                    const Icon = o.icon;
                    return (
                      <motion.div
                        key={o.title}
                        style={{
                          border: "1px solid rgba(255,255,255,0.06)",
                          backgroundColor: "rgba(255,255,255,0.015)",
                          padding: "1.5rem 1.75rem",
                          transition: "border-color 300ms ease, background-color 300ms ease",
                        }}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.55 }}
                        viewport={{ once: true }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = `${GOLD}18`;
                          el.style.backgroundColor = "rgba(255,255,255,0.025)";
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.borderColor = "rgba(255,255,255,0.06)";
                          el.style.backgroundColor = "rgba(255,255,255,0.015)";
                        }}
                      >
                        <Icon style={{ width: "18px", height: "18px", color: `${GOLD}70`, marginBottom: "0.85rem" }} />
                        <h3 style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.97rem",
                          color: "rgba(255,255,255,0.80)",
                        }}>
                          {o.title}
                        </h3>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ backgroundColor: BASE }}>
          <SectionDivider />
        </div>

        {/* ── SPEAKING ──────────────────────────────────────────────────── */}
        <section id="speaking" style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <Eyebrow>Speaking</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}>
                  Speaking & discourse
                </h2>
                <p style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "44ch",
                }}>
                  Governance, frontier market architecture, and principle under pressure —
                  designed to move decisions, not generate applause.
                </p>

                <div className="mt-9 space-y-4">
                  {[
                    "Keynote addresses for boards and leadership forums",
                    "Private executive retreat facilitation",
                    "Strategic roundtables and panel discourse",
                    "Institutional guest lectures",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-start gap-3.5"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.50 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle style={{ width: "14px", height: "14px", color: `${GOLD}80`, flexShrink: 0, marginTop: "3px" }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.02rem",
                        color: "rgba(255,255,255,0.58)",
                      }}>
                        {item}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div style={{
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "2rem",
                  boxShadow: "0 18px 70px -50px rgba(0,0,0,0.80)",
                }}>
                  <Mic2 style={{ width: "28px", height: "28px", color: `${GOLD}80`, marginBottom: "1.5rem" }} />
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.5rem",
                    color: "rgba(255,255,255,0.88)",
                  }}>
                    Engage for speaking
                  </h3>
                  <p style={{
                    marginTop: "0.85rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.95rem",
                    lineHeight: 1.68,
                    color: "rgba(255,255,255,0.38)",
                  }}>
                    The objective is not noise. It is clearer thinking, sharper language,
                    and stronger institutional judgement.
                  </p>

                  <Link href="/contact?intent=speaking-engagement"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-3 transition-all duration-300"
                    style={{
                      padding: "14px 24px",
                      border: "1px solid rgba(255,255,255,0.09)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.55)",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}30`; el.style.color = `${GOLD}BB`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                  >
                    Submit speaking enquiry
                    <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── HOW THE WORK PROCEEDS + FIT ───────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <Eyebrow>Method</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}>
                  How the work proceeds
                </h2>
                <p style={{
                  marginTop: "0.75rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  color: "rgba(255,255,255,0.35)",
                  fontStyle: "italic",
                }}>
                  Structured, documented, accountable.
                </p>

                <div className="mt-10 space-y-9">
                  {HOW.map((s, i) => (
                    <motion.div
                      key={s.step}
                      className="flex gap-5"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.55 }}
                      viewport={{ once: true }}
                    >
                      <div style={{
                        flexShrink: 0,
                        width: "38px",
                        height: "38px",
                        border: `1px solid ${GOLD}28`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.2rem",
                        color: `${GOLD}90`,
                      }}>
                        {i + 1}
                      </div>
                      <div>
                        <h4 style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.15rem",
                          color: "rgba(255,255,255,0.82)",
                        }}>
                          {s.step}
                        </h4>
                        <p style={{
                          marginTop: "0.4rem",
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.92rem",
                          lineHeight: 1.65,
                          color: "rgba(255,255,255,0.38)",
                        }}>
                          {s.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div style={{
                  border: `1px solid ${GOLD}18`,
                  background: `linear-gradient(135deg, ${GOLD}04, transparent)`,
                  padding: "2rem",
                }}>
                  <Compass style={{ width: "28px", height: "28px", color: `${GOLD}80`, marginBottom: "1.5rem" }} />
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.5rem",
                    color: "rgba(255,255,255,0.88)",
                  }}>
                    Who this is for
                  </h3>

                  <ul className="mt-7 space-y-4">
                    {[
                      "Founders carrying responsibility for people, capital, and direction",
                      "Boards requiring structure stronger than personality",
                      "Leadership teams needing clearer judgement under pressure",
                    ].map(line => (
                      <li key={line} className="flex items-start gap-3.5">
                        <CheckCircle style={{ width: "14px", height: "14px", color: `${GOLD}80`, flexShrink: 0, marginTop: "3px" }} />
                        <span style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          color: "rgba(255,255,255,0.58)",
                        }}>
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-9">
                    <Link href="/contact?source=consulting&intent=context-note"
                      className="group block transition-all duration-300"
                      style={{
                        border: `1px solid ${GOLD}28`,
                        backgroundColor: `${GOLD}07`,
                        padding: "1.25rem 1.5rem",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}48`; el.style.backgroundColor = `${GOLD}10`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}28`; el.style.backgroundColor = `${GOLD}07`; }}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8.5px",
                          letterSpacing: "0.26em",
                          textTransform: "uppercase",
                          color: `${GOLD}BB`,
                        }}>
                          Share context note
                        </span>
                        <ArrowRight style={{ width: "12px", height: "12px", color: `${GOLD}80` }} />
                      </div>
                    </Link>

                    <p style={{
                      marginTop: "0.85rem",
                      textAlign: "center",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.14)",
                    }}>
                      Strictly confidential · Limited mandates
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-4xl px-6 py-24 text-center lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.70 }}
            >
              <Activity style={{ width: "22px", height: "22px", color: `${GOLD}50`, margin: "0 auto 1.5rem" }} />

              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                When the decision matters, structure matters.
              </h2>

              <p style={{
                margin: "1.25rem auto 0",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.38)",
                maxWidth: "44ch",
              }}>
                Engage for diagnostic clarity, a structured decision environment,
                or ongoing strategic counsel.
              </p>

              <div className="flex flex-col justify-center gap-3 mt-10 sm:flex-row">
                <Link href="/diagnostics"
                  className="group inline-flex items-center justify-center gap-3 transition-all duration-300"
                  style={{
                    padding: "14px 32px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.18)"; el.style.color = "rgba(255,255,255,0.80)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.55)"; }}
                >
                  Start with diagnostics
                  <ArrowRight style={{ width: "12px", height: "12px" }} />
                </Link>

                <Link href="/consulting/strategy-room"
                  className="group inline-flex items-center justify-center gap-3 transition-all duration-300"
                  style={{
                    padding: "14px 32px",
                    backgroundColor: "rgba(255,255,255,0.96)",
                    color: "rgb(3 3 5)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "9px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.96)"}
                >
                  Enter strategy room
                  <ArrowRight style={{ width: "12px", height: "12px" }} />
                </Link>
              </div>

              <div className="flex justify-center mt-14">
                <div className="h-12 w-px" style={{ background: `linear-gradient(to bottom, transparent, ${GOLD}30, transparent)` }} />
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </Layout>
  );
};

export default ConsultingPage;