// pages/diagnostics/executive-reporting.tsx
// The flagship diagnostic product surface.
// No fake demo data. No pricing table. No fabricated case studies.
// The page earns authority by describing the product precisely.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckSquare,
  ChevronRight,
  FileText,
  Lock,
  Scale,
  ShieldCheck,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// MOTION
// ─────────────────────────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (d = 0.09) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
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

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const REPORT_SECTIONS = [
  {
    icon: BarChart3,
    title: "Constitutional posture",
    body: "Route, readiness tier, authority classification, org state, and temperature — the complete constitutional reading derived from the intake. Seven scored dimensions rendered as a coherent posture statement.",
  },
  {
    icon: AlertTriangle,
    title: "Failure mode analysis",
    body: "Structural failure modes identified through the constitutional scoring engine — not symptomatic observations. Each mode is named, domain-attributed, and severity-classified.",
  },
  {
    icon: Target,
    title: "Domain findings",
    body: "Three to five board-level findings across governance, authority, execution, trust, and strategy. Each finding carries a headline, a reading drawn from the scoring data, and an observable operational signal.",
  },
  {
    icon: Scale,
    title: "Strategic domain analysis",
    body: "Intent vs reality gap analysis across dominant domains. The dissonance score quantifies where declared strategic intent diverges from constitutional operating reality.",
  },
  {
    icon: CheckSquare,
    title: "Priority stack and interventions",
    body: "The ordered set of corrective actions the constitutional assessment determines necessary, sequenced by impact and addressable by the declared authority.",
  },
  {
    icon: FileText,
    title: "Executive summary and mandate",
    body: "A board-grade narrative summary written for a principal or chair. States the structural condition plainly. Closes with a single governed next action — the constitutional mandate.",
  },
];

const HOW_STEPS = [
  {
    n: "01",
    title: "Declare the matter",
    body: "A structured intake captures the full diagnostic picture: problem statement, symptoms, desired outcome, constraint, authority scope, evidence quality, financial exposure, and decision question.",
  },
  {
    n: "02",
    title: "Constitutional scoring",
    body: "The system derives a constitutional assessment across seven dimensions — clarity, governance, authority, severity, readiness, org state, and route — using the same engine as the Strategy Room.",
  },
  {
    n: "03",
    title: "Guidance assembled",
    body: "Constitutional guidance is assembled against the asset registry. Governed recommendations are matched by domain fit, readiness tier, and failure mode signature.",
  },
  {
    n: "04",
    title: "Brief delivered",
    body: "A board-grade intelligence brief is rendered immediately: executive summary, domain analysis, findings, priority stack, financial exposure estimate, and escalation route.",
  },
];

const FIT_CONDITIONS = [
  "A board or executive team is carrying material consequence without a structural reading of the problem.",
  "Leadership perceives misalignment but cannot locate where the failure mode actually lives.",
  "A decision of significant operational, financial, or reputational weight is approaching.",
  "The authority structure is unclear, contested, or carrying ambiguity that compounds over time.",
  "Prior advisory or consulting work has not produced lasting structural change.",
];

const UNFIT_CONDITIONS = [
  "The problem is not yet articulated with sufficient structural precision for governance-grade analysis.",
  "The submitting authority does not have direct or sponsoring access to the mandate.",
  "The situation is exploratory rather than consequential.",
];

const WHAT_THE_INTAKE_REQUIRES = [
  { label: "Organisation & role",      desc: "Who is submitting and from what position of authority." },
  { label: "Problem statement",        desc: "The structural problem, not symptoms. Minimum 120 characters." },
  { label: "Observed symptoms",        desc: "What is visible on the ground. Minimum 80 characters." },
  { label: "Desired outcome",          desc: "The decision-grade outcome the situation requires." },
  { label: "Current constraint",       desc: "What is materially blocking movement right now." },
  { label: "Authority & governance",   desc: "Authority scope, decision sponsor, stakeholder breadth." },
  { label: "Financial exposure",       desc: "Revenue band, market exposure, estimated exposure (GBP)." },
  { label: "Evidence quality",         desc: "How strong and current the evidence base is." },
  { label: "Decision question",        desc: "The specific decision that needs to be made." },
  { label: "Cost of inaction",         desc: "What happens structurally if nothing changes." },
];

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function ExecutiveReportingPage() {
  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Board-grade executive intelligence briefs. Constitutional diagnosis of structural failure modes, authority ambiguity, and governance weakness — rendered from a disciplined intake."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute" style={{
              left: "-5%", top: "-10%",
              width: "700px", height: "600px",
              borderRadius: "50%",
              background: `radial-gradient(ellipse at center, ${GOLD}09 0%, ${GOLD}03 30%, transparent 65%)`,
              filter: "blur(140px)",
            }} />
            <div className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>
          <div className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-52" />

            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.55 }}
              className="flex items-center gap-2 mb-10"
            >
              <Link href="/diagnostics" className="transition-opacity hover:opacity-70" style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
              }}>
                Diagnostics
              </Link>
              <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.40)",
              }}>
                Executive Reporting
              </span>
            </motion.div>

            <div className="grid gap-16 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">

              {/* Left — title */}
              <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <Eyebrow>Flagship diagnostic · Board-grade intelligence</Eyebrow>
                </motion.div>

                <motion.h1 variants={fadeUp} style={{
                  marginTop: "1.5rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.8rem, 6.5vw, 6.5rem)",
                  lineHeight: 0.90,
                  letterSpacing: "-0.048em",
                  color: "rgba(255,255,255,0.94)",
                }}>
                  Executive
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.28)" }}>Intelligence Brief.</span>
                </motion.h1>

                <motion.p variants={fadeUp} style={{
                  marginTop: "1.75rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1rem, 1.4vw, 1.22rem)",
                  lineHeight: 1.72,
                  color: "rgba(255,255,255,0.42)",
                  maxWidth: "50ch",
                }}>
                  A constitutional diagnosis of structural failure modes, authority
                  ambiguity, and governance weakness — rendered immediately from a
                  disciplined intake. Not a framework. Not a template. A governed reading.
                </motion.p>

                <motion.div variants={fadeUp} style={{ marginTop: "2.5rem" }}>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/diagnostics/executive-reporting/run"
                      className="group inline-flex items-center gap-3 transition-all duration-300"
                      style={{
                        padding: "14px 28px",
                        border: `1px solid ${GOLD}42`,
                        backgroundColor: `${GOLD}0E`,
                        color: GOLD,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}16`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}0E`; }}
                    >
                      Run your diagnostic <ArrowRight style={{ width: "12px", height: "12px" }} />
                    </Link>
                    <Link href="/diagnostics"
                      className="inline-flex items-center gap-3 transition-all duration-300"
                      style={{
                        padding: "14px 28px",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.38)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.65)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.09)"; el.style.color = "rgba(255,255,255,0.38)"; }}
                    >
                      Diagnostic ladder
                    </Link>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right — report specification */}
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.80, delay: 0.16 }}
              >
                <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: LIFT }}>
                  <div style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: `1px solid ${GOLD}12`,
                    background: `linear-gradient(to right, ${GOLD}08, transparent)`,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.40em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}>
                      Report specification
                    </span>
                  </div>

                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {[
                      { label: "Classification",     value: "Diagnostic · Restricted" },
                      { label: "Generation",         value: "Real-time constitutional synthesis" },
                      { label: "Constitutional data",value: "7-dimension scoring + posture" },
                      { label: "Findings",           value: "3–5 board-level domain diagnoses" },
                      { label: "Priority stack",     value: "Ordered interventions, up to 8" },
                      { label: "Financial exposure", value: "Modelled from intake data" },
                      { label: "Domain analysis",    value: "Intent vs reality dissonance" },
                      { label: "Routing",            value: "STRATEGY · DIAGNOSTIC · REJECT" },
                      { label: "Storage",            value: "Run record persisted, intake governed" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <span style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                        }}>
                          {label}
                        </span>
                        <span style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.88rem",
                          color: "rgba(255,255,255,0.58)",
                          textAlign: "right",
                          maxWidth: "55%",
                        }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "0.85rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="flex items-center gap-2">
                      <Lock style={{ width: "10px", height: "10px", color: `${GOLD}70` }} />
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.26em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        Governed · Intake-driven · Not templated
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ paddingBottom: "5rem" }} />
          </div>
        </section>

        {/* ── WHAT THE REPORT CONTAINS ──────────────────────────────────── */}
        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mb-12">
              <Eyebrow>Report contents</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                What the brief contains.
              </h2>
              <p style={{
                marginTop: "0.85rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.02rem",
                lineHeight: 1.70,
                color: "rgba(255,255,255,0.38)",
                maxWidth: "46ch",
              }}>
                Every section is derived from the constitutional assessment of the
                specific intake. Nothing is generic. Nothing is carried across from
                a template.
              </p>
            </motion.div>

            <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {REPORT_SECTIONS.map(s => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.title} variants={fadeUp}>
                    <div style={{
                      border: "1px solid rgba(255,255,255,0.062)",
                      backgroundColor: "rgb(5 5 7)",
                      padding: "1.75rem 2rem",
                      height: "100%",
                    }}>
                      <Icon style={{ width: "18px", height: "18px", color: `${GOLD}AA`, marginBottom: "1.25rem" }} />
                      <h3 style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.12rem",
                        color: "rgba(255,255,255,0.82)",
                        marginBottom: "0.65rem",
                      }}>
                        {s.title}
                      </h3>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.90rem",
                        lineHeight: 1.68,
                        color: "rgba(255,255,255,0.38)",
                      }}>
                        {s.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ── WHAT THE INTAKE REQUIRES ──────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">

              <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
                <Eyebrow>Intake requirements</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.7rem, 2.8vw, 2.5rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.022em",
                  color: "rgba(255,255,255,0.88)",
                }}>
                  What the intake requires.
                </h2>
                <p style={{
                  marginTop: "0.85rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.70,
                  color: "rgba(255,255,255,0.38)",
                  maxWidth: "42ch",
                }}>
                  The intake is the diagnostic instrument. The quality of the output
                  is determined entirely by the precision of the input. Thin answers
                  produce thin diagnoses.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ delay: 0.10 }}>
                <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {WHAT_THE_INTAKE_REQUIRES.map(({ label, desc }) => (
                      <div key={label} className="flex items-start gap-4 px-4 py-3">
                        <div style={{
                          flexShrink: 0,
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          backgroundColor: `${GOLD}55`,
                          marginTop: "7px",
                        }} />
                        <div>
                          <div style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.38)",
                            marginBottom: "0.25rem",
                          }}>
                            {label}
                          </div>
                          <p style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.38)",
                          }}>
                            {desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mb-12">
              <Eyebrow>How it works</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                Four steps to institutional clarity.
              </h2>
            </motion.div>

            <motion.div variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {HOW_STEPS.map(step => (
                <motion.div key={step.n} variants={fadeUp}>
                  <div style={{
                    border: "1px solid rgba(255,255,255,0.06)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "1.75rem",
                    height: "100%",
                  }}>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "2.8rem",
                      lineHeight: 1,
                      color: `${GOLD}22`,
                      marginBottom: "1.25rem",
                    }}>
                      {step.n}
                    </div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.10rem",
                      color: "rgba(255,255,255,0.80)",
                      marginBottom: "0.65rem",
                    }}>
                      {step.title}
                    </h3>
                    <p style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.88rem",
                      lineHeight: 1.68,
                      color: "rgba(255,255,255,0.38)",
                    }}>
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FIT CONDITIONS ────────────────────────────────────────────── */}
        <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} className="mb-10">
              <Eyebrow>Fit conditions</Eyebrow>
              <h2 style={{
                marginTop: "1.25rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.90)",
              }}>
                When the brief is appropriate.
              </h2>
            </motion.div>

            <div className="grid gap-10 lg:grid-cols-2">
              <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "rgba(110,231,183,0.65)",
                  marginBottom: "1rem",
                }}>
                  Appropriate when
                </div>
                <div className="space-y-3">
                  {FIT_CONDITIONS.map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div style={{
                        flexShrink: 0, width: "5px", height: "5px", borderRadius: "50%",
                        backgroundColor: "rgba(110,231,183,0.50)", marginTop: "7px",
                      }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.62,
                        color: "rgba(255,255,255,0.55)",
                      }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }} transition={{ delay: 0.12 }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "rgba(252,165,165,0.55)",
                  marginBottom: "1rem",
                }}>
                  Not appropriate when
                </div>
                <div className="space-y-3 mb-8">
                  {UNFIT_CONDITIONS.map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div style={{
                        flexShrink: 0, width: "5px", height: "5px", borderRadius: "50%",
                        backgroundColor: "rgba(252,165,165,0.40)", marginTop: "7px",
                      }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.62,
                        color: "rgba(255,255,255,0.40)",
                      }}>
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{
                  padding: "1.25rem 1.5rem",
                  border: "1px solid rgba(255,255,255,0.05)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65,
                    color: "rgba(255,255,255,0.32)", fontStyle: "italic",
                    marginBottom: "0.85rem",
                  }}>
                    If the situation doesn't yet meet these conditions, the
                    constitutional diagnostic or team assessment are the appropriate
                    starting points.
                  </p>
                  <Link href="/diagnostics"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    View diagnostic ladder <ChevronRight style={{ width: "10px", height: "10px" }} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}>
              <div style={{
                border: `1px solid ${GOLD}20`,
                backgroundColor: `${GOLD}07`,
                padding: "2.5rem",
              }}>
                <Eyebrow>Begin</Eyebrow>
                <h2 style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.022em",
                  color: "rgba(255,255,255,0.88)",
                  marginBottom: "0.85rem",
                }}>
                  Declare the matter. Receive the reading.
                </h2>
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.72,
                  color: "rgba(255,255,255,0.42)", fontStyle: "italic",
                  maxWidth: "48ch", marginBottom: "1.75rem",
                }}>
                  The system will determine whether the matter qualifies for executive
                  reporting, strategy room engagement, or foundational correction.
                  The intake is the instrument.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/diagnostics/executive-reporting/run"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "13px 26px",
                      border: `1px solid ${GOLD}42`,
                      backgroundColor: `${GOLD}10`,
                      color: `${GOLD}CC`,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}60`; el.style.backgroundColor = `${GOLD}18`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; }}
                  >
                    Run diagnostic <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>
                  <Link href="/consulting/strategy-room"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "13px 26px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.60)"; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.35)"; }}
                  >
                    Strategy Room
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </div>
    </Layout>
  );
}