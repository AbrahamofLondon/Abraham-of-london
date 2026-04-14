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
};

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const RUNGS: Rung[] = [
  {
    n: "01",
    label: "Constitutional Diagnostic",
    href: "/diagnostics/constitutional-diagnostic",
    duration: "6 min",
    route: "STRATEGY",
  },
  {
    n: "02",
    label: "Team Assessment",
    href: "/diagnostics/team-assessment",
    duration: "10 min",
    route: "DIAGNOSTIC",
  },
  {
    n: "03",
    label: "Enterprise Assessment",
    href: "/diagnostics/enterprise-assessment",
    duration: "15 min",
    route: "DIAGNOSTIC",
  },
  {
    n: "04",
    label: "Executive Reporting",
    href: "/diagnostics/executive-reporting",
    duration: "12 min",
    route: "STRATEGY",
  },
];

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
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.68)",
        }}
      >
        {`RUNG ${rung.n}`}
      </span>
      <Dot />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.48)",
        }}
      >
        {rung.label}
      </span>
      <Dot />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.32)",
        }}
      >
        {rung.duration}
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
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.16)",
        }}
      >
        →
      </span>
      <Link
        href={rung.href}
        className="transition-all hover:underline"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: AMBER,
        }}
      >
        Begin
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
                The diagnostic instrument.
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
                Assess structural alignment across six domains. Results inform constitutional routing.
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
                Required: 10 minutes · 18 questions · No account required
              </div>
              <Link
                href="/purpose-alignment"
                className="mt-8 inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: AMBER,
                }}
              >
                Begin diagnostic
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
