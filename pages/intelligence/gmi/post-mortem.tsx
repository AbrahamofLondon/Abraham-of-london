import * as React from "react";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import { getGmiPerformanceMetrics, type GmiPerformanceMetricsData } from "@/lib/intelligence/gmi-data-service.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  performance: GmiPerformanceMetricsData;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const performance = await getGmiPerformanceMetrics("GMI-Q2-2026");
  return {
    props: {
      performance: performance.data,
    },
    revalidate: 1800,
  };
};

const GmiPostMortemPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ performance }) => {
  return (
    <Layout
      title="GMI Quarterly Post-Mortem | Abraham of London"
      description="Public post-mortem discipline for Global Market Intelligence."
      canonicalUrl="/intelligence/gmi/post-mortem"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Quarterly post-mortem
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              Q2 post-mortem is blocked until Q1 calls are scored with evidence.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              Errors, underweights, disconfirmed calls, and too-early calls will be published here before a subsequent edition can be marked complete.
            </p>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <p className="text-[8px] uppercase tracking-[0.16em] text-white/34" style={mono}>Calls reviewed</p>
              <p className="mt-3 text-3xl font-light">{performance.totalCallsReviewed}</p>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <p className="text-[8px] uppercase tracking-[0.16em] text-white/34" style={mono}>Too early is success?</p>
              <p className="mt-3 text-3xl font-light">No</p>
            </article>
            <article className="border border-white/10 bg-white/[0.015] p-5">
              <p className="text-[8px] uppercase tracking-[0.16em] text-white/34" style={mono}>Publication state</p>
              <p className="mt-3 text-3xl font-light">Draft</p>
            </article>
          </section>

          <section className="border border-amber-500/20 bg-amber-500/[0.04] p-6">
            <h2 className="font-serif text-xl text-white">First Edition / Prior Review Exception</h2>
            <p className="mt-3 text-sm leading-7 text-white/55">
              Q1 2026 is the first registered call ledger edition. Q2 cannot become complete until its prior-call review is evidenced, scored, and reflected in the post-mortem.
            </p>
            <Link href="/intelligence/gmi/calls" className="mt-5 inline-block text-[10px] uppercase tracking-[0.16em] text-[#E6C98C]" style={mono}>
              View call ledger
            </Link>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiPostMortemPage;
