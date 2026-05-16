/**
 * pages/security-review.tsx
 *
 * /security-review
 *
 * For enterprise procurement, legal, and security teams requesting
 * a formal security review pack, DPA, or architecture briefing.
 *
 * No false certification claims. Honest status on every item.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { Shield, ArrowRight, FileText, Mail, Lock, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const PACK_ITEMS = [
  {
    included: true,
    label: "Security posture overview",
    note: "Hosting, auth model, secrets management, rate limiting, error handling.",
  },
  {
    included: true,
    label: "Data handling summary",
    note: "What is stored, what is not, retention periods, encryption at rest and in transit.",
  },
  {
    included: true,
    label: "Sub-processor list",
    note: "Current sub-processors with purpose and data region.",
  },
  {
    included: true,
    label: "Provenance architecture summary",
    note: "How hash-based tamper-evidence works. Internal chain anchoring status.",
  },
  {
    included: true,
    label: "Data rights fulfillment",
    note: "Deletion, export, rectification — implemented features and API references.",
  },
  {
    included: true,
    label: "Responsible disclosure policy",
    note: "Scope, contact, response commitments.",
  },
  {
    included: false,
    label: "SOC 2 report",
    note: "Not yet available. Planned. Will be shared when completed.",
  },
  {
    included: false,
    label: "Independent penetration test report",
    note: "Not yet completed. Planned before enterprise GA. Will be shared under NDA when available.",
  },
  {
    included: false,
    label: "ISO 27001 certificate",
    note: "Not yet initiated.",
  },
] as const;

const SecurityReviewPage: NextPage = () => {
  return (
    <Layout
      title="Security Review Pack | Abraham of London"
      description="Enterprise security review request — what is available now, what is planned, and how to initiate a review."
    >
      <Head>
        <meta name="robots" content="noindex,follow" />
      </Head>

      <main
        className="min-h-screen px-6 py-20"
        style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}
      >
        <div className="mx-auto max-w-2xl space-y-8">

          {/* ── HEADER ──────────────────────────────────────────────── */}
          <header>
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
                marginBottom: "1rem",
              }}
            >
              Enterprise · Procurement · Security
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Shield className="h-5 w-5" style={{ color: GOLD }} />
              <h1
                style={{
                  ...serif,
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  lineHeight: 1.1,
                  color: "rgba(255,255,255,0.92)",
                }}
              >
                Security Review Pack
              </h1>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              For security, legal, and procurement teams evaluating Abraham of
              London for enterprise or regulated-industry deployment.
              We document exactly what is available and what is not.
            </p>
          </header>

          {/* ── WHAT IS AVAILABLE ───────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.015)",
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Pack contents
              </p>
            </div>

            <div className="space-y-2">
              {PACK_ITEMS.map(({ included, label, note }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "0.6rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      marginTop: "0.25rem",
                      flexShrink: 0,
                      width: "1rem",
                      height: "1rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {included ? (
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(100,220,140,0.7)",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,0.2)",
                          display: "block",
                        }}
                      />
                    )}
                  </span>
                  <div>
                    <p
                      style={{
                        ...serif,
                        fontSize: "0.92rem",
                        color: included
                          ? "rgba(255,255,255,0.78)"
                          : "rgba(255,255,255,0.35)",
                        lineHeight: 1.4,
                      }}
                    >
                      {label}
                    </p>
                    <p
                      style={{
                        ...serif,
                        fontSize: "0.82rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.32)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── HONEST POSTURE NOTE ─────────────────────────────────── */}
          <section
            style={{
              border: "1px solid rgba(255,200,80,0.15)",
              backgroundColor: "rgba(255,200,80,0.03)",
              padding: "1rem",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: "rgba(255,200,80,0.6)" }}
              />
              <div>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,200,80,0.7)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Honest posture
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "0.9rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  We are a growth-stage product. SOC 2, ISO 27001, and an
                  independent penetration test are planned — not yet completed.
                  If your procurement process requires these before evaluation,
                  we recommend beginning the design partner programme while
                  these are in progress. We will not claim certifications we
                  do not hold.
                </p>
              </div>
            </div>
          </section>

          {/* ── REQUEST FORM ────────────────────────────────────────── */}
          <section
            style={{
              border: `1px solid ${GOLD}22`,
              backgroundColor: `${GOLD}05`,
              padding: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4" style={{ color: `${GOLD}70` }} />
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: `${GOLD}88`,
                }}
              >
                Request the pack
              </p>
            </div>

            <p
              style={{
                ...serif,
                fontSize: "0.95rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "1.25rem",
              }}
            >
              Email the address below with your organisation name, role, and a
              brief description of your evaluation requirement. We will respond
              within 2 business days with the available pack and a call invitation
              if appropriate.
            </p>

            <a
              href="mailto:security@abrahamoflondon.com?subject=Security Review Request&body=Organisation: %0ARole: %0AEvaluation requirement: "
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${GOLD}44`,
                backgroundColor: `${GOLD}0A`,
                color: `${GOLD}CC`,
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "0.7rem 1.25rem",
                textDecoration: "none",
              }}
            >
              <Mail className="h-3.5 w-3.5" />
              security@abrahamoflondon.com
            </a>
          </section>

          {/* ── CROSS-LINKS ─────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/trust"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.35rem 0.7rem",
              }}
            >
              ← Trust Center
            </Link>
            <Link
              href="/design-partners"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "0.35rem 0.7rem",
              }}
            >
              Design partner programme
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

        </div>
      </main>
    </Layout>
  );
};

export default SecurityReviewPage;
