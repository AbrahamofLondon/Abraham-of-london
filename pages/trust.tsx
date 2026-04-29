/**
 * /trust — Psychological clarity. Who this is for, what to expect, what not to expect.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const TrustPage: NextPage = () => (
  <Layout title="Trust | Abraham of London" description="Who this is for, what to expect, and what not to expect." canonicalUrl="/trust">
    <Head><meta name="robots" content="index,follow" /></Head>
    <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-2xl">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Trust</span>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.5rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.90)", marginTop: "0.5rem" }}>
          Clear expectations. No ambiguity.
        </h1>

        <div className="mt-8 space-y-6">
          {/* Who this is for */}
          <section style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>Who This Is For</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <li>Executives and founders facing unresolved decisions with material cost</li>
              <li>Operators responsible for decisions they cannot currently enforce</li>
              <li>Board members who need structured evidence, not opinions</li>
              <li>Leaders who suspect the stated problem is not the real problem</li>
            </ul>
          </section>

          {/* Who this is NOT for */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Who This Is Not For</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
              <li>People exploring ideas without a real decision at stake</li>
              <li>Organisations seeking generic advice or motivational content</li>
              <li>Teams looking for collaboration or brainstorming tools</li>
              <li>Anyone who wants the system to make decisions for them</li>
            </ul>
          </section>

          {/* What to expect */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>What To Expect</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              <li>The system will identify contradictions between what you say and what you do</li>
              <li>It will name what you are avoiding — specifically, not generically</li>
              <li>It will price the cost of delay using your own stated inputs</li>
              <li>It will prescribe one concrete action — not a menu of options</li>
              <li>It will track whether you act and escalate if you do not</li>
              <li>Every output is governed — the result is held to a consistent review standard</li>
            </ul>
          </section>

          {/* What NOT to expect */}
          <section style={{ border: "1px solid rgba(252,165,165,0.12)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>What Not To Expect</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
              <li>Comfortable language — the system names problems directly</li>
              <li>Multiple options — one move, not a decision menu</li>
              <li>Generic assistant output — the result you receive has governed review before release</li>
              <li>Guaranteed outcomes — the system identifies and enforces, it does not predict</li>
              <li>Privacy from your own data — the system uses your inputs against your framing</li>
            </ul>
          </section>

          {/* Product trust */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>How Trust Is Built Here</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              <li>Every decision is reviewable — auditable, traceable, and accountable</li>
              <li>No fabricated data — all outputs derived from your stated inputs</li>
              <li>No hidden AI — output is governed by proprietary validation before it reaches you</li>
              <li>Founder-led — built from 15+ years of real-world execution experience</li>
              <li>Academically grounded — draws from recognised intellectual traditions</li>
            </ul>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}55` }}>Proof Boundary</span>
            <ul className="mt-3 space-y-2 text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
              <li>Public proof is designed to be sufficient for scrutiny, not sufficient to reconstruct the system.</li>
              <li>You will see condition, consequence, and verified movement where appropriate.</li>
              <li>You will not see private source records, client identity, or proprietary operating mechanics.</li>
              <li>Where deeper substantiation is required, it moves through the appropriate confidential route.</li>
            </ul>
          </section>
        </div>

        {/* Cross-links: validate before you enter */}
        <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Validate before you enter</span>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/verification" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Verify credentials</Link>
            <Link href="/foundations" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Intellectual foundations</Link>
            <Link href="/evidence" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Applied evidence</Link>
            <Link href="/playbooks" style={{ ...mono, fontSize: "7px", padding: "4px 10px", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)" }}>Public playbooks</Link>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <Link href="/diagnostics/fast" className="inline-flex items-center gap-3" style={{ padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Start with the stuck decision <ArrowRight style={{ width: 11, height: 11 }} />
          </Link>
        </div>

        <p className="mt-8" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
          Developed by Abraham Adaramola · Founder, Abraham of London
        </p>
      </div>
    </main>
  </Layout>
);

export default TrustPage;
