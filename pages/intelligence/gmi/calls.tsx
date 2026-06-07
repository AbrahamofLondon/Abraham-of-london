import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import {
  getGmiCallLedger,
  toPublicCallLedgerEntry,
  type GmiDataProvenance,
} from "@/lib/intelligence/gmi-data-service.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  calls: ReturnType<typeof toPublicCallLedgerEntry>[];
  provenance: GmiDataProvenance;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const result = await getGmiCallLedger("GMI-Q2-2026");
  return {
    props: {
      calls: result.data.map(toPublicCallLedgerEntry),
      provenance: result.provenance,
    },
    revalidate: 1800,
  };
};

const GmiCallsPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ calls, provenance }) => {
  return (
    <Layout
      title="GMI Call Ledger | Abraham of London"
      description="Public read-only Global Market Intelligence call ledger."
      canonicalUrl="/intelligence/gmi/calls"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Public call ledger
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              Calls are registered before they are reviewed.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              This ledger exposes the call record, review window, evidence posture, score where available, and version history. It excludes private notes and unpublished client context.
            </p>
            <p className="mt-3 text-xs leading-5 text-white/35">
              Data source: {provenance.sourceName} ({provenance.sourceType}). Last updated {provenance.lastUpdatedAt ?? "not available"}. Production safe: {provenance.isProductionSafe ? "yes" : "no"}.
            </p>
          </header>

          <section className="space-y-4">
            {calls.map((call) => (
              <article key={call.callId} className="border border-white/10 bg-white/[0.015] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>{call.callId}</p>
                    <p className="mt-1 text-xs text-white/34">{call.editionId} · {call.category.replace(/_/g, " ")} · Review {call.reviewWindow}</p>
                  </div>
                  <span className="border border-white/10 bg-black/25 px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-white/50" style={mono}>
                    {call.currentScore === null ? call.currentStatus.replace(/_/g, " ") : `${call.currentScore}/5 ${call.scoreLabel}`}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-white/62">{call.thesis}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <p className="text-xs leading-5 text-white/38"><span className="text-white/60">Region:</span> {call.region}</p>
                  <p className="text-xs leading-5 text-white/38"><span className="text-white/60">Theme:</span> {call.theme}</p>
                  <p className="text-xs leading-5 text-white/38"><span className="text-white/60">Next review:</span> {call.nextReviewDue ?? "Not set"}</p>
                </div>
                {call.evidenceSources.length > 0 ? (
                  <div className="mt-3">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Evidence sources</p>
                    <ul className="mt-2 space-y-1">
                      {call.evidenceSources.map((source) => (
                        <li key={source} className="text-xs leading-5 text-white/42">{source}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiCallsPage;
