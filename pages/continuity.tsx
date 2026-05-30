/* pages/continuity.tsx — PUBLIC CONTINUITY PAGE
 *
 * Explains the Foundry's continuity model: how decisions are tracked,
 * verified, and carried forward. No auth required. Public.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import RetainedOversightSection from "@/components/homepage/RetainedOversightSection";
import MemoryContinuityPreview from "@/components/homepage/MemoryContinuityPreview";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const PRINCIPLES = [
  {
    title: "Decisions Leave Traces",
    body: "Every governed decision creates a record. Who decided, what evidence they used, what they overruled, and what they committed to. These traces form an auditable chain.",
  },
  {
    title: "Evidence Has a Shelf Life",
    body: "Evidence used in a decision is timestamped. When it expires, the decision is flagged for review. This prevents stale data from supporting active governance.",
  },
  {
    title: "Authority Is Verified, Not Assumed",
    body: "Each decision records who had authority to make it. If authority changes — through role change, delegation, or escalation — the decision record reflects it.",
  },
  {
    title: "Commitments Are Tracked to Completion",
    body: "Every decision produces commitments. The Foundry tracks each commitment through to verification or escalation. Unresolved commitments block related decisions.",
  },
];

export default function ContinuityPage() {
  return (
    <Layout
      title="Continuity | Foundry | Abraham of London"
      description="How the Foundry ensures decision continuity across governance cycles, team changes, and evolving evidence."
      canonicalUrl="/continuity"
    >
      <Head><title>Continuity | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span className="text-[#C9A96E]/70">Continuity</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Continuity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Decisions outlive the people who make them. The Foundry ensures that every governed
            decision remains traceable, verifiable, and actionable across team changes, reorganisation,
            and evolving evidence.
          </p>

          <div className="mt-16 space-y-8">
            {PRINCIPLES.map((p, i) => (
              <div key={i} className="border-l-2 pl-6 py-2" style={{ borderColor: `${GOLD}40` }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-[8px] text-white/20">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-serif text-xl font-light italic text-white/80">{p.title}</h2>
                </div>
                <p className="text-sm leading-7 text-white/65 max-w-2xl">{p.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 border-t border-white/10 pt-10">
            <h2 className="font-serif text-2xl font-light italic text-white/80">Why continuity matters</h2>
            <p className="mt-4 text-sm leading-7 text-white/65 max-w-2xl">
              When a key decision-maker leaves, the institutional memory of <em>why</em> a decision was
              made often leaves with them. The Foundry preserves not just the decision outcome, but the
              evidence, authority, and reasoning chain that produced it. This means:
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "New leaders can understand the rationale behind existing commitments",
                "Decisions can be reviewed when evidence or conditions change",
                "Auditors can verify that governance was followed",
                "Escalations carry their full context, not just a summary",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: GOLD }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Retained Oversight ──────────────────────────────────────────── */}
          <RetainedOversightSection />

          {/* ── Memory Continuity ──────────────────────────────────────────── */}
          <MemoryContinuityPreview />

          <div className="mt-12 border-t border-white/10 pt-10">
            <div className="flex flex-wrap gap-4">
              <Link
                href="/foundry/decision-test"
                data-analytics="continuity-to-test"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Test a Decision →
              </Link>
              <Link
                href="/foundry/start"
                data-analytics="continuity-to-start"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Start a full review →
              </Link>
              <Link
                href="/foundry"
                className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors"
              >
                ← Foundry Home
              </Link>
            </div>
            <p className="mt-6 font-mono text-[7px] uppercase tracking-[0.25em] text-white/15 text-center">
              Continuity is the institutional product. Public tests demonstrate the category.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
