/* pages/foundry/decision-test.tsx — PUBLIC DECISION TEST
 *
 * Constraint-aware decision triage. Uses the Constraint Reality Layer
 * to classify domain, detect constraint signals, and return a directive
 * (LOW / MODERATE / HIGH / ESCALATE / CONSTRAINED_RESCUE) with a
 * minimum viable next move and a fallback if the ideal path is blocked.
 *
 * No persistence. No admin data. Client-side analysis only.
 * Not professional, legal, tax, or financial advice.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { InterestForm } from "@/components/foundry/InterestForm";
import { track } from "@/lib/foundry/track";
import {
  analyzeConstraintReality,
  type RiskDirective,
  type DecisionDomain,
} from "@/lib/decision/constraint-reality-layer";

const GOLD = "#C9A96E";

function directiveBadgeClass(d: RiskDirective): string {
  if (d === "LOW") return "bg-emerald-500/10 text-emerald-400";
  if (d === "CONSTRAINED_RESCUE" || d === "ESCALATE") return "bg-red-500/10 text-red-400";
  if (d === "HIGH") return "bg-red-500/10 text-red-400";
  return "bg-amber-500/10 text-amber-400";
}

function domainLabel(d: DecisionDomain): string {
  const labels: Record<DecisionDomain, string> = {
    compliance_statutory: "Compliance / Statutory",
    financial_exposure: "Financial Commitment",
    legal_regulatory: "Legal / Regulatory",
    deadline_bound: "Deadline-Bound",
    product_release: "Product / Release",
    market_claim: "Market / Positioning",
    board_sensitive: "Board / Governance",
    family_legal_admin: "Personal / Legal Admin",
    operational_dependency: "Operational Risk",
    personal_low_stakes: "Personal / Low Stakes",
    unclear: "Unclear — more context needed",
  };
  return labels[d] ?? d;
}

export default function DecisionTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<ReturnType<typeof analyzeConstraintReality> | null>(null);

  const SAMPLE =
    "We need to launch the new service by end of quarter. The team believes we're ready but we're still waiting on legal review. No one has formally approved the budget yet.";

  function handleSubmit() {
    if (!text.trim()) return;
    const analysis = analyzeConstraintReality(text);
    track("foundry_test_run", {
      test: "decision",
      charCount: text.length,
      directive: analysis.directive,
      decisionType: analysis.decisionType,
    });
    setResult(analysis);
  }

  function handleSample() {
    setText(SAMPLE);
    track("foundry_test_sample", { test: "decision" });
  }

  const demoRef = React.useRef(Date.now().toString(36).slice(-6).toUpperCase());
  const timestamp = React.useRef(
    new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  );
  // Refresh both when a new result is generated
  function submitAndRefreshRef() {
    demoRef.current = Date.now().toString(36).slice(-6).toUpperCase();
    timestamp.current = new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    handleSubmit();
  }

  return (
    <Layout
      title="Test a Decision | Foundry | Abraham of London"
      description="Submit a decision under consideration. Receive domain classification, constraint analysis, and a triage directive with a minimum viable next move."
      canonicalUrl="/foundry/decision-test"
    >
      <Head><title>Test a Decision | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Decision Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Test a Decision
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Describe the decision, the pressure you are under, and the constraints you are facing.
            The Foundry classifies the domain, detects constraint signals, and returns a triage
            directive with a minimum viable next move.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Not professional, legal, tax, or financial advice
          </p>

          {/* Input */}
          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the decision: what you face, the deadline, the constraints, what you have tried, and what is preventing the ideal solution..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={submitAndRefreshRef}
                disabled={!text.trim()}
                data-analytics="foundry-decision-submit"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Assess Decision
              </button>
              <button
                onClick={handleSample}
                data-analytics="foundry-decision-sample"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Use Sample
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-12 space-y-6">

              {/* Header: directive + type + score */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                      Decision Risk Score
                    </p>
                    <p className="mt-2 font-serif text-5xl font-light text-white/90">
                      {result.score}<span className="text-2xl text-white/30">/100</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${directiveBadgeClass(result.directive)}`}>
                      {result.directive === "CONSTRAINED_RESCUE" ? "CONSTRAINED RESCUE" : result.directive}
                    </span>
                    <span className="rounded px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] bg-white/5 text-white/35">
                      {domainLabel(result.decisionType)}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white/70 leading-relaxed">{result.situationSummary}</p>

                {/* Primary tension */}
                {result.primaryTension && (
                  <div className="mt-4 border-l-2 pl-4 py-1" style={{ borderColor: `${GOLD}40` }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">
                      Primary tension
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed italic">{result.primaryTension}</p>
                  </div>
                )}

                {/* Demo ref + timestamp */}
                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    Demo ref: {demoRef.current}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    {timestamp.current}
                  </span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {/* Findings */}
              {result.findings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Findings</p>
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border p-4 ${
                      f.severity === "HIGH" ? "border-red-500/20 bg-red-500/5" :
                      f.severity === "MEDIUM" ? "border-amber-500/15 bg-amber-500/5" :
                      "border-white/8 bg-white/2"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] ${
                          f.severity === "HIGH" ? "bg-red-500/10 text-red-400" :
                          f.severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/40"
                        }`}>{f.severity}</span>
                        <span className="text-sm font-medium text-white/70">{f.label}</span>
                      </div>
                      <p className="text-xs text-white/55">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pressure + constraints detected */}
              {(result.constraintSignals.length > 0 || result.pressureTypes.length > 0) && (
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                    Constraint Reality
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.constraintSignals.map(s => (
                      <span key={s} className="rounded border border-red-500/15 bg-red-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-red-400/70">
                        {s.replace(/_/g, " ")}
                      </span>
                    ))}
                    {result.pressureTypes.map(p => (
                      <span key={p} className="rounded border border-amber-500/15 bg-amber-500/5 px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] text-amber-400/60">
                        {p.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Downside of delay / wrong action */}
              <div className="border border-white/8 bg-white/2 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                      Downside of delay
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{result.downsideOfDelay}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                      Downside of wrong action
                    </p>
                    <p className="text-xs text-white/60 leading-relaxed">{result.downsideOfWrongAction}</p>
                  </div>
                </div>
              </div>

              {/* Minimum viable next move */}
              <div className="border p-5" style={{ borderColor: `${GOLD}25` }}>
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  Minimum Viable Next Move
                </p>
                <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: `${GOLD}CC` }}>
                  {result.minimumViableNextMove}
                </div>
              </div>

              {/* Fallback */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">
                  Fallback — if the ideal path is unavailable
                </p>
                <p className="text-sm text-white/65 leading-relaxed">{result.fallback}</p>
              </div>

              {/* Evidence needed + must not delay */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="border border-white/8 bg-white/2 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-3">
                    Evidence needed next
                  </p>
                  <ul className="space-y-2">
                    {result.evidenceNeeded.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/20" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border border-red-500/15 bg-red-500/4 p-5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-red-400/60 mb-3">
                    Must not be delayed
                  </p>
                  <ul className="space-y-2">
                    {result.mustNotDelay.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-white/65">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400/40" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Escalation threshold */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25 mb-1">
                  Escalation threshold
                </p>
                <p className="text-xs text-white/45">{result.escalationThreshold}</p>
              </div>

              {/* Disclaimer */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Domain triage only · Not professional, legal, tax, or financial advice · No data retained
                </p>
              </div>

              {/* Interest capture */}
              <InterestForm sourceTest="decision" initialDecisionType={result.decisionType} />

              {/* Conversion CTA */}
              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  What a full review adds
                </p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review produces a verifiable record: evidence timestamped, authority confirmed,
                  commitments tracked, and a minimum viable intervention plan specific to your constraints.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/foundry/start"
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "decision-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Start a full review →
                  </Link>
                  <Link
                    href="/continuity"
                    onClick={() => track("foundry_conversion_click", { target: "continuity", source: "decision-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
                  >
                    Understand continuity →
                  </Link>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link href="/foundry" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  ← Back to Foundry
                </Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/market-signal-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Market Signal Test →
                </Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/release-risk-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">
                  Try Release Risk Test →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
