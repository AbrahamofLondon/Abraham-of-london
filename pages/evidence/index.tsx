import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const EVIDENCE = [
  {
    slug: "tariff-shock-growth-break",
    title: "When Growth Models Broke Under Tariff Shock",
    context: "April 2026 tariff escalation and market repricing.",
    insight: "Markets shifted from growth pricing to survivability pricing.",
    signal: "Assumptions collapsed before models were updated.",
  },
  {
    slug: "team-alignment-illusion",
    title: "The Illusion of Team Alignment Under Pressure",
    context: "Leadership believed alignment was high.",
    insight: "Respondent evidence showed divergence at execution layer.",
    signal: "Alignment failure was hidden until measured.",
  },
  {
    slug: "escalation-denied-case",
    title: "Why Escalation Was Denied (And That Saved the System)",
    context: "Condition appeared critical but evidence incomplete.",
    insight: "Escalation threshold not met under governed criteria.",
    signal: "Premature escalation would have increased systemic risk.",
  },
];

// ─────────────────────────────────────────────────────────���───────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  React.useEffect(() => {
    const { trackScrollDepth, trackHesitation, advanceConviction } = require("@/lib/analytics/hesitation");
    const { emitJourneyEvent } = require("@/lib/analytics/journey-client");
    emitJourneyEvent("evidence_viewed", { entryPath: "/evidence" });
    const cleanScroll = trackScrollDepth("evidence", [80]);
    const cleanHesitation = trackHesitation({ page: "evidence", idleTimeout: 6000 });
    advanceConviction("RECOGNISED");
    return () => { cleanScroll(); cleanHesitation(); };
  }, []);

  return (
    <Layout
      title="Case Evidence | Abraham of London"
      description="Structured readings of conditions that required decisions. Not opinions. Applied analysis under real conditions."
      canonicalUrl="/evidence"
    >
      <Head>
        <meta name="description" content="Case evidence: structured readings of conditions that required decisions. Observed under real conditions." />
      </Head>

      <div style={{ backgroundColor: VOID }}>

        {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="pt-14 pb-10 lg:pt-20 lg:pb-12">
              <Eyebrow>Case Evidence</Eyebrow>
              <h1 style={{
                ...serif,
                marginTop: "0.85rem",
                fontSize: "clamp(1.9rem, 7vw, 3.2rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "36ch",
                fontStyle: "italic",
              }}>
                Observed under real conditions.
              </h1>
              <p style={{
                ...serif,
                marginTop: "0.85rem",
                fontSize: "1rem",
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.45)",
                maxWidth: "56ch",
              }}>
                These are not opinions. These are structured readings of conditions that required decisions.
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. DEFINITION STRIP ─────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="grid gap-px md:grid-cols-3 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.04)" }}>
              {[
                { pre: "Not commentary", post: "Applied analysis" },
                { pre: "Not hindsight", post: "Decision-time interpretation" },
                { pre: "Not theory", post: "Operator-facing outputs" },
              ].map((item) => (
                <div key={item.pre} style={{ backgroundColor: VOID, padding: "0.85rem 1rem" }}>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    {item.pre}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    {" \u2192 "}
                  </span>
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
                    {item.post}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. EVIDENCE GRID ────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10 lg:py-14">
              <div className="grid gap-3 md:grid-cols-3">
                {EVIDENCE.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/evidence/${e.slug}`}
                    className="group flex flex-col transition-all duration-200 hover:-translate-y-px"
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      backgroundColor: "rgba(255,255,255,0.02)",
                      padding: "1.15rem",
                    }}
                  >
                    {/* Title */}
                    <h3 style={{ ...serif, fontSize: "1.05rem", lineHeight: 1.15, color: "rgba(255,255,255,0.85)" }}>
                      {e.title}
                    </h3>

                    {/* Context */}
                    <div style={{ marginTop: "0.65rem" }}>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        Context
                      </span>
                      <p style={{ ...serif, marginTop: "0.1rem", fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.38)" }}>
                        {e.context}
                      </p>
                    </div>

                    {/* System insight */}
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                        System insight
                      </span>
                      <p style={{ ...serif, marginTop: "0.1rem", fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.50)" }}>
                        {e.insight}
                      </p>
                    </div>

                    {/* Outcome signal */}
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                        Outcome signal
                      </span>
                      <p style={{ ...serif, marginTop: "0.1rem", fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.38)" }}>
                        {e.signal}
                      </p>
                    </div>

                    {/* CTA */}
                    <div style={{ marginTop: "auto", paddingTop: "0.75rem" }}>
                      <span
                        className="inline-flex items-center gap-2"
                        style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: AMBER }}
                      >
                        View evidence
                        <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERVENTION LINE ── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ ...serif, fontSize: "0.88rem", color: "rgba(252,165,165,0.45)", fontStyle: "italic" }}>
                This requires intervention, not analysis.
              </p>
            </div>
          </div>
        </section>

        {/* ── BACK ────────────────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-8">
              <Link href="/" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                Back to home
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
