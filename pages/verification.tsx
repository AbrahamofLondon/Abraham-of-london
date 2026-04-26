/**
 * /verification — Externally verifiable trust surface.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ExternalLink, Shield } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const VerificationPage: NextPage = () => (
  <Layout title="Verification | Abraham of London" description="Legal presence, founder credentials, and operating boundaries." canonicalUrl="/verification">
    <Head><meta name="robots" content="index,follow" /></Head>
    <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-4 w-4" style={{ color: `${GOLD}70` }} />
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Verification</span>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.90)" }}>
          Verifiable. Traceable. Bounded.
        </h1>

        <div className="mt-8 space-y-6">
          {/* Legal */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Legal Presence</span>
            <div className="mt-3 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              <p>Abraham of London — United Kingdom</p>
              <p>Alomarada Ltd — UK registered company</p>
              <a href="https://find-and-update.company-information.service.gov.uk/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1" style={{ color: `${GOLD}90`, fontSize: "0.82rem" }}>
                Companies House record <ExternalLink style={{ width: 9, height: 9 }} />
              </a>
            </div>
          </section>

          {/* Founder */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Founder</span>
            <div className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              <p>Abraham Adaramola · London, United Kingdom</p>
              <p className="mt-1">15+ years in commercial strategy, contract governance, and cross-border execution.</p>
              <div className="mt-2 flex gap-3">
                <Link href="/about/founder" style={{ color: `${GOLD}90`, fontSize: "0.82rem" }}>Full profile</Link>
                <a href="https://www.linkedin.com/company/abraham-of-london/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1" style={{ color: `${GOLD}90`, fontSize: "0.82rem" }}>
                  LinkedIn <ExternalLink style={{ width: 9, height: 9 }} />
                </a>
              </div>
            </div>
          </section>

          {/* Credentials */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Professional Credentials</span>
            <ul className="mt-3 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              <li>ISO/IEC 27001:2022 Lead Auditor (2025)</li>
              <li>CMI Level 7 Diploma in Consulting Management</li>
              <li>MBA — University of East Anglia (Brand Leadership)</li>
              <li>BSc — Microbiology (University of Lagos)</li>
            </ul>
          </section>

          {/* Operating Reality */}
          <section style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Operating Reality</span>
            <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Client engagements are confidential. Case dossiers published on this platform are anonymised reconstructions designed to demonstrate method logic, not disclose client identity.
            </p>
          </section>

          {/* What This Is / Is Not */}
          <div className="grid gap-4 sm:grid-cols-2">
            <section style={{ border: `1px solid ${GOLD}12`, padding: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}50` }}>What This Platform Is</span>
              <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>
                <li>Decision enforcement systems</li>
                <li>Governance frameworks</li>
                <li>Execution structures</li>
                <li>Deterministic analysis</li>
              </ul>
            </section>
            <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>What This Platform Is Not</span>
              <ul className="mt-2 space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                <li>Not legal advice</li>
                <li>Not therapy or coaching</li>
                <li>Not generic consulting templates</li>
                <li>Not AI-generated output</li>
              </ul>
            </section>
          </div>
        </div>

        <p className="mt-10" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
          Developed by Abraham Adaramola · Founder, Abraham of London
        </p>
      </div>
    </main>
  </Layout>
);

export default VerificationPage;
