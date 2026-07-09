import * as React from "react";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import { GMI_CALL_SCORING_RUBRIC, GMI_METHODOLOGY } from "@/lib/intelligence/gmi-methodology";
import { GMI_REQUIRED_EDITION_SECTIONS } from "@/lib/intelligence/gmi-instrument";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const evidenceRules = [
  "MONITORING to MEDIUM requires at least one named source row.",
  "MEDIUM to HIGH requires two independent source categories.",
  "HIGH claims must have source appendix support.",
  "SCENARIO claims cannot be written as facts.",
  "Hard macro numbers, hard probability figures, capital-flow claims, policy quotes, and current country or sector claims require source support.",
] as const;

const GmiMethodologyPage: NextPage = () => {
  return (
    <Layout
      title="GMI Methodology | Abraham of London"
      description="Locked Global Market Intelligence methodology, scoring rubric, evidence posture rules, and release blockers."
      canonicalUrl="/intelligence/gmi/methodology"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Methodology {GMI_METHODOLOGY.methodologyVersion}
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              The rubric is locked before public scoring begins.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/58">{GMI_METHODOLOGY.legalBoundary}</p>
            <p className="mt-2 text-xs text-white/35">
              Rubric version: {GMI_METHODOLOGY.rubricVersion}. Effective from: {GMI_METHODOLOGY.effectiveFrom}.
            </p>
          </header>

          <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {GMI_CALL_SCORING_RUBRIC.map((item) => (
              <article key={item.score} className="border border-white/10 bg-white/[0.015] p-5">
                <p className="text-4xl font-light" style={{ color: `${GOLD}DD` }}>{item.score}</p>
                <p className="mt-2 text-sm text-white/82">{item.label}</p>
                <p className="mt-2 text-xs leading-6 text-white/46">{item.definition}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="border border-white/10 bg-white/[0.015] p-6">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Required edition sections
              </p>
              <div className="mt-4 grid gap-2">
                {GMI_REQUIRED_EDITION_SECTIONS.map((section) => (
                  <div key={section} className="border border-white/6 bg-black/20 px-3 py-2 text-xs text-white/50">
                    {section.replace(/_/g, " ")}
                  </div>
                ))}
              </div>
            </article>

            <article className="border border-white/10 bg-white/[0.015] p-6">
              <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
                Evidence posture governance
              </p>
              <div className="mt-4 space-y-2">
                {evidenceRules.map((rule) => (
                  <p key={rule} className="border-l border-[#C9A96E]/30 pl-3 text-xs leading-6 text-white/50">{rule}</p>
                ))}
              </div>
            </article>
          </section>

          <section className="border border-[#C9A96E]/20 bg-[#C9A96E]/[0.04] p-6">
            <p style={{ ...mono, fontSize: "11px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Version record
            </p>
            {GMI_METHODOLOGY.changeLog.map((entry) => (
              <div key={entry.version} className="mt-4 border border-white/8 bg-black/20 p-4">
                <p className="text-xs text-white/65">{entry.version} — effective {entry.effectiveFrom}</p>
                <p className="mt-2 text-xs leading-6 text-white/45">{entry.note}</p>
              </div>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiMethodologyPage;

