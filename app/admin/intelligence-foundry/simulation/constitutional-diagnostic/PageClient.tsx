"use client";
// app/admin/intelligence-foundry/simulation/constitutional-diagnostic/page.tsx
// Constitutional Diagnostic Simulator — real production scoring via
// deriveConstitutionalDiagnosticBundle(). 10 domain questions, 0–10 resonance/certainty
// sliders per question. Returns constitutional route, authority score, coherence score,
// failure mode count, and domain-level findings.
// PRODUCTION_CALLABLE — no AI, no external calls.

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type RunSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type Finding = {
  id: string;
  title: string;
  description: string;
  severity: RunSeverity;
  source: string;
  evidence?: string;
  remediation?: string;
};

type FormulaStep = {
  stepId: string;
  label: string;
  inputs: Record<string, number | string>;
  output: number | string;
  sourceRule: string;
  engineVersion: string;
};

type RawOutput = {
  engineId?: string;
  formulaSteps?: FormulaStep[];
  constitutionalRoute?: string;
  confidence?: number;
  authorityScore?: number;
  coherenceScore?: number;
  failureModeCount?: number;
  [key: string]: unknown;
};

type EngineResult = {
  findings: Finding[];
  summary: string;
  severity: RunSeverity;
  engineVersion: string;
  durationMs: number;
  limitations?: string[];
  rawOutput?: RawOutput;
};

// ─── Questions (mirrors DEFAULT_DIAGNOSTIC_QUESTIONS) ─────────────────────────

const QUESTIONS = [
  { id: "q1",  text: "The stated strategy and actual resource allocation are meaningfully aligned.",                                           domain: "coherence",   reverse: false },
  { id: "q2",  text: "Decision authority is clear and exercised without chronic diffusion or bottleneck.",                                     domain: "authority",   reverse: false },
  { id: "q3",  text: "The operating environment has changed faster than the organisation's ability to adapt.",                                 domain: "environment", reverse: true  },
  { id: "q4",  text: "There is a pattern of strategic drift — direction stated but not executed with discipline.",                             domain: "execution",   reverse: true  },
  { id: "q5",  text: "When someone raises a serious objection here, the objection is tested against the decision — not against the person.",   domain: "trust",       reverse: false },
  { id: "q6",  text: "The organisation carries visible friction: coordination failures, duplicated work, or unresolved conflict.",              domain: "friction",    reverse: true  },
  { id: "q7",  text: "There is a clear decision-maker who can authorise strategic intervention.",                                              domain: "authority",   reverse: false },
  { id: "q8",  text: "The cost of getting this wrong would be material — financial, reputational, or structural.",                             domain: "stakes",      reverse: false },
  { id: "q9",  text: "The same problems keep resurfacing despite repeated attempts to fix them.",                                              domain: "pattern",     reverse: true  },
  { id: "q10", text: "External market or stakeholder pressure is actively forcing attention to this issue.",                                   domain: "pressure",    reverse: false },
] as const;

type QuestionId = typeof QUESTIONS[number]["id"];
type AnswerMap = Record<QuestionId, { resonance: number; certainty: number }>;

function defaultAnswers(): AnswerMap {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, { resonance: 5, certainty: 5 }])) as AnswerMap;
}

// ─── Components ───────────────────────────────────────────────────────────────

function SeverityChip({ severity }: { severity: RunSeverity | string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-400 border border-red-500/20",
    HIGH:     "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    MEDIUM:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    LOW:      "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    INFO:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${styles[severity] ?? "bg-white/5 text-white/40"}`}>
      {severity}
    </span>
  );
}

function RouteChip({ route }: { route?: string }) {
  if (!route) return null;
  const styles: Record<string, string> = {
    REJECT:      "bg-red-500/10 text-red-400 border border-red-500/20",
    DIAGNOSTIC:  "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    STRATEGY:    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    INFORMATION: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-mono font-semibold ${styles[route] ?? "bg-white/5 text-white/30 border border-white/8"}`}>
      {route}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConstitutionalDiagnosticSimPage() {
  const [mode,       setMode]       = useState<"guided" | "defaults">("guided");
  const [answers,    setAnswers]    = useState<AnswerMap>(defaultAnswers);
  const [loading,    setLoading]    = useState(false);
  const [result,     setResult]     = useState<EngineResult | null>(null);
  const [error,      setError]      = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  function setAnswer(id: QuestionId, field: "resonance" | "certainty", value: number) {
    setAnswers((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function runDiagnostic() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedRunId(null);
    setSaveError(null);
    try {
      const payload = mode === "defaults" ? { useDefaults: true } : { answers };
      const res = await fetch("/api/admin/intelligence-foundry/engines/constitutional-diagnostic/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Diagnostic failed");
      setResult(data.result as EngineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function saveRun() {
    if (!result) return;
    setSaving(true);
    setSaveError(null);
    try {
      const ts = Date.now();
      const res = await fetch("/api/admin/intelligence-foundry/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Constitutional Diagnostic · ${new Date(ts).toISOString().slice(0, 16).replace("T", " ")}`,
          slug: `constitutional-diagnostic-${ts}`,
          runType: "SCENARIO",
          module: "constitutional-diagnostic-sim",
          severity: result.severity,
          durationMs: result.durationMs,
          recommendation: result.summary,
          findingsJson: JSON.stringify(result.findings),
          outputJson: JSON.stringify(result.rawOutput ?? {}),
          status: "PENDING",
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Save failed");
      setSavedRunId((data.run as { id: string }).id);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const rawOutput = result?.rawOutput;
  const formulaSteps = rawOutput?.formulaSteps ?? [];
  const violationFindings = result?.findings.filter((f) => f.severity !== "INFO") ?? [];

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <Link
          href="/admin/intelligence-foundry"
          className="text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white/40 transition-colors"
        >
          ← Intelligence Foundry
        </Link>
        <div className="flex items-center gap-3 mt-3 mb-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">
            Constitutional Diagnostic · PRODUCTION_CALLABLE
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white/80">Constitutional Diagnostic Simulator</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Real production scoring via{" "}
          <span className="font-mono text-white/30 text-xs">deriveConstitutionalDiagnosticBundle()</span>.
          Domain scoring across coherence, authority, environment, execution, trust, friction,
          stakes, pattern, and pressure. Returns constitutional route and domain scores.
        </p>
      </div>

      {/* Mode selector */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Input Mode</p>
        <div className="flex gap-2">
          {(["guided", "defaults"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase transition-all ${
                mode === m
                  ? "bg-amber-400/10 text-amber-400 border border-amber-400/25"
                  : "bg-white/3 text-white/35 border border-white/8 hover:text-white/55"
              }`}
            >
              {m === "guided" ? "Guided (10 questions)" : "Default answers (5/5)"}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-white/30">
          {mode === "defaults"
            ? "Balanced mid-range resonance=5, certainty=5 for all questions. Useful for engine smoke-testing."
            : "Rate each statement with resonance (how true) and certainty (how confident you are)."}
        </p>
      </div>

      {/* Guided questions */}
      {mode === "guided" && (
        <div className="space-y-3">
          {QUESTIONS.map((q) => (
            <div key={q.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-[9px] font-mono text-white/20 shrink-0 mt-0.5 uppercase">{q.id}</span>
                <div className="flex-1">
                  <p className="text-xs text-white/60 leading-relaxed">{q.text}</p>
                  <p className="text-[9px] font-mono text-white/20 mt-0.5">
                    domain: {q.domain}{q.reverse ? " · reverse-scored" : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[9px] font-mono uppercase text-white/20">Resonance</label>
                    <span className="text-[9px] font-mono text-white/45">{answers[q.id].resonance}</span>
                  </div>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={answers[q.id].resonance}
                    onChange={(e) => setAnswer(q.id, "resonance", Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-white/15 mt-0.5">
                    <span>0 — Not at all</span><span>10 — Completely</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[9px] font-mono uppercase text-white/20">Certainty</label>
                    <span className="text-[9px] font-mono text-white/45">{answers[q.id].certainty}</span>
                  </div>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={answers[q.id].certainty}
                    onChange={(e) => setAnswer(q.id, "certainty", Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-white/15 mt-0.5">
                    <span>0 — Guessing</span><span>10 — Certain</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Run button */}
      <button
        onClick={runDiagnostic}
        disabled={loading}
        className="rounded-lg px-4 py-2 text-sm font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Running diagnostic…" : "Run Constitutional Diagnostic"}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary card */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {rawOutput?.constitutionalRoute && (
                <RouteChip route={rawOutput.constitutionalRoute as string} />
              )}
              <SeverityChip severity={result.severity} />
              <p className="text-[10px] font-mono text-white/25 ml-auto">v{result.engineVersion} · {result.durationMs}ms</p>
            </div>
            <p className="text-xs text-white/50 mb-3">{result.summary}</p>
            <div className="grid grid-cols-3 gap-3">
              {typeof rawOutput?.authorityScore === "number" && (
                <div className="rounded-lg border border-white/6 bg-white/[0.015] p-2.5 text-center">
                  <p className="text-[9px] font-mono uppercase text-white/20 mb-0.5">Authority</p>
                  <p className="text-xl font-mono text-white/60">{rawOutput.authorityScore}</p>
                </div>
              )}
              {typeof rawOutput?.coherenceScore === "number" && (
                <div className="rounded-lg border border-white/6 bg-white/[0.015] p-2.5 text-center">
                  <p className="text-[9px] font-mono uppercase text-white/20 mb-0.5">Coherence</p>
                  <p className="text-xl font-mono text-white/60">{rawOutput.coherenceScore}</p>
                </div>
              )}
              {typeof rawOutput?.failureModeCount === "number" && (
                <div className="rounded-lg border border-white/6 bg-white/[0.015] p-2.5 text-center">
                  <p className="text-[9px] font-mono uppercase text-white/20 mb-0.5">Failure Modes</p>
                  <p className={`text-xl font-mono ${(rawOutput.failureModeCount as number) > 0 ? "text-red-400/70" : "text-emerald-400/70"}`}>
                    {rawOutput.failureModeCount as number}
                  </p>
                </div>
              )}
            </div>
            {typeof rawOutput?.confidence === "number" && (
              <p className="text-[10px] font-mono text-white/20 mt-2">
                confidence: {(rawOutput.confidence as number).toFixed(2)}
              </p>
            )}
          </div>

          {/* Save run */}
          <div className="flex items-center gap-3">
            {savedRunId ? (
              <a
                href={`/admin/intelligence-foundry/runs/${savedRunId}`}
                className="text-xs text-emerald-400/70 hover:text-emerald-400 font-mono transition-colors"
              >
                ✓ Run saved — view run →
              </a>
            ) : (
              <button
                onClick={saveRun}
                disabled={saving}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/60 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Saving…" : "Save run to vault"}
              </button>
            )}
            {saveError && <p className="text-xs text-red-400/70 font-mono">{saveError}</p>}
          </div>

          {/* Findings */}
          {violationFindings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Findings</p>
              {violationFindings.map((f) => (
                <div key={f.id} className={`rounded-xl border p-4 ${
                  f.severity === "CRITICAL" ? "border-red-500/20 bg-red-500/[0.04]" :
                  f.severity === "HIGH"     ? "border-orange-500/20 bg-orange-500/[0.03]" :
                  f.severity === "MEDIUM"   ? "border-amber-500/15 bg-amber-500/[0.03]" :
                  "border-yellow-500/15 bg-yellow-500/[0.03]"
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <SeverityChip severity={f.severity} />
                    <p className="text-xs font-medium text-white/65">{f.title}</p>
                  </div>
                  <p className="text-xs text-white/45 mb-2">{f.description}</p>
                  {f.evidence && (
                    <p className="text-[10px] font-mono text-white/30 mb-2 bg-white/[0.03] rounded px-2 py-1">
                      {f.evidence}
                    </p>
                  )}
                  {f.remediation && (
                    <p className="text-[10px] text-white/35 leading-relaxed border-t border-white/5 pt-2 mt-2">
                      {f.remediation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Domain trace */}
          {formulaSteps.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Domain Trace</p>
              <div className="space-y-1">
                {formulaSteps.map((step) => (
                  <div key={step.stepId} className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{step.label}</span>
                    <span className="font-mono text-[10px] text-white/55">{String(step.output)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Limitations */}
          {result.limitations && result.limitations.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Engine Limitations</p>
              <ul className="space-y-1">
                {result.limitations.map((l, i) => (
                  <li key={i} className="flex gap-2 text-xs text-white/30">
                    <span className="text-white/20 shrink-0">·</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
