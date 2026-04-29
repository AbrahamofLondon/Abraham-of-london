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

              <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(201,169,110,0.60)", padding: "4px 10px", border: "1px solid rgba(201,169,110,0.15)" }}>
                  5 outcome-verified cases
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  14–60 day enforcement windows
                </div>
              </div>

              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem", maxWidth: "50ch" }}>
                All cases anonymised due to commercial confidentiality. Outcome metrics preserved and auditable at system level.
              </p>
            </div>
          </div>
        </section>

        {/* ── 1B. PROOF STANDARD ─────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div
              className="grid gap-px md:grid-cols-4 border-y"
              style={{ borderColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              {[
                { title: "What is published", body: "Anonymised cases that preserve condition, decision, consequence, and observed movement." },
                { title: "What is not published", body: "Identity, raw source records, internal routing logic, and private operating mechanics." },
                { title: "What does not qualify", body: "Self-declared success without sufficient corroboration or review." },
                { title: "What this proves", body: "That the system can identify a live condition, direct action, and verify whether movement occurred." },
              ].map((item) => (
                <div key={item.title} style={{ backgroundColor: VOID, padding: "1rem" }}>
                  <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                    {item.title}
                  </div>
                  <p style={{ ...serif, marginTop: "0.45rem", fontSize: "0.84rem", lineHeight: 1.5, color: "rgba(255,255,255,0.44)" }}>
                    {item.body}
                  </p>
                </div>
              ))}
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
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.5rem" }}>
                Public proof is designed to be sufficient for due diligence without disclosing the private operating model.
              </p>
              <p style={{ ...serif, fontSize: "0.88rem", color: "rgba(252,165,165,0.45)", fontStyle: "italic" }}>
                This requires intervention, not analysis.
              </p>
            </div>
          </div>
        </section>

        {/* ── TRUST ROUTING ─────────────────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/verification" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>Verify</Link>
                <Link href="/trust" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>Trust boundaries</Link>
                <Link href="/foundations" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>Foundations</Link>
                <Link href="/terms-of-service" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>Terms</Link>
                <Link href="/privacy" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>Privacy</Link>
              </div>
              <div className="mt-6 text-center">
                <Link href="/diagnostics/fast" className="inline-flex items-center gap-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, padding: "0.75rem 1rem", border: `1px solid ${GOLD}30`, backgroundColor: `${GOLD}06` }}>
                  Run the diagnostic <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
