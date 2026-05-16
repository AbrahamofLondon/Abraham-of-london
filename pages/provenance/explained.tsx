/**
 * pages/provenance/explained.tsx
 *
 * /provenance/explained
 *
 * Non-technical buyer explanation of decision provenance.
 * Written for boards, principals, and serious decision-makers.
 * Leads with defensibility — not SHA-256.
 *
 * No account, case, or governed record is created by visiting this page.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Shield, FileText, Eye, AlertTriangle } from "lucide-react";

import Layout from "@/components/Layout";

// ─── Design tokens ──────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Section data ───────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "what-provenance-means",
    label: "01",
    heading: "What provenance means",
    body: [
      "Provenance is the documented record of a decision — not just what was decided, but what was known at the time, who was accountable for it, what changed during the process, and whether the record itself has remained intact since it was sealed.",
      "A provenance record is not a summary you write afterwards. It is built as the decision unfolds, capturing evidence, accountability assignments, and governance milestones in a tamper-evident structure.",
    ],
  },
  {
    id: "what-it-proves",
    label: "02",
    heading: "What it proves",
    bullets: [
      { label: "What was recorded", text: "The specific evidence inputs, confidence levels, and governance assessments that existed at the time." },
      { label: "When it was recorded", text: "Timestamps bound to the record — not editable after the fact." },
      { label: "Who was accountable", text: 'Named accountability owners, not diffuse “the team decided.”' },
      { label: "What changed", text: "Every revision is traceable. The system records what changed, not just the final state." },
      { label: "Whether the record is intact", text: "A cryptographic hash of the canonical record is computed and stored. If the record is altered after sealing, the hash no longer matches — and verification fails." },
    ],
    footer: "If a governed decision is later challenged, the system can show what was recorded, when it was recorded, what changed, and whether the client-safe record still matches its stored hash.",
  },
  {
    id: "what-it-does-not-prove",
    label: "03",
    heading: "What it does not prove",
    intro: "Provenance is not an audit opinion. It does not prove:",
    bullets: [
      { label: "Decision quality", text: "That the decision was correct." },
      { label: "Evidence accuracy", text: "That the evidence was accurate — only that it was captured and classified." },
      { label: "Outcome quality", text: "That the outcome was good." },
      { label: "Regulatory compliance", text: "That the record complies with any specific regulatory standard unless that compliance layer has been explicitly built and verified." },
    ],
    footer: "Provenance proves process integrity — not outcome quality.",
    footerStrong: true,
  },
  {
    id: "why-a-board-cares",
    label: "04",
    heading: "Why a board cares",
    body: [
      "A board is ultimately accountable for material decisions, even ones delegated to management. When a decision is challenged — by regulators, investors, counterparties, or in litigation — the board needs to demonstrate that a structured process was followed, material risks were identified and assessed, named individuals were accountable, and the record of that process has not been altered.",
      'Without provenance, "we followed a proper process" is an assertion. With provenance, it is a verifiable record.',
    ],
  },
  {
    id: "why-a-regulator-cares",
    label: "05",
    heading: "Why a regulator cares",
    body: [
      "Regulators increasingly require evidence of how decisions were made, not just what was decided. Governance frameworks in financial services, professional services, and regulated industries often require documented decision rationale, identified accountability, evidence of risk consideration, and audit trails that survive personnel changes.",
      "A governed provenance record provides a structured, hash-verified audit trail that can be produced in response to regulatory enquiry — without requiring manual reconstruction from emails and meeting notes.",
    ],
  },
  {
    id: "why-a-client-cares",
    label: "06",
    heading: "Why a client cares",
    body: [
      "A client commissioning a significant decision has a legitimate interest in knowing that the process was defensible. Provenance gives a client a client-safe summary of what was recorded, a hash they can verify independently, a chain of custody showing when key milestones occurred, and confidence that the record has not been altered since it was sealed.",
      "This is especially relevant for clients who face their own governance obligations — institutional investors, professional services firms, regulated entities — who need to demonstrate due diligence in the decisions they commission.",
    ],
  },
  {
    id: "what-happens-when-record-changes",
    label: "07",
    heading: "What happens when a record changes",
    body: [
      "Every governed record has a canonical form — a precise, stable serialisation of its contents. When the record is sealed, a SHA-256 hash of that canonical form is stored.",
      "If anything in the record changes after sealing — a field is edited, a note is added, a date is corrected — the canonical form changes. The new hash no longer matches the stored hash. Verification returns MISMATCH.",
      "This means tampering is structurally detectable, not merely prohibited. You do not need to trust that no one edited the record. You can verify it.",
    ],
  },
  {
    id: "how-verification-works",
    label: "08",
    heading: "How verification works in plain English",
    steps: [
      "The system holds a governed record — a structured object capturing a decision and its governance history.",
      "It also holds a hash: a 64-character string computed from the exact content of that record when it was sealed.",
      'When you click “Verify integrity,” the system recomputes the hash from the current record — using the same algorithm, the same field ordering, the same rules.',
      "It compares the recomputed hash to the stored hash.",
      { match: true, text: "If they match: MATCH — the record is intact." },
      { mismatch: true, text: "If they differ: MISMATCH — something changed after sealing. Do not rely on this record until it has been reviewed." },
      { unavail: true, text: "If the record cannot be reached: UNAVAILABLE — verification is temporarily not possible." },
    ],
    footer: "The hash is not a password. It is a fingerprint. Change one character in the record, and the fingerprint changes entirely.",
  },
] as const;

// ─── Page ───────────────────────────────────────────────────────────────────

const ProvenanceExplainedPage: NextPage = () => {
  return (
    <Layout
      title="What Decision Provenance Means | Abraham of London"
      description="A plain-English explanation of decision provenance — what it proves, why boards and regulators care, and how hash verification works without technical jargon."
      fullWidth
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen px-6 py-24"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-3xl space-y-12">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <header style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "2rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                border: `1px solid ${GOLD}30`,
                backgroundColor: `${GOLD}08`,
                color: `${GOLD}BB`,
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.25rem 0.55rem",
                marginBottom: "1.25rem",
              }}
            >
              No technical background required
            </div>

            <h1
              style={{
                ...serif,
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.05,
                color: "rgba(255,255,255,0.92)",
                marginBottom: "1rem",
              }}
            >
              Decision Provenance
              <br />
              <span style={{ color: `${GOLD}CC` }}>Explained</span>
            </h1>

            <p
              style={{
                ...serif,
                fontSize: "1.1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.58)",
                maxWidth: "52ch",
              }}
            >
              For boards, principals, and serious decision-makers. Written in plain
              English. Leads with defensibility — not cryptography.
            </p>
          </header>

          {/* ── SECTIONS ────────────────────────────────────────────── */}
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="space-y-4">
              <div className="flex items-baseline gap-3">
                <span
                  style={{
                    ...mono,
                    fontSize: "8px",
                    letterSpacing: "0.14em",
                    color: `${GOLD}55`,
                    minWidth: "1.5rem",
                  }}
                >
                  {section.label}
                </span>
                <h2
                  style={{
                    ...serif,
                    fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
                    lineHeight: 1.15,
                    color: "rgba(255,255,255,0.88)",
                  }}
                >
                  {section.heading}
                </h2>
              </div>

              {"intro" in section && section.intro && (
                <p style={{ ...serif, fontSize: "1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}>
                  {section.intro}
                </p>
              )}

              {"body" in section && section.body && (
                <div className="space-y-3">
                  {section.body.map((para, i) => (
                    <p
                      key={i}
                      style={{
                        ...serif,
                        fontSize: "1rem",
                        lineHeight: 1.75,
                        color: "rgba(255,255,255,0.62)",
                      }}
                    >
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {"bullets" in section && section.bullets && (
                <div className="space-y-3 pl-5">
                  {section.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          backgroundColor: `${GOLD}66`,
                          marginTop: "0.6rem",
                          flexShrink: 0,
                        }}
                      />
                      <p
                        style={{
                          ...serif,
                          fontSize: "1rem",
                          lineHeight: 1.7,
                          color: "rgba(255,255,255,0.62)",
                        }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.82)" }}>
                          {bullet.label}:{" "}
                        </span>
                        {bullet.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {"steps" in section && section.steps && (
                <div className="space-y-2 pl-5">
                  {section.steps.map((step, i) => {
                    const text = typeof step === "string" ? step : step.text;
                    const isMatch = typeof step !== "string" && "match" in step && step.match;
                    const isMismatch = typeof step !== "string" && "mismatch" in step && step.mismatch;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <span
                          style={{
                            ...mono,
                            fontSize: "7px",
                            letterSpacing: "0.1em",
                            color: `${GOLD}44`,
                            marginTop: "0.35rem",
                            minWidth: "1.25rem",
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}.
                        </span>
                        <p
                          style={{
                            ...serif,
                            fontSize: "1rem",
                            lineHeight: 1.7,
                            color: isMatch
                              ? "rgba(100,220,140,0.85)"
                              : isMismatch
                                ? "rgba(255,120,120,0.85)"
                                : "rgba(255,255,255,0.62)",
                          }}
                        >
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {"footer" in section && section.footer && (
                <p
                  style={{
                    ...serif,
                    fontSize: "0.95rem",
                    lineHeight: 1.65,
                    color: "footerStrong" in section && section.footerStrong
                      ? `${GOLD}CC`
                      : "rgba(255,255,255,0.42)",
                    fontStyle: "italic",
                    borderLeft: `2px solid ${GOLD}33`,
                    paddingLeft: "1rem",
                  }}
                >
                  {section.footer}
                </p>
              )}
            </section>
          ))}

          {/* ── DISCLAIMER ──────────────────────────────────────────── */}
          <section
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: "1.5rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.22)",
                lineHeight: 1.8,
              }}
            >
              This document describes the provenance model used by Abraham of London for
              supported governed records. It does not constitute legal advice. The
              verification system demonstrates structural tamper-evidence — it does not
              replace independent legal or regulatory review.
            </p>
          </section>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}05`,
              padding: "1.5rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: `${GOLD}88`,
                marginBottom: "0.75rem",
              }}
            >
              See it in action
            </p>

            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.65)",
                marginBottom: "1.5rem",
              }}
            >
              The public provenance demo lets you verify a real demonstration record —
              same hashing discipline, same verification model used for supported
              governed cases.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/provenance/demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: `1px solid ${GOLD}55`,
                  backgroundColor: `${GOLD}12`,
                  color: `${GOLD}DD`,
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0.7rem 1.25rem",
                  textDecoration: "none",
                }}
              >
                <Shield className="h-3.5 w-3.5" />
                Verify the demo record
              </Link>

              <Link
                href="/diagnostics/fast"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  color: "rgba(255,255,255,0.55)",
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0.7rem 1.25rem",
                  textDecoration: "none",
                }}
              >
                Run fast diagnostic
                <ArrowRight className="h-3 w-3" />
              </Link>

              <Link
                href="/trust"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.35)",
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  padding: "0.7rem 1.25rem",
                  textDecoration: "none",
                }}
              >
                Trust Center
              </Link>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  );
};

export default ProvenanceExplainedPage;
