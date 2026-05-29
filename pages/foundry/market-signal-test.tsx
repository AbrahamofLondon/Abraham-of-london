/* pages/foundry/market-signal-test.tsx — PUBLIC MARKET SIGNAL TEST
 *
 * Controlled public test: submit a claim, offer, or positioning statement.
 * Returns overclaim, clarity, and buyer friction assessment.
 * No persistence. No admin data. Client-side analysis only.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";

const GOLD = "#C9A96E";

type Finding = {
  label: string;
  detail: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
};

type TestResult = {
  score: number;
  label: string;
  summary: string;
  findings: Finding[];
  consequence: string;
  nextAction: string;
};

function analyzeMarketSignal(text: string): TestResult {
  const findings: Finding[] = [];
  const lower = text.toLowerCase();

  // Overclaim detection
  const overclaimPatterns = [
    { word: "revolutionary", issue: "Revolutionary claim", detail: "\"Revolutionary\" is a high-risk claim that requires extraordinary evidence. Without it, the statement signals hype over substance." },
    { word: "game-changer", issue: "Game-changer claim", detail: "\"Game-changer\" is a subjective superlative that undermines credibility. Replace with specific, measurable impact." },
    { word: "best-in-class", issue: "Best-in-class claim", detail: "\"Best-in-class\" requires comparative evidence. Without a named benchmark, this is an unsupported superlative." },
    { word: "industry-leading", issue: "Industry-leading claim", detail: "\"Industry-leading\" is a comparative claim that requires evidence of the comparison set and the metric." },
    { word: "unique", issue: "Uniqueness claim", detail: "\"Unique\" is an absolute claim. Unless the statement describes a legally protectable differentiation, this is overclaim." },
    { word: "guaranteed", issue: "Guarantee claim", detail: "\"Guaranteed\" creates a contractual expectation. Verify that the organisation can legally and operationally deliver on this." },
    { word: "transform", issue: "Transformation claim", detail: "\"Transform\" implies fundamental change. This requires evidence of before/after states and a defined mechanism." },
    { word: "disrupt", issue: "Disruption claim", detail: "\"Disrupt\" is a loaded term that signals hype in most B2B contexts. Replace with specific market impact." },
  ];

  for (const pattern of overclaimPatterns) {
    if (lower.includes(pattern.word)) {
      findings.push({ label: pattern.issue, detail: pattern.detail, severity: "HIGH" });
    }
  }

  // Clarity assessment
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount > 100) {
    findings.push({ label: "Excessive length", detail: `At ${wordCount} words, this is too long for a clear market signal. Core claims should be expressible in 2-3 sentences.`, severity: "MEDIUM" });
  }

  if (!lower.includes("for") && !lower.includes("to") && !lower.includes("that")) {
    findings.push({ label: "Missing value proposition structure", detail: "Strong market signals follow a 'what → for whom → why' structure. This statement does not clearly articulate the value recipient.", severity: "MEDIUM" });
  }

  // Buyer friction
  const frictionWords = ["complex", "sophisticated", "enterprise-grade", "powerful", "robust", "scalable"];
  const foundFriction = frictionWords.filter(w => lower.includes(w));
  if (foundFriction.length > 0) {
    findings.push({ label: "Abstract feature language", detail: `Terms like "${foundFriction.join(", ")}" describe features, not outcomes. Replace with specific customer benefit statements.`, severity: "LOW" });
  }

  // Jargon density
  const jargonWords = ["synergy", "leverage", "optimize", "streamline", "holistic", "end-to-end", "best-of-breed", "world-class"];
  const foundJargon = jargonWords.filter(w => lower.includes(w));
  if (foundJargon.length > 0) {
    findings.push({ label: "Jargon detected", detail: `Terms like "${foundJargon.join(", ")}" reduce clarity. Each jargon word costs you a reader. Replace with plain language.`, severity: "LOW" });
  }

  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.severity === "MEDIUM").length;
  const score = Math.max(0, 100 - (highCount * 20 + medCount * 10));

  let label: string, summary: string, consequence: string, nextAction: string;
  if (score >= 80) {
    label = "CLEAR SIGNAL";
    summary = "This market signal is clear and credible. Claims are specific and supported.";
    consequence = "Low buyer friction. The statement can be used in market-facing communications with confidence.";
    nextAction = "Proceed with market testing. Monitor for actual buyer response.";
  } else if (score >= 50) {
    label = "NEEDS SHARPENING";
    summary = "The signal has some strength but contains claims or language that may create buyer friction.";
    consequence = "Buyers may hesitate, challenge claims, or perceive hype. Each finding reduces conversion probability.";
    nextAction = "Address HIGH findings before using this in market-facing materials.";
  } else {
    label = "WEAK SIGNAL";
    summary = "This market signal is unlikely to be credible to informed buyers. Multiple overclaims and clarity issues.";
    consequence = "Buyers will likely challenge or dismiss the statement. Credibility damage may outlast the specific claim.";
    nextAction = "Rewrite. Remove all unsupported superlatives. Lead with specific, verifiable outcomes.";
  }

  return { score, label, summary, findings, consequence, nextAction };
}

function track(event: string, data?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event, data);
    }
  } catch {}
}

export default function MarketSignalTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);

  const SAMPLE = "Our revolutionary, industry-leading platform leverages AI to transform enterprise operations. We're the world-class solution for complex business challenges, delivering best-in-class outcomes through our powerful, end-to-end synergy engine.";

  function handleSubmit() {
    if (!text.trim()) return;
    track("foundry_test_run", { test: "market-signal", charCount: text.length });
    setResult(analyzeMarketSignal(text));
  }

  return (
    <Layout
      title="Check a Market Signal | Foundry | Abraham of London"
      description="Submit a claim, offer, or positioning statement. Receive an overclaim, clarity, and buyer friction assessment."
      canonicalUrl="/foundry/market-signal-test"
    >
      <Head><title>Check a Market Signal | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)", paddingBottom: "8rem" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span className="text-[#C9A96E]/70">Market Signal Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Check a Market Signal
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">
            Submit a claim, offer, or positioning statement. The Foundry will assess overclaim risk,
            clarity, and buyer friction.
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
                onClick={() => { setText(SAMPLE); track("foundry_test_sample", { test: "market-signal" }); }}
                data-analytics="foundry-market-sample"
                className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 hover:text-white/60 transition-colors"
              >
                Use Sample
              </button>
            </div>
          </div>

          {result && (
            <div className="mt-12 space-y-6">
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Signal Clarity Score</p>
                    <p className="mt-2 font-serif text-5xl font-light text-white/90">{result.score}<span className="text-2xl text-white/30">/100</span></p>
                  </div>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    result.label === "CLEAR SIGNAL" ? "bg-emerald-500/10 text-emerald-400" :
                    result.label === "WEAK SIGNAL" ? "bg-red-500/10 text-red-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{result.label}</span>
                </div>
                <p className="mt-4 text-sm text-white/60">{result.summary}</p>

                <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-white/5">
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/15">
                    Demo ref: {Date.now().toString(36).slice(-6).toUpperCase()}
                  </span>
                  <span className="text-white/5">·</span>
                  <span className="font-mono text-[7px] uppercase tracking-[0.25em] text-white/15">
                    {new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="rounded border border-amber-500/10 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[6px] uppercase tracking-[0.2em] text-amber-400/40">
                    Demo — not verifiable
                  </span>
                </div>
              </div>

              {result.findings.length > 0 && (
                <div className="space-y-2">
                  <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Findings</p>
                  {result.findings.map((f, i) => (
                    <div key={i} className={`border p-4 ${
                      f.severity === "HIGH" ? "border-red-500/20 bg-red-500/5" :
                      f.severity === "MEDIUM" ? "border-amber-500/15 bg-amber-500/4" :
                      "border-white/8 bg-white/2"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase ${
                          f.severity === "HIGH" ? "bg-red-500/10 text-red-400" :
                          f.severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400" :
                          "bg-white/5 text-white/40"
                        }`}>{f.severity}</span>
                        <span className="text-sm font-medium text-white/70">{f.label}</span>
                      </div>
                      <p className="text-xs text-white/45">{f.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Consequence</p>
                <p className="text-sm text-white/60">{result.consequence}</p>
                <div className="mt-4 h-px bg-white/5" />
                <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Recommended Next Action</p>
                <p className="text-sm text-[#C9A96E]/80">{result.nextAction}</p>
              </div>

              <div className="border border-white/5 bg-white/1 p-4">
                <p className="font-mono text-[7px] uppercase tracking-[0.3em] text-white/20 text-center">
                  This is a public preview. It identifies visible patterns and risks, but it is not a full governed assessment.
                </p>
              </div>

              {/* ── Conversion path ───────────────────────────────────────── */}
              <div className="border border-white/8 bg-white/2 p-5 text-center">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/30 mb-3">
                  Need a verifiable record?
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/foundry/start"
                    data-analytics="foundry-conversion-full-review"
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "market-signal-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Run a full review →
                  </Link>
                  <Link
                    href="/foundry/value"
                    data-analytics="foundry-conversion-value"
                    onClick={() => track("foundry_conversion_click", { target: "value-case", source: "market-signal-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/40 hover:text-white/60 transition-colors"
                  >
                    See what a full review includes
                  </Link>
                </div>
              </div>

              {/* ── Navigation links ──────────────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link
                  href="/foundry"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/50 transition-colors"
                >
                  ← Back to Foundry
                </Link>
                <span className="text-white/10">·</span>
                <Link
                  href="/foundry/decision-test"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/50 transition-colors"
                >
                  Try Decision Test →
                </Link>
                <span className="text-white/10">·</span>
                <Link
                  href="/foundry/release-risk-test"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/50 transition-colors"
                >
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
