/**
 * pages/design-partners.tsx
 *
 * Design partner programme — /design-partners
 *
 * Public page describing the Abraham of London design partner programme.
 *
 * The design partner programme offers early access to instruments and
 * sessions in exchange for structured feedback. Partners are not charged
 * for access during the engagement period; they are asked to contribute
 * genuine outcome data, session notes, and calibration feedback.
 *
 * Doctrinal constraints:
 * - No fabricated scarcity ("only 5 spots left")
 * - No fake testimonials or attributed case outcomes
 * - No commitments the platform cannot fulfil
 * - Mandatory disclaimer: no regulated advice
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};
const BG = "#0A0A0A";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}18 30%, ${GOLD}18 70%, transparent 100%)`,
        margin: "40px 0",
      }}
    />
  );
}

function CriterionRow({ label, description }: { label: string; description: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "16px",
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
          minWidth: "100px",
          paddingTop: "2px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <p
        style={{
          ...serif,
          fontSize: "15px",
          color: "rgba(255,255,255,0.58)",
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function CommitmentRow({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ color: `${GOLD}80`, fontSize: "10px", marginTop: "3px", flexShrink: 0 }}>—</span>
      <p style={{ ...serif, fontSize: "15px", color: "rgba(255,255,255,0.58)", lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DesignPartnersPage() {
  return (
    <>
      <Head>
        <title>Design Partners — Abraham of London</title>
        <meta
          name="description"
          content="The Abraham of London design partner programme. Early access to governed decision instruments in exchange for structured feedback and outcome contribution."
        />
      </Head>

      <div
        style={{
          background: BG,
          color: "rgba(255,255,255,0.85)",
          minHeight: "100vh",
          padding: "64px 24px 96px",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>

          {/* ── Header ───────────────────────────────────────────────── */}
          <header style={{ marginBottom: "48px" }}>
            <SectionLabel>Programme</SectionLabel>
            <h1
              style={{
                ...serif,
                fontSize: "clamp(26px, 4vw, 42px)",
                color: "rgba(255,255,255,0.90)",
                lineHeight: 1.2,
                marginTop: "8px",
                marginBottom: "16px",
              }}
            >
              Design partner programme
            </h1>
            <p
              style={{
                ...serif,
                fontSize: "17px",
                color: "rgba(255,255,255,0.50)",
                lineHeight: 1.8,
                maxWidth: "520px",
              }}
            >
              A structured early-access engagement for decision-makers and operators
              who want to work directly with the governed decision system as it is built —
              shaping the instruments, calibrating the methodology, and contributing real
              outcome data that improves the benchmark pool for everyone.
            </p>
          </header>

          {/* ── What it is ───────────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>What this is</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              Not a beta test. A calibration partnership.
            </h2>
            <p
              style={{
                ...serif,
                fontSize: "15px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.75,
                marginBottom: "12px",
                maxWidth: "540px",
              }}
            >
              Design partners are given access to instruments and sessions that are not
              yet in the public catalogue. In return, they commit to completing structured
              feedback forms, contributing opted-in anonymised outcome data, and participating
              in one calibration call per engagement period.
            </p>
            <p
              style={{
                ...serif,
                fontSize: "15px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.75,
                maxWidth: "540px",
              }}
            >
              Design partners are not asked to endorse the product, participate in case
              studies, or allow their name to be used in any marketing material without
              explicit written consent.
            </p>
          </section>

          <GoldDivider />

          {/* ── What partners receive ─────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>What partners receive</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "20px" }}>
              Access and engagement
            </h2>
            <div>
              <CommitmentRow text="Complimentary access to all instruments and sessions active during the engagement period — no payment required." />
              <CommitmentRow text="Direct access to the principal for calibration calls and feedback review sessions." />
              <CommitmentRow text="Early sight of instruments before public release for input on methodology and framing." />
              <CommitmentRow text="Your governed case records are stored in Decision Centre and remain yours. No data is used outside the anonymised benchmark pool without consent." />
              <CommitmentRow text="Invitation to the design partner review session at the end of each engagement period." />
            </div>
          </section>

          <GoldDivider />

          {/* ── What partners commit to ───────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>What partners commit to</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "20px" }}>
              The exchange
            </h2>
            <div>
              <CommitmentRow text="Complete at least two governed instruments or sessions during the engagement period." />
              <CommitmentRow text="Submit structured feedback using the provided form after each session (approximately 10 minutes)." />
              <CommitmentRow text="Opt in to anonymised outcome contribution — what happened after you acted on the recommendation." />
              <CommitmentRow text="Attend one calibration call (45 minutes) during the engagement period." />
              <CommitmentRow text="Flag methodology concerns, edge cases, and confusing language directly to the principal." />
            </div>
          </section>

          <GoldDivider />

          {/* ── Who this is for ───────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Selection criteria</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "20px" }}>
              Who this is for
            </h2>
            <div>
              <CriterionRow
                label="Role"
                description="Decision-makers, operators, and principals who regularly face consequential decisions under structural constraint — not researchers or observers."
              />
              <CriterionRow
                label="Stakes"
                description="Partners are most useful when they are working through real decisions, not hypothetical ones. Live situations produce calibration data."
              />
              <CriterionRow
                label="Commitment"
                description="Partners who can commit the full engagement period — typically 6–8 weeks — and complete the two-session minimum without external pressure."
              />
              <CriterionRow
                label="Feedback quality"
                description="Partners who can articulate what is confusing, missing, or structurally wrong — not just what they liked. Diagnostic feedback is what moves the instrument."
              />
            </div>
          </section>

          <GoldDivider />

          {/* ── What this is NOT ──────────────────────────────────────── */}
          <section style={{ marginBottom: "40px" }}>
            <SectionLabel>Clarity</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              What this is not
            </h2>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.7,
                maxWidth: "520px",
                marginBottom: "12px",
              }}
            >
              Design partnership is not a discount programme, a promotional arrangement,
              or a trial with an expectation of conversion. Partners are not asked to
              recommend the product to others, provide a testimonial, or participate in
              any commercial activity.
            </p>
            <p
              style={{
                ...mono,
                fontSize: "9px",
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.7,
                maxWidth: "520px",
              }}
            >
              There is no commitment to continued free access after the engagement period.
              Partners who wish to continue using the platform after the programme ends
              do so under the standard access model.
            </p>
          </section>

          <GoldDivider />

          {/* ── How to apply ──────────────────────────────────────────── */}
          <section style={{ marginBottom: "48px" }}>
            <SectionLabel>Application</SectionLabel>
            <h2 style={{ ...serif, fontSize: "22px", color: "rgba(255,255,255,0.80)", marginBottom: "16px" }}>
              How to apply
            </h2>
            <p
              style={{
                ...serif,
                fontSize: "15px",
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.75,
                marginBottom: "24px",
                maxWidth: "500px",
              }}
            >
              Send a brief message via the contact form. Describe the decision environment
              you are working in — what kinds of decisions you face, and what draws you to
              this kind of structured approach. No pitch. No CV. Just context.
            </p>
            <Link
              href="/contact"
              style={{
                ...mono,
                fontSize: "10px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: GOLD,
                border: `1px solid ${GOLD}40`,
                background: `${GOLD}0A`,
                padding: "12px 22px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Apply via contact
            </Link>
          </section>

          {/* ── Disclaimer ───────────────────────────────────────────── */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.015)",
              padding: "14px 18px",
              marginBottom: "40px",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.22)",
                lineHeight: 1.75,
              }}
            >
              Access granted through the design partner programme is complimentary and subject
              to engagement commitments. No outcome is guaranteed. Governed records produced
              during the programme reflect user-submitted evidence and do not constitute legal,
              financial, investment, or professional advice. Anonymised outcome data contributed
              by design partners enters the benchmark pool under the same conditions as all
              other contributions — no partner data is identified or attributed.
            </p>
          </div>

          {/* ── Footer nav ───────────────────────────────────────────── */}
          <nav
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "28px",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Enterprise API", href: "/developers" },
              { label: "Pricing", href: "/pricing" },
              { label: "Decision Centre", href: "/decision-centre" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.32)",
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
