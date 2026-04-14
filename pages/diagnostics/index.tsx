import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, FileText, LayoutGrid, Radar, Users } from "lucide-react";

import Layout from "@/components/Layout";

type Rung = {
  n: string;
  title: string;
  href: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  output: string;
  duration: string;
  access: string;
  route: string;
};

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "200px 200px",
};

const RUNGS: Rung[] = [
  {
    n: "01",
    title: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    icon: Radar,
    output: "Route, posture, authority classification, confidence score",
    duration: "4–7 min",
    access: "No login",
    route: "Returns STRATEGY, DIAGNOSTIC, or REJECT.",
  },
  {
    n: "02",
    title: "Team Assessment",
    href: "/diagnostics/team-assessment",
    icon: Users,
    output: "Leader-team gap, fragility index, domain breakdown",
    duration: "12–18 min",
    access: "Reads prior result",
    route: "Advances only when the constitutional route supports evidence gathering.",
  },
  {
    n: "03",
    title: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    icon: LayoutGrid,
    output: "Failure mode, section breakdown, escalation route",
    duration: "8–12 min",
    access: "Reads Team Assessment",
    route: "Routes toward Executive Reporting or Strategy Room when consequence is material.",
  },
];

const QUALIFIES = [
  "A material decision is approaching and the structural condition is still unclear.",
  "Misalignment has persisted after internal attempts to correct it.",
  "The cost of delay is compounding across governance, execution, or authority.",
  "A sponsor needs a governed route, not reassurance or generic guidance.",
];

const DOES_NOT_QUALIFY = [
  "Curiosity without a decision-bearing sponsor.",
  "Validation-seeking where the outcome is already politically fixed.",
  "Personal anxiety presented as institutional diagnosis.",
  "Matters where authority is absent at the level the decision requires.",
];

function GoldRule() {
  return <div className="h-px w-full" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}CC`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function RouteStrip() {
  const items = [
    { label: "Strategy", color: "rgba(110,231,183,0.82)", border: "rgba(110,231,183,0.18)", bg: "rgba(110,231,183,0.05)" },
    { label: "Diagnostic", color: `${GOLD}D4`, border: `${GOLD}22`, bg: `${GOLD}08` },
    { label: "Reject", color: "rgba(252,165,165,0.82)", border: "rgba(252,165,165,0.18)", bg: "rgba(252,165,165,0.05)" },
  ];

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: LIFT }}>
      <div style={{ padding: "0.9rem 1.15rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.38)",
          }}
        >
          Constitutional route set
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2" style={{ padding: "1rem 1.15rem" }}>
        {items.map((item) => (
          <div
            key={item.label}
            style={{
              border: `1px solid ${item.border}`,
              backgroundColor: item.bg,
              padding: "0.5rem 0.35rem",
              textAlign: "center",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "6.5px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: item.color,
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  const Icon = rung.icon;
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "1.5rem 0" }}>
      <div className="grid gap-5 lg:grid-cols-[72px_1fr_auto] lg:items-start">
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "18px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)",
            lineHeight: 1,
          }}
        >
          {rung.n}
        </div>

        <div>
          <div className="mb-2 flex items-center gap-3">
            <Icon style={{ width: "13px", height: "13px", color: `${GOLD}B8`, flexShrink: 0 }} />
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.35rem, 2vw, 1.7rem)",
                fontStyle: "italic",
                lineHeight: 1.05,
                color: "rgba(255,255,255,0.90)",
              }}
            >
              {rung.title}
            </span>
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
              marginBottom: "0.85rem",
            }}
          >
            {rung.duration} · {rung.access}
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "6.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: `${GOLD}A8`,
                  marginBottom: "0.4rem",
                }}
              >
                Output
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.62,
                  color: "rgba(255,255,255,0.68)",
                }}
              >
                {rung.output}
              </p>
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "6.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.34)",
                  marginBottom: "0.4rem",
                }}
              >
                Route outcome
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.62,
                  color: "rgba(255,255,255,0.50)",
                }}
              >
                {rung.route}
              </p>
            </div>
          </div>
        </div>

        <div>
          <Link
            href={rung.href}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{
              padding: "12px 18px",
              border: `1px solid ${GOLD}32`,
              backgroundColor: `${GOLD}0A`,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}CC`,
              whiteSpace: "nowrap",
            }}
          >
            Enter rung {rung.n}
            <ArrowRight style={{ width: "11px", height: "11px" }} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function QualificationColumn({ title, items, accent, dim = false }: { title: string; items: string[]; accent: string; dim?: boolean }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <span className="h-5 w-px" style={{ backgroundColor: accent }} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.40em",
            textTransform: "uppercase",
            color: dim ? "rgba(252,165,165,0.68)" : `${GOLD}B8`,
          }}
        >
          {title}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-3">
            <div style={{ width: "4px", height: "4px", marginTop: "8px", backgroundColor: accent, flexShrink: 0 }} />
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.98rem",
                lineHeight: 1.62,
                color: dim ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.62)",
                fontStyle: dim ? "italic" : "normal",
              }}
            >
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiagnosticsIndexPage() {
  return (
    <Layout title="Diagnostic Ladder | Abraham of London">
      <Head>
        <meta
          name="description"
          content="The governed diagnostic ladder for classifying structural problems, qualifying serious matters, and routing them toward reporting or escalation."
        />
      </Head>

      <div style={{ backgroundColor: VOID, ...GRAIN }}>
        <section style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-14 lg:py-18">
              <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
                <div>
                  <Eyebrow>Diagnostic Ladder · Abraham of London</Eyebrow>
                  <h1
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(2rem, 3.5vw, 3rem)",
                      lineHeight: 1.02,
                      letterSpacing: "-0.03em",
                      color: "rgba(255,255,255,0.90)",
                      maxWidth: "13ch",
                    }}
                  >
                    Three rungs. One route. No ambient guidance.
                  </h1>
                  <p
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.94rem",
                      lineHeight: 1.65,
                      color: "rgba(255,255,255,0.52)",
                      maxWidth: "46ch",
                    }}
                  >
                    This system classifies structural problems, states whether they qualify, and routes them toward reporting or escalation without ambient advisory language.
                  </p>
                </div>
                <RouteStrip />
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-14 lg:py-18">
              <div className="mb-8">
                <Eyebrow>Rung sequence</Eyebrow>
              </div>
              <div>
                {RUNGS.map((rung) => (
                  <RungRow key={rung.n} rung={rung} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-14 lg:py-18">
              <div className="mb-8">
                <Eyebrow>Qualification</Eyebrow>
              </div>
              <div className="grid gap-10 lg:grid-cols-2">
                <QualificationColumn
                  title="What qualifies"
                  items={QUALIFIES}
                  accent="rgba(201,169,110,0.70)"
                />
                <QualificationColumn
                  title="What does not"
                  items={DOES_NOT_QUALIFY}
                  accent="rgba(252,165,165,0.42)"
                  dim
                />
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: VOID }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-14">
              <div style={{ marginBottom: "1rem" }}>
                <Eyebrow>After rung 03</Eyebrow>
              </div>
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1rem",
                    lineHeight: 1.62,
                    color: "rgba(255,255,255,0.58)",
                    maxWidth: "54ch",
                  }}
                >
                  Executive Reporting follows when the enterprise reading shows a decision-bearing condition that needs a governed dossier. Strategy Room follows when a structured product is insufficient and the consequence remains materially live.
                </p>
                <Link
                  href="/diagnostics/executive-reporting"
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    padding: "12px 18px",
                    border: `1px solid ${GOLD}32`,
                    backgroundColor: `${GOLD}0A`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: `${GOLD}CC`,
                    whiteSpace: "nowrap",
                  }}
                >
                  Executive Reporting
                  <FileText style={{ width: "11px", height: "11px" }} />
                </Link>
              </div>
              <div style={{ marginTop: "1.25rem" }}>
                <GoldRule />
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
