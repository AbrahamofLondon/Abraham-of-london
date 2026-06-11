/**
 * pages/retainers/index.tsx — Retainer Oversight positioning page
 *
 * Not a product catalogue. Not a pricing page.
 * This explains what retainer oversight is and who it is for.
 * The CTA routes to readiness review, not immediate purchase.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

type TierSpec = {
  id: string;
  name: string;
  threads: string;
  cadence: string;
  scope: string[];
};

const TIERS: TierSpec[] = [
  {
    id: "CORE",
    name: "Core Oversight",
    threads: "One active decision thread",
    cadence: "Monthly cycle",
    scope: [
      "Decision commitment tracking",
      "Drift scan against prior brief",
      "Action ledger update",
      "Oversight note",
    ],
  },
  {
    id: "OPERATIONAL",
    name: "Operator Oversight",
    threads: "Up to three active decision threads",
    cadence: "Monthly cycle with escalation protocol",
    scope: [
      "Multi-thread risk scan",
      "Cross-decision dependency review",
      "Execution drift assessment",
      "Escalation note if threshold breached",
      "Oversight brief",
    ],
  },
  {
    id: "INSTITUTIONAL",
    name: "Institutional Oversight",
    threads: "Unlimited decision threads",
    cadence: "Monthly cycle — board-level brief",
    scope: [
      "Full governance continuity",
      "Stakeholder alignment drift review",
      "Board-level oversight brief",
      "Return brief protocol",
      "Unresolved risk registry",
      "Outcome hypothesis tracking",
    ],
  },
];

const MONTHLY_ITEMS = [
  "Signal review — what has changed since the last cycle",
  "Drift scan — are commitments still being honoured",
  "Unresolved risk update — what is still open and why",
  "Action ledger — what was committed, what was done, what slipped",
  "Oversight brief — a written record of the review",
  "Escalation note — if a threshold has been breached",
];

export default function RetainersPage() {
  return (
    <Layout>
      <Head>
        <title>Retainer Oversight | Abraham of London</title>
        <meta
          name="description"
          content="Governed decision continuity for operators who cannot afford drift after the first brief."
        />
      </Head>

      <main style={{ background: "#060609", color: "#e8e0d0", minHeight: "100vh" }}>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "80px 24px 64px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>
              RETAINER OVERSIGHT
            </p>
            <h1 style={{ ...serif, fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 300, lineHeight: 1.15, color: "#f5f0e8", marginBottom: 24 }}>
              For operators who cannot afford<br />decision drift after the first brief.
            </h1>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: "#9e9890", maxWidth: 640 }}>
              A single Boardroom Brief answers a moment of pressure. Retainer oversight governs
              what happens next — whether commitments hold, whether risks resurface, whether
              the decision still stands when conditions change.
            </p>
          </div>
        </section>

        {/* ── WHAT IT DOES ──────────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 32 }}>
              WHAT RETAINER OVERSIGHT DOES
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
              {[
                { label: "Monitors decision commitments", body: "Tracks what was agreed following a brief and whether those commitments have been acted on." },
                { label: "Detects execution drift", body: "Identifies the gap between what was decided and what is actually happening in the organisation." },
                { label: "Reviews prior warnings", body: "Returns to the risk flags and falsification criteria established in earlier briefs." },
                { label: "Tracks unresolved risk", body: "Maintains a registry of open risks and escalates when conditions cross a threshold." },
                { label: "Turns judgement into continuity", body: "Converts one-off analysis into a governed record of decisions, commitments, and outcomes." },
              ].map(item => (
                <div key={item.label} style={{ background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4, padding: "24px 20px" }}>
                  <p style={{ ...mono, fontSize: 11, color: GOLD, marginBottom: 10 }}>{item.label}</p>
                  <p style={{ fontSize: 14, color: "#9e9890", lineHeight: 1.65 }}>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHO IT IS FOR ─────────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
            <div>
              <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>
                WHO IT IS FOR
              </p>
              {[
                "Founder-operators managing compounding decisions under time pressure",
                "Executive teams where a single decision has board-level consequences",
                "Boards and advisers who need governed continuity across cycles",
                "Organisations with a pattern of recurring decisions that do not hold",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <span style={{ color: GOLD, marginTop: 3, flexShrink: 0 }}>—</span>
                  <p style={{ fontSize: 14, color: "#b8b0a0", lineHeight: 1.65 }}>{item}</p>
                </div>
              ))}
            </div>
            <div>
              <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: "#c0392b", textTransform: "uppercase", marginBottom: 24 }}>
                ENTRY GATE
              </p>
              <p style={{ fontSize: 14, color: "#9e9890", lineHeight: 1.7, marginBottom: 16 }}>
                Not every account should enter a retainer. Readiness is assessed before an offer
                is made. Some engagements are better served by a Boardroom Brief, Strategy Room,
                or Executive Report first.
              </p>
              <p style={{ fontSize: 14, color: "#9e9890", lineHeight: 1.7 }}>
                The intake process collects enough structured information to determine whether
                ongoing oversight addresses a real governance need — or whether a single-session
                instrument is the right starting point.
              </p>
            </div>
          </div>
        </section>

        {/* ── TIERS ─────────────────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 32 }}>
              OVERSIGHT TIERS
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {TIERS.map(tier => (
                <div key={tier.id} style={{ background: "#0d0d12", border: "1px solid #1e1e24", borderRadius: 4, padding: "28px 24px" }}>
                  <p style={{ ...mono, fontSize: 11, color: GOLD, marginBottom: 6 }}>{tier.name.toUpperCase()}</p>
                  <p style={{ fontSize: 13, color: "#6e6860", marginBottom: 4 }}>{tier.threads}</p>
                  <p style={{ fontSize: 13, color: "#6e6860", marginBottom: 20 }}>{tier.cadence}</p>
                  {tier.scope.map(s => (
                    <div key={s} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#3a3830", flexShrink: 0 }}>›</span>
                      <p style={{ fontSize: 13, color: "#9e9890", lineHeight: 1.5 }}>{s}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHAT HAPPENS MONTHLY ──────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 32 }}>
              WHAT HAPPENS EACH CYCLE
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
              {MONTHLY_ITEMS.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: "1px solid #1a1a20" }}>
                  <span style={{ ...mono, fontSize: 11, color: "#3a3830", flexShrink: 0, paddingTop: 2 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p style={{ fontSize: 14, color: "#b8b0a0", lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROOF DISCIPLINE ──────────────────────────────────────────────── */}
        <section style={{ borderBottom: "1px solid #1e1e24", padding: "64px 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>
              PROOF DISCIPLINE
            </p>
            <p style={{ fontSize: 15, color: "#9e9890", lineHeight: 1.7, maxWidth: 640, marginBottom: 24 }}>
              Retainer oversight is linked to the fulfilment and evidence infrastructure
              built for Boardroom Brief. Where publishable, outcomes are linked to case studies
              with evidence state, consent basis, and falsification criteria.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {[
                "Linked to prior fulfilment records",
                "Linked to outcome hypotheses",
                "Linked to case studies where publishable",
                "No success claims without evidence",
                "Consent required for named publication",
              ].map(item => (
                <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ color: GOLD, fontSize: 12, paddingTop: 2, flexShrink: 0 }}>◆</span>
                  <p style={{ fontSize: 13, color: "#7e7870" }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <section style={{ padding: "80px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <p style={{ ...mono, fontSize: 11, letterSpacing: "0.15em", color: GOLD, textTransform: "uppercase", marginBottom: 24 }}>
              NEXT STEP
            </p>
            <h2 style={{ ...serif, fontSize: 28, fontWeight: 300, color: "#f5f0e8", marginBottom: 16 }}>
              Request a retainer readiness review
            </h2>
            <p style={{ fontSize: 15, color: "#7e7870", lineHeight: 1.7, marginBottom: 36 }}>
              This is not a purchase form. It collects the structural information required
              to determine whether ongoing oversight addresses a genuine governance need.
              A member of the team will review your submission and respond directly.
            </p>
            <Link
              href="/retainers/readiness"
              style={{
                display: "inline-block",
                background: GOLD,
                color: "#060609",
                padding: "14px 32px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 2,
              }}
            >
              Request Readiness Review
            </Link>
          </div>
        </section>

      </main>
    </Layout>
  );
}
