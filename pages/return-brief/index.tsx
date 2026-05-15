import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import * as React from "react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const RETURN_BRIEF_FIELDS = [
  {
    label: "What changed",
    value: "The record names what moved since the prior governed decision, review point, or checkpoint.",
  },
  {
    label: "What did not",
    value: "Conditions that remain active stay visible instead of disappearing behind a new form.",
  },
  {
    label: "Commitment state",
    value: "Missed, completed, blocked, or unresolved commitments are carried forward into the next review.",
  },
  {
    label: "What is now required",
    value: "The next admissible move is stated from the current record, not invented from a clean slate.",
  },
];

const ReturnBriefPage: NextPage = () => {
  return (
    <Layout
      title="Return Brief | Abraham of London"
      description="A client-safe explanation of the Return Brief: the governed record reopened when a condition remains active."
      canonicalUrl="/return-brief"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "baseline", marginBottom: "4px" }}>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Return Brief
              </p>
              <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                Public explainer
              </span>
            </div>
            <h1 className="mt-4" style={{ ...serif, fontSize: "clamp(2rem, 4vw, 3rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)" }}>
              The governed record reopened when the condition remains active.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
              A Return Brief reopens the governed record when the condition remains active. It records what changed, what did not, what commitment was missed or completed, and what is now required.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7" style={{ color: "rgba(255,255,255,0.38)" }}>
              This page explains the mechanism. Generated Return Briefs are case-specific and appear when the governed record has enough return-cycle evidence to reopen the condition safely.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {RETURN_BRIEF_FIELDS.map((field) => (
              <article key={field.label} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}99` }}>
                  {field.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/62">{field.value}</p>
              </article>
            ))}
          </section>

          <section style={{ border: "1px solid rgba(201,169,110,0.18)", background: "rgba(201,169,110,0.04)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              What a Return Brief is not
            </p>
            <p className="mt-3 text-sm leading-7 text-white/60">
              It is not a generic follow-up email, not a fresh assessment, and not a public disclosure of protected notes. It is a client-safe continuation of an existing governed record, using only the evidence the system is permitted to carry forward.
            </p>
          </section>

          <section style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
              Where governed cases live
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: "rgba(255,255,255,0.40)", maxWidth: "52ch" }}>
              If you have an existing governed case, the Decision Centre is where it continues. A generated Return Brief is part of that record — not a standalone document.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Primary: Decision Centre */}
              <Link
                href="/decision-centre"
                className="inline-flex items-center gap-2 border px-4 py-3"
                style={{ borderColor: `${GOLD}45`, backgroundColor: `${GOLD}10`, color: "#F5F5F5", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}
              >
                Open Decision Centre
                <ArrowRight className="h-3 w-3" />
              </Link>
              {/* Secondary */}
              <Link
                href="/diagnostics/fast"
                className="inline-flex items-center gap-2 border px-4 py-3"
                style={{ borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}
              >
                Run Fast Diagnostic
              </Link>
              <Link
                href="/provenance/sample-export"
                className="inline-flex items-center gap-2 border px-4 py-3"
                style={{ borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none" }}
              >
                View Provenance Sample
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default ReturnBriefPage;
