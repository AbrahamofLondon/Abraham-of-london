/* pages/continuity.tsx — PUBLIC CONTINUITY PAGE
 *
 * Explains the Foundry's continuity model: what a governed case is,
 * why it matters, what is preserved, and what changes after full review.
 * No auth required. Public.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { track } from "@/lib/foundry/track";

const GOLD = "#C9A96E";

const WHAT_IS_PRESERVED = [
  "The decision itself — what was decided and what was ruled out",
  "The evidence used — sources, dates, and whether they have since expired",
  "The authority — who had mandate to decide, and under what conditions",
  "The commitments made — what was promised, to whom, and whether it was delivered",
  "The reasoning chain — why this decision, at this time, with this evidence",
];

const WHY_CONTINUITY = [
  {
    label: "Leadership changes",
    body: "When a decision-maker leaves, the rationale behind their decisions should not leave with them. Continuity means new leaders inherit the reasoning, not just the outcome.",
  },
  {
    label: "Evidence expires",
    body: "Data used to support a decision has a shelf life. When it expires, the decision is flagged for review — not silently relied upon with stale foundations.",
  },
  {
    label: "Audits require records",
    body: "Auditors, regulators, and boards need more than a decision. They need the chain: who decided, on what basis, with what authority, and what was committed to.",
  },
  {
    label: "Escalations need context",
    body: "When a decision is challenged or escalated, the full record travels with it — evidence, authority, and prior commitments — not just a summary that has already lost meaning.",
  },
];

export default function ContinuityPage() {
  return (
    <Layout
      title="Continuity | Foundry | Abraham of London"
      description="What a governed case is, why it matters, and what changes when a decision enters a full review. The Foundry preserves evidence, authority, and commitment across governance cycles."
      canonicalUrl="/continuity"
    >
      <Head><title>Continuity | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Continuity</span>
          </div>

          {/* Hero */}
          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Continuity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Decisions outlive the people who make them. The Foundry ensures every governed
            decision remains traceable, verifiable, and actionable across team changes,
            reorganisation, and evolving evidence.
          </p>

          {/* What a governed case is */}
          <section className="mt-16">
            <h2 className="font-serif text-2xl font-light italic text-white/80">
              What a governed case is
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/65 max-w-2xl">
              A governed case is a decision record that can be returned to, compared, and verified
              over time. It is not a report. It is not a summary. It is a structured record of the
              decision process: what was known, who had authority, what was committed to, and
              whether those commitments were met.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/65 max-w-2xl">
              A public test gives you a pattern analysis. A governed case gives you an institution.
            </p>
          </section>

          {/* What is preserved */}
          <section className="mt-14">
            <h2 className="font-serif text-2xl font-light italic text-white/80">
              What is preserved
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/60 max-w-2xl">
              When a decision enters full review, the record captures:
            </p>
            <ul className="mt-5 space-y-3">
              {WHAT_IS_PRESERVED.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: GOLD }} />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* What changes after full review */}
          <section className="mt-14">
            <h2 className="font-serif text-2xl font-light italic text-white/80">
              What changes after a full review
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/60 max-w-2xl">
              A public test is a pattern check. A full review changes the category of the decision:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { before: "Pattern-based analysis", after: "Evidence-verified record" },
                { before: "Demo reference ID", after: "Governed verification token" },
                { before: "Illustrative result", after: "Auditable decision chain" },
                { before: "No persistence", after: "Durable record you can return to" },
              ].map(({ before, after }, i) => (
                <div key={i} className="border border-white/8 p-4">
                  <p className="text-xs text-white/35 font-mono line-through">{before}</p>
                  <p className="mt-1 text-sm text-white/70">{after}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why organisations need continuity */}
          <section className="mt-14">
            <h2 className="font-serif text-2xl font-light italic text-white/80">
              Why continuity, not one-off opinions
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/60 max-w-2xl">
              Advisory opinions are consumed and forgotten. Governed cases are built into the
              institutional record. The distinction matters in four situations:
            </p>
            <div className="mt-6 space-y-6">
              {WHY_CONTINUITY.map((item, i) => (
                <div key={i} className="border-l-2 pl-6 py-1" style={{ borderColor: `${GOLD}40` }}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-[8px] text-white/20">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-serif text-base font-light italic text-white/80">{item.label}</h3>
                  </div>
                  <p className="text-sm leading-6 text-white/60 max-w-2xl">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Positioning statement */}
          <section className="mt-16">
            <div
              className="p-8"
              style={{ borderLeft: `2px solid ${GOLD}33`, backgroundColor: "rgba(255,255,255,0.008)" }}
            >
              <p className="font-serif text-xl text-white/75 leading-relaxed italic">
                You do not pay for access. You pay for continuity.
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55 max-w-xl">
                The public tests demonstrate what pattern-based analysis can surface.
                Continuity is what happens when that analysis becomes an institutional record —
                one that can be verified, returned to, and built upon.
              </p>
            </div>
          </section>

          {/* CTA hierarchy */}
          <section className="mt-14 border-t border-white/10 pt-10">
            <div className="flex flex-wrap gap-4">
              {/* Primary */}
              <Link
                href="/foundry/decision-test"
                data-analytics="continuity-to-test"
                onClick={() => track("foundry_continuity_click", { target: "decision-test" })}
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Test a Decision →
              </Link>

              {/* Secondary */}
              <Link
                href="/foundry/start"
                data-analytics="continuity-to-start"
                onClick={() => track("foundry_continuity_click", { target: "full-review" })}
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Start a full review →
              </Link>

              {/* Interest capture */}
              <Link
                href="/foundry/start#contact"
                data-analytics="continuity-to-interest"
                onClick={() => track("foundry_continuity_click", { target: "interest-form" })}
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Request a full review →
              </Link>

              {/* Tertiary */}
              <Link
                href="/foundry"
                onClick={() => track("foundry_continuity_click", { target: "foundry-home" })}
                className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors self-center"
              >
                ← Foundry Home
              </Link>
            </div>

            <p className="mt-8 font-mono text-[7px] uppercase tracking-[0.25em] text-white/15 text-center">
              Continuity is the institutional product. Public tests demonstrate the category.
            </p>
          </section>

        </div>
      </main>
    </Layout>
  );
}
