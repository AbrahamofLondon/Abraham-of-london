/* pages/foundry/index.tsx — PUBLIC FOUNDRY FRONT DOOR
 *
 * Category entry point. No auth. No admin data. No internal mechanics.
 * Explains the category in under 10 seconds.
 * Offers three controlled public tests and points to verification.
 * No internal vocabulary: no ResearchRun, LIVE_GOVERNED, adapter, registry.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const BASE = "rgb(3,3,5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const TESTS = [
  {
    id:     "decision",
    label:  "Test a Decision",
    href:   "/foundry/decision-test",
    body:   "Describe a decision your organisation is facing. The Foundry returns a risk score, flags evidence gaps, and identifies authority issues — in seconds.",
    detail: "Risk score · Evidence gaps · Authority flags · Next-action directive",
    accent: GOLD,
  },
  {
    id:     "market",
    label:  "Check a Market Signal",
    href:   "/foundry/market-signal-test",
    body:   "Paste a claim, offer, or positioning statement. The Foundry assesses overclaim risk, clarity, and buyer friction before it reaches the market.",
    detail: "Overclaim risk · Clarity score · Buyer friction · Credibility flags",
    accent: "rgba(196,181,253,0.85)",
  },
  {
    id:     "release",
    label:  "Check Release Risk",
    href:   "/foundry/release-risk-test",
    body:   "Describe a release or operational commitment. The Foundry returns a proceed / hold / escalate directive with the specific risks that triggered it.",
    detail: "Release readiness · Approval gaps · Hidden dependencies · Risk severity",
    accent: "rgba(94,234,212,0.85)",
  },
] as const;

export default function FoundryIndexPage() {
  return (
    <Layout
      title="The Decision Foundry | Abraham of London"
      description="Test a decision, check a market signal, or assess release risk before it becomes an expensive mistake. Public controlled tests with verification."
      canonicalUrl="/foundry"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index, follow" />
      </Head>

      <main style={{ backgroundColor: BASE, color: "white", minHeight: "100vh" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* ── Hero ── */}
          <header className="pt-28 pb-20">
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: `${GOLD}99` }}>
              Abraham of London · Decision Foundry
            </p>

            <h1 className="mt-5 max-w-3xl" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.25rem)", lineHeight: 1.15, color: "rgba(255,255,255,0.92)" }}>
              Test the quality of a decision before it becomes an expensive mistake.
            </h1>

            <p className="mt-6 max-w-2xl text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              Every decision leaves a trace. The Foundry makes those traces visible — before you commit.
              Three controlled public tests for decisions, market claims, and release commitments.
              Each result includes a verification token. No sign-up required.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/verify"
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
                style={{ ...mono, color: `${GOLD}BB`, border: `1px solid ${GOLD}30` }}
              >
                Verify a Record →
              </Link>
              <Link
                href="/continuity"
                className="inline-flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest transition-colors"
                style={{ ...mono, color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                How Continuity Works →
              </Link>
            </div>
          </header>

          {/* ── Divider ── */}
          <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.06)", marginBottom: "3rem" }} />

          {/* ── Test cards ── */}
          <section aria-label="Public controlled tests">
            <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "1.5rem" }}>
              Three controlled tests
            </p>

            <div className="grid gap-5 sm:grid-cols-3">
              {TESTS.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="group block p-6 transition-all"
                  style={{
                    border: "1px solid rgba(255,255,255,0.07)",
                    backgroundColor: "rgba(255,255,255,0.012)",
                    textDecoration: "none",
                  }}
                >
                  {/* Accent top bar */}
                  <div style={{ height: "2px", width: "2rem", backgroundColor: t.accent, opacity: 0.6, marginBottom: "1.25rem" }} />

                  <h2 className="text-base font-medium" style={{ color: "rgba(255,255,255,0.88)" }}>
                    {t.label}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {t.body}
                  </p>

                  <p className="mt-4 text-[9px] leading-relaxed" style={{ ...mono, color: "rgba(255,255,255,0.22)" }}>
                    {t.detail}
                  </p>

                  <p className="mt-5 text-[10px] uppercase tracking-widest" style={{ ...mono, color: `${t.accent}` }}>
                    Run test →
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Positioning statement ── */}
          <section className="mt-20 mb-20 max-w-2xl">
            <div
              className="p-8"
              style={{ borderLeft: `2px solid ${GOLD}33`, backgroundColor: "rgba(255,255,255,0.008)" }}
            >
              <p style={{ ...serif, fontSize: "1.35rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
                You do not pay for access. You pay for continuity.
              </p>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                A governed case is a decision record that can be returned to, compared, verified,
                and developed over time. The public tests demonstrate the category.
                Continuity is the institutional product.
              </p>
              <Link
                href="/continuity"
                className="mt-5 inline-block text-[10px] uppercase tracking-widest transition-colors"
                style={{ ...mono, color: `${GOLD}88` }}
              >
                About Continuity →
              </Link>
            </div>
          </section>

          {/* ── Proof claims ── */}
          <section
            className="mb-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Foundry proof claims"
          >
            {[
              { claim: "Test the decision before it becomes policy." },
              { claim: "Verify the record before you trust the report." },
              { claim: "Expose weak evidence before it becomes expensive." },
              { claim: "Turn decision history into institutional memory." },
            ].map(({ claim }) => (
              <div
                key={claim}
                className="p-4"
                style={{ border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
                  {claim}
                </p>
              </div>
            ))}
          </section>

        </div>
      </main>
    </Layout>
  );
}