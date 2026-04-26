/**
 * /canon/glossary — 40 canonically defined terms with intellectual lineage.
 * Data source: lib/canon/glossary.ts (typed registry — no MDX needed).
 * Sits as sibling to /canon and /canon/[slug] — same system, different surface.
 */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { CANON_GLOSSARY } from "@/lib/canon/glossary";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const CanonGlossaryPage: NextPage = () => {
  const [search, setSearch] = React.useState("");

  const filtered = search.trim()
    ? CANON_GLOSSARY.filter((e) => e.term.toLowerCase().includes(search.toLowerCase()) || e.definition.toLowerCase().includes(search.toLowerCase()))
    : CANON_GLOSSARY;

  return (
    <Layout title="Canon Glossary | Abraham of London" description="40 canonical terms — defined with precision, grounded in recognised intellectual traditions." canonicalUrl="/canon/glossary" fullWidth={false}>
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-2xl">

          {/* Header */}
          <div className="mb-2">
            <Link href="/canon" style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              ← Canon
            </Link>
          </div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Canon Glossary</span>
          <h1 style={{ ...serif, fontWeight: 300, fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.1, color: "rgba(255,255,255,0.92)", marginTop: "0.5rem" }}>
            Definitive terms.
          </h1>
          <p className="mt-3" style={{ fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.38)", maxWidth: "46ch" }}>
            {CANON_GLOSSARY.length} terms — each operationally defined and grounded in recognised intellectual traditions. Not poetic ambiguity. Structural precision.
          </p>

          {/* Search */}
          <div className="mt-6 mb-8">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.70)", fontSize: "0.88rem", outline: "none" }}
            />
          </div>

          {/* Terms */}
          <div className="space-y-4">
            {filtered.map((entry) => (
              <div key={entry.term} style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 500, color: "rgba(255,255,255,0.75)", margin: 0 }}>{entry.term}</h3>
                <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "0.35rem" }}>
                  {entry.definition}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.lineage.map((source) => (
                    <span key={source} style={{ ...mono, fontSize: "6px", padding: "2px 6px", border: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.22)", letterSpacing: "0.05em" }}>
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.25)", textAlign: "center", marginTop: "2rem" }}>
              No terms match &ldquo;{search}&rdquo;.
            </p>
          )}

          <p className="mt-10" style={{ ...mono, fontSize: "6px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.10)" }}>
            Developed by Abraham Adaramola · Founder, Abraham of London
          </p>
        </div>
      </main>
    </Layout>
  );
};

export default CanonGlossaryPage;
