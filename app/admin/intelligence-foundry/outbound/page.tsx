"use client";
// app/admin/intelligence-foundry/outbound/page.tsx
// Outbound Narrative Range — shared outbound policy gate dry-run evaluation.
// Tests the gate that applies to ALL outbound providers.
// Truthfully a dry-run — does not simulate live publishing states.

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
  allowed?: boolean;
  blockers?: string[];
  warnings?: string[];
  formulaSteps?: FormulaStep[];
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

// ─── Provider options ─────────────────────────────────────────────────────────

const PROVIDER_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "x",        label: "X / Twitter" },
  { value: "facebook", label: "Facebook" },
];

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

function GateDecision({ allowed }: { allowed: boolean }) {
  return (
    <span className={`rounded px-2 py-1 text-xs font-mono font-semibold uppercase ${
      allowed
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        : "bg-red-500/10 text-red-400 border border-red-500/20"
    }`}>
      {allowed ? "GATE: ALLOWED" : "GATE: BLOCKED"}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutboundNarrativeRangePage() {
  const [mode,     setMode]     = useState<"custom" | "safe" | "failing">("custom");
  const [text,     setText]     = useState("");
  const [title,    setTitle]    = useState("");
  const [link,     setLink]     = useState("");
  const [provider, setProvider] = useState("linkedin");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<EngineResult | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  async function runGate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload =
        mode === "safe"    ? { useSafeFixture: true } :
        mode === "failing" ? { useFailingFixture: true } :
        { text, title, link: link || null, provider };

      const res = await fetch("/api/admin/intelligence-foundry/outbound/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Gate evaluation failed");
      setResult(data.result as EngineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const rawOutput = result?.rawOutput;
  const allowed = rawOutput?.allowed;
  const blockers = rawOutput?.blockers ?? [];
  const warnings = rawOutput?.warnings ?? [];
  const violationFindings = result?.findings.filter((f) => f.severity !== "INFO") ?? [];
  const formulaSteps = rawOutput?.formulaSteps ?? [];

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
            Outbound Narrative Range · PRODUCTION_CALLABLE
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white/80">Outbound Narrative Range</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Shared outbound policy gate dry-run. Tests disallowed phrase detection, guarantee
          language, frontmatter leakage, link domain validation, and empty text guard — the
          same gate applied to all providers. No simulation of live publishing states.
        </p>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-white/6 bg-white/[0.015] px-4 py-3">
        <p className="text-[10px] text-white/30 leading-relaxed">
          This is a <span className="text-white/50 font-mono">DRY_RUN</span> gate evaluation.
          Results reflect policy compliance only — not live approval status, scheduling state, or publish eligibility.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Gate Mode</p>

        {/* Mode selector */}
        <div className="flex gap-2 flex-wrap">
          {(["custom", "safe", "failing"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase transition-all ${
                mode === m
                  ? m === "failing" ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : m === "safe" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-400/10 text-amber-400 border border-amber-400/25"
                  : "bg-white/3 text-white/35 border border-white/8 hover:text-white/55"
              }`}
            >
              {m === "custom" ? "Custom Draft" : m === "safe" ? "Safe Fixture" : "Failing Fixture"}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-white/30 leading-relaxed">
          {mode === "safe"    && "Compliant LinkedIn post with an approved link. Expects GATE: ALLOWED."}
          {mode === "failing" && "X post with guarantee language, AI prediction claims, and unapproved link. Expects GATE: BLOCKED."}
          {mode === "custom"  && "Test your own draft copy through the shared outbound policy gate."}
        </div>

        {/* Custom draft input */}
        {mode === "custom" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Title (optional)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Post title…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Link (optional)</label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://…"
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Post body</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="Paste post copy here…"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-y"
              />
            </div>
            <div className="w-40">
              <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-white/20"
              >
                {PROVIDER_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={runGate}
          disabled={loading || (mode === "custom" && !text.trim())}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Evaluating…" : "Run Policy Gate"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Gate decision */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              {typeof allowed === "boolean" && <GateDecision allowed={allowed} />}
              <p className="text-[10px] font-mono text-white/25 ml-auto">v{result.engineVersion}</p>
            </div>
            <p className="text-xs text-white/50 mb-3">{result.summary}</p>

            {/* Blockers + warnings summary */}
            {(blockers.length > 0 || warnings.length > 0) && (
              <div className="space-y-2 mt-3">
                {blockers.length > 0 && (
                  <div className="rounded-lg border border-red-500/15 bg-red-500/[0.04] px-3 py-2">
                    <p className="text-[10px] font-mono uppercase text-red-400/60 mb-1">Blockers ({blockers.length})</p>
                    {blockers.map((b, i) => (
                      <p key={i} className="text-xs text-red-300/70">· {b}</p>
                    ))}
                  </div>
                )}
                {warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2">
                    <p className="text-[10px] font-mono uppercase text-amber-400/60 mb-1">Warnings ({warnings.length})</p>
                    {warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-300/70">· {w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Findings */}
          {violationFindings.length > 0 ? (
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
          ) : (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <p className="text-xs text-emerald-400">No violations — draft passed all shared policy gate checks.</p>
            </div>
          )}

          {/* Check trace */}
          {formulaSteps.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Gate Trace</p>
              <div className="space-y-1">
                {formulaSteps.map((step) => (
                  <div key={step.stepId} className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{step.label}</span>
                    <span className={`font-mono text-[10px] ${
                      String(step.output).startsWith("FAIL")    ? "text-red-400" :
                      String(step.output).startsWith("BLOCKED") ? "text-red-400" :
                      String(step.output).startsWith("WARN")    ? "text-amber-400" :
                      String(step.output) === "PASS"            ? "text-emerald-400/70" :
                      String(step.output) === "NOT_CHECKED"     ? "text-white/20" :
                      "text-white/55"
                    }`}>
                      {String(step.output)}
                    </span>
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
