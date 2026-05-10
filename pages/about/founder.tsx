/**
 * /about/founder — Founder surface.
 * Luxury minimal. Authority-first. Not a CV.
 */

import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};

const proofLinks = [
  { label: "Verify", href: "/verification" },
  { label: "Evidence", href: "/evidence" },
  { label: "Trust", href: "/trust" },
  { label: "Foundations", href: "/foundations" },
  { label: "Terms", href: "/terms-of-service" },
  { label: "Privacy", href: "/privacy" },
];

const FounderPage: NextPage = () => {
  return (
    <Layout
      title="Abraham Adaramola — Founder | Abraham of London"
      description="Founder surface for Abraham Adaramola, builder of Abraham of London: a decision authority system for contradiction, consequence, enforcement, and verification."
      canonicalUrl="/about/founder"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        className="min-h-screen px-6 py-24"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(201,169,110,0.055), transparent 34%), rgb(3,3,5)",
        }}
      >
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <section className="mx-auto max-w-3xl text-center">
            <span
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: `${GOLD}80`,
              }}
            >
              Founder
            </span>

            <h1
              className="mt-5"
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "clamp(2.8rem, 7vw, 5.2rem)",
                lineHeight: 0.96,
                color: "rgba(255,255,255,0.94)",
              }}
            >
              Abraham Adaramola
            </h1>

            <p
              className="mx-auto mt-6 max-w-xl"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.34)",
              }}
            >
              Founder — Abraham of London · London
            </p>
          </section>

          {/* Founder portrait */}
          <section className="mx-auto mt-12 flex justify-center">
            <div style={{ width: 120, height: 120, border: `1px solid ${GOLD}30`, overflow: "hidden" }}>
              <Image src="/assets/images/profile-portrait.webp" alt="Abraham Adaramola" width={120} height={120} className="object-cover" style={{ filter: "grayscale(0.3)" }} />
            </div>
          </section>

          {/* Cinematic positioning */}
          <section className="mx-auto mt-12 max-w-2xl">
            <p
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "clamp(1.55rem, 3vw, 2.25rem)",
                lineHeight: 1.2,
                color: "rgba(255,255,255,0.86)",
              }}
            >
              Most organisations do not fail because they lack intelligence.
            </p>

            <p
              className="mt-4"
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "clamp(1.55rem, 3vw, 2.25rem)",
                lineHeight: 1.2,
                color: `${GOLD}CC`,
              }}
            >
              They fail because contradictions are tolerated, authority is unclear,
              and decisions are not enforced.
            </p>
          </section>

          {/* Origin */}
          <section
            className="mx-auto mt-14 max-w-2xl"
            style={{
              borderLeft: `1px solid ${GOLD}38`,
              paddingLeft: "1.25rem",
            }}
          >
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(255,255,255,0.58)" }}>
              Abraham of London was built from direct exposure to that failure.
            </p>

            <p
              className="mt-4"
              style={{ fontSize: "0.96rem", lineHeight: 1.9, color: "rgba(255,255,255,0.46)" }}
            >
              Across high-pressure commercial environments — where contracts determine outcomes,
              authority is contested, timing carries cost, and execution failure becomes measurable —
              the same pattern repeats.
            </p>

            <p
              className="mt-4"
              style={{ fontSize: "0.96rem", lineHeight: 1.9, color: "rgba(255,255,255,0.46)" }}
            >
              Clarity exists. Execution breaks.
            </p>
          </section>

          {/* System statement */}
          <section className="mx-auto mt-16 max-w-3xl">
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.08)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                padding: "2rem 0",
              }}
            >
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: `${GOLD}70`,
                }}
              >
                The Response
              </p>

              <div className="mt-7 grid gap-8 md:grid-cols-2">
                <div>
                  <p
                    style={{
                      ...serif,
                      fontWeight: 300,
                      fontSize: "1.65rem",
                      lineHeight: 1.25,
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    Not a consultancy layer.
                    <br />
                    Not advisory opinion.
                  </p>
                </div>

                <div>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "rgba(255,255,255,0.46)" }}>
                    Abraham of London is a structured decision system designed to identify
                    contradiction, price consequence, enforce decision, and verify whether action worked.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Operating evidence */}
          <section className="mx-auto mt-16 max-w-3xl">
            <span
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}70`,
              }}
            >
              Operating Exposure
            </span>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                {
                  metric: "15+",
                  label: "years across contracting, governance, energy, infrastructure, and public–private environments",
                },
                {
                  metric: "$500M+",
                  label: "asset-value programmes involving government, investors, and delivery partners",
                },
                {
                  metric: "$40M/month",
                  label: "trade and logistics exposure under volatile operational conditions",
                },
              ].map((item) => (
                <div
                  key={item.metric}
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "1rem",
                  }}
                >
                  <p
                    style={{
                      ...serif,
                      fontWeight: 300,
                      fontSize: "1.7rem",
                      color: `${GOLD}CC`,
                    }}
                  >
                    {item.metric}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Condensed background */}
          <section className="mx-auto mt-16 max-w-2xl">
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}70`,
              }}
            >
              Background
            </p>

            <div className="mt-5 space-y-5">
              <p style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "rgba(255,255,255,0.48)" }}>
                As Managing Consultant at Alomarada Ltd, Abraham has worked across strategic advisory,
                governance design, stakeholder alignment, and public–private programme development.
              </p>

              <p style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "rgba(255,255,255,0.48)" }}>
                Earlier work across First Sourcing Ltd and MRS Oil & Gas placed him inside environments
                where commercial decisions, supplier discipline, cross-border execution, and timing directly
                affected financial outcome.
              </p>

              <p style={{ fontSize: "0.95rem", lineHeight: 1.85, color: "rgba(255,255,255,0.48)" }}>
                That operating reality shaped the central thesis behind Abraham of London:
                information is rarely the missing piece. Enforced decision authority is.
              </p>
            </div>
          </section>

          {/* Why this matters personally */}
          <section className="mx-auto mt-14 max-w-2xl" style={{ borderLeft: `1px solid ${GOLD}25`, paddingLeft: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}55` }}>
              Why this exists
            </p>
            <p className="mt-4" style={{ ...serif, fontWeight: 300, fontSize: "1.15rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
              I watched capable people defer decisions they already understood, in environments where delay carried measurable cost. The problem was never intelligence. It was always enforcement — the absence of a system that identifies the contradiction, names the avoided decision, and tracks whether action was taken.
            </p>
            <p className="mt-3" style={{ fontSize: "0.92rem", lineHeight: 1.85, color: "rgba(255,255,255,0.38)" }}>
              Abraham of London exists because I could not find that system anywhere. So I built it.
            </p>
          </section>

          {/* Published proof */}
          <section
            className="mx-auto mt-16 max-w-3xl"
            style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}04`,
              padding: "1.5rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}75`,
              }}
            >
              Applied Evidence
            </p>

            <p
              className="mt-5"
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "1.45rem",
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              Published case dossiers show decision-pattern outcomes across anonymised conditions.
            </p>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.44)" }}>
              The evidence layer preserves decision logic, intervention method, and outcome discipline while
              protecting commercial confidentiality. Cases are anonymised or modelled where required.
            </p>

            <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              Public evidence is intended to demonstrate that the system can identify a live condition,
              frame the decision properly, and verify movement afterward. It is not intended to expose
              private source records, identity, or proprietary operating mechanics.
            </p>

            <Link
              href="/evidence"
              className="mt-5 inline-flex"
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: `${GOLD}CC`,
              }}
            >
              See applied evidence →
            </Link>
          </section>

          {/* Formal grounding */}
          <section className="mx-auto mt-16 max-w-3xl">
            <div className="grid gap-4 md:grid-cols-2">
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.1rem" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  Formal Grounding
                </p>

                <ul className="mt-4 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                  <li>MBA — University of East Anglia, Norwich Business School</li>
                  <li>BSc — Microbiology, University of Lagos</li>
                  <li>ISO/IEC 27001:2022 Lead Auditor</li>
                  <li>CMI Level 7 Diploma in Consulting Management</li>
                </ul>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.1rem" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                  }}
                >
                  Intellectual Position
                </p>

                <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
                  The system draws from classical philosophy, Christian theological tradition,
                  institutional theory, governance practice, and applied commercial execution.
                  Its contribution is structured integration into enforceable decision systems.
                </p>
              </div>
            </div>
          </section>

          {/* Verification */}
          <section className="mx-auto mt-16 max-w-3xl">
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}70`,
              }}
            >
              Verification
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "7px 11px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: `${GOLD}B8`,
                }}
              >
                LinkedIn <ExternalLink style={{ width: 10, height: 10 }} />
              </a>

              <a
                href="https://find-and-update.company-information.service.gov.uk/company/11549053/officers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5"
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "7px 11px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: `${GOLD}B8`,
                }}
              >
                Companies House <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
              Verification here is deliberately layered: legal presence, founder grounding, public evidence,
              and bounded proof standards. Deeper substantiation exists, but it remains inside the correct confidential path.
            </p>
          </section>

          {/* Operating boundary */}
          <section className="mx-auto mt-16 max-w-2xl text-center">
            <p
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "clamp(1.45rem, 3vw, 2rem)",
                lineHeight: 1.28,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              This platform is built for environments where decisions carry weight,
              misalignment is expensive, and authority must be made explicit.
            </p>

            <p className="mt-5 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.40)" }}>
              It is not designed for general advisory use. It is designed for intervention.
            </p>
          </section>

          {/* Trust routing */}
          <section className="mx-auto mt-12 max-w-3xl">
            <div className="flex flex-wrap justify-center gap-3">
              {proofLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    padding: "7px 12px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.34)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mx-auto mt-16 max-w-xl text-center">
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/diagnostics/fast"
                className="group inline-flex items-center gap-2"
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgb(3,3,5)",
                  backgroundColor: GOLD,
                  padding: "0.85rem 1.15rem",
                }}
              >
                Run the diagnostic
                <ArrowRight style={{ width: 11, height: 11 }} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/verification" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Verify credentials
                </Link>
                <Link href="/contact" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                  Contact
                </Link>
              </div>
            </div>
          </section>

          <footer className="mx-auto mt-16 max-w-3xl border-t border-white/5 pt-6 text-center">
            <p
              style={{
                ...mono,
                fontSize: "6px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.14)",
              }}
            >
              Developed by Abraham Adaramola · Founder, Abraham of London
            </p>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

export default FounderPage;
