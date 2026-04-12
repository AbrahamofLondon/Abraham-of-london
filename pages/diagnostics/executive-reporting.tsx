// pages/diagnostics/executive-reporting.tsx
// Flagship product surface for Executive Reporting.
// Market-facing, exact, and aligned to a governed diagnostic product.

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

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const stagger = (d = 0.08) => ({
  hidden: {},
  show: { transition: { staggerChildren: d } },
});

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
      }
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8.5px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

type SectionCard = {
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  title: string;
  body: string;
};

const DELIVERABLES: SectionCard[] = [
  {
    icon: FileText,
    title: "Executive headline and route",
    body:
      "A direct top-line judgment stating the matter, the constitutional route, and the seriousness level. No padded prose. No advisory fog.",
  },
  {
    icon: ShieldCheck,
    title: "Governance risk reading",
    body:
      "A structured reading of governance weakness, authority ambiguity, and institutional exposure, expressed as a decision-grade risk posture.",
  },
  {
    icon: AlertTriangle,
    title: "Top pressure points",
    body:
      "The three most material points of pressure driving the condition now, not a general observation set. These are ranked for consequence, not decoration.",
  },
  {
    icon: BarChart3,
    title: "Domain breakdown",
    body:
      "Scored pressure across strategy, finance, operations, human capital, and governance, so leadership can see where the real burden sits.",
  },
  {
    icon: Scale,
    title: "Decision options and trade-offs",
    body:
      "Clear strategic options with the trade-offs attached. The report does not merely describe the problem; it frames the decision that must now be made.",
  },
  {
    icon: CheckSquare,
    title: "Correction priorities and execution sequence",
    body:
      "An ordered sequence for the next 7, 30, and 90 days, aligned to the submitting authority and the severity of the condition.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "You declare the matter",
    body:
      "The intake captures the problem, the visible symptoms, the decision pressure, the authority position, the financial exposure, and the cost of inaction.",
  },
  {
    n: "02",
    title: "The engine classifies the condition",
    body:
      "The constitutional system scores clarity, governance, authority, severity, readiness, route, and organisational posture to determine what the matter actually is.",
  },
  {
    n: "03",
    title: "The report is assembled",
    body:
      "The system renders a single board-grade brief from the scored condition: route, seriousness, pressure points, options, trade-offs, and correction priorities.",
  },
  {
    n: "04",
    title: "The next action becomes clear",
    body:
      "The matter is routed toward executive correction, deeper strategic engagement, or foundational remediation. Ambiguity is removed from the decision path.",
  },
];

const FIT_CONDITIONS = [
  "A material decision is approaching and leadership still lacks a structural reading of the condition.",
  "The issue appears operational on the surface, but the real failure may be constitutional, strategic, or governance-based.",
  "Prior advisory work has generated movement without producing order.",
  "Authority is blurred, contested, or insufficiently aligned to the problem being carried.",
  "The cost of delay is rising across financial, operational, reputational, or human terms.",
];

const NOT_FIT_CONDITIONS = [
  "The issue is still vague, emotional, or too thinly described to support a governed reading.",
  "The submitting party has no authority, sponsor, or mandate connection to the decision path.",
  "The matter is exploratory, educational, or curiosity-driven rather than consequential.",
];

const INTAKE_REQUIREMENTS = [
  {
    label: "Organisation and role",
    desc: "Who is submitting, in what capacity, and from what position of authority.",
  },
  {
    label: "Problem statement",
    desc: "The structural matter itself, not merely the symptoms around it.",
  },
  {
    label: "Observed symptoms",
    desc: "What is visible on the ground, in leadership behaviour, or in operating performance.",
  },
  {
    label: "Desired outcome",
    desc: "The decision-grade state the organisation needs to reach.",
  },
  {
    label: "Constraint",
    desc: "What is materially preventing movement now.",
  },
  {
    label: "Authority and governance",
    desc: "Decision scope, sponsor position, and how mandate actually flows.",
  },
  {
    label: "Financial exposure",
    desc: "Revenue band, estimated downside, and commercial weight of delay.",
  },
  {
    label: "Evidence quality",
    desc: "How current, reliable, and decision-usable the evidence base is.",
  },
  {
    label: "Decision question",
    desc: "The precise question leadership is actually trying to answer.",
  },
  {
    label: "Cost of inaction",
    desc: "What compounds structurally if nothing changes.",
  },
];

const REPORT_SPEC_ROWS = [
  { label: "Classification", value: "Flagship diagnostic product" },
  { label: "Output", value: "Board-grade executive intelligence brief" },
  { label: "Method", value: "Constitutional scoring + governed synthesis" },
  { label: "Route", value: "PROCEED · DIAGNOSE · REJECT" },
  { label: "Seriousness", value: "LOW · MODERATE · HIGH · CRITICAL" },
  { label: "Pressure points", value: "Top 3 ranked drivers" },
  { label: "Domain breakdown", value: "Strategy · Finance · Operations · People · Governance" },
  { label: "Decision framing", value: "Options + trade-off map" },
  { label: "Execution sequence", value: "7-day · 30-day · 90-day correction path" },
  { label: "Persistence", value: "Run record stored against governed intake" },
];

const PROOF_BLOCK = {
  title: "Illustrative case pattern",
  strap: "An anonymised operating pattern",
  summary:
    "A growth-stage firm presents rising revenue, slipping execution, repeated management friction, and a founder who still believes the issue is mainly talent. The report identifies the deeper condition as governance weakness and authority over-concentration, not merely a people problem.",
  outcome: [
    "Route: PROCEED",
    "Seriousness: HIGH",
    "Pressure points: governance drift, decision bottleneck, execution inconsistency",
    "Immediate priority: clarify mandate, stabilise operating ownership, reset decision rights",
  ],
};

export default function ExecutiveReportingPage() {
  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Executive Reporting is the flagship diagnostic product: a board-grade intelligence brief produced from a disciplined intake, designed to expose structural failure, authority weakness, and decision pressure."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                left: "-6%",
                top: "-14%",
                width: "760px",
                height: "620px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${GOLD}09 0%, ${GOLD}03 32%, transparent 68%)`,
                filter: "blur(150px)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-40"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
            />
            <div className="absolute inset-0 opacity-[0.020]" style={GRAIN} />
          </div>

          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pt-36 md:pt-44 lg:pt-48" />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.55 }}
              className="mb-10 flex items-center gap-2"
            >
              <Link
                href="/diagnostics"
                className="transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                Diagnostics
              </Link>
              <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.40)",
                }}
              >
                Executive Reporting
              </span>
            </motion.div>

            <div className="grid gap-16 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
              <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
                <motion.div variants={fadeUp}>
                  <Eyebrow>Flagship product · Board-grade diagnostic intelligence</Eyebrow>
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  style={{
                    marginTop: "1.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(3rem, 6.7vw, 6.7rem)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.05em",
                    color: "rgba(255,255,255,0.95)",
                  }}
                >
                  Executive
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.30)" }}>Reporting.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  style={{
                    marginTop: "1.65rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.02rem, 1.4vw, 1.24rem)",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.46)",
                    maxWidth: "50ch",
                  }}
                >
                  A board-grade intelligence brief generated from a disciplined intake and a
                  governed constitutional scoring system. It identifies the real condition,
                  names the pressure points, frames the decision, and sequences the required
                  correction.
                </motion.p>

                <motion.p
                  variants={fadeUp}
                  style={{
                    marginTop: "1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.98rem",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.33)",
                    maxWidth: "55ch",
                    fontStyle: "italic",
                  }}
                >
                  This is not a slide deck, not a survey summary, and not advisory wallpaper.
                  It is a decision instrument.
                </motion.p>

                <motion.div variants={fadeUp} style={{ marginTop: "2.25rem", maxWidth: "56ch" }}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      padding: "1rem 1.2rem",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.94rem",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.44)",
                        margin: 0,
                      }}
                    >
                      Executive Reporting formalises the matter into a board-level brief.
                      Strategy Room is where that reading can be further worked into strategic
                      intervention and mandate execution.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} style={{ marginTop: "2.4rem" }}>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/diagnostics/executive-reporting/run"
                      className="inline-flex items-center gap-3 transition-all duration-300"
                      style={{
                        padding: "14px 28px",
                        border: `1px solid ${GOLD}42`,
                        backgroundColor: `${GOLD}10`,
                        color: GOLD,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.30em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}65`;
                        el.style.backgroundColor = `${GOLD}18`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}42`;
                        el.style.backgroundColor = `${GOLD}10`;
                      }}
                    >
                      Run executive reporting
                      <ArrowRight style={{ width: "12px", height: "12px" }} />
                    </Link>

                    <Link
                      href="/diagnostics"
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
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.16)";
                        el.style.color = "rgba(255,255,255,0.65)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.09)";
                        el.style.color = "rgba(255,255,255,0.38)";
                      }}
                    >
                      Diagnostic ladder
                    </Link>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.14 }}
              >
                <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: LIFT }}>
                  <div
                    style={{
                      padding: "0.9rem 1.25rem",
                      borderBottom: `1px solid ${GOLD}12`,
                      background: `linear-gradient(to right, ${GOLD}08, transparent)`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.40em",
                        textTransform: "uppercase",
                        color: `${GOLD}90`,
                      }}
                    >
                      Product specification
                    </span>
                  </div>

                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {REPORT_SPEC_ROWS.map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6.5px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.20)",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.9rem",
                            color: "rgba(255,255,255,0.58)",
                            textAlign: "right",
                            maxWidth: "58%",
                          }}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: "0.9rem 1.25rem",
                      borderTop: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <Lock style={{ width: "10px", height: "10px", color: `${GOLD}70` }} />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.26em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.20)",
                        }}
                      >
                        Governed · Intake-driven · Persisted by run
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: "rgb(5 5 7)",
                      padding: "1rem 1.2rem",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: `${GOLD}88`,
                        marginBottom: "0.75rem",
                      }}
                    >
                      Best used when
                    </div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.92rem",
                        lineHeight: 1.6,
                        color: "rgba(255,255,255,0.42)",
                        margin: 0,
                      }}
                    >
                      The issue already carries consequence, the decision cannot be delayed,
                      and leadership needs a clean structural reading rather than another round
                      of commentary.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div style={{ paddingBottom: "5rem", marginTop: "3.5rem" }}>
              <GoldRule />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-26">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-12"
            >
              <Eyebrow>What the brief contains</Eyebrow>
              <h2
                style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.9rem, 3vw, 2.9rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}
              >
                The actual deliverable.
              </h2>
              <p
                style={{
                  marginTop: "0.85rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.02rem",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.38)",
                  maxWidth: "48ch",
                }}
              >
                This is the report object translated into executive form. It is precise,
                bounded, and fit for decision-making.
              </p>
            </motion.div>

            <motion.div
              variants={stagger(0.08)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
              {DELIVERABLES.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.title} variants={fadeUp}>
                    <div
                      style={{
                        border: "1px solid rgba(255,255,255,0.062)",
                        backgroundColor: "rgb(5 5 7)",
                        padding: "1.75rem 2rem",
                        height: "100%",
                      }}
                    >
                      <Icon
                        style={{
                          width: "18px",
                          height: "18px",
                          color: `${GOLD}AA`,
                          marginBottom: "1.2rem",
                        }}
                      />
                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.14rem",
                          color: "rgba(255,255,255,0.82)",
                          marginBottom: "0.65rem",
                        }}
                      >
                        {item.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.92rem",
                          lineHeight: 1.68,
                          color: "rgba(255,255,255,0.38)",
                        }}
                      >
                        {item.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Eyebrow>Proof layer</Eyebrow>
                <h2
                  style={{
                    marginTop: "1.25rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.8rem, 3vw, 2.7rem)",
                    lineHeight: 1.0,
                    letterSpacing: "-0.025em",
                    color: "rgba(255,255,255,0.90)",
                  }}
                >
                  What this looks like in practice.
                </h2>
                <p
                  style={{
                    marginTop: "0.85rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.38)",
                    maxWidth: "44ch",
                  }}
                >
                  One example is enough. The point is not theatre. The point is clarity.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.08 }}
              >
                <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: LIFT }}>
                  <div
                    style={{
                      padding: "0.9rem 1.2rem",
                      borderBottom: `1px solid ${GOLD}12`,
                      background: `linear-gradient(to right, ${GOLD}08, transparent)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.34em",
                        textTransform: "uppercase",
                        color: `${GOLD}88`,
                        marginBottom: "0.35rem",
                      }}
                    >
                      {PROOF_BLOCK.strap}
                    </div>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.2rem",
                        color: "rgba(255,255,255,0.84)",
                      }}
                    >
                      {PROOF_BLOCK.title}
                    </h3>
                  </div>

                  <div style={{ padding: "1.35rem 1.2rem" }}>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.95rem",
                        lineHeight: 1.68,
                        color: "rgba(255,255,255,0.42)",
                        marginBottom: "1.1rem",
                      }}
                    >
                      {PROOF_BLOCK.summary}
                    </p>

                    <GoldRule soft />

                    <div className="mt-4 space-y-3">
                      {PROOF_BLOCK.outcome.map((line) => (
                        <div key={line} className="flex items-start gap-3">
                          <div
                            style={{
                              flexShrink: 0,
                              width: "4px",
                              height: "4px",
                              backgroundColor: `${GOLD}55`,
                              marginTop: "8px",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.94rem",
                              lineHeight: 1.55,
                              color: "rgba(255,255,255,0.52)",
                            }}
                          >
                            {line}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:items-start">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <Eyebrow>Intake requirements</Eyebrow>
                <h2
                  style={{
                    marginTop: "1.25rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.75rem, 2.9vw, 2.55rem)",
                    lineHeight: 1.0,
                    letterSpacing: "-0.022em",
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  The report is only as good as the intake.
                </h2>
                <p
                  style={{
                    marginTop: "0.85rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.7,
                    color: "rgba(255,255,255,0.38)",
                    maxWidth: "44ch",
                  }}
                >
                  Thin input produces thin judgment. The intake is not admin. It is the
                  diagnostic instrument.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.08 }}
              >
                <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                  <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    {INTAKE_REQUIREMENTS.map(({ label, desc }) => (
                      <div key={label} className="flex items-start gap-4 px-4 py-3">
                        <div
                          style={{
                            flexShrink: 0,
                            width: "4px",
                            height: "4px",
                            backgroundColor: `${GOLD}55`,
                            marginTop: "7px",
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.28em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.38)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {label}
                          </div>
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.9rem",
                              lineHeight: 1.58,
                              color: "rgba(255,255,255,0.38)",
                              margin: 0,
                            }}
                          >
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

        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-12"
            >
              <Eyebrow>How it works</Eyebrow>
              <h2
                style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.85rem, 3vw, 2.85rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}
              >
                Four steps from ambiguity to governed action.
              </h2>
            </motion.div>

            <motion.div
              variants={stagger(0.09)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            >
              {HOW_IT_WORKS.map((step) => (
                <motion.div key={step.n} variants={fadeUp}>
                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.015)",
                      padding: "1.75rem",
                      height: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "2.8rem",
                        lineHeight: 1,
                        color: `${GOLD}22`,
                        marginBottom: "1.2rem",
                      }}
                    >
                      {step.n}
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.1rem",
                        color: "rgba(255,255,255,0.80)",
                        marginBottom: "0.65rem",
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.9rem",
                        lineHeight: 1.68,
                        color: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {step.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: BASE,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-24">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-10"
            >
              <Eyebrow>Fit conditions</Eyebrow>
              <h2
                style={{
                  marginTop: "1.25rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-0.025em",
                  color: "rgba(255,255,255,0.90)",
                }}
              >
                When Executive Reporting is the right move.
              </h2>
            </motion.div>

            <div className="grid gap-10 lg:grid-cols-2">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(110,231,183,0.65)",
                    marginBottom: "1rem",
                  }}
                >
                  Appropriate when
                </div>

                <div className="space-y-3">
                  {FIT_CONDITIONS.map((line) => (
                    <div key={line} className="flex items-start gap-3">
                      <div
                        style={{
                          flexShrink: 0,
                          width: "5px",
                          height: "5px",
                          backgroundColor: "rgba(110,231,183,0.50)",
                          marginTop: "7px",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          lineHeight: 1.62,
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: 0.1 }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.55)",
                    marginBottom: "1rem",
                  }}
                >
                  Not appropriate when
                </div>

                <div className="space-y-3 mb-8">
                  {NOT_FIT_CONDITIONS.map((line) => (
                    <div key={line} className="flex items-start gap-3">
                      <div
                        style={{
                          flexShrink: 0,
                          width: "5px",
                          height: "5px",
                          backgroundColor: "rgba(252,165,165,0.40)",
                          marginTop: "7px",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          lineHeight: 1.62,
                          color: "rgba(255,255,255,0.40)",
                        }}
                      >
                        {line}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    padding: "1.2rem 1.4rem",
                    border: "1px solid rgba(255,255,255,0.05)",
                    backgroundColor: "rgba(255,255,255,0.01)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.94rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.34)",
                      fontStyle: "italic",
                      marginBottom: "0.85rem",
                    }}
                  >
                    If the matter is still forming, start lower on the ladder. The wrong
                    entry point wastes everyone’s time.
                  </p>

                  <Link
                    href="/diagnostics"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.25)",
                    }}
                  >
                    View diagnostic ladder
                    <ChevronRight style={{ width: "10px", height: "10px" }} />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              <div
                style={{
                  border: `1px solid ${GOLD}20`,
                  backgroundColor: `${GOLD}07`,
                  padding: "2.5rem",
                }}
              >
                <Eyebrow>Begin</Eyebrow>

                <h2
                  style={{
                    marginTop: "1.25rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.6rem, 2.5vw, 2.3rem)",
                    lineHeight: 1.05,
                    letterSpacing: "-0.022em",
                    color: "rgba(255,255,255,0.88)",
                    marginBottom: "0.85rem",
                  }}
                >
                  Declare the matter. Get the reading.
                </h2>

                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.02rem",
                    lineHeight: 1.72,
                    color: "rgba(255,255,255,0.42)",
                    fontStyle: "italic",
                    maxWidth: "48ch",
                    marginBottom: "1.75rem",
                  }}
                >
                  The system will determine whether the matter should proceed as executive
                  correction, be routed deeper into strategic engagement, or be sent back for
                  foundational clarification.
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/diagnostics/executive-reporting/run"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "13px 26px",
                      border: `1px solid ${GOLD}42`,
                      backgroundColor: `${GOLD}10`,
                      color: `${GOLD}CC`,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}60`;
                      el.style.backgroundColor = `${GOLD}18`;
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = `${GOLD}42`;
                      el.style.backgroundColor = `${GOLD}10`;
                    }}
                  >
                    Run executive reporting
                    <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>

                  <Link
                    href="/consulting/strategy-room"
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{
                      padding: "13px 26px",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.35)",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.16)";
                      el.style.color = "rgba(255,255,255,0.60)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.borderColor = "rgba(255,255,255,0.08)";
                      el.style.color = "rgba(255,255,255,0.35)";
                    }}
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