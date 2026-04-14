import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

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

const DELIVERABLE_FIELDS = [
  {
    label: "Executive headline and route",
    value: "Top-line judgment naming the matter, the constitutional route, and the seriousness level.",
  },
  {
    label: "Governance risk reading",
    value: "Authority weakness, mandate ambiguity, and institutional exposure stated in decision-grade language.",
  },
  {
    label: "Top pressure points",
    value: "Three ranked drivers of the condition now, ordered by consequence rather than observation volume.",
  },
  {
    label: "Domain breakdown",
    value: "Scored pressure across strategy, finance, operations, human capital, and governance.",
  },
  {
    label: "Decision options and trade-offs",
    value: "Clear options with attached costs, constraints, and strategic consequences.",
  },
  {
    label: "Correction priorities and execution sequence",
    value: "Ordered 7-day, 30-day, and 90-day path tied to authority level and severity.",
  },
];

const COMMERCIAL_OBJECT_ROWS = [
  { label: "Format", value: "Single governed dossier generated from intake and constitutional scoring." },
  { label: "Delivery", value: "Run record stored immediately against the intake with structured snapshot persistence." },
  { label: "Access", value: "Inquiry-gated diagnostic product entered through the executive reporting intake." },
  { label: "Afterward", value: "Progresses toward Strategy Room only when the matter exceeds the structured product boundary." },
];

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

function SpecTable({ rows }: { rows: Array<{ label: string; value: string }> }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
      {rows.map((row, index) => (
        <div
          key={row.label}
          className="grid gap-3 px-4 py-3 md:grid-cols-[168px_1fr]"
          style={{ borderTop: index === 0 ? "none" : "1px solid rgba(255,255,255,0.05)" }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.26)",
            }}
          >
            {row.label}
          </div>
          <div
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "12px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.80)",
            }}
          >
            {row.value}
          </div>
        </div>
      ))}
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

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)", ...GRAIN }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-14 lg:py-16">
              <Eyebrow>Executive Reporting · Flagship Dossier</Eyebrow>
              <h1
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.03em",
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: "14ch",
                }}
              >
                The report the ladder produces.
              </h1>
              <p
                style={{
                  marginTop: "0.9rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.62,
                  color: "rgba(255,255,255,0.52)",
                  maxWidth: "48ch",
                }}
              >
                Board-grade dossier generated from governed intake, constitutional scoring, and structured decision framing.
              </p>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-6 lg:py-7">
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  lineHeight: 1.9,
                }}
              >
                <div>Rung 02 of the diagnostic sequence.</div>
                <div>Constitutional diagnostic feeds it.</div>
                <div>Strategy Room follows it.</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-14">
              <div className="mb-5">
                <Eyebrow>Dossier specification</Eyebrow>
              </div>
              <SpecTable rows={DELIVERABLE_FIELDS} />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-14">
              <div className="mb-5">
                <Eyebrow>Product specification</Eyebrow>
              </div>
              <SpecTable rows={REPORT_SPEC_ROWS} />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: BASE, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-14">
              <div className="mb-5">
                <Eyebrow>Commercial object</Eyebrow>
              </div>
              <SpecTable rows={COMMERCIAL_OBJECT_ROWS} />
            </div>
          </div>
        </section>

        <section style={{ backgroundColor: VOID }}>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-12 lg:py-14">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/diagnostics/executive-reporting/run"
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    padding: "12px 18px",
                    border: `1px solid ${GOLD}34`,
                    backgroundColor: `${GOLD}0A`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: `${GOLD}CC`,
                  }}
                >
                  Begin Executive Reporting
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>

                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
                  style={{
                    padding: "12px 18px",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  See the diagnostic ladder
                  <FileText style={{ width: "11px", height: "11px" }} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
