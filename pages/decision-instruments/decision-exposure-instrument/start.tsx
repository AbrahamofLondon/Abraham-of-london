import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const StartPage: NextPage = () => (
  <Layout title="Decision Exposure — Start" description="Your instrument is ready.">
    <Head><meta name="robots" content="noindex" /></Head>
    <main className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "rgb(3,3,5)" }}>
      <div className="max-w-md text-center">
        <span style={{ ...mono, fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60` }}>Purchase confirmed</span>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "2rem", lineHeight: 1.1, color: "rgba(255,255,255,0.90)", marginTop: "1rem" }}>
          Your Decision Exposure Instrument is ready.
        </h1>
        <p style={{ fontSize: "0.92rem", lineHeight: 1.7, color: "rgba(255,255,255,0.40)", marginTop: "1rem" }}>
          Run the decision instrument for live scoring and automatic result persistence. The PDF dossier unlocks after the run is saved.
        </p>
        <div className="mt-6 space-y-3">
          <Link href="/decision-instruments/decision-exposure-instrument/run" className="flex items-center justify-center gap-3 w-full" style={{ padding: "14px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" }}>
            Start decision instrument <ArrowRight style={{ width: 11, height: 11 }} />
          </Link>
          <div className="flex items-center justify-center gap-2 w-full" style={{ padding: "10px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.24)", ...mono, fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase" }}>
            PDF dossier unlocks after saved run
          </div>
        </div>
      </div>
    </main>
  </Layout>
);

export default StartPage;
