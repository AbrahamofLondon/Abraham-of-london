/* pages/foundry/brief/sample.tsx
 *
 * Sample Decision Failure Brief — a proof artefact, not a sales page.
 * Shows what a paid brief looks like using a fictional but realistic scenario.
 * No internal vocabulary. No overclaim. No sales pitch.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

const SAMPLE_BRIEF = {
  scenario: "A solo consultant with a lapsed limited company needs to file overdue accounts and corporation tax. They have no accountant, no budget for one, and the deadline has already passed.",
  reference: "BRIEF-SAMPLE-001",
  date: "30 May 2026",
  tier: "Full",
  decisionType: "Compliance / Statutory",
  directive: "CONSTRAINED RESCUE",
  primaryFailurePoint: "OBLIGATION_FAILURE",
  secondaryFailurePoint: "CONSTRAINT_FAILURE",
  primaryTension: "Cash constraint vs compliance exposure — the cost of not filing may exceed the cost of a fixed-scope professional review.",
  situationSummary: "This decision is most likely to fail at obligation and constraint. The available options are constrained, but a viable rescue path exists.",
  whatMustNotBeDelayed: [
    "Confirm the exact filing deadline — overdue filings may have different penalty schedules than initial deadlines",
    "Contact HMRC Business Payment Support Service (0300 200 3835) to discuss the overdue filing and any payment arrangement",
    "Separate the outstanding filing obligations: corporation tax, annual accounts, and any VAT are separate requirements",
  ],
  minimumViableNextMove: "Build a minimum viable filing rescue path: identify the exact filing types required, separate what is already submitted from what is outstanding, prepare your records pack (bank statements, invoices, receipts, prior returns), contact HMRC proactively, seek a fixed-fee limited-scope review, and file the most accurate defensible position you can if no professional help is available before the deadline.",
  fallbackPath: "If no professional help is affordable before the deadline, file the most accurate return you can based on available records, clearly marking estimated figures where exact numbers are unavailable. File an amended return once professional help is obtained. HMRC and Companies House treat proactive communication and timely (even imperfect) filing more favourably than non-response.",
  failureRisks: [
    { severity: "CRITICAL", label: "Obligation / Statutory Duty", description: "A statutory or legal obligation is present and at risk. This is not optional — it is a legal duty with enforceable consequences." },
    { severity: "CRITICAL", label: "Constraint / Ideal Path Inaccessible", description: "The required resources, access, or professional support are not available. The ideal path cannot be followed — a viable rescue path is needed instead." },
    { severity: "CRITICAL", label: "Consequence / Severe Downside if Delayed or Wrong", description: "The consequence of inaction or an error is severe and may be irreversible. The cost of delay or wrong action materially exceeds the cost of intervention." },
    { severity: "HIGH", label: "Evidence / No Evidence Referenced", description: "No data, evidence, or analysis supports this decision. Decisions without evidence are highly vulnerable to reversal." },
    { severity: "HIGH", label: "Viability / Ideal Path Inaccessible", description: "The standard recommended path (professional help, adequate time, full records) is not accessible under current constraints." },
  ],
  evidenceNeeded: [
    "Exact filing deadline and any remaining extension window",
    "Status of provisional vs final submission",
    "Completeness of underlying records and accounts",
    "Turnover/profit reconciliation and allowable deductions",
    "Budget available for limited-scope professional review",
  ],
  viableMoves: [
    { label: "Confirm exact obligation and deadline", description: "Identify the specific filing, response, or action required, and the precise deadline. Separate each obligation — they may have different deadlines and different consequences.", accessibility: "must_act_now" },
    { label: "Contact HMRC, Citizens Advice, or ICAEW for free guidance", description: "When ideal professional support is unaffordable, fixed-scope or free-advice routes address the specific question without requiring full engagement.", accessibility: "possible_with_low_funds" },
    { label: "Build the minimum evidence pack", description: "Compile what is known, explicitly note what is assumed, and identify the one or two critical unknowns.", accessibility: "possible_with_low_funds" },
    { label: "Document the decision and constraints", description: "Record the decision, the constraints, what was attempted, and the reasoning — regardless of whether the ideal path was available.", accessibility: "possible_with_low_funds" },
  ],
  impossibleAdvice: [
    "Recommend only paid professional help — without a free or fixed-scope alternative",
    "Suggest completing records fully before acting — deadline does not allow it",
    "Suggest self-completing a complex process without any external check",
    "Return LOW RISK — external obligation and consequence signals are present",
  ],
  escalationThreshold: "Professional help is strongly recommended. If cash constraints prevent this, contact HMRC's Business Payment Support Service and seek free guidance from Citizens Advice or ICAEW before the deadline.",
  disclaimer: "This is a sample brief for illustration purposes. It is not professional, legal, tax, or financial advice. Each paid brief is generated from the user's specific submission and reviewed by the Foundry team before delivery.",
};

export default function SampleBriefPage() {
  return (
    <Layout
      title="Sample Decision Failure Brief | Abraham of London"
      description="See what a paid Decision Failure Brief looks like. A fictional but realistic example showing the failure map, minimum viable next move, and fallback path."
      canonicalUrl="/foundry/brief/sample"
    >
      <Head><title>Sample Decision Failure Brief | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Sample Brief</span>
          </div>

          <div className="mb-2 flex items-center gap-2">
            <span className="rounded border border-amber-500/20 bg-amber-500/8 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/60">
              Sample
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/20">
              {SAMPLE_BRIEF.tier} Tier
            </span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Decision Failure Brief
          </h1>
          <p className="mt-4 text-base leading-7 text-white/50 max-w-2xl">
            This is a sample brief based on a fictional scenario. It shows the structure and depth
            of a paid Decision Failure Brief. Your brief will be generated from your specific
            submission and reviewed by the Foundry team.
          </p>

          {/* Scenario */}
          <div className="mt-8 border border-white/8 bg-white/2 p-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Scenario</p>
            <p className="text-sm text-white/65 leading-relaxed italic">"{SAMPLE_BRIEF.scenario}"</p>
          </div>

          {/* Failure point header */}
          <div className="mt-8 border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Most likely to fail at</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
                {SAMPLE_BRIEF.primaryFailurePoint.replace(/_/g, " ")}
              </span>
              <span className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
                {SAMPLE_BRIEF.secondaryFailurePoint.replace(/_/g, " ")}
              </span>
              <span className="rounded bg-red-500/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
                {SAMPLE_BRIEF.directive}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] bg-white/5 text-white/35">
                {SAMPLE_BRIEF.decisionType}
              </span>
            </div>
            <p className="mt-4 text-sm text-white/70 leading-relaxed">{SAMPLE_BRIEF.situationSummary}</p>
            <div className="mt-3 border-l-2 pl-4 py-1" style={{ borderColor: `${GOLD}40` }}>
              <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">Primary tension</p>
              <p className="text-xs text-white/60 leading-relaxed italic">{SAMPLE_BRIEF.primaryTension}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
              <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">Ref: {SAMPLE_BRIEF.reference}</span>
              <span className="text-white/10">·</span>
              <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">{SAMPLE_BRIEF.date}</span>
              <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">Sample — not a real record</span>
            </div>
          </div>

          {/* Failure risks */}
          <div className="mt-6 space-y-2">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Failure risks</p>
            {SAMPLE_BRIEF.failureRisks.map((r, i) => (
              <div key={i} className={`border p-4 ${
                r.severity === "CRITICAL" ? "border-red-500/20 bg-red-500/5" :
                r.severity === "HIGH" ? "border-red-500/15 bg-red-500/4" :
                "border-amber-500/15 bg-amber-500/5"
              }`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] ${
                    r.severity === "CRITICAL" ? "bg-red-500/15 text-red-400" :
                    r.severity === "HIGH" ? "bg-red-500/10 text-red-400/80" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{r.severity}</span>
                  <span className="text-sm font-medium text-white/70">{r.label}</span>
                </div>
                <p className="text-xs text-white/55 leading-relaxed">{r.description}</p>
              </div>
            ))}
          </div>

          {/* Must not be delayed */}
          <div className="mt-6 border border-red-500/15 bg-red-500/4 p-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-red-400/60 mb-3">Must not be delayed</p>
            <ul className="space-y-2">
              {SAMPLE_BRIEF.whatMustNotBeDelayed.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/65">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/40" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Minimum viable next move */}
          <div className="mt-6 border p-5" style={{ borderColor: `${GOLD}25` }}>
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">Minimum viable next move</p>
            <p className="text-sm leading-relaxed" style={{ color: `${GOLD}CC` }}>{SAMPLE_BRIEF.minimumViableNextMove}</p>
          </div>

          {/* Fallback */}
          <div className="mt-6 border border-white/8 bg-white/2 p-5">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Fallback — if the ideal path is unavailable</p>
            <p className="text-sm text-white/65 leading-relaxed">{SAMPLE_BRIEF.fallbackPath}</p>
          </div>

          {/* Evidence needed + Viable moves */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="border border-white/8 bg-white/2 p-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">Evidence needed</p>
              <ul className="space-y-2">
                {SAMPLE_BRIEF.evidenceNeeded.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-white/8 bg-white/2 p-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">Viable moves</p>
              <ul className="space-y-3">
                {SAMPLE_BRIEF.viableMoves.map((m, i) => (
                  <li key={i}>
                    <p className="text-xs font-medium text-white/65 mb-0.5">{m.label}</p>
                    <p className="text-xs text-white/45 leading-relaxed">{m.description}</p>
                    {m.accessibility === "possible_with_low_funds" && (
                      <span className="mt-1 inline-block rounded bg-emerald-500/8 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.15em] text-emerald-400/50">
                        low-resource viable
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Impossible advice */}
          <div className="mt-6 border border-white/5 bg-white/1 p-4">
            <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-2">What this brief does NOT recommend</p>
            <ul className="space-y-1">
              {SAMPLE_BRIEF.impossibleAdvice.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-white/35">
                  <span className="mt-1 text-white/20">×</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Escalation threshold */}
          <div className="mt-6 border border-white/5 bg-white/1 p-4">
            <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">Escalation threshold</p>
            <p className="text-xs text-white/40">{SAMPLE_BRIEF.escalationThreshold}</p>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 border border-white/5 bg-white/1 p-4">
            <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">{SAMPLE_BRIEF.disclaimer}</p>
          </div>

          {/* CTA */}
          <div className="mt-10 border border-white/8 bg-white/2 p-6 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
              Want a brief for your actual decision?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/foundry/decision-test"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Run the Decision Test →
              </Link>
              <Link
                href="/foundry/start"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Request a Decision Failure Brief
              </Link>
            </div>
          </div>

        </div>
      </main>
    </Layout>
  );
}
