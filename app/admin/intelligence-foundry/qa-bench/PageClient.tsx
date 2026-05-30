"use client";

/* app/admin/intelligence-foundry/qa-bench/PageClient.tsx
 *
 * Adversarial Product QA Bench.
 *
 * Stress-tests the entire product ladder from one scenario input.
 * Renders all output tiers, catalogue mapping, quality flags,
 * founder checklist, and manual scoring.
 *
 * Internal only. Not exposed publicly.
 */

import * as React from "react";
import Link from "next/link";
import { analyzeDecisionFailureMap } from "@/lib/decision/decision-failure-map";
import { composeDecisionCase } from "@/lib/product/decision-case-composer";
import {
  toFreeDecisionOutput,
  toPaidBriefOutput,
  toExecutiveReviewInput,
  toContinuityRecord,
  toAdminQualitySignal,
} from "@/lib/product/output-adapters";
import { getCatalogue, getProduct } from "@/lib/product/product-catalogue-registry";
import type { DecisionCaseTier, LadderStep } from "@/lib/product/decision-case-contract";
import type { DecisionFailureMapResult } from "@/lib/decision/decision-failure-map";

const GOLD = "#C9A96E";

// ─── Seeded scenarios ─────────────────────────────────────────────────────────

const SEEDED_SCENARIOS: Record<string, string> = {
  "tax/accounts deadline no funds": "I need to file my company accounts and corporation tax return by the end of this month. I have no money for an accountant. The records are complicated — multiple income streams, some expenses I'm not sure about. I already submitted a placeholder filing but the real deadline is approaching. I'm worried about penalties I can't afford.",
  "board political pressure incomplete evidence": "The board needs to decide whether to acquire a competitor by next quarter. The CEO is pushing hard for it but the due diligence is incomplete. Two board members have conflicts of interest. The CFO says the numbers don't add up without cost savings we haven't validated. There's pressure to announce before the competitor's earnings call.",
  "product launch weak evidence revenue urgency": "We need to ship this feature by end of quarter to hit our revenue target. The testing is incomplete — we found a critical bug yesterday. Marketing has already announced the launch date. The CEO is not willing to delay. We don't have a rollback plan. If this fails, our largest customer will leave.",
  "market claim no buyer proof": "Our platform reduces decision time by 40%. We have internal benchmarks but no customer validation. The claim sounds impressive but we haven't tested it with actual buyers. Our competitors are making similar claims. We need to know if this is defensible before putting it on the website.",
  "family/legal/admin deadline harm of delay": "I need to make a decision about my mother's power of attorney. She has dementia and can no longer manage her affairs. Her savings are running out. The care home fees are increasing. If I don't act soon, the local authority will step in and I may lose control over her care arrangements. I can't afford a solicitor.",
  "procurement supplier risk": "We need to choose a new cloud infrastructure provider. Our current provider is increasing prices by 300%. The migration will take 3 months and requires significant engineering time. Two vendors have submitted proposals but neither has completed a security audit. Our CTO wants to move quickly but the compliance team has concerns about data residency.",
  "investor pitch unsupported traction": "We're raising our seed round and need to present traction data to investors. Our revenue is growing but we don't have cohort retention data. Our customer acquisition cost is unclear because we haven't tracked it properly. The CEO wants to present our best case but I'm worried about what happens when investors ask for unit economics.",
  "operational failure unclear owner": "Our production system went down for 4 hours last night. The incident response was chaotic — no one knew who was responsible for making the call to failover. The runbook was out of date. Three different teams claimed they were waiting for someone else. We need to decide who owns the incident response process going forward.",
  "low-stakes preference": "I'm trying to decide between two coffee machines for the office. One is more expensive but has better reviews. The other is cheaper and simpler. Either would be fine. There's no deadline, no legal obligation, and no one will be harmed either way.",
  "executive reputational exposure": "A senior partner at our firm has been accused of misconduct by a former employee. The allegations are unproven but damaging. The partner denies everything. We need to decide whether to launch an internal investigation, commission an external review, or wait for formal legal proceedings. Any choice carries reputational risk.",
};

// ─── Forbidden / internal terms check ─────────────────────────────────────────

const INTERNAL_TERMS = [
  "ResearchRun", "LIVE_GOVERNED", "RESERVED_CONCEPT", "adapter", "CI gate", "governance event",
];

const FORBIDDEN_CLAIMS = [
  "professional advice", "cryptographic proof", "legally binding", "guarantees", "replaces a qualified professional",
];

function checkForbiddenTerms(text: string): { term: string; found: boolean }[] {
  return [
    ...INTERNAL_TERMS.map(term => ({ term, found: text.includes(term) })),
    ...FORBIDDEN_CLAIMS.map(claim => ({ term: `forbidden: ${claim}`, found: text.toLowerCase().includes(claim.toLowerCase()) })),
  ];
}

// ─── Score entry component ────────────────────────────────────────────────────

type ScoreKey = "usefulness" | "specificity" | "viability" | "premiumFeel" | "embarrassmentRisk";

const SCORE_LABELS: Record<ScoreKey, string> = {
  usefulness: "Usefulness (1-5)",
  specificity: "Specificity (1-5)",
  viability: "Viability (1-5)",
  premiumFeel: "Premium feel (1-5)",
  embarrassmentRisk: "Embarrassment risk (1-5)",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function QABenchPageClient() {
  const [scenarioKey, setScenarioKey] = React.useState<string>("tax/accounts deadline no funds");
  const [customText, setCustomText] = React.useState("");
  const [analysis, setAnalysis] = React.useState<DecisionFailureMapResult | null>(null);
  const [decisionCase, setDecisionCase] = React.useState<ReturnType<typeof composeDecisionCase> | null>(null);
  const [scores, setScores] = React.useState<Record<ScoreKey, number>>({
    usefulness: 3, specificity: 3, viability: 3, premiumFeel: 3, embarrassmentRisk: 3,
  });
  const [wouldShip, setWouldShip] = React.useState<boolean | null>(null);
  const [tab, setTab] = React.useState<string>("free");

  const text = customText || SEEDED_SCENARIOS[scenarioKey] || "";

  function runAnalysis() {
    if (!text.trim()) return;
    const dfm = analyzeDecisionFailureMap(text);
    setAnalysis(dfm);

    const dc = composeDecisionCase({
      source: "decision_test",
      tier: "full",
      safeSummary: text.slice(0, 200),
      rawInput: text,
    });
    setDecisionCase(dc);
  }

  React.useEffect(() => {
    if (text) runAnalysis();
  }, []);

  function setScore(key: ScoreKey, value: number) {
    setScores(prev => ({ ...prev, [key]: value }));
  }

  const catalogue = getCatalogue();

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/intelligence-foundry" className="font-mono text-[11px] text-white/25 hover:text-white/45">
            ← Foundry
          </Link>
          <h1 className="mt-2 text-lg font-semibold text-white/80">Adversarial QA Bench</h1>
          <p className="text-xs text-white/40 mt-1">Stress-test the entire product ladder from one scenario input</p>
        </div>

        {/* Scenario selection */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-white/30 mb-2">Seeded scenarios</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {Object.keys(SEEDED_SCENARIOS).map(key => (
                <button
                  key={key}
                  onClick={() => { setScenarioKey(key); setCustomText(""); }}
                  className={`block w-full text-left px-3 py-1.5 text-xs font-mono transition-colors ${
                    scenarioKey === key && !customText
                      ? 'bg-white/10 text-white/80 border-l-2 border-amber-500'
                      : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[8px] uppercase tracking-wider text-white/30 mb-2">Custom scenario</p>
            <textarea
              value={customText}
              onChange={e => { setCustomText(e.target.value); setScenarioKey(""); }}
              placeholder="Paste or type a decision scenario..."
              rows={6}
              className="w-full border bg-black/30 px-3 py-2 text-xs text-white/70 placeholder:text-white/20 focus:outline-none resize-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>

        <button
          onClick={runAnalysis}
          disabled={!text.trim()}
          className="mb-6 border px-4 py-2 font-mono text-[9px] uppercase tracking-wider transition-colors disabled:opacity-30"
          style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
        >
          Run QA Analysis
        </button>

        {analysis && decisionCase && (
          <>
            {/* Summary bar */}
            <div className="grid grid-cols-5 gap-3 mb-6">
              <div className="border border-white/8 bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-wider text-white/30">Directive</p>
                <p className={`text-sm font-mono mt-1 ${
                  analysis.directive === "LOW" ? "text-emerald-400" :
                  analysis.directive === "CONSTRAINED_RESCUE" || analysis.directive === "ESCALATE" ? "text-red-400" :
                  analysis.directive === "HIGH" ? "text-red-400/80" : "text-amber-400"
                }`}>{analysis.directive}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-wider text-white/30">Failure Point</p>
                <p className="text-sm font-mono mt-1 text-white/70">{analysis.primaryFailurePoint}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-wider text-white/30">Domain</p>
                <p className="text-sm font-mono mt-1 text-white/70">{analysis.decisionType}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-wider text-white/30">Confidence</p>
                <p className="text-sm font-mono mt-1 text-white/70">{analysis.confidence}</p>
              </div>
              <div className="border border-white/8 bg-white/[0.02] p-3">
                <p className="font-mono text-[7px] uppercase tracking-wider text-white/30">Score</p>
                <p className="text-sm font-mono mt-1 text-white/70">{analysis.score}/100</p>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="flex flex-wrap gap-1 mb-4 border-b border-white/10 pb-2">
              {[
                { id: "free", label: "Free Output" },
                { id: "paid", label: "Paid Brief" },
                { id: "exec", label: "Executive Review" },
                { id: "continuity", label: "Continuity Record" },
                { id: "quality", label: "Quality Signal" },
                { id: "catalogue", label: "Catalogue" },
                { id: "checks", label: "Forbidden Terms" },
                { id: "review", label: "Review Checklist" },
                { id: "score", label: "Manual Score" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider transition-colors ${
                    tab === t.id ? 'text-white/80 border-b-2 border-amber-500' : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="border border-white/8 bg-white/[0.02] p-5 min-h-[400px] overflow-auto">

              {/* Free Output */}
              {tab === "free" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-amber-400/60 mb-3">Free Decision Output (teaser)</p>
                  <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {JSON.stringify(toFreeDecisionOutput(decisionCase), null, 2)}
                  </pre>
                </div>
              )}

              {/* Paid Brief */}
              {tab === "paid" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-emerald-400/60 mb-3">Paid Brief Output (full)</p>
                  <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {JSON.stringify(toPaidBriefOutput(decisionCase), null, 2)}
                  </pre>
                </div>
              )}

              {/* Executive Review */}
              {tab === "exec" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-violet-400/60 mb-3">Executive Review Input (qualified)</p>
                  <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {JSON.stringify(toExecutiveReviewInput(decisionCase, {
                      name: "Sample User",
                      email: "user@example.com",
                      organisation: "Sample Organisation",
                      role: "CEO",
                      deadline: "30 days",
                      stakeholders: "Board, CFO, Legal",
                      desiredOutcome: "Clear decision path with risk register",
                    }), null, 2)}
                  </pre>
                </div>
              )}

              {/* Continuity Record */}
              {tab === "continuity" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-blue-400/60 mb-3">Continuity Record</p>
                  <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {JSON.stringify(toContinuityRecord(decisionCase), null, 2)}
                  </pre>
                </div>
              )}

              {/* Quality Signal */}
              {tab === "quality" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/30 mb-3">Admin Quality Signal</p>
                  <pre className="text-[10px] text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                    {JSON.stringify(toAdminQualitySignal(decisionCase), null, 2)}
                  </pre>
                </div>
              )}

              {/* Catalogue */}
              {tab === "catalogue" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/30 mb-3">Catalogue Entry Mapping</p>
                  <div className="space-y-3">
                    {Object.entries(catalogue).map(([step, entry]) => (
                      <div key={step} className="border border-white/5 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[8px] uppercase tracking-wider text-white/30">{step}</span>
                          <span className={`rounded px-1.5 py-0.5 font-mono text-[7px] uppercase ${
                            entry.price === "Free" ? "bg-emerald-500/10 text-emerald-400" :
                            entry.price.startsWith("From") || entry.price === "Retainer" ? "bg-violet-500/10 text-violet-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>{entry.price}</span>
                          <span className="font-mono text-[7px] text-white/25">{entry.visibility}</span>
                        </div>
                        <p className="text-xs text-white/70">{entry.name}</p>
                        <p className="text-[10px] text-white/40 mt-1">{entry.publicPromise.slice(0, 120)}...</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="font-mono text-[6px] uppercase tracking-wider text-white/20">Engine: {entry.sourceEngine}</span>
                          <span className="font-mono text-[6px] uppercase tracking-wider text-white/20">Route: {entry.route}</span>
                          <span className="font-mono text-[6px] uppercase tracking-wider text-white/20">Fulfilment: {entry.fulfilmentPath}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forbidden Terms */}
              {tab === "checks" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-red-400/60 mb-3">Forbidden Terms & Internal Term Check</p>
                  <div className="space-y-1">
                    {checkForbiddenTerms(JSON.stringify(analysis)).map(({ term, found }) => (
                      <div key={term} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${found ? 'bg-red-400' : 'bg-emerald-400/50'}`} />
                        <span className={`text-xs font-mono ${found ? 'text-red-400' : 'text-white/40'}`}>
                          {found ? '⚠' : '✓'} {term}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Checklist */}
              {tab === "review" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-amber-400/60 mb-3">Founder Review Checklist</p>
                  <div className="space-y-3">
                    {[
                      { id: "decision_type", label: "Decision type correct", check: analysis.decisionType !== "unclear" },
                      { id: "failure_point", label: "Failure point defensible", check: analysis.primaryFailurePoint !== "NO_CRITICAL_FAILURE" || analysis.directive === "LOW" },
                      { id: "recommendation", label: "Recommendation viable", check: analysis.minimumViableNextMove.length > 30 },
                      { id: "no_impossible", label: "No impossible advice", check: analysis.impossibleAdvice.length > 0 || analysis.directive === "LOW" },
                      { id: "evidence", label: "Evidence needed included", check: analysis.evidenceNeeded.length > 0 },
                      { id: "regulated", label: "Regulated advice boundary respected", check: !analysis.situationSummary.toLowerCase().includes("professional advice") },
                      { id: "worth_price", label: "Worth-price judgement", check: analysis.directive !== "LOW" || analysis.confidence !== "low" },
                      { id: "ready", label: "Ready to deliver", check: analysis.fallbackPath.length > 30 && analysis.whatMustNotBeDelayed.length > 0 },
                    ].map(item => (
                      <div key={item.id} className="flex items-start gap-3">
                        <span className={`mt-0.5 text-xs ${item.check ? 'text-emerald-400' : 'text-red-400'}`}>
                          {item.check ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="text-xs text-white/70">{item.label}</p>
                          {!item.check && (
                            <p className="text-[9px] text-red-400/60 mt-0.5">Flagged — review required</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Score */}
              {tab === "score" && (
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-wider text-white/30 mb-3">Manual Quality Score</p>
                  <div className="space-y-4 max-w-md">
                    {(Object.keys(SCORE_LABELS) as ScoreKey[]).map(key => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-white/60">{SCORE_LABELS[key]}</p>
                          <p className="text-sm font-mono text-white/80">{scores[key]}</p>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <button
                              key={n}
                              onClick={() => setScore(key, n)}
                              className={`w-8 h-8 text-xs font-mono border transition-colors ${
                                scores[key] === n
                                  ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                                  : 'border-white/10 text-white/30 hover:border-white/30'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-white/60 mb-2">Would you ship this output?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setWouldShip(true)}
                          className={`px-4 py-2 text-xs font-mono border transition-colors ${
                            wouldShip === true ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : 'border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        >
                          Ship ✓
                        </button>
                        <button
                          onClick={() => setWouldShip(false)}
                          className={`px-4 py-2 text-xs font-mono border transition-colors ${
                            wouldShip === false ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-white/10 text-white/40 hover:border-white/30'
                          }`}
                        >
                          Block ✗
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Raw analysis for reference */}
            <details className="mt-4">
              <summary className="font-mono text-[8px] uppercase tracking-wider text-white/20 cursor-pointer hover:text-white/40">
                Raw DFM Output
              </summary>
              <pre className="mt-2 text-[9px] text-white/30 leading-relaxed whitespace-pre-wrap font-mono max-h-96 overflow-y-auto">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </details>
          </>
        )}

        {!analysis && (
          <div className="border border-dashed border-white/10 p-8 text-center">
            <p className="text-xs text-white/30 font-mono">Select a scenario or enter custom text, then click "Run QA Analysis"</p>
          </div>
        )}

      </div>
    </div>
  );
}
