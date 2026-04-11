// pages/diagnostics/index.tsx
// Institutional Monumentalism — rebuilt for sharper hierarchy, cleaner ladder logic,
// stronger qualification framing, and a more decisive escalation close.

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ChevronRight,
  Crown,
  FileText,
  LayoutGrid,
  Radar,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";

import Layout from "@/components/Layout";
import AssessmentSuiteLadder from "@/components/assessments/AssessmentSuiteLadder";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "200px 200px",
};

type Layer = {
  n: string;
  title: string;
  href: string;
  domain: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  duration: string;
  output: string;
  purpose: string;
  gate: string;
  tension: string;
  routeHint: string;
};

const LAYERS: Layer[] = [
  {
    n: "01",
    title: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    domain: "Entry gate",
    icon: Radar,
    duration: "4–7 min",
    output: "Route, posture, authority classification, confidence score",
    purpose:
      "Determines whether the signal warrants engagement at all. Not a questionnaire — a gate. Produces STRATEGY, DIAGNOSTIC, or REJECT with named rationale.",
    gate: "No login. No commitment. One constitutional reading.",
    tension: "The first task is not to solve. It is to determine whether a real mandate exists.",
    routeHint: "Routes to STRATEGY, DIAGNOSTIC, or REJECT.",
  },
  {
    n: "02",
    title: "Team Assessment",
    href: "/diagnostics/team-assessment",
    domain: "Evidence layer",
    icon: Users,
    duration: "12–18 min",
    output: "Leader–team perception gap, fragility index, domain breakdown",
    purpose:
      "One leader's perception is not evidence. This instrument measures the gap between how leadership reads the team and how the team reads itself. That gap is the structural finding.",
    gate: "Requires completion of prior layer. Reads prior result automatically.",
    tension: "Misalignment often hides in the distance between leadership certainty and lived team reality.",
    routeHint: "Turns internal perception into evidence.",
  },
  {
    n: "03",
    title: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    domain: "Institution layer",
    icon: LayoutGrid,
    duration: "8–12 min",
    output:
      "Dominant failure mode, section breakdown, escalation route with structural justification",
    purpose:
      "Some problems are not team-sized. This layer maps where authority, governance, execution consistency, and institutional risk posture are failing across the full institutional architecture.",
    gate: "Reads Team Assessment result. Routes to Executive Reporting or Strategy Room.",
    tension: "The failure may not live where the symptoms first appear.",
    routeHint: "Maps institutional risk across the architecture.",
  },
  {
    n: "04",
    title: "Executive Reporting",
    href: "/diagnostics/executive-reporting",
    domain: "Decision layer",
    icon: FileText,
    duration: "20 min intake",
    output:
      "Board-grade structured report: headline, governance risk, pressure points, domain analysis, decision options, correction priorities, 7/30/90 sequence",
    purpose:
      "Where the diagnostic signal becomes a governed deliverable. Not a summary — a board-grade interpretation artefact that sponsors can act on, present, and preserve.",
    gate: "Paid product. The flagship commercial object.",
    tension: "This is where signal becomes governed language suitable for consequential decisions.",
    routeHint: "Produces the commercial object sponsors can actually use.",
  },
];

const PRINCIPLES = [
  {
    index: "I",
    title: "Signal before solution",
    body:
      "Each layer establishes what is actually happening before forcing a recommendation. The system will not recommend intervention on insufficient evidence.",
  },
  {
    index: "II",
    title: "Escalation is earned",
    body:
      "The ladder routes by evidence. Strategy Room is not the default — it is the conclusion of a governed reading that justifies it.",
  },
  {
    index: "III",
    title: "Governed output only",
    body:
      "Every diagnostic produces a structured artefact: route, posture, and correction priority. No ambient reflection. No participation trophies.",
  },
  {
    index: "IV",
    title: "The cost of inaction is stated",
    body:
      "This system is designed for decisions that carry material consequence. If the situation does not qualify, the instrument will say so.",
  },
];

const QUALIFIES = [
  "A decision with material consequences that cannot be reversed cheaply",
  "Institutional misalignment that has persisted through internal correction attempts",
  "A leadership or governance question where the cost of inaction is compounding",
  "A private or board-level situation where discretion matters as much as clarity",
  "A mandate where the question is not what to do, but whether it can be done",
];

const DOES_NOT_QUALIFY = [
  "Exploratory curiosity without a decision-bearing sponsor",
  "Situations where the outcome is already determined and validation is the actual goal",
  "Personal performance anxiety dressed as institutional diagnosis",
  "Requests that cannot define what a successful outcome would look like",
  "Mandates where authority is absent or contested at the highest required level",
];

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
          fontSize: "8px",
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

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "2.2rem",
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)",
          marginTop: "0.35rem",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ClassificationStrip() {
  const items = [
    {
      label: "Strategy",
      color: "rgba(110,231,183,0.70)",
      bg: "rgba(110,231,183,0.06)",
      border: "rgba(110,231,183,0.18)",
    },
    {
      label: "Diagnostic",
      color: `${GOLD}CC`,
      bg: `${GOLD}08`,
      border: `${GOLD}22`,
    },
    {
      label: "Reject",
      color: "rgba(252,165,165,0.70)",
      bg: "rgba(252,165,165,0.05)",
      border: "rgba(252,165,165,0.18)",
    },
  ];

  return (
    <div style={{ padding: "0.95rem 1.5rem" }}>
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.30em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.18)",
          marginBottom: "0.6rem",
        }}
      >
        Constitutional routes
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((r) => (
          <div
            key={r.label}
            style={{
              padding: "4px 0",
              textAlign: "center",
              border: `1px solid ${r.border}`,
              backgroundColor: r.bg,
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "6.5px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: r.color,
              }}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerRow({
  layer,
  index,
  reduceMotion,
  isOpen,
  onToggle,
}: {
  layer: Layer;
  index: number;
  reduceMotion: boolean | null;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = layer.icon;
  const isFlagship = index === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, delay: 0.06 + index * 0.06 }}
    >
      <div
        style={{
          border: `1px solid ${isFlagship ? `${GOLD}28` : "rgba(255,255,255,0.062)"}`,
          backgroundColor: isFlagship ? `${GOLD}05` : LIFT,
          transition: "border-color 400ms ease, background-color 400ms ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = isFlagship
            ? `${GOLD}50`
            : "rgba(255,255,255,0.120)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = isFlagship
            ? `${GOLD}28`
            : "rgba(255,255,255,0.062)";
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`diagnostic-layer-${layer.n}`}
          style={{
            width: "100%",
            padding: "1.75rem 2rem",
            background: "transparent",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <div className="grid gap-4 lg:grid-cols-[84px_1fr_auto] lg:items-center">
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "3rem",
                lineHeight: 1,
                letterSpacing: "-0.04em",
                color: isFlagship ? `${GOLD}42` : "rgba(255,255,255,0.08)",
              }}
            >
              {layer.n}
            </div>

            <div>
              <div className="mb-1.5 flex items-center gap-3">
                <Icon
                  style={{
                    width: "14px",
                    height: "14px",
                    color: isFlagship ? `${GOLD}AA` : "rgba(255,255,255,0.40)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(1.2rem, 2vw, 1.62rem)",
                    lineHeight: 1,
                    letterSpacing: "-0.020em",
                    color: "rgba(255,255,255,0.90)",
                  }}
                >
                  {layer.title}
                </span>
                {isFlagship && (
                  <span
                    style={{
                      padding: "2px 8px",
                      border: `1px solid ${GOLD}30`,
                      backgroundColor: `${GOLD}0C`,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "6.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: `${GOLD}CC`,
                      flexShrink: 0,
                    }}
                  >
                    Flagship
                  </span>
                )}
              </div>

              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                {layer.domain} · {layer.duration}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="lg:block"
                style={{
                  display: "none",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}
              >
                {isOpen ? "Collapse" : "Expand"}
              </div>

              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "transform 300ms ease",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                <ChevronRight
                  style={{ width: "12px", height: "12px", color: "rgba(255,255,255,0.35)" }}
                />
              </div>
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={`diagnostic-layer-${layer.n}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.32 }}
              style={{
                borderTop: "1px solid rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "1.75rem 2rem 2rem" }}>
                <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                  <div>
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "1.08rem",
                        lineHeight: 1.78,
                        color: "rgba(255,255,255,0.65)",
                        marginBottom: "1rem",
                      }}
                    >
                      {layer.purpose}
                    </p>

                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.94rem",
                        lineHeight: 1.7,
                        color: "rgba(255,255,255,0.36)",
                        marginBottom: "1.25rem",
                        fontStyle: "italic",
                      }}
                    >
                      {layer.tension}
                    </p>

                    <div
                      style={{
                        padding: "0.75rem 1rem",
                        border: "1px solid rgba(255,255,255,0.05)",
                        backgroundColor: "rgba(255,255,255,0.01)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        Gate
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.88rem",
                          color: "rgba(255,255,255,0.45)",
                          fontStyle: "italic",
                        }}
                      >
                        {layer.gate}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div
                      style={{
                        border: `1px solid ${GOLD}18`,
                        backgroundColor: `${GOLD}06`,
                        padding: "1rem 1.25rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.32em",
                          textTransform: "uppercase",
                          color: `${GOLD}80`,
                          marginBottom: "0.5rem",
                        }}
                      >
                        Output
                      </div>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.88rem",
                          lineHeight: 1.65,
                          color: "rgba(255,255,255,0.60)",
                          marginBottom: "0.85rem",
                        }}
                      >
                        {layer.output}
                      </p>
                      <p
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "6.5px",
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.22)",
                        }}
                      >
                        {layer.routeHint}
                      </p>
                    </div>

                    <Link
                      href={layer.href}
                      className="flex items-center justify-between transition-all duration-300"
                      style={{
                        padding: "1rem 1.25rem",
                        border: `1px solid ${isFlagship ? `${GOLD}35` : "rgba(255,255,255,0.09)"}`,
                        backgroundColor: isFlagship ? `${GOLD}0D` : "rgba(255,255,255,0.02)",
                        color: isFlagship ? `${GOLD}CC` : "rgba(255,255,255,0.55)",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = isFlagship ? `${GOLD}55` : "rgba(255,255,255,0.18)";
                        el.style.backgroundColor = isFlagship ? `${GOLD}14` : "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = isFlagship ? `${GOLD}35` : "rgba(255,255,255,0.09)";
                        el.style.backgroundColor = isFlagship ? `${GOLD}0D` : "rgba(255,255,255,0.02)";
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                        }}
                      >
                        {isFlagship ? "Open flagship" : `Enter ${layer.n}`}
                      </span>
                      <ArrowRight style={{ width: "12px", height: "12px" }} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function DiagnosticsIndexPage() {
  const reduceMotion = useReducedMotion();
  const [openLayer, setOpenLayer] = React.useState<string>("01");

  return (
    <Layout
      title="Diagnostics | Abraham of London"
      description="A full diagnostic ladder for leaders, operators, and institutions. Constitutional, team, enterprise, and executive reporting — each layer with a distinct job."
      canonicalUrl="/diagnostics"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <section style={{ backgroundColor: VOID, position: "relative", overflow: "hidden" }}>
          <div className="pointer-events-none absolute inset-0">
            <div
              className="absolute"
              style={{
                left: "-8%",
                top: "-20%",
                width: "700px",
                height: "700px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse at center, ${GOLD}09 0%, transparent 65%)`,
                filter: "blur(160px)",
              }}
            />
            <div
              className="absolute"
              style={{
                right: "-10%",
                top: "20%",
                width: "500px",
                height: "500px",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.012) 0%, transparent 60%)",
                filter: "blur(140px)",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-48"
              style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
            />
            <div className="absolute inset-0 opacity-[0.022]" style={GRAIN} />
          </div>

          <div
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }}
          />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
            <div className="pb-20 pt-36 md:pb-28 md:pt-48">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="mb-10"
              >
                <Eyebrow>The diagnostic ladder</Eyebrow>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, delay: 0.06 }}
              >
                <h1
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "clamp(3rem, 8vw, 7.5rem)",
                    lineHeight: 0.88,
                    letterSpacing: "-0.045em",
                    color: "rgba(255,255,255,0.94)",
                    maxWidth: "14ch",
                  }}
                >
                  Before strategy,
                  <br />
                  <span style={{ color: "rgba(255,255,255,0.26)" }}>before intervention,</span>
                  <br />
                  <span style={{ color: GOLD }}>signal.</span>
                </h1>
              </motion.div>

              <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_420px] lg:items-end">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.85, delay: 0.2 }}
                >
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(1.05rem, 1.5vw, 1.22rem)",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.42)",
                      maxWidth: "48ch",
                      marginBottom: "1.4rem",
                    }}
                  >
                    Four layers. Each with a distinct job. None exists to decorate the others.
                    The ladder routes by evidence — not by preference, not by proximity to a sale.
                  </p>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1rem",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.30)",
                      maxWidth: "48ch",
                      marginBottom: "2rem",
                      fontStyle: "italic",
                    }}
                  >
                    If the signal does not qualify, the system will say so. If it does, the next move
                    is earned.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="#ladder"
                      className="group inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "13px 26px",
                        border: `1px solid ${GOLD}42`,
                        backgroundColor: `${GOLD}0E`,
                        color: GOLD,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.28em",
                        textTransform: "uppercase",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}65`;
                        el.style.backgroundColor = `${GOLD}16`;
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = `${GOLD}42`;
                        el.style.backgroundColor = `${GOLD}0E`;
                      }}
                    >
                      Enter the ladder
                      <ArrowRight
                        style={{
                          width: "12px",
                          height: "12px",
                          transition: "transform 300ms ease",
                        }}
                        className="group-hover:translate-x-0.5"
                      />
                    </Link>

                    <Link
                      href="/diagnostics/executive-reporting"
                      className="inline-flex items-center gap-2.5 transition-all duration-300"
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
                        el.style.borderColor = "rgba(255,255,255,0.18)";
                        el.style.color = "rgba(255,255,255,0.72)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "rgba(255,255,255,0.09)";
                        el.style.color = "rgba(255,255,255,0.45)";
                      }}
                    >
                      Executive Reporting
                    </Link>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.16 }}
                  style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}
                >
                  <div
                    style={{
                      padding: "0.85rem 1.5rem",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px",
                        letterSpacing: "0.38em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.20)",
                      }}
                    >
                      Platform specification
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-2"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <div
                      style={{
                        borderRight: "1px solid rgba(255,255,255,0.05)",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <StatCell value="4" label="Diagnostic layers" />
                    </div>
                    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <StatCell value="3" label="Escalation routes" />
                    </div>
                    <div style={{ borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                      <StatCell value="10" label="Constitutional questions" />
                    </div>
                    <div>
                      <StatCell value="1" label="Governing output" />
                    </div>
                  </div>

                  <ClassificationStrip />
                </motion.div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: `linear-gradient(to right, transparent, ${GOLD}14, transparent)` }}
          />
        </section>

        <section
          style={{
            backgroundColor: VOID,
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="py-16">
              <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
                <div className="pb-8 lg:pr-12 lg:pb-0">
                  <Eyebrow>Operating principles</Eyebrow>
                  <p
                    style={{
                      marginTop: "0.85rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.88rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.30)",
                      fontStyle: "italic",
                      maxWidth: "22ch",
                    }}
                  >
                    What the system refuses to do matters as much as what it does.
                  </p>
                </div>

                <div
                  className="divide-y"
                  style={{
                    borderColor: "rgba(255,255,255,0.05)",
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {PRINCIPLES.map((p, i) => (
                    <motion.div
                      key={p.index}
                      initial={{ opacity: 0, x: reduceMotion ? 0 : 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.6, delay: 0.12 + i * 0.05 }}
                      style={{ padding: "1.5rem 0" }}
                      className="grid gap-4 lg:grid-cols-[60px_1fr]"
                    >
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.4rem",
                          lineHeight: 1,
                          letterSpacing: "-0.02em",
                          color: "rgba(255,255,255,0.15)",
                        }}
                      >
                        {p.index}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.08rem",
                            lineHeight: 1.2,
                            color: "rgba(255,255,255,0.80)",
                            marginBottom: "0.5rem",
                          }}
                        >
                          {p.title}
                        </div>
                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.95rem",
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.38)",
                          }}
                        >
                          {p.body}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ladder" className="scroll-mt-0" style={{ backgroundColor: BASE }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="py-20 lg:py-28">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7 }}
                className="mb-14"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                  <div>
                    <Eyebrow>The full ladder</Eyebrow>
                    <h2
                      style={{
                        marginTop: "1rem",
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
                        lineHeight: 1,
                        letterSpacing: "-0.025em",
                        color: "rgba(255,255,255,0.90)",
                      }}
                    >
                      Four layers. One governed sequence.
                    </h2>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.95rem",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.32)",
                      maxWidth: "33ch",
                      textAlign: "right",
                      fontStyle: "italic",
                    }}
                  >
                    Select the layer that matches your situation. The system routes forward from
                    there.
                  </p>
                </div>
              </motion.div>

              <div className="space-y-3">
                {LAYERS.map((layer, i) => (
                  <LayerRow
                    key={layer.n}
                    layer={layer}
                    index={i}
                    reduceMotion={reduceMotion}
                    isOpen={openLayer === layer.n}
                    onToggle={() => setOpenLayer((prev) => (prev === layer.n ? "" : layer.n))}
                  />
                ))}
              </div>

              <div className="mt-20">
                <div style={{ marginBottom: "1.25rem" }}>
                  <Eyebrow>Visual overview</Eyebrow>
                </div>
                <AssessmentSuiteLadder />
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: VOID,
            borderTop: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-12 py-16 lg:grid-cols-2 lg:items-start">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.65 }}
              >
                <div style={{ marginBottom: "1.5rem" }}>
                  <Eyebrow>What qualifies</Eyebrow>
                </div>
                <div className="space-y-3">
                  {QUALIFIES.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        style={{
                          flexShrink: 0,
                          marginTop: "7px",
                          width: "4px",
                          height: "4px",
                          backgroundColor: `${GOLD}70`,
                        }}
                      />
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          lineHeight: 1.68,
                          color: "rgba(255,255,255,0.60)",
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.65, delay: 0.08 }}
              >
                <div style={{ marginBottom: "1.5rem" }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="h-5 w-px"
                      style={{ backgroundColor: "rgba(252,165,165,0.35)" }}
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8px",
                        letterSpacing: "0.40em",
                        textTransform: "uppercase",
                        color: "rgba(252,165,165,0.65)",
                      }}
                    >
                      What does not
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {DOES_NOT_QUALIFY.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        style={{
                          flexShrink: 0,
                          marginTop: "7px",
                          width: "4px",
                          height: "4px",
                          backgroundColor: "rgba(252,165,165,0.40)",
                        }}
                      />
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          lineHeight: 1.68,
                          color: "rgba(255,255,255,0.35)",
                          fontStyle: "italic",
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: VOID }}>
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="py-20 lg:py-28">
              <div
                className="relative overflow-hidden"
                style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06` }}
              >
                <div
                  className="pointer-events-none absolute right-0 top-0"
                  style={{
                    width: "400px",
                    height: "400px",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at top right, ${GOLD}12 0%, transparent 70%)`,
                    filter: "blur(80px)",
                  }}
                />
                <div
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: `linear-gradient(to right, transparent, ${GOLD}40, transparent)` }}
                />

                <div className="relative z-10" style={{ padding: "3rem 2.5rem" }}>
                  <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="mb-6 flex items-center gap-3">
                        <Crown style={{ width: "14px", height: "14px", color: `${GOLD}AA` }} />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.38em",
                            textTransform: "uppercase",
                            color: `${GOLD}90`,
                          }}
                        >
                          Escalation threshold
                        </span>
                      </div>

                      <h2
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "clamp(1.6rem, 3.5vw, 3rem)",
                          lineHeight: 1.02,
                          letterSpacing: "-0.022em",
                          color: "rgba(255,255,255,0.92)",
                          marginBottom: "1rem",
                          maxWidth: "22ch",
                        }}
                      >
                        When the diagnostic reveals material consequence, the next move is Strategy
                        Room.
                      </h2>

                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.02rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.42)",
                          maxWidth: "46ch",
                          fontStyle: "italic",
                        }}
                      >
                        The ladder does not force escalation. It shows when escalation is the
                        responsible next step — and, with equal precision, when it is not.
                      </p>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <div
                          style={{
                            padding: "5px 10px",
                            border: "1px solid rgba(110,231,183,0.18)",
                            backgroundColor: "rgba(110,231,183,0.06)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: "rgba(110,231,183,0.80)",
                            }}
                          >
                            Strategy signal
                          </span>
                        </div>

                        <div
                          style={{
                            padding: "5px 10px",
                            border: `1px solid ${GOLD}22`,
                            backgroundColor: `${GOLD}08`,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: `${GOLD}BE`,
                            }}
                          >
                            Governed escalation
                          </span>
                        </div>

                        <div
                          style={{
                            padding: "5px 10px",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backgroundColor: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.22em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.26)",
                            }}
                          >
                            Sponsor-ready
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Link
                        href="/consulting/strategy-room"
                        className="inline-flex items-center gap-2.5 transition-all duration-300"
                        style={{
                          padding: "13px 24px",
                          border: `1px solid ${GOLD}40`,
                          backgroundColor: `${GOLD}12`,
                          color: `${GOLD}CC`,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.borderColor = `${GOLD}65`;
                          el.style.backgroundColor = `${GOLD}1C`;
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.borderColor = `${GOLD}40`;
                          el.style.backgroundColor = `${GOLD}12`;
                        }}
                      >
                        <Crown style={{ width: "11px", height: "11px" }} />
                        Enter Strategy Room
                        <ArrowRight style={{ width: "11px", height: "11px" }} />
                      </Link>

                      <Link
                        href="/diagnostics/executive-reporting"
                        className="inline-flex items-center gap-2.5 transition-all duration-300"
                        style={{
                          padding: "13px 24px",
                          border: "1px solid rgba(255,255,255,0.09)",
                          backgroundColor: "rgba(255,255,255,0.02)",
                          color: "rgba(255,255,255,0.45)",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.borderColor = "rgba(255,255,255,0.18)";
                          el.style.color = "rgba(255,255,255,0.72)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLAnchorElement;
                          el.style.borderColor = "rgba(255,255,255,0.09)";
                          el.style.color = "rgba(255,255,255,0.45)";
                        }}
                      >
                        Executive Reporting
                      </Link>

                      <Link
                        href="/diagnostics/constitutional-diagnostic"
                        className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.25)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Start at Layer 01 <ChevronRight style={{ width: "10px", height: "10px" }} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}