import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType, NextPage } from "next";

import Layout from "@/components/Layout";
import {
  getGmiFalsificationRules,
  type GmiDataProvenance,
  type GmiFalsificationRuleData,
} from "@/lib/intelligence/gmi-data-service.server";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type Props = {
  rules: GmiFalsificationRuleData[];
  provenance: GmiDataProvenance;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const result = await getGmiFalsificationRules("GMI-Q2-2026");
  return {
    props: {
      rules: result.data,
      provenance: result.provenance,
    },
    revalidate: 1800,
  };
};

const GmiFalsificationPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({ rules, provenance }) => {
  return (
    <Layout
      title="GMI Falsification Register | Abraham of London"
      description="Public falsification register for Global Market Intelligence theses."
      canonicalUrl="/intelligence/gmi/falsification"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Falsification register
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              Every major thesis states what would prove it wrong.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">
              These rules are not decorative caveats. They are the public threshold for changing the view.
            </p>
            <p className="mt-3 text-xs leading-5 text-white/35">
              Data source: {provenance.sourceName} ({provenance.sourceType}). Last updated {provenance.lastUpdatedAt ?? "not available"}.
            </p>
          </header>

          <section className="space-y-4">
            {rules.map((rule) => (
              <article key={rule.id} className="border border-white/10 bg-white/[0.015] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                      {rule.thesisId}
                    </p>
                    <h2 className="mt-2 font-serif text-xl text-white">{rule.thesisStatement}</h2>
                  </div>
                  <span className="border border-white/10 bg-black/25 px-3 py-1 text-[9px] uppercase tracking-[0.16em] text-white/50" style={mono}>
                    {rule.currentStatus}
                  </span>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/30" style={mono}>What would prove it wrong</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{rule.falsificationCondition}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/30" style={mono}>Observable signal</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{rule.observableIndicator}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/30" style={mono}>Threshold</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">{rule.thresholdType}: {rule.thresholdValue}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-white/30" style={mono}>Evidence posture</p>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      {rule.evidenceSourceRows.length} linked rows. Next review {rule.nextReviewDue}.
                    </p>
                  </div>
                </div>
                <p className="mt-4 border-t border-white/8 pt-4 text-sm leading-6 text-white/45">{rule.publicExplanation}</p>
              </article>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiFalsificationPage;
