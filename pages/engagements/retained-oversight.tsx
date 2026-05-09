import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1rem" }}>
      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}BB` }}>{title}</p>
      <div className="mt-3 text-sm leading-7 text-white/60">{children}</div>
    </section>
  );
}

const RetainedOversightPage: NextPage = () => {
  return (
    <Layout
      title="Retained Oversight | Selective Engagement"
      description="Buyer-facing retained oversight pathway."
      canonicalUrl="/engagements/retained-oversight"
      fullWidth
      headerTransparent
    >
      <Head><meta name="robots" content="index,follow" /></Head>
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>Selective engagement · retained oversight</p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3rem)", color: "rgba(255,255,255,0.92)" }}>
              Sponsor-safe retained institutional memory.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60">
              Current honest classification: selective high-value ready. This pathway exists where the buyer already has a serious record and needs cadence, memory, sponsor-safe reporting, and governed follow-through.
            </p>
          </header>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="Who it is for">
              Sponsors, owners, and serious operators who already understand the value of governed continuity and need retained visibility without exposing raw respondent text, operator notes, or counsel notes.
            </Block>
            <Block title="What is retained">
              Cadence posture, attention items, counsel history, boardroom history, outcome record, checkpoint continuity, and sponsor-safe reporting where the record supports it.
            </Block>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What is not claimed">
              Not general £50k readiness. Not automated oversight unless cadence is actually configured that way. Not continuous monitoring language where no such automation exists. Not verified outcomes without verification.
            </Block>
            <Block title="What blocks higher readiness">
              Thinner live retained history on some scopes, limited entitlement maturity for broader portfolio exposure, and the need for denser real cadence, counsel, boardroom, and outcome memory before any broader high-value claim can be made honestly.
            </Block>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Block title="What a retained cycle includes">
              Review cadence posture, sponsor-safe command summary, attention queue, counsel continuity where relevant, boardroom archive status where relevant, and retained outcome posture with thin-state honesty when evidence is sparse.
            </Block>
            <Block title="Cancellation and continuity loss">
              The commercial value is not recurring access to a dashboard. It is the accumulated institutional memory that would otherwise be lost: cadence history, counsel continuity, boardroom context, outcome record, and sponsor-safe pattern memory.
            </Block>
          </section>

          <div className="flex flex-wrap gap-3">
            <Link href="/oversight" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">Review retained oversight pathway</Link>
            <Link href="/diagnostics/fast" className="border border-white/10 px-4 py-3 text-sm text-white/72 transition hover:bg-white/5">Submit evidence first</Link>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default RetainedOversightPage;
