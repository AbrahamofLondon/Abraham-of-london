import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const cards = [
  {
    title: "Memory",
    body: "What changed, what carried forward, and how the record is evolving.",
    href: "/intelligence/memory",
  },
  {
    title: "Contradictions",
    body: "User-safe contradiction visibility without exposing internal mechanics.",
    href: "/intelligence/contradictions",
  },
  {
    title: "Market",
    body: "Market intelligence, strategic briefs, and public versus restricted intelligence lines.",
    href: "/intelligence/market",
  },
  {
    title: "Reports",
    body: "Structured report pathways tied to catalog identity and governed access rules.",
    href: "/intelligence/reports",
  },
] as const;

const IntelligenceIndexPage: NextPage = () => {
  return (
    <Layout
      title="Intelligence | Abraham of London"
      description="Decision intelligence, memory, contradictions, and market reading."
      canonicalUrl="/intelligence"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Intelligence</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Memory, contradictions, and market reading.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Intelligence is not one generic feed. It includes decision memory, contradiction visibility, market material, and reports tied to governed access and catalog identity.
            </p>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]"
              >
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{card.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/58">{card.body}</p>
              </Link>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceIndexPage;
