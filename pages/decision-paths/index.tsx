import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import CheckoutButton from "@/components/commercial/CheckoutButton";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";
import {
  trackLanding,
  trackBundleClick,
  trackExecGateView,
} from "@/lib/analytics/journey-client";

// ──────���──────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ───────────────────────────────────────────────────────────────���─────────────

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

// ──────────────────────────────────────────���──────────────────────────────────
// DATA
// ─────────────────────────────���───────────────────────────��───────────────────

type DecisionPath = {
  id: number;
  name: string;
  price: string;
  positioning: string;
  trigger: string;
  includes: string[];
  outcome: string;
  cta: string;
  ctaHref: string;
  secondaryCta?: string;
  secondaryProductCode?: string;
  accent?: "gold" | "emphasis";
};

const PATHS: DecisionPath[] = [
  {
    id: 1,
    name: "Decision Instruments",
    price: `${getProductDisplayPrice("decision_exposure_instrument")}\u2013${getProductDisplayPrice("intervention_path_selector")}`,
    positioning: "When one decision condition must be isolated before it compounds.",
    trigger: "Use this stage when exposure, authority, or intervention path is unclear and the system needs a specific decision signal.",
    includes: [
      "Decision Exposure Instrument",
      "Mandate Clarity Framework",
      "Intervention Path Selector",
    ],
    outcome: "You produce a bounded output that feeds Executive Reporting when consequence must be priced.",
    cta: "View instruments",
    ctaHref: "/decision-instruments",
    secondaryCta: `Acquire Operator Pack · ${getProductDisplayPrice("operator_decision_pack")}`,
    secondaryProductCode: "operator_decision_pack",
  },
  {
    id: 2,
    name: "Executive Reporting",
    price: getProductDisplayPrice("executive_reporting"),
    positioning: "When accumulated evidence must become a governed position.",
    trigger: "Use this stage when contradiction is established and the cost of delay or wrong action must be stated clearly.",
    includes: [
      "Evidence convergence",
      "Contradiction hierarchy",
      "Consequence pricing",
      "Priority stack",
    ],
    outcome: "You receive a decision document that names the condition, consequence, and next required move.",
    cta: "Open Executive Reporting",
    ctaHref: "/diagnostics/executive-reporting",
    accent: "gold",
  },
  {
    id: 3,
    name: "Strategy Room",
    price: getProductDisplayPrice("strategy_room"),
    positioning: "When analysis is over and intervention must be sequenced.",
    trigger: "Use this stage when the system has determined that action, ownership, and constraint resolution are now required.",
    includes: [
      "Decision object",
      "Execution blocker",
      "First three moves",
      "Decision log",
      "Escalation triggers",
    ],
    outcome: "You enter a controlled execution environment for the decision already determined.",
    cta: "Enter Strategy Room",
    ctaHref: "/consulting/strategy-room",
    accent: "emphasis",
  },
];

const PROGRESSION_STAGES = [
  { label: "Diagnostic", description: "Identify condition" },
  { label: "Evidence", description: "Build the case" },
  { label: "Executive Reporting", description: "State consequence" },
  { label: "Strategy Room", description: "Execute intervention" },
];

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ──────────────────���──────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.38)",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent"
      }
    />
  );
}

// ──────��───────────────────���──────────────────────────────────────────────────
// PATH CARD
// ──────────────────��────────────────────────────────────���─────────────────────

function PathCard({ path }: { path: DecisionPath }) {
  const isGold = path.accent === "gold";
  const isEmphasis = path.accent === "emphasis";

  const borderColor = isGold
    ? `${GOLD}35`
    : isEmphasis
      ? "rgba(255,255,255,0.14)"
      : "rgba(255,255,255,0.08)";
  const bgColor = isGold
    ? `${GOLD}06`
    : isEmphasis
      ? "rgba(255,255,255,0.03)"
      : "rgba(255,255,255,0.018)";
  const nameColor = isGold ? GOLD : "rgba(255,255,255,0.88)";

  return (
    <div
      className="flex flex-col transition-all duration-200"
      style={{
        border: `1px solid ${borderColor}`,
        backgroundColor: bgColor,
        padding: "1.5rem",
      }}
    >
      {/* Path number + price */}
      <div className="flex items-center justify-between">
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: isGold ? `${GOLD}90` : "rgba(255,255,255,0.28)",
          }}
        >
          Path {path.id}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "10px",
            letterSpacing: "0.08em",
            color: isGold ? GOLD : "rgba(255,255,255,0.72)",
          }}
        >
          {path.price}
        </span>
      </div>

      {/* Name */}
      <h3
        style={{
          marginTop: "0.85rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "1.35rem",
          lineHeight: 1.1,
          color: nameColor,
        }}
      >
        {path.name}
      </h3>

      {/* Positioning */}
      <p
        style={{
          marginTop: "0.6rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.95rem",
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.52)",
          fontStyle: "italic",
        }}
      >
        {path.positioning}
      </p>

      {/* Trigger */}
      <div style={{ marginTop: "1rem" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.24)",
          }}
        >
          When to use
        </span>
        <p
          style={{
            marginTop: "0.35rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.88rem",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.42)",
          }}
        >
          {path.trigger}
        </p>
      </div>

      {/* Includes */}
      <div style={{ marginTop: "1rem" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.24)",
          }}
        >
          Includes
        </span>
        <ul style={{ marginTop: "0.35rem" }}>
          {path.includes.map((item) => (
            <li
              key={item}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.88rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.42)",
                paddingLeft: "0.75rem",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  color: isGold ? `${GOLD}60` : "rgba(255,255,255,0.18)",
                }}
              >
                ·
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Outcome */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "1.25rem",
        }}
      >
        <div
          style={{
            borderTop: `1px solid ${isGold ? `${GOLD}18` : "rgba(255,255,255,0.06)"}`,
            paddingTop: "1rem",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "6.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.24)",
            }}
          >
            Outcome
          </span>
          <p
            style={{
              marginTop: "0.35rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.95rem",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.68)",
            }}
          >
            {path.outcome}
          </p>
        </div>

        {/* CTA */}
        <Link
          href={path.ctaHref}
          onClick={() => trackBundleClick(path.name, parseInt(path.price.replace(/[^0-9]/g, ""), 10) || 0)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 transition-all duration-200"
          style={{
            padding: "10px 16px",
            border: `1px solid ${isGold ? `${GOLD}40` : AMBER + "30"}`,
            backgroundColor: isGold ? `${GOLD}0A` : "transparent",
            color: isGold ? GOLD : AMBER,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isGold ? `${GOLD}65` : AMBER + "55";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isGold ? `${GOLD}40` : AMBER + "30";
          }}
        >
          {path.cta}
          <ArrowRight style={{ width: "10px", height: "10px" }} />
        </Link>
        {path.secondaryProductCode && path.secondaryCta && (
          <CheckoutButton
            productCode={path.secondaryProductCode}
            originPath="/decision-paths"
            onCheckoutStart={() => trackBundleClick(path.secondaryProductCode || path.name, 129)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 transition-all duration-200"
            style={{
              padding: "9px 14px",
              border: `1px solid ${GOLD}35`,
              backgroundColor: `${GOLD}08`,
              color: GOLD,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {path.secondaryCta}
          </CheckoutButton>
        )}
      </div>
    </div>
  );
}

// ────────────��────────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────���────────────────────────────────────────────

export default function DecisionPathsPage() {
  React.useEffect(() => {
    trackLanding("/decision-paths");
  }, []);

  return (
    <Layout
      title="Decision Paths | Abraham of London"
      description="Structured decision tools that build evidence, define position, and prepare escalation. From signal to decision — without guesswork."
      canonicalUrl="/decision-paths"
    >
      <Head>
        <meta
          name="description"
          content="Governed decision paths. Structured instruments that build evidence, price consequence, and prepare escalation when it is justified."
        />
      </Head>

      <div style={{ backgroundColor: VOID }}>

        {/* ── 1) HERO ─────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-16 lg:py-24">
              <Eyebrow>Governed Decision System</Eyebrow>
              <h1
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2rem, 9vw, 4rem)",
                  lineHeight: 0.98,
                  letterSpacing: 0,
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: "48ch",
                  fontStyle: "italic",
                }}
              >
                From signal to decision&mdash;without guesswork.
              </h1>
              <p
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.48)",
                  maxWidth: "56ch",
                }}
              >
                Structured instruments that build evidence, price consequence, and
                prepare escalation when it is justified.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href="#paths"
                  className="inline-flex items-center gap-2 transition-all duration-200"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${AMBER}42`,
                    backgroundColor: "transparent",
                    color: AMBER,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8.5px",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `${AMBER}65`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = `${AMBER}42`;
                  }}
                >
                  View decision paths
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </a>
                <Link
                  href="/diagnostics/constitutional-diagnostic"
                  className="inline-flex items-center gap-2 transition-all hover:underline"
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.32)",
                  }}
                >
                  Start diagnostic (6 min)
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2) SYSTEM PROGRESSION STRIP ─────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div
              className="border-y py-6"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div
                className="grid gap-px md:grid-cols-4"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                {PROGRESSION_STAGES.map((stage, i) => (
                  <div
                    key={stage.label}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ backgroundColor: VOID }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        color: `${GOLD}50`,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7.5px",
                          letterSpacing: "0.20em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.58)",
                        }}
                      >
                        {stage.label}
                      </div>
                      <div
                        style={{
                          marginTop: "0.15rem",
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.85rem",
                          color: "rgba(255,255,255,0.32)",
                        }}
                      >
                        {stage.description}
                      </div>
                    </div>
                    {i < PROGRESSION_STAGES.length - 1 && (
                      <ArrowRight
                        className="ml-auto hidden md:block"
                        style={{
                          width: "10px",
                          height: "10px",
                          color: "rgba(255,255,255,0.12)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p
                className="mt-3"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}
              >
                Each stage increases consequence, clarity, and commitment
              </p>
            </div>
          </div>
        </section>

        {/* ── 3) THE PATHS (CORE) ─────────────────────────────────────────── */}
        <section id="paths">
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-16">
              <Eyebrow>Decision paths</Eyebrow>
              <h2
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.84)",
                }}
              >
                Choose the path that matches the pressure.
              </h2>
              <p
                style={{
                  marginTop: "0.65rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.38)",
                  maxWidth: "52ch",
                }}
              >
                Each path is a progression step. They build evidence, sharpen
                position, and prepare the conditions for Executive Reporting
                and Strategy Room when consequence justifies it.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {PATHS.map((path) => (
                  <PathCard key={path.id} path={path} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <GoldRule />

        {/* ── 4) FLAGSHIP SECTION ─────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-16">
              <Eyebrow>Flagship</Eyebrow>
              <h2
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.88)",
                  fontStyle: "italic",
                }}
              >
                The point where evidence becomes position.
              </h2>
              <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                {/* Left — what it does */}
                <div>
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.52)",
                      maxWidth: "48ch",
                    }}
                  >
                    Executive Reporting translates accumulated diagnostic
                    evidence into a governed position. It does not advise. It
                    states consequence, prices exposure, and sequences the
                    decisions that follow.
                  </p>
                  <div className="mt-6 space-y-0">
                    {[
                      { label: "Position statement", desc: "Structural condition stated in board-grade language" },
                      { label: "Financial exposure", desc: "Estimated cost of inaction over defined horizon" },
                      { label: "Priority stack", desc: "Force-ranked decisions under real constraints" },
                      { label: "Next action", desc: "The single move that unlocks the sequence" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-start gap-4 py-3"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.04)",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: GOLD,
                            minWidth: "10rem",
                            flexShrink: 0,
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.92rem",
                            lineHeight: 1.55,
                            color: "rgba(255,255,255,0.42)",
                          }}
                        >
                          {item.desc}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right — CTA panel */}
                <div
                  style={{
                    border: `1px solid ${GOLD}28`,
                    backgroundColor: `${GOLD}06`,
                    padding: "1.75rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Executive Reporting
                  </div>
                  <p
                    style={{
                      marginTop: "0.85rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    The governed executive brief. Where accumulated diagnostic
                    evidence becomes a board-grade position with financial
                    exposure and directed action.
                  </p>
                  <Link
                    href="/diagnostics/executive-reporting"
                    onClick={() => trackExecGateView()}
                    className="mt-5 inline-flex items-center gap-2 transition-all duration-200"
                    style={{
                      padding: "10px 20px",
                      border: `1px solid ${GOLD}40`,
                      backgroundColor: `${GOLD}0A`,
                      color: GOLD,
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8.5px",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      alignSelf: "flex-start",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${GOLD}65`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${GOLD}40`;
                    }}
                  >
                    View Executive Reporting &middot; {getProductDisplayPrice("executive_reporting")}
                    <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <GoldRule soft />

        {/* ── 5) ESCALATION SECTION ─────���─────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-16">
              <Eyebrow>Escalation environment</Eyebrow>
              <h2
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                When interpretation is no longer enough.
              </h2>
              <p
                style={{
                  marginTop: "0.85rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.40)",
                  maxWidth: "52ch",
                }}
              >
                The Strategy Room opens when evidence justifies intervention.
                It is not always available. Entry is gated by condition. It is
                not advisory.
              </p>

              <div
                className="mt-6 grid gap-4 md:grid-cols-3"
                style={{ maxWidth: "48rem" }}
              >
                {[
                  "Not always available",
                  "Entry is gated by condition",
                  "Not advisory",
                ].map((rule) => (
                  <div
                    key={rule}
                    style={{
                      border: "1px solid rgba(255,255,255,0.06)",
                      backgroundColor: "rgba(255,255,255,0.018)",
                      padding: "0.85rem 1rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.38)",
                      }}
                    >
                      {rule}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/strategy-room"
                className="mt-6 inline-flex items-center gap-2 transition-all duration-200"
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.52)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                Strategy Room &middot; {getProductDisplayPrice("strategy_room")}
                <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
            </div>
          </div>
        </section>

        <GoldRule soft />

        {/* ── 6) GUARDRAILS ───────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10">
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.24)",
                    marginBottom: "0.85rem",
                  }}
                >
                  System guardrails
                </div>
                <div
                  className="space-y-2"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.92rem",
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.38)",
                  }}
                >
                  <p>These are structured instruments. They produce decision objects, not commentary.</p>
                  <p>They build evidence. They do not build consensus.</p>
                  <p>
                    They do not replace the executive report or escalation
                    environment. They prepare the conditions for both.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── BACK LINK ───────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
