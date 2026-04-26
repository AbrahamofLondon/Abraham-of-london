/**
 * /about/founder — Founder surface. Visible authority. Verifiable reality.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};

const capabilities = [
  "Contract Structuring & Negotiation",
  "Public Sector & Regulated Procurement",
  "Cross-Border Deal Execution",
  "Governance & Compliance",
  "Risk & Opportunity Management",
  "Government & Stakeholder Liaison",
  "Strategic Partnerships",
  "Infrastructure Development",
];

const trustLinks = [
  { label: "Verify credentials", href: "/verification" },
  { label: "Trust boundaries", href: "/trust" },
  { label: "Applied evidence", href: "/evidence" },
  { label: "Intellectual foundations", href: "/foundations" },
];

const FounderPage: NextPage = () => {
  return (
    <Layout
      title="Abraham Adaramola — Founder | Abraham of London"
      description="Founder profile for Abraham Adaramola: commercial strategist, governance practitioner, and builder of the Abraham of London decision authority system."
      canonicalUrl="/about/founder"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-3xl">
          <span
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}70`,
            }}
          >
            Founder
          </span>

          <h1
            style={{
              ...serif,
              fontWeight: 300,
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              lineHeight: 1.02,
              color: "rgba(255,255,255,0.94)",
              marginTop: "0.65rem",
            }}
          >
            Abraham Adaramola
          </h1>

          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.35)",
              marginTop: "0.65rem",
            }}
          >
            Founder — Abraham of London · London, United Kingdom
          </p>

          <section className="mt-8" style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "1rem" }}>
            <p style={{ fontSize: "1rem", lineHeight: 1.85, color: "rgba(255,255,255,0.62)" }}>
              Commercial strategist with 15+ years of experience across complex contracting, procurement governance,
              energy, infrastructure, and public–private advisory environments.
            </p>
            <p style={{ fontSize: "0.94rem", lineHeight: 1.85, color: "rgba(255,255,255,0.48)", marginTop: "0.85rem" }}>
              His work sits at the intersection of contract discipline, governance structure, decision authority,
              execution control, and institutional risk.
            </p>
            <p style={{ fontSize: "0.94rem", lineHeight: 1.85, color: "rgba(255,255,255,0.48)", marginTop: "0.85rem" }}>
              Abraham of London translates that operating experience into structured decision systems for organisations
              that need clarity under pressure, not more comfortable language.
            </p>
          </section>

          <section className="mt-10">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
              Core Capabilities
            </span>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {capabilities.map((capability) => (
                <div
                  key={capability}
                  style={{
                    padding: "8px 10px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    fontSize: "0.78rem",
                    color: "rgba(255,255,255,0.42)",
                  }}
                >
                  {capability}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 space-y-5">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
              Career Evidence
            </span>

            <article style={{ border: `1px solid ${GOLD}18`, padding: "1.15rem", backgroundColor: `${GOLD}04` }}>
              <h2 style={{ fontSize: "0.98rem", fontWeight: 500, color: "rgba(255,255,255,0.76)" }}>
                Managing Consultant — Alomarada Ltd
              </h2>
              <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.28)" }}>2018–Present</span>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                <li>Designed contract-governance frameworks for UK–Africa programmes.</li>
                <li>Led procurement and commercial pipelines exceeding $150M.</li>
                <li>Managed supplier onboarding and compliance in regulated environments.</li>
                <li>Engaged governments, investors, prime contractors, and institutional stakeholders.</li>
              </ul>
            </article>

            <article style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.15rem" }}>
              <h2 style={{ fontSize: "0.98rem", fontWeight: 500, color: "rgba(255,255,255,0.68)" }}>
                Commercial & Strategy Consultant — First Sourcing Ltd
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                <li>Managed RFx-to-contract-award cycles across cross-border commercial projects.</li>
                <li>Resolved LC and shipment delays through commercial restructuring.</li>
                <li>Improved delivery discipline through supplier performance scorecards.</li>
              </ul>
            </article>

            <article style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1.15rem" }}>
              <h2 style={{ fontSize: "0.98rem", fontWeight: 500, color: "rgba(255,255,255,0.68)" }}>
                Project Lead — MRS Oil & Gas Ltd
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                <li>Managed supplier contracts and logistics activity in downstream operations.</li>
                <li>Coordinated trade operations involving BP and regional partners.</li>
                <li>Reduced procurement bottlenecks through vendor and customs-interface improvements.</li>
              </ul>
            </article>
          </section>

          <section className="mt-8 grid gap-4 sm:grid-cols-2">
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                Education
              </span>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.48)" }}>
                MBA — University of East Anglia, Norwich Business School
              </p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                BSc — Microbiology, University of Lagos
              </p>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.07)", padding: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                Credentials
              </span>
              <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>
                <li>ISO/IEC 27001:2022 Lead Auditor</li>
                <li>CMI Level 7 Diploma in Consulting Management</li>
                <li>AWS Business Professional — in progress</li>
                <li>Cybersecurity training — eHacking</li>
              </ul>
            </div>
          </section>

          <section className="mt-8" style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}65` }}>
              Verification
            </span>

            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href="https://www.linkedin.com/in/abraham-adaramola-06630321/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs"
                style={{ color: `${GOLD}AA` }}
              >
                LinkedIn — Abraham Adaramola <ExternalLink style={{ width: 10, height: 10 }} />
              </a>

              <a
                href="https://find-and-update.company-information.service.gov.uk/company/11549053/officers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs"
                style={{ color: `${GOLD}AA` }}
              >
                Companies House — Alomarada Ltd <ExternalLink style={{ width: 10, height: 10 }} />
              </a>
            </div>
          </section>

          <section className="mt-6 flex flex-wrap gap-3">
            {trustLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "5px 10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.30)",
                }}
              >
                {link.label}
              </Link>
            ))}
          </section>

          <section className="mt-9" style={{ borderLeft: `2px solid ${GOLD}25`, paddingLeft: "1rem" }}>
            <p
              style={{
                ...serif,
                fontWeight: 300,
                fontSize: "1.08rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.50)",
                fontStyle: "italic",
              }}
            >
              Abraham of London was built to address a recurring failure: organisations do not fail because
              they lack information. They fail because contradictions are ignored, authority is unclear, and
              decisions are not enforced.
            </p>
          </section>

          <section className="mt-7">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              Intellectual Position
            </span>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.40)", lineHeight: 1.75 }}>
              The work draws from classical philosophy, Christian theological tradition, institutional theory,
              governance practice, and applied commercial strategy. The Canon is a structured synthesis of
              established traditions applied to modern decision systems, not a claim to invent new source material.
            </p>
          </section>

          <footer className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p
              style={{
                ...mono,
                fontSize: "6px",
                letterSpacing: "0.15em",
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

export default FounderPage;