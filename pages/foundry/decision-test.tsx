/* pages/foundry/decision-test.tsx — PUBLIC DECISION TEST
 *
 * Controlled public test: submit a decision under consideration.
 * Returns a risk score, evidence gaps, and authority assessment.
 * No persistence. No admin data. Client-side analysis only.
 * Output is clearly labelled as a public test.
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

function analyzeDecision(text: string): TestResult {
  const findings: Finding[] = [];
  const lower = text.toLowerCase();

  // Authority gaps
  if (!lower.includes("approved") && !lower.includes("sign") && !lower.includes("authority") && !lower.includes("decide")) {
    findings.push({ label: "No named decision-maker", detail: "No approval authority or decision-maker is identified. Without a named authority, this decision cannot proceed through governance.", severity: "HIGH" });
  }
  if (lower.includes("pending") || lower.includes("waiting") || lower.includes("not sure")) {
    findings.push({ label: "Decision stall detected", detail: "Language suggests the decision is stalled. Identify the blocking dependency and name the owner.", severity: "HIGH" });
  }

  // Evidence gaps
  if (!lower.includes("data") && !lower.includes("evidence") && !lower.includes("research") && !lower.includes("analysis")) {
    findings.push({ label: "No evidence referenced", detail: "The decision description does not reference any data, evidence, or analysis. Decisions without evidence references carry elevated reversal risk.", severity: "MEDIUM" });
  }
  if (lower.includes("assume") || lower.includes("believe") || lower.includes("think") || lower.includes("maybe")) {
    findings.push({ label: "Assumption-based reasoning", detail: "The decision relies on assumptions rather than verified evidence. Each assumption should be stated explicitly and tested.", severity: "MEDIUM" });
  }

  // Timing risk
  if (lower.includes("urgent") || lower.includes("immediately") || lower.includes("asap") || lower.includes("rush")) {
    findings.push({ label: "Urgency signal detected", detail: "Urgency language may indicate a decision being forced without proper governance. Verify that the timeline is real, not manufactured.", severity: "LOW" });
  }
  if (lower.includes("quarter") || lower.includes("deadline") || lower.includes("end of") || lower.includes("by ")) {
    findings.push({ label: "Time-bound decision", detail: "A deadline is referenced. Ensure the timeline allows for proper evidence gathering and authority review.", severity: "LOW" });
  }

  // Calculate score
  const highCount = findings.filter(f => f.severity === "HIGH").length;
  const medCount = findings.filter(f => f.severity === "MEDIUM").length;
  const score = Math.max(0, 100 - (highCount * 25 + medCount * 10));

  let label: string, summary: string, consequence: string, nextAction: string;
  if (score >= 80) {
    label = "LOW RISK";
    summary = "This decision appears structurally sound. Key governance elements are present.";
    consequence = "Proceed with standard governance. Ensure the decision is documented and the authority is recorded.";
    nextAction = "Document the decision and proceed through your standard approval process.";
  } else if (score >= 50) {
    label = "MODERATE RISK";
    summary = "This decision has gaps that should be addressed before proceeding.";
    consequence = "Unaddressed gaps may lead to reversal, rework, or governance failure.";
    nextAction = "Address the HIGH-priority findings before seeking formal approval.";
  } else {
    label = "HIGH RISK";
    summary = "This decision is not ready for governance. Critical elements are missing.";
    consequence = "Proceeding without addressing these gaps carries significant risk of failure, reversal, or governance escalation.";
    nextAction = "Do not proceed. Resolve all HIGH findings before re-submitting.";
  }

  return { score, label, summary, findings, consequence, nextAction };
}

function track(event: string, data?: Record<string, unknown>) {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event, data);
    }
  } catch {
    // Analytics unavailable — non-blocking
  }
}

export default function DecisionTestPage() {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState<TestResult | null>(null);
  const [showSample, setShowSample] = React.useState(false);

  const SAMPLE = "We need to launch the new service by end of quarter. The team believes we're ready but we're still waiting on legal review. No one has formally approved the budget yet.";

  function handleSubmit() {
    if (!text.trim()) return;
    track("foundry_test_run", { test: "decision", charCount: text.length });
    setResult(analyzeDecision(text));
  }

  function handleSample() {
    setText(SAMPLE);
    setShowSample(true);
    track("foundry_test_sample", { test: "decision" });
  }

  return (
    <Layout
      title="Test a Decision | Foundry | Abraham of London"
      description="Submit a decision under consideration. Receive a risk score, evidence gaps, and authority assessment."
      canonicalUrl="/foundry/decision-test"
    >
      <Head><title>Test a Decision | Foundry | Abraham of London</title></Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
          {/* Breadcrumb */}
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span className="text-[#C9A96E]/70">Decision Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Test a Decision
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
            Describe a decision your organisation is facing. The Foundry will assess its structural
            risk, identify evidence gaps, and flag authority issues.
          </p>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.25em] text-amber-500/60">
            Public test · No data persisted · Results are illustrative
          </p>

          {/* Input */}
          <div className="mt-10 space-y-4">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder="Describe the decision, who is involved, what evidence exists, and what the timeline is..."
              className="w-full border bg-black/30 px-4 py-3 text-sm text-white/70 placeholder:text-white/20 focus:outline-none"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            />
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSubmit}
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

          {/* Result */}
          {result && (
            <div className="mt-12 space-y-6">
              <div className="border p-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">Decision Risk Score</p>
                    <p className="mt-2 font-serif text-5xl font-light text-white/90">{result.score}<span className="text-2xl text-white/30">/100</span></p>
                  </div>
                  <span className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    result.label === "LOW RISK" ? "bg-emerald-500/10 text-emerald-400" :
                    result.label === "HIGH RISK" ? "bg-red-500/10 text-red-400" :
                    "bg-amber-500/10 text-amber-400"
                  }`}>{result.label}</span>
                </div>
                <p className="mt-4 text-sm text-white/70">{result.summary}</p>

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

              <div className="border border-white/8 bg-white/2 p-5">
                <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30 mb-2">Consequence</p>
                <p className="text-sm text-white/70">{result.consequence}</p>
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
                    onClick={() => track("foundry_conversion_click", { target: "full-review", source: "decision-test" })}
                    className="border px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] transition-colors"
                    style={{ borderColor: `${GOLD}50`, color: GOLD, backgroundColor: `${GOLD}12` }}
                  >
                    Run a full review →
                  </Link>
                  <Link
                    href="/foundry/value"
                    data-analytics="foundry-conversion-value"
                    onClick={() => track("foundry_conversion_click", { target: "value-case", source: "decision-test" })}
                    className="border border-white/10 px-5 py-2.5 font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 hover:text-white/70 transition-colors"
                  >
                    See what a full review includes
                  </Link>
                </div>
              </div>

              {/* ── Navigation links ──────────────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
                <Link
                  href="/foundry"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors"
                >
                  ← Back to Foundry
                </Link>
                <span className="text-white/10">·</span>
                <Link
                  href="/foundry/market-signal-test"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors"
                >
                  Try Market Signal Test →
                </Link>
                <span className="text-white/10">·</span>
                <Link
                  href="/foundry/release-risk-test"
                  className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25 hover:text-white/65 transition-colors"
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
