/* pages/foundry/market-signal-test.tsx — PUBLIC MARKET SIGNAL TEST
 *
 * Assesses a market claim across two independent dimensions:
 *   - Copy clarity: is the language specific, unambiguous, and free of overclaim?
 *   - Market evidence: is there buyer proof, quantified outcomes, or cited data?
 *
 * A polished claim with no buyer proof does not score as strong.
 * The two scores are reported independently and combined for overall.
 *
 * No persistence. No admin data. Client-side analysis only.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { InterestForm } from "@/components/foundry/InterestForm";
import { track } from "@/lib/foundry/track";

const GOLD = "#C9A96E";

type FindingSeverity = "HIGH" | "MEDIUM" | "LOW";

type Finding = {
  label: string;
  detail: string;
  severity: FindingSeverity;
  dimension: "clarity" | "evidence";
};

type TestResult = {
  clarityScore: number;
  evidenceScore: number;
  overallScore: number;
  label: string;
  summary: string;
  findings: Finding[];
  evidenceNote: string;
  consequence: string;
  nextAction: string;
  demoRef: string;
  timestamp: string;
};

function generateDemoRef(): string {
  return Date.now().toString(36).slice(-6).toUpperCase();
}

// ─── Clarity analysis ─────────────────────────────────────────────────────────

function clarityFindings(lower: string): Finding[] {
  const findings: Finding[] = [];

  const overclaimPatterns = [
    { word: "revolutionary", issue: "Revolutionary claim", detail: "\"Revolutionary\" requires extraordinary evidence. Without it, the statement reads as hype, not substance." },
    { word: "game-changer", issue: "Game-changer claim", detail: "\"Game-changer\" is a subjective superlative. Replace with specific, measurable impact." },
    { word: "best-in-class", issue: "Best-in-class claim", detail: "\"Best-in-class\" requires a named benchmark and a defined metric. Without them, it is an unsupported superlative." },
    { word: "industry-leading", issue: "Industry-leading claim", detail: "\"Industry-leading\" requires a defined comparison set and measurement basis." },
    { word: "unique", issue: "Uniqueness claim", detail: "\"Unique\" is an absolute. Unless legally or technically protectable, it creates credibility risk." },
    { word: "guaranteed", issue: "Guarantee claim", detail: "\"Guaranteed\" creates a contractual expectation. Verify delivery capability before using." },
    { word: "transform", issue: "Transformation claim", detail: "\"Transform\" implies fundamental change. Requires before/after evidence and a defined mechanism." },
    { word: "disrupt", issue: "Disruption claim", detail: "\"Disrupt\" signals hype in most B2B contexts. Replace with specific market or operational impact." },
    { word: "world-class", issue: "World-class claim", detail: "\"World-class\" is an unmeasurable superlative. It weakens credibility by suggesting the claim cannot be evidenced." },
  ];

  for (const p of overclaimPatterns) {
    if (lower.includes(p.word)) {
      findings.push({ label: p.issue, detail: p.detail, severity: "HIGH", dimension: "clarity" });
    }
  }

  const wordCount = lower.split(/\s+/).filter(Boolean).length;
  if (wordCount > 100) {
    findings.push({
      label: "Excessive length",
      detail: `At ${wordCount} words, the signal is too long. Core claims should be expressible in 2–3 sentences.`,
      severity: "MEDIUM",
      dimension: "clarity",
    });
  }

  const jargonWords = ["synergy", "leverage", "optimize", "streamline", "holistic", "end-to-end", "best-of-breed"];
  const foundJargon = jargonWords.filter(w => lower.includes(w));
  if (foundJargon.length > 0) {
    findings.push({
      label: "Jargon detected",
      detail: `Terms like "${foundJargon.join(", ")}" reduce clarity. Each jargon word costs you a reader.`,
      severity: "MEDIUM",
      dimension: "clarity",
    });
  }

  const frictionWords = ["complex", "sophisticated", "enterprise-grade", "powerful", "robust", "scalable"];
  const foundFriction = frictionWords.filter(w => lower.includes(w));
  if (foundFriction.length > 0) {
    findings.push({
      label: "Feature language without buyer outcome",
      detail: `"${foundFriction.join(", ")}" describes product attributes, not customer results. Replace with specific benefit statements.`,
      severity: "LOW",
      dimension: "clarity",
    });
  }

  if (!lower.includes("for") && !lower.includes("to") && !lower.includes("that")) {
    findings.push({
      label: "Value recipient unclear",
      detail: "Strong market signals state who benefits and how. This statement does not clearly name the value recipient.",
      severity: "MEDIUM",
      dimension: "clarity",
    });
  }

  return findings;
}

// ─── Evidence analysis ────────────────────────────────────────────────────────

function evidenceFindings(lower: string, originalText: string): Finding[] {
  const findings: Finding[] = [];

  // Buyer validation signals (positive)
  const hasBuyerValidation =
    /\b(customer|client|user|pilot|beta|case study|testimonial|reference|proven with|used by|trusted by|deployed at|adopted by)\b/.test(lower);

  // Quantified claims (positive)
  const hasQuantifiedClaim =
    /\d+%|\d+ (customer|client|user|company|team|organisation|organization)|\d+x (faster|cheaper|better|more)|\$[\d,]+|£[\d,]+|€[\d,]+/.test(lower);

  // Research/data citations (positive)
  const hasResearchCitation =
    /\b(study|research|data|survey|report|analysis|benchmark|measured|according to|source|citation)\b/.test(lower);

  // Competitor differentiation (positive if supported, risky if not)
  const hasCompetitorClaim =
    /\b(unlike|compared to|vs |versus|better than|outperform|alternative to|replace|instead of)\b/.test(lower);

  // Claims that need legal defensibility
  const hasLegalRiskClaim =
    /\b(guaranteed|proven|certified|accredited|guaranteed result|no risk|zero risk|100%)\b/.test(lower);

  if (!hasBuyerValidation) {
    findings.push({
      label: "No buyer validation detected",
      detail:
        "No reference to customers, pilots, case studies, or real deployments was found. Informed buyers will ask for proof. Claims without buyer evidence carry high friction.",
      severity: "HIGH",
      dimension: "evidence",
    });
  }

  if (!hasQuantifiedClaim) {
    findings.push({
      label: "No quantified outcomes",
      detail:
        "No numbers, percentages, or measurable results were found. Quantified outcomes are the single highest-impact credibility signal in B2B market claims.",
      severity: "HIGH",
      dimension: "evidence",
    });
  }

  if (!hasResearchCitation && !hasBuyerValidation) {
    findings.push({
      label: "No external data or cited evidence",
      detail:
        "No research, data, or third-party sources were referenced. Even one specific reference materially strengthens credibility.",
      severity: "MEDIUM",
      dimension: "evidence",
    });
  }

  if (hasCompetitorClaim && !hasQuantifiedClaim) {
    findings.push({
      label: "Competitive claim without supporting data",
      detail:
        "Comparative claims (better than, unlike, outperforms) require specific evidence. Unsubstantiated comparative claims are a credibility liability.",
      severity: "MEDIUM",
      dimension: "evidence",
    });
  }

  if (hasLegalRiskClaim) {
    findings.push({
      label: "Legally sensitive claim detected",
      detail:
        "Terms like \"guaranteed\", \"proven\", or \"certified\" create legal obligations or require formal evidence. Verify delivery capability and legal defensibility before use.",
      severity: "HIGH",
      dimension: "evidence",
    });
  }

  if (hasBuyerValidation && hasQuantifiedClaim) {
    // Strong evidence — add an informational finding
    findings.push({
      label: "Buyer validation and quantification detected",
      detail:
        "Buyer references and quantified claims were found. Ensure each is accurate, current, and can be cited under challenge.",
      severity: "LOW",
      dimension: "evidence",
    });
  }

  return findings;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreClarity(findings: Finding[]): number {
  const highCount = findings.filter(f => f.dimension === "clarity" && f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.dimension === "clarity" && f.severity === "MEDIUM").length;
  return Math.max(0, 100 - highCount * 20 - medCount * 10);
}

function scoreEvidence(findings: Finding[]): number {
  const highCount = findings.filter(f => f.dimension === "evidence" && f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.dimension === "evidence" && f.severity === "MEDIUM").length;
  return Math.max(0, 100 - highCount * 25 - medCount * 10);
}

// ─── Main analyser ────────────────────────────────────────────────────────────

function analyzeMarketSignal(text: string): TestResult {
  const lower = text.toLowerCase();

  const allFindings = [
    ...clarityFindings(lower),
    ...evidenceFindings(lower, text),
  ].slice(0, 5);

  const clarityScore = scoreClarity(allFindings);
  const evidenceScore = scoreEvidence(allFindings);
  const overallScore = Math.round((clarityScore + evidenceScore) / 2);

  const highEvidenceDeficit = allFindings.filter(f => f.dimension === "evidence" && f.severity === "HIGH").length >= 2;
  const hasClarity = clarityScore >= 60;

  let label: string, summary: string, consequence: string, nextAction: string;

  if (overallScore >= 70 && clarityScore >= 70 && evidenceScore >= 70) {
    label = "STRONG SIGNAL";
    summary = "This market signal is clear and supported. Claims are specific and reference buyer proof.";
    consequence = "Low buyer friction. The statement can be used with confidence, assuming all referenced data is current and accurate.";
    nextAction = "Proceed. Monitor actual buyer response. Refresh evidence annually.";
  } else if (hasClarity && highEvidenceDeficit) {
    label = "CLEAR BUT UNPROVEN";
    summary = "The language is clear but the claim lacks buyer validation or quantified evidence.";
    consequence = "Informed buyers will ask for proof. Copy that passes a clarity check but fails an evidence check creates qualified pipeline friction at the verification stage.";
    nextAction = "Add buyer proof before market use: at minimum one quantified customer outcome, a pilot reference, or a cited study.";
  } else if (overallScore >= 50) {
    label = "NEEDS SHARPENING";
    summary = "The signal has some strength but contains claims or evidence gaps that will create buyer friction.";
    consequence = "Buyers may hesitate, challenge claims, or perceive hype. Each unresolved finding reduces conversion probability.";
    nextAction = "Address HIGH findings in both dimensions. Do not use in market-facing materials until resolved.";
  } else {
    label = "WEAK SIGNAL";
    summary = "This market signal is unlikely to be credible to informed buyers. Multiple clarity and evidence issues detected.";
    consequence = "Buyers will challenge or dismiss the statement. Using it without remediation risks credibility damage that outlasts the specific claim.";
    nextAction = "Rewrite from evidence upward: start with a specific quantified customer outcome, then build the claim around it.";
  }

  const hasBuyer = /\b(customer|client|user|pilot|case study)\b/.test(lower);
  const hasNumbers = /\d+%|\d+x|\$[\d,]+|£[\d,]+/.test(lower);
  const evidenceNote = hasBuyer && hasNumbers
    ? "Buyer references and quantified claims were detected. Verify each is accurate, current, and can be cited under challenge."
    : hasBuyer
    ? "Buyer references detected but no quantified outcomes. Adding at least one specific measurable result significantly increases credibility."
    : hasNumbers
    ? "Quantified claims detected but no buyer validation. Numbers without customer context read as internal metrics, not market proof."
    : "No buyer validation or quantified outcomes detected. These are the two highest-impact credibility signals for any market claim.";

  return {
    clarityScore,
    evidenceScore,
    overallScore,
    label,
    summary,
    findings: allFindings,
    evidenceNote,
    consequence,
    nextAction,
    demoRef: generateDemoRef(),
    timestamp: new Date().toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
  };
}

export default function MarketSignalTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);

  const SAMPLE =
    "Our revolutionary, industry-leading platform leverages AI to transform enterprise operations. We're the world-class solution for complex business challenges, delivering best-in-class outcomes through our powerful, end-to-end synergy engine.";

  function handleSubmit() {
    if (!text.trim()) return;
    track("foundry_test_run", { test: "market-signal", charCount: text.length });
    setResult(analyzeMarketSignal(text));
  }

  function handleSample() {
    setText(SAMPLE);
    track("foundry_test_sample", { test: "market-signal" });
  }

  return (
    <Layout
      title="Check a Market Signal | Foundry | Abraham of London"
      description="Assess a market claim across two dimensions: copy clarity and market evidence. A polished claim without buyer proof does not score as strong."
      canonicalUrl="/foundry/market-signal-test"
    >
      <Head><title>Check a Market Signal | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">

          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Market Signal Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Check a Market Signal
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Submit a claim, offer, or positioning statement. The Foundry assesses two independent
            dimensions: copy clarity and market evidence. A polished claim without buyer proof
            does not score as strong.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Results are illustrative
          </p>

          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Paste a market claim, positioning statement, or offer description..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
                disabled={!text.trim()}
                data-analytics="foundry-market-submit"
                className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors disabled:opacity-30"
                style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
              >
                Assess Signal
              </button>
              <button
                onClick={handleSample}
                data-analytics="foundry-market-sample"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
              >
                Use Sample
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-12 space-y-6">

              {/* Dual score header */}
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    Signal Assessment
                  </p>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    result.label === "STRONG SIGNAL" ? "bg-emerald-500/10 text-emerald-400" :
                    result.label === "WEAK SIGNAL" ? "bg-red-500/10 text-red-400" :
                    result.label === "CLEAR BUT UNPROVEN" ? "bg-amber-500/10 text-amber-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{result.label}</span>
                </div>

                {/* Split scores */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="border border-white/8 p-4 text-center">
                    <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30 mb-1">Clarity</p>
                    <p className="font-serif text-3xl font-light text-white/80">
                      {result.clarityScore}<span className="text-lg text-white/30">/100</span>
                    </p>
                  </div>
                  <div className="border border-white/8 p-4 text-center">
                    <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30 mb-1">Evidence</p>
                    <p className="font-serif text-3xl font-light text-white/80">
                      {result.evidenceScore}<span className="text-lg text-white/30">/100</span>
                    </p>
                  </div>
                  <div className="border p-4 text-center" style={{ borderColor: `${GOLD}25` }}>
                    <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/30 mb-1">Overall</p>
                    <p className="font-serif text-3xl font-light" style={{ color: GOLD }}>
                      {result.overallScore}<span className="text-lg text-white/30">/100</span>
                    </p>
                  </div>
                </div>

                <p className="text-sm text-white/70">{result.summary}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    Demo ref: {result.demoRef}
                  </span>
                  <span className="text-white/10">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/25">
                    {result.timestamp}
                  </span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {/* Findings grouped by dimension */}
              {result.findings.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Findings</p>
                    <div className="flex gap-2">
                      <span className="rounded px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] border border-white/10 text-white/35">Clarity</span>
                      <span className="rounded px-2 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] border border-purple-500/20 text-purple-400/60">Evidence</span>
                    </div>
                  </div>
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border p-4 ${
                      f.severity === "HIGH" ? "border-red-500/20 bg-red-500/5" :
                      f.severity === "MEDIUM" ? "border-amber-500/15 bg-amber-500/5" :
                      "border-white/8 bg-white/2"
                    }`}>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase ${
                          f.severity === "HIGH" ? "bg-red-500/10 text-red-400" :
                          f.severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/40"
                        }`}>{f.severity}</span>
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[7px] uppercase tracking-[0.15em] ${
                          f.dimension === "evidence"
                            ? "border border-purple-500/20 text-purple-400/60"
                            : "border border-white/10 text-white/30"
                        }`}>{f.dimension}</span>
                        <span className="text-sm font-medium text-white/70">{f.label}</span>
                      </div>
                      <p className="text-xs text-white/55">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence note */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Market Evidence Note</p>
                <p className="text-sm text-white/65">{result.evidenceNote}</p>
              </div>

              {/* Consequence + next action */}
              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Consequence</p>
                <p className="text-sm text-white/70">{result.consequence}</p>
                <div className="mt-4 h-px bg-white/5" />
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Recommended Next Action</p>
                <p className="text-sm" style={{ color: `${GOLD}CC` }}>{result.nextAction}</p>
              </div>

              {/* Disclaimer */}
              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  Public preview · Pattern-based analysis only · Not a full governed assessment · No data retained
                </p>
              </div>

              <InterestForm sourceTest="market-signal" />

              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">What a full review adds</p>
                <p className="text-xs text-white/50 mb-4 max-w-md mx-auto">
                  A full review validates each claim against cited evidence, records the review authority,
                  and issues a verifiable record your team can reference under challenge.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link href="/foundry/start" onClick={() => track("foundry_conversion_click", { target: "full-review", source: "market-signal-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}>
                    Start a full review →
                  </Link>
                  <Link href="/continuity" onClick={() => track("foundry_conversion_click", { target: "continuity", source: "market-signal-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors">
                    Understand continuity →
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link href="/foundry" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">← Back to Foundry</Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/decision-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">Try Decision Test →</Link>
                <span className="text-white/10">·</span>
                <Link href="/foundry/release-risk-test" className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors">Try Release Risk Test →</Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
