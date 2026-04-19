import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

type Rung = {
  n: string;
  label: string;
  href: string;
  duration: string;
  route: string;
  role: string;
  produces: string;
};

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const RUNGS: Rung[] = [
  {
    n: "00",
    label: "Purpose Alignment",
    href: "/diagnostics/purpose-alignment",
    duration: "8 min",
    route: "PERSONAL",
    role: "Free personal diagnostic",
    produces: "Personal alignment profile, pattern reading, first action",
  },
  {
    n: "01",
    label: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    duration: "6 min",
    route: "STRATEGY",
    role: "Public instrument",
    produces: "Route, confidence, posture, readiness, failure modes",
  },
  {
    n: "02",
    label: "Team Assessment",
    href: "/diagnostics/team-assessment",
    duration: "10 min",
    route: "DIAGNOSTIC",
    role: "Continuation instrument",
    produces: "Perception gap, fragility class, team focus areas",
  },
  {
    n: "03",
    label: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    duration: "15 min",
    route: "DIAGNOSTIC",
    role: "Continuation instrument",
    produces: "Enterprise pressure points, escalation logic",
  },
  {
    n: "04",
    label: "Executive Reporting",
    href: "/diagnostics/executive-reporting",
    duration: "12 min",
    route: "STRATEGY",
    role: "Executive intake instrument",
    produces: "Board-grade constitutional interpretation",
  },
];

const TOTAL_STAGES = RUNGS.length;

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

function RouteStrip() {
  const items = [
    { label: "STRATEGY", color: GOLD },
    { label: "DIAGNOSTIC", color: "rgba(255,255,255,0.48)" },
    { label: "REJECT", color: "rgba(255,255,255,0.24)" },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: item.color,
            }}
          >
            {item.label}
          </span>
          {index < items.length - 1 ? (
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
              }}
            >
              ·
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function routeColor(route: string) {
  if (route === "STRATEGY") return GOLD;
  if (route === "DIAGNOSTIC") return "rgba(255,255,255,0.48)";
  if (route === "PERSONAL") return "rgba(110,231,183,0.65)";
  return "rgba(255,255,255,0.24)";
}

function Dot() {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.16)",
      }}
    >
      ·
    </span>
  );
}

function RungRow({ rung }: { rung: Rung }) {
  return (
    <div className="grid gap-3 border-t border-white/[0.06] py-5 md:grid-cols-[0.8fr_1fr_auto] md:items-start">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.68)",
            }}
          >
            {`STAGE ${rung.n} OF ${TOTAL_STAGES}`}
          </span>
          <Dot />
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: routeColor(rung.route),
            }}
          >
            {rung.route}
          </span>
        </div>
        <div
          style={{
            marginTop: "0.65rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "1.12rem",
            color: "rgba(255,255,255,0.78)",
          }}
        >
          {rung.label}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.32)",
          }}
        >
          {rung.role} · {rung.duration}
        </div>
        <p
          style={{
            marginTop: "0.55rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.92rem",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.44)",
          }}
        >
          Produces: {rung.produces}.
        </p>
      </div>
      <Link
        href={rung.href}
        className="inline-flex items-center gap-2 transition-all hover:underline md:justify-self-end"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: AMBER,
        }}
      >
        Open stage
        <ArrowRight style={{ width: "10px", height: "10px" }} />
      </Link>
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

      <div style={{ backgroundColor: VOID }}>
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-20 lg:py-24">
              <Eyebrow>DIAGNOSTICS · INSTRUMENT MODE</Eyebrow>
              <h1
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: "48ch",
                  fontStyle: "italic",
                }}
              >
                The diagnostic ladder.
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
                A public navigation surface for the four assessment stages. Each stage below states whether it is an instrument, what it collects, and what it produces.
              </p>
              <RouteStrip />
              <div
                className="mt-8"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                }}
              >
                Public entry · staged assessment · no account required for diagnostic stages
              </div>
              <Link
                href="/diagnostics/purpose-alignment"
                className="mt-8 inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: AMBER,
                }}
              >
                Start the Diagnostic
                <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8 lg:py-10">
              <div className="space-y-1">
                {RUNGS.map((rung) => (
                  <RungRow key={rung.n} rung={rung} />
                ))}
              </div>

              <div
                className="mt-6 flex items-center gap-2"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.24)",
                }}
              >
                <span style={{ display: "inline-block", width: "16px", height: "1px", backgroundColor: "rgba(255,255,255,0.12)" }} />
                Escalates to Strategy Room only if earlier stages do not resolve the matter
              </div>
            </div>
          </div>
        </section>

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
