/**
 * /private-clients — Private mandate surface.
 * Confidentiality-first. Trust mechanism. Self-serve diagnostic path.
 * Design: Institutional Monumentalism — aligned with platform design system.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Eye, KeyRound } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const BASE = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif" };

const PrivateClientsPage: NextPage = () => {
  return (
    <Layout
      title="Private Clients | Abraham of London"
      description="Confidential strategic advisory for principals, founders, and select private mandates where discretion and judgment matter."
      canonicalUrl="/private-clients"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:title" content="Private Clients | Abraham of London" />
        <meta property="og:description" content="Quiet advisory. Serious discretion. Bespoke strategic support for principals and founders." />
      </Head>

      <div style={{ backgroundColor: BASE, color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <section className="relative" style={{ background: `radial-gradient(circle at 30% 20%, ${GOLD}08, transparent 45%), ${BASE}` }}>
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}30, transparent)` }} />
          <div className="mx-auto max-w-5xl px-6 pb-16 pt-28 lg:px-12 lg:pt-36">
            <div className="inline-flex items-center gap-2" style={{ padding: "6px 14px", border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06` }}>
              <Lock style={{ width: 12, height: 12, color: `${GOLD}80` }} />
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70` }}>
                Private · Confidential · Select access
              </span>
            </div>

            <h1 className="mt-8" style={{ ...serif, fontWeight: 300, fontSize: "clamp(2.4rem, 6vw, 4.2rem)", lineHeight: 0.96, color: "rgba(255,255,255,0.92)" }}>
              Quiet advisory.
              <br />
              <span style={{ color: `${GOLD}CC` }}>Serious discretion.</span>
            </h1>

            <p className="mt-6 max-w-2xl" style={{ ...serif, fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.8, color: "rgba(255,255,255,0.48)" }}>
              Bespoke strategic support for principals, founders, and select private mandates where confidentiality and judgment matter more than volume.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              {[
                { icon: Eye, label: "Strict confidence" },
                { icon: KeyRound, label: "Select access" },
                { icon: ShieldCheck, label: "Deliberate scope" },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  {i > 0 && <div className="h-3 w-px" style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />}
                  <div className="flex items-center gap-2">
                    <item.icon style={{ width: 12, height: 12, color: `${GOLD}60` }} />
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>{item.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONFIDENTIALITY STATEMENT ─────────────────────────────────── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-16 lg:px-12">
            <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "2rem" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "1rem" }}>
                Confidentiality commitment
              </div>
              <div className="space-y-3" style={{ ...serif, fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.45)" }}>
                <p>No client is named publicly. No engagement is referenced without explicit written permission. No case material is used in marketing, evidence surfaces, or public writing without anonymisation and consent.</p>
                <p>Confidential details should not be submitted in the initial contact form. The first conversation establishes boundaries before any sensitive information is exchanged.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROOF / DELIVERY / BOUNDARY ──────────────────────────────── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-14 lg:px-12">
            <div className="grid gap-4 md:grid-cols-3">
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.85rem" }}>Proof</div>
                <p style={{ ...serif, fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Decision authority methodology observed across anonymised cases. Evidence method: anonymised, modelled, and verified where stated.
                </p>
                <Link href="/evidence" className="mt-3 inline-flex items-center gap-1.5" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                  See evidence <ArrowRight style={{ width: 9, height: 9 }} />
                </Link>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.85rem" }}>Delivery</div>
                <p style={{ ...serif, fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Private strategic counsel, decision architecture, and governance design. Diagnostic evidence + Executive Reporting + Strategy Room as warranted.
                </p>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1.5rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.85rem" }}>Boundary</div>
                <p style={{ ...serif, fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                  Deliberately limited capacity. Not built for volume. Engagements are accepted on the basis of seriousness, not revenue. Unsuitable requests are declined.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SELF-SERVE PATH ──────────────────────────────────────────── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-14 lg:px-12">
            <div className="grid gap-4 md:grid-cols-2">
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06`, padding: "1.75rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.85rem" }}>Before you enquire</div>
                <p style={{ ...serif, fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
                  Run the diagnostic first. It takes under 2 minutes and produces a specific reading. If the condition justifies private engagement, the system will indicate it.
                </p>
                <Link href="/diagnostics/fast" className="mt-4 inline-flex items-center gap-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                  Run the diagnostic <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.75rem" }}>
                <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.85rem" }}>Request confidential conversation</div>
                <p style={{ ...serif, fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)" }}>
                  For principals and their representatives. Initial contact is handled discreetly with clear boundaries from the outset.
                </p>
                <Link href="/contact?type=private" className="mt-4 inline-flex items-center gap-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                  Contact <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRUST ROUTING ────────────────────────────────────────────── */}
        <section style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12">
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: "Verify the founder", href: "/verification" },
                { label: "Trust boundaries", href: "/trust" },
                { label: "Evidence", href: "/evidence" },
                { label: "Foundations", href: "/foundations" },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)" }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default PrivateClientsPage;
