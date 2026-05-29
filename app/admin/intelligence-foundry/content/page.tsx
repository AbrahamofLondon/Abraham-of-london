"use client";
// app/admin/intelligence-foundry/content/page.tsx
// Content & Category Lab — deterministic editorial style analysis.
// Applies Abraham of London house style rules to editorial, blog, shorts, briefs, outbound copy.
// No AI, no external calls. All findings reference specific matched strings.

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
  wordCount?: number;
  charCount?: number;
  contentType?: string;
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

// ─── Content type options ─────────────────────────────────────────────────────

const CONTENT_TYPE_OPTIONS = [
  { value: "editorial", label: "Editorial" },
  { value: "blog",      label: "Blog post" },
  { value: "shorts",    label: "Shorts" },
  { value: "brief",     label: "Brief" },
  { value: "outbound",  label: "Outbound copy" },
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

function OverallBadge({ severity }: { severity: RunSeverity | string }) {
  const styles: Record<string, string> = {
    CRITICAL: "bg-red-500/10 text-red-400 border border-red-500/20",
    HIGH:     "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    MEDIUM:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    LOW:      "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    INFO:     "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-mono font-semibold uppercase ${styles[severity] ?? "bg-white/5 text-white/40"}`}>
      {severity === "INFO" ? "CLEAR" : severity}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContentCategoryLabPage() {
  const [mode,        setMode]        = useState<"analyze" | "clean" | "dirty">("analyze");
  const [text,        setText]        = useState("");
  const [title,       setTitle]       = useState("");
  const [contentType, setContentType] = useState("editorial");
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState<EngineResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [savedRunId, setSavedRunId] = useState<string | null>(null);
  const [saveError,  setSaveError]  = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedRunId(null);
    setSaveError(null);
    try {
      const payload =
        mode === "clean" ? { useCleanFixture: true } :
        mode === "dirty" ? { useDirtyFixture: true } :
        { text, title, contentType };

      const res = await fetch("/api/admin/intelligence-foundry/content/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Analysis failed");
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
          title: `Content Style Check · ${new Date(ts).toISOString().slice(0, 16).replace("T", " ")}`,
          slug: `content-style-check-${ts}`,
          runType: "CONTENT",
          module: "content-category-lab",
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
            Content &amp; Category Lab · PRODUCTION_CALLABLE
          </p>
        </div>
        <h1 className="text-xl font-semibold text-white/80">Content &amp; Category Lab</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Abraham of London editorial house style checker. UK/US spelling drift, overclaim
          phrases, guarantee language, hidden compliance assertions, AI prediction claims,
          evidence posture weakness, authority claim leakage. No AI — all findings reference
          specific matched strings.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Analysis Mode</p>

        {/* Mode selector */}
        <div className="flex gap-2 flex-wrap">
          {(["analyze", "clean", "dirty"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase transition-all ${
                mode === m
                  ? m === "dirty" ? "bg-red-500/15 text-red-400 border border-red-500/30"
                    : m === "clean" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-400/10 text-amber-400 border border-amber-400/25"
                  : "bg-white/3 text-white/35 border border-white/8 hover:text-white/55"
              }`}
            >
              {m === "analyze" ? "Custom Text" : m === "clean" ? "Clean Fixture" : "Dirty Fixture"}
            </button>
          ))}
        </div>

        <div className="text-[10px] text-white/30 leading-relaxed">
          {mode === "clean" && "Compliant editorial sample. Expects 0 violations."}
          {mode === "dirty" && "Non-compliant sample with US spelling, overclaims, guarantee language. Expects multiple findings."}
          {mode === "analyze" && "Check your own copy against Abraham of London house style rules."}
        </div>

        {/* Custom text input */}
        {mode === "analyze" && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article or piece title…"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Body text</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Paste editorial, blog post, brief, or outbound copy here…"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-y"
              />
            </div>
            <div className="w-48">
              <label className="block text-[10px] font-mono uppercase text-white/20 mb-1">Content type</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-white/20"
              >
                {CONTENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          onClick={runAnalysis}
          disabled={loading || (mode === "analyze" && !text.trim())}
          className="rounded-lg px-4 py-2 text-sm font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? "Checking…" : "Run Style Check"}
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
          {/* Summary */}
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex items-center gap-3 mb-3">
              <OverallBadge severity={result.severity} />
              {rawOutput?.contentType && (
                <p className="text-xs text-white/40 font-mono">{String(rawOutput.contentType)}</p>
              )}
              <p className="text-[10px] font-mono text-white/25 ml-auto">v{result.engineVersion}</p>
            </div>
            <p className="text-xs text-white/50">{result.summary}</p>
            <div className="flex gap-4 mt-3">
              <span className="text-xs text-white/30">{result.findings.filter((f) => f.severity === "CRITICAL").length} CRITICAL</span>
              <span className="text-xs text-white/30">{result.findings.filter((f) => f.severity === "HIGH").length} HIGH</span>
              <span className="text-xs text-white/30">{result.findings.filter((f) => f.severity === "MEDIUM").length} MEDIUM</span>
              <span className="text-xs text-white/30">{result.findings.filter((f) => f.severity === "LOW").length} LOW</span>
            </div>
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
              <p className="text-xs text-emerald-400">No violations — content passed all house style checks.</p>
            </div>
          )}

          {/* Check trace */}
          {formulaSteps.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Check Trace</p>
              <div className="space-y-1">
                {formulaSteps.map((step) => (
                  <div key={step.stepId} className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{step.label}</span>
                    <span className={`font-mono text-[10px] ${
                      String(step.output).startsWith("FAIL") ? "text-red-400" :
                      String(step.output).startsWith("WARN") ? "text-amber-400" :
                      String(step.output) === "PASS" ? "text-emerald-400/70" :
                      String(step.output) === "NOT_CHECKED" ? "text-white/20" :
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
