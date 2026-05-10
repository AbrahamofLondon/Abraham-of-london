/**
 * /toolkits — Deployable execution systems index.
 * Data source: lib/toolkits/registry.ts (typed SSOT).
 * Each toolkit links to Canon codes + products. Not content — systems.
 */

import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import Layout from "@/components/Layout";
import { TOOLKITS } from "@/lib/toolkits/registry";
import { CANON_REFERENCES } from "@/lib/canon/reference-codes";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  public: { label: "Public", color: "rgba(110,231,183,0.50)" },
  registered: { label: "Registered", color: "rgba(255,255,255,0.35)" },
  paid: { label: "Paid", color: `${GOLD}AA` },
  enterprise: { label: "Enterprise", color: "rgba(252,165,165,0.55)" },
};

const ToolkitsIndexPage: NextPage = () => (
  <Layout title="Toolkits | Abraham of London" description="Deployable execution systems — not content, but structured frameworks with outputs and commercial hooks." canonicalUrl="/toolkits" fullWidth={false}>
    <Head><meta name="robots" content="index,follow" /></Head>
    <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="mx-auto max-w-3xl">

        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Toolkits</span>
        <h1 style={{ ...serif, fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)", marginTop: "0.5rem" }}>
          Deployable execution systems.
        </h1>
        <p className="mt-3" style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.38)", maxWidth: "50ch" }}>
          Each toolkit is a structured system with frameworks, diagnostics, outputs, and commercial application. If it does not produce an outcome, it does not exist here.
        </p>

        {/* Toolkit Grid */}
        <div className="mt-10 space-y-4">
          {TOOLKITS.map((toolkit) => {
            const tierInfo = TIER_LABELS[toolkit.tier] ?? TIER_LABELS.public!;
            const frameworks = toolkit.linkedFrameworks.map((code) => CANON_REFERENCES.find((r) => r.code === code)).filter(Boolean);

            return (
              <Link
                key={toolkit.slug}
                href={`/toolkits/${toolkit.slug}`}
                className="group block transition-all"
                style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.75)", margin: 0 }}>{toolkit.title}</h2>
                      {toolkit.tier !== "public" && <Lock style={{ width: 10, height: 10, color: tierInfo.color }} />}
                    </div>
                    <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: tierInfo.color }}>{toolkit.domain} · {tierInfo.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" style={{ color: "rgba(255,255,255,0.30)", marginTop: "4px" }} />
                </div>

                <p className="mt-2" style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.38)" }}>{toolkit.description}</p>

                {/* Framework codes */}
                {frameworks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {frameworks.map((fw) => (
                      <span key={fw!.code} style={{ ...mono, fontSize: "6px", padding: "1px 5px", border: `1px solid ${GOLD}15`, color: `${GOLD}60` }}>
                        {fw!.code}
                      </span>
                    ))}
                  </div>
                )}

                {/* Outputs preview */}
                <div className="mt-2 flex flex-wrap gap-1">
                  {toolkit.outputs.slice(0, 3).map((out) => (
                    <span key={out} style={{ ...mono, fontSize: "6px", padding: "1px 5px", border: "1px solid rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.20)" }}>
                      {out}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-10" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
          Developed by Abraham Adaramola · Founder, Abraham of London
        </p>
      </div>
    </main>
  </Layout>
);

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

export default ToolkitsIndexPage;
