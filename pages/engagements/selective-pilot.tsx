import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const SelectivePilotPage: NextPage = () => {
  return (
    <Layout
      title="Selective Operator Pilot"
      description="One-page selective operator pilot pathway."
      canonicalUrl="/engagements/selective-pilot"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-4xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Selective Operator Pilot · Decision Infrastructure Trial
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Bring one serious decision.
            </h1>
            <p className="mt-4 text-base leading-8 text-white/68">
              Bring one decision your organisation cannot afford to keep circling. The system will test it, identify the contradiction, issue a required move, schedule accountability, and show what changes.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {[
              "The system tests the case under evidence, authority, consequence, and execution reality.",
              "The contradiction is named clearly rather than softened into commentary.",
              "A required move is issued instead of a vague recommendation.",
              "A checkpoint is scheduled so the case does not disappear after first contact.",
              "The outcome is reviewed later rather than assumed.",
              "Escalation is considered only if it is earned by the record.",
            ].map((line) => (
              <div key={line} style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
                <p className="text-sm leading-7 text-white/62">{line}</p>
              </div>
            ))}
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/diagnostics/fast" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">Test a decision first</Link>
            <Link href="/engagements/operator-pilot" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">Review engagement path</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default SelectivePilotPage;
