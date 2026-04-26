/**
 * /about/founder — Founder surface. Visible authority. Verifiable reality.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const FounderPage: NextPage = () => (
  <Layout title="Abraham Adaramola — Founder | Abraham of London" description="Commercial strategist with 15+ years in complex contracting, governance, and decision systems." canonicalUrl="/about/founder">
    <Head><meta name="robots" content="index,follow" /></Head>
    <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Founder</span>
        <h1 style={{ ...serif, fontWeight: 300, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)", marginTop: "0.5rem" }}>
          Abraham Adaramola
        </h1>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.30)", marginTop: "0.5rem" }}>
          Founder — Abraham of London · London, United Kingdom
        </p>

        {/* Summary */}
        <div className="mt-8" style={{ borderLeft: `2px solid ${GOLD}25`, paddingLeft: "1rem" }}>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}>
            Commercial strategist with 15+ years of experience leading complex, cross-border contracting and procurement environments across energy, infrastructure, and public–private systems.
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginTop: "0.75rem" }}>
            Specialist in contract governance, risk control, and multi-jurisdictional negotiation, with a track record spanning UK–Africa operations, upstream/downstream energy, and institutional advisory.
          </p>
          <p style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.45)", marginTop: "0.75rem" }}>
            Known for disciplined execution, structured decision-making, and the ability to align commercial strategy with operational and regulatory realities under pressure.
          </p>
        </div>

        {/* Core Capabilities */}
        <div className="mt-8">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Core Capabilities</span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {["Contract Structuring & Negotiation", "Public Sector & Regulated Procurement", "Cross-Border Deal Execution", "Governance & Compliance", "Risk & Opportunity Management", "Government & Stakeholder Liaison", "Strategic Partnerships", "Infrastructure Development"].map((cap) => (
              <div key={cap} style={{ padding: "6px 10px", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>{cap}</div>
            ))}
          </div>
        </div>

        {/* Career */}
        <div className="mt-10 space-y-6">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Career Highlights</span>

          <div style={{ border: `1px solid ${GOLD}15`, padding: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "rgba(255,255,255,0.70)" }}>Managing Consultant — Alomarada Ltd</h3>
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)" }}>2018–Present</span>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              <li>Designed contract-governance frameworks for UK–Africa programs</li>
              <li>Led procurement pipelines exceeding $150M+</li>
              <li>Managed export-control compliant supplier onboarding</li>
              <li>Conducted negotiations with governments, investors, and contractors</li>
            </ul>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>Commercial & Strategy Consultant — First Sourcing Ltd</h3>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              <li>Managed RFx → contract award lifecycle</li>
              <li>Resolved LC shipping failures through contract restructuring</li>
              <li>Reduced late deliveries by 40% via supplier performance systems</li>
            </ul>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 500, color: "rgba(255,255,255,0.60)" }}>Project Lead — MRS Oil & Gas Ltd</h3>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              <li>Managed downstream logistics and supplier contracts</li>
              <li>Coordinated trade operations with BP</li>
              <li>Reduced procurement bottlenecks via vendor restructuring</li>
            </ul>
          </div>
        </div>

        {/* Education + Certs */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Education</span>
            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>MBA — University of East Anglia (Brand Leadership)</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>BSc — Microbiology (University of Lagos)</p>
          </div>
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Certifications</span>
            <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              <li>ISO/IEC 27001:2022 Lead Auditor</li>
              <li>CMI Level 7 Diploma — Consulting Management</li>
              <li>AWS Business Professional (in progress)</li>
            </ul>
          </div>
        </div>

        {/* Verification */}
        <div className="mt-8" style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Verification</span>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="https://www.linkedin.com/company/abraham-of-london/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs" style={{ color: `${GOLD}AA` }}>
              LinkedIn <ExternalLink style={{ width: 10, height: 10 }} />
            </a>
            <a href="https://find-and-update.company-information.service.gov.uk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs" style={{ color: `${GOLD}AA` }}>
              Companies House <ExternalLink style={{ width: 10, height: 10 }} />
            </a>
          </div>
        </div>

        {/* Positioning */}
        <div className="mt-8" style={{ borderLeft: `2px solid ${GOLD}20`, paddingLeft: "1rem" }}>
          <p style={{ ...serif, fontWeight: 300, fontSize: "1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
            Abraham of London was built to address a recurring failure: organisations do not fail because they lack information — they fail because contradictions are ignored and decisions are not enforced. The platform translates real-world contracting, governance, and execution experience into structured decision systems designed for high-stakes environments.
          </p>
        </div>

        {/* Intellectual position */}
        <div className="mt-6">
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>Intellectual Position</span>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
            Work draws from classical philosophy, Christian theological tradition, institutional and governance theory, and applied commercial strategy experience. The Canon is a structured synthesis of established traditions applied to modern decision systems — not the invention of new source material.
          </p>
        </div>

        {/* Authorship */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.12)" }}>
            Developed by Abraham Adaramola · Founder, Abraham of London
          </p>
        </div>

      </div>
    </main>
  </Layout>
);

export default FounderPage;
