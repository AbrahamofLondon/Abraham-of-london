/**
 * /why-not-ai — Defensive positioning against Copilot, Gemini, agents.
 *
 * Copilot answers questions.
 * We determine whether the question should be asked.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const WhyNotAI: NextPage = () => {
  return (
    <Layout title="Why Not AI | Abraham of London" description="Why decision authority cannot be delegated to language models.">
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-xl">

          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-4 w-4" style={{ color: `${GOLD}80` }} />
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}70` }}>
              Decision Authority vs AI Assistance
            </span>
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "clamp(2rem, 5vw, 3rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.90)" }}>
            Copilot answers questions.<br />
            <span style={{ color: `${GOLD}CC` }}>This system decides whether those answers should exist.</span>
          </h1>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(255,255,255,0.40)", marginTop: "1.5rem", maxWidth: "48ch" }}>
            Language models are powerful. They are also non-deterministic, non-accountable, and structurally incapable of decision authority.
          </p>

          {/* Comparison */}
          <div className="mt-8 space-y-4">
            {[
              { ai: "Non-deterministic — same question, different answer", us: "Deterministic — same input, identical output. Provably." },
              { ai: "No authority model — cannot identify who decides", us: "Authority classification — names the owner, detects false authority" },
              { ai: "No enforcement — suggests but cannot require action", us: "Enforcement layer — breach tracking, escalation, Strategy Room lock" },
              { ai: "No trust decay — treats every interaction as new", us: "Institutional memory — integrity scoring, recurrence detection, pattern tracking" },
              { ai: "No auditability — outputs cannot be traced to logic", us: "Full traceability — inputs, signals, routing, rejections, all visible" },
              { ai: "No economic anchoring — cannot price consequences", us: "Cost modelling — delay cost, option decay, control shift probability" },
            ].map((row, i) => (
              <div key={i} className="grid gap-3 sm:grid-cols-2">
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
                  <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>AI Assistant</span>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.30)", marginTop: "0.2rem" }}>{row.ai}</p>
                </div>
                <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}04`, padding: "0.75rem" }}>
                  <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: `${GOLD}60` }}>Decision Authority</span>
                  <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", marginTop: "0.2rem" }}>{row.us}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Position statement */}
          <div className="mt-10 border-l-2 pl-4" style={{ borderColor: `${GOLD}30` }}>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.1rem", lineHeight: 1.6, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
              AI tools optimise for answers. This system optimises for decision completion under pressure. These are fundamentally different capabilities.
            </p>
          </div>

          {/* What we do not do */}
          <div className="mt-8" style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.35)" }}>
              What this system does not do
            </span>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
              <li>Does not answer questions</li>
              <li>Does not summarise content</li>
              <li>Does not draft text</li>
              <li>Does not search information</li>
              <li>Does not mimic AI assistant behaviour</li>
            </ul>
          </div>

          {/* What we do */}
          <div className="mt-4" style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
              What this system does
            </span>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <li>Identifies the contradiction you have not named</li>
              <li>Prices the cost of delay using your own stated inputs</li>
              <li>Assigns decision ownership and detects false authority</li>
              <li>Enforces action with breach tracking and escalation</li>
              <li>Verifies outcomes and adjusts confidence over time</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-10">
            <Link href="/diagnostics/fast" className="inline-flex items-center gap-3" style={{ padding: "14px 28px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}08`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Start with the stuck decision <ArrowRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

        </div>
      </main>
    </Layout>
  );
};

export default WhyNotAI;
