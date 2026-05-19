/**
 * /verification — Externally verifiable trust surface.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import Layout from "@/components/Layout";
import LegalIdentityBlock from "@/components/trust/LegalIdentityBlock";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};

const nextSteps = [
  { label: "See applied evidence", href: "/evidence" },
  { label: "Trust boundaries", href: "/trust" },
  { label: "Intellectual foundations", href: "/foundations" },
  { label: "Public playbooks", href: "/playbooks" },
  { label: "Terms of service", href: "/terms-of-service" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Cookie policy", href: "/cookie-policy" },
  { label: "Security", href: "/security" },
];

const VerificationPage: NextPage = () => {
  return (
    <Layout
      title="Verification | Abraham of London"
      description="Legal presence, founder credentials, intellectual grounding, and operating boundaries for Abraham of London."
      canonicalUrl="/verification"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center gap-2">
            <Shield className="h-4 w-4" style={{ color: `${GOLD}78` }} />
            <span
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: `${GOLD}70`,
              }}
            >
              Verification
            </span>
          </div>

          <h1
            style={{
              ...serif,
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 2.8rem)",
              lineHeight: 1.08,
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Verifiable. Traceable. Bounded.
          </h1>

          <p className="mt-4 max-w-2xl text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.8 }}>
            Abraham of London is built around decision authority, governance discipline, and execution verification.
            This page identifies what can be checked, what is bounded, and what should not be assumed.
          </p>

          <div className="mt-9 space-y-6">
            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Legal Presence
              </span>

              <LegalIdentityBlock variant="embedded" />
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                UTR: 3124426287.
              </p>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Infrastructure Boundary
              </span>

              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                Namecheap remains the registrar. Cloudflare is authoritative DNS for abrahamoflondon.org. Netlify remains the production application host/origin.
              </p>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.75, fontStyle: "italic" }}>
                Cloudflare proxying, WAF/rate-limiting, DLP, Zero Trust, mTLS, and expanded edge-security controls are enabled only where explicitly configured and verified.
              </p>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Founder
              </span>

              <div className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                <p>Abraham Adaramola · London, United Kingdom.</p>
                <p className="mt-1">
                  Commercial strategist with 15+ years across contract governance, procurement strategy,
                  cross-border commercial execution, energy, infrastructure, and public–private environments.
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="/about/founder" style={{ color: `${GOLD}A0`, fontSize: "0.82rem" }}>
                    Full founder profile
                  </Link>

                  <a
                    href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1"
                    style={{ color: `${GOLD}A0`, fontSize: "0.82rem" }}
                  >
                    LinkedIn — Abraham Adaramola <ExternalLink style={{ width: 9, height: 9 }} />
                  </a>
                </div>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Founder Assurance Credentials
              </span>

              <div className="mt-3 space-y-3 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                <p>
                  Abraham Adaramola holds an ISO/IEC 27001:2022 Lead Auditor credential and has formal training across consulting management, company direction, cybersecurity, business development, and MBA-level brand leadership.
                </p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontStyle: "italic", borderLeft: `1px solid ${GOLD}30`, paddingLeft: "0.75rem" }}>
                  These credentials support assurance literacy, audit awareness, and governance discipline. They should not be read as independent certification of Alomarada Ltd, Abraham of London, or the platform.
                </p>
                <a
                  href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1"
                  style={{ color: `${GOLD}A0`, fontSize: "0.82rem" }}
                >
                  View founder profile on LinkedIn <ExternalLink style={{ width: 9, height: 9 }} />
                </a>
              </div>
            </section>

            <section style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}65` }}>
                Operating Reality
              </span>

              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                Client engagements are confidential. Case dossiers published on this platform are anonymised,
                reconstructed, or modelled to protect identity while demonstrating decision-pattern logic,
                method application, and verified outcome discipline.
              </p>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Evidence Standard
              </span>

              <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                <li>Public proof is anonymised, human-reviewed, and published only when the underlying outcome is strong enough to defend.</li>
                <li>Self-reported claims alone are not treated as public proof.</li>
                <li>Public case material preserves condition, decision, consequence, and verified movement while removing identity and source records.</li>
                <li>Deeper source documentation remains private and can be handled only inside the appropriate commercial or confidential route.</li>
              </ul>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div style={{ border: `1px solid ${GOLD}14`, padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}55` }}>
                  What This Platform Is
                </span>

                <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  <li>Decision enforcement infrastructure.</li>
                  <li>Governance and authority frameworks.</li>
                  <li>Execution systems and diagnostic instruments.</li>
                  <li>Governed analysis with auditable outputs.</li>
                </ul>
              </div>

              <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                  What This Platform Is Not
                </span>

                <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.48)" }}>
                  <li>Not legal advice.</li>
                  <li>Not therapy, coaching, or counselling.</li>
                  <li>Not generic consulting templates.</li>
                  <li>Not AI-generated advice pretending to be judgement.</li>
                </ul>
              </div>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
                Intellectual Grounding
              </span>

              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.60)", lineHeight: 1.75 }}>
                The system draws from Scripture, classical philosophy, institutional theory, governance practice,
                economics, statecraft, and commercial execution experience. Its originality is in synthesis,
                operationalisation, and enforcement—not in claiming to invent its source traditions.
              </p>

              <Link href="/foundations" style={{ display: "inline-block", marginTop: "0.75rem", color: `${GOLD}A0`, fontSize: "0.82rem" }}>
                Review foundations →
              </Link>
            </section>
          </div>

          <section className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              Next verification steps
            </span>

            <div className="mt-3 flex flex-wrap gap-2">
              {nextSteps.map((step) => (
                <Link
                  key={step.href}
                  href={step.href}
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.30)",
                  }}
                >
                  {step.label}
                </Link>
              ))}
            </div>
          </section>

          <footer className="mt-8">
            <p
              style={{
                ...mono,
                fontSize: "6px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.12)",
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

export default VerificationPage;
