import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const IntelligenceReportsPage: NextPage = () => {
  return (
    <Layout
      title="Intelligence Reports | Abraham of London"
      description="Report pathways tied to governed access and artifact identity."
      canonicalUrl="/intelligence/reports"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Intelligence reports</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Reports routed through governed identities.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Intelligence reports are tied to artifact and entitlement logic. Public and restricted report lines remain separated. Where a public report index is still thin, the honest path is to route through intelligence and artifacts rather than pretend a broader open catalogue exists.
            </p>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            <Link href="/artifacts" className="border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Artifact archive</p>
              <p className="mt-3 text-sm leading-7 text-white/58">View downloadable and catalog-tied report surfaces.</p>
            </Link>
            <Link href="/intelligence/market" className="border border-white/10 bg-white/[0.02] p-5 transition hover:bg-white/[0.04]">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>Market intelligence</p>
              <p className="mt-3 text-sm leading-7 text-white/58">View the main public entry to market and strategic reporting.</p>
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default IntelligenceReportsPage;
