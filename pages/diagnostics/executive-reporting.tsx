import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

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
          {index < items.length - 1 ? <Dot /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function SummaryLine({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      className="mt-6 flex flex-wrap items-center gap-2"
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
      }}
    >
      {children}
    </div>
  );
}

export default function ExecutiveReportingPage() {
  return (
    <Layout
      title="Executive Reporting | Abraham of London"
      description="Executive Reporting is the flagship dossier product: a board-grade intelligence brief generated from governed intake and constitutional scoring."
      canonicalUrl="/diagnostics/executive-reporting"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <div style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-20 lg:py-24">
              <Eyebrow>EXECUTIVE REPORTING · INSTRUMENT MODE</Eyebrow>
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
                The executive dossier.
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
                Campaign synthesis, constitutional posture, and governed recommendations for institutional decision-makers.
              </p>

              <RouteStrip />

              <SummaryLine color="rgba(255,255,255,0.38)">
                <span>Campaign management</span>
                <Dot />
                <span>Participant telemetry</span>
                <Dot />
                <span>Constitutional posture</span>
                <Dot />
                <span>PDF export</span>
              </SummaryLine>

              <SummaryLine color="rgba(255,255,255,0.28)">
                <span>Requires: Active campaign</span>
                <Dot />
                <span>5+ participants</span>
                <Dot />
                <span>Completed assessment</span>
              </SummaryLine>

              <Link
                href="/admin/reporting"
                className="mt-8 inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "9px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: AMBER,
                }}
              >
                Access executive reports
                <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
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
