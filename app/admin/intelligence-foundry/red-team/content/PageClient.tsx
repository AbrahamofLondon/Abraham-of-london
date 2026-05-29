// app/admin/intelligence-foundry/red-team/content/page.tsx
// Content Red-Team — adversarial content pressure-testing.
// Fabricated credentials, regulatory misrepresentation, market overclaim,
// AI overclaim, urgency tactics, unattributed social proof, claim density.
// No AI. No external calls. No production data touched.

"use client";

import * as React from "react";
import Link from "next/link";

type Finding = {
  id: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  source: string;
  evidence?: string;
  remediation?: string;
};

type RunResult = {
  findings: Finding[];
  summary: string;
  severity: string;
  engineVersion: string;
  durationMs: number;
  limitations?: string[];
  promotionRequirements?: string[];
  rawOutput?: Record<string, unknown>;
};

const SEVERITY_CHIP: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-400/90 border border-red-500/25",
  HIGH:     "bg-orange-500/15 text-orange-400/80 border border-orange-500/20",
  MEDIUM:   "bg-amber-400/12 text-amber-400/75 border border-amber-400/20",
  LOW:      "bg-white/8 text-white/45 border border-white/12",
  INFO:     "bg-emerald-400/10 text-emerald-400/70 border border-emerald-400/15",
};

const CONTENT_TYPE_OPTIONS = [
  { value: "editorial",  label: "Editorial" },
  { value: "blog",       label: "Blog" },
  { value: "outbound",   label: "Outbound" },
  { value: "boardroom",  label: "Boardroom" },
  { value: "gmi",        label: "GMI" },
];

type Mode = "clean" | "dirty" | "custom";

const PLACEHOLDER_TEXT =
  "Paste content here to run adversarial analysis. The engine will check for fabricated credentials, regulatory misrepresentation, market overclaim, AI capability overclaim, urgency/scarcity tactics, unattributed social proof, and high claim density.";

export default function ContentRedTeamPage() {
  const [mode, setMode] = React.useState<Mode>("clean");
  const [contentType, setContentType] = React.useState("editorial");
  const [customText, setCustomText] = React.useState("");
  const [customTitle, setCustomTitle] = React.useState("");
  const [running,    setRunning]    = React.useState(false);
  const [result,     setResult]     = React.useState<RunResult | null>(null);
  const [error,      setError]      = React.useState<string | null>(null);
  const [saving,     setSaving]     = React.useState(false);
  const [savedRunId, setSavedRunId] = React.useState<string | null>(null);
  const [saveError,  setSaveError]  = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setSavedRunId(null);
    setSaveError(null);

    const payload: Record<string, unknown> = { contentType };

    if (mode === "clean") {
      payload.useCleanFixture = true;
    } else if (mode === "dirty") {
      payload.useDirtyFixture = true;
    } else {
      payload.text = customText;
      payload.title = customTitle;
    }

    try {
      const res = await fetch("/api/admin/intelligence-foundry/red-team/content/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Content red-team run failed");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setSaveError(null);
    try {
      const ts = Date.now();
      const res = await fetch("/api/admin/intelligence-foundry/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Content Red-Team · ${new Date(ts).toISOString().slice(0, 16).replace("T", " ")}`,
          slug: `content-red-team-${ts}`,
          runType: "RED_TEAM",
          module: "content-red-team",
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
  };

  const violationCount = result?.findings.filter((f) => f.severity !== "INFO").length ?? 0;

  const overallColor =
    !result ? "text-white/25"
    : violationCount === 0 ? "text-emerald-400/80"
    : result.severity === "CRITICAL" ? "text-red-400/80"
    : result.severity === "HIGH" ? "text-orange-400/80"
    : "text-amber-400/80";

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
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1 mt-3">
          Red-Team · Content Pressure-Testing
        </p>
        <h1 className="text-xl font-semibold text-white/80">Content Red-Team</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Adversarial content analysis: fabricated credentials, regulatory misrepresentation,
          market dominance overclaim, AI capability overclaim, urgency tactics, unattributed
          social proof, and claim density. No AI. No external calls.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Run Configuration</p>

        {/* Mode */}
        <div>
          <p className="text-[10px] font-mono text-white/20 mb-2 uppercase tracking-wide">Mode</p>
          <div className="flex flex-wrap gap-2">
            {(["clean", "dirty", "custom"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono border capitalize transition-all ${
                  mode === m
                    ? m === "dirty"
                      ? "border-red-400/30 bg-red-400/8 text-red-400/80"
                      : m === "clean"
                        ? "border-emerald-400/30 bg-emerald-400/8 text-emerald-400/80"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-400/80"
                    : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
                }`}
              >
                {m === "clean" ? "Clean fixture" : m === "dirty" ? "Dirty fixture (detection test)" : "Custom content"}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-white/20 mt-1.5">
            {mode === "dirty"
              ? "Known-bad content — verifies detection is working. Expect CRITICAL findings."
              : mode === "clean"
                ? "Known-clean content — should return 0 violations."
                : "Paste your own content to analyse."}
          </p>
        </div>

        {/* Content type */}
        <div>
          <p className="text-[10px] font-mono text-white/20 mb-2 uppercase tracking-wide">Content Type</p>
          <div className="flex flex-wrap gap-2">
            {CONTENT_TYPE_OPTIONS.map((ct) => (
              <button
                key={ct.value}
                onClick={() => setContentType(ct.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono border transition-all ${
                  contentType === ct.value
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-400/80"
                    : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom content input */}
        {mode === "custom" && (
          <div className="space-y-2">
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Content title (optional)"
              className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20"
            />
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={PLACEHOLDER_TEXT}
              rows={6}
              className="w-full rounded-lg border border-white/8 bg-white/2 px-3 py-2 text-sm text-white/60 placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-y font-mono"
            />
          </div>
        )}

        <button
          onClick={handleRun}
          disabled={running || (mode === "custom" && !customText.trim())}
          className="rounded-lg border border-red-400/20 bg-red-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-red-400/70 hover:border-red-400/35 hover:text-red-400/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {running ? "Running content red-team…" : "Run Content Red-Team"}
        </button>

        {error && <p className="text-xs text-red-400/70 font-mono">{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-white/8 bg-white/2 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1">Overall Severity</p>
                <p className={`text-2xl font-mono font-bold ${overallColor}`}>{result.severity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-mono text-white/20">content-red-team v{result.engineVersion}</p>
                <p className="text-[10px] font-mono text-white/15 mt-0.5">{result.durationMs}ms</p>
              </div>
            </div>
            <p className="text-sm text-white/50">{result.summary}</p>
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
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs font-mono text-white/40 hover:text-white/60 hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {saving ? "Saving…" : "Save run to vault"}
              </button>
            )}
            {saveError && <p className="text-xs text-red-400/70 font-mono">{saveError}</p>}
          </div>

          {/* Findings */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Findings</p>
            {result.findings.map((finding) => (
              <div
                key={finding.id}
                className={`rounded-xl border p-4 ${
                  finding.severity === "CRITICAL" ? "border-red-500/20 bg-red-500/5"
                  : finding.severity === "HIGH" ? "border-orange-500/15 bg-orange-500/[0.04]"
                  : finding.severity === "MEDIUM" ? "border-amber-400/12 bg-amber-400/[0.03]"
                  : finding.severity === "INFO" ? "border-emerald-400/12 bg-emerald-400/[0.03]"
                  : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider shrink-0 mt-0.5 ${SEVERITY_CHIP[finding.severity]}`}>
                    {finding.severity}
                  </span>
                  <p className="text-sm font-medium text-white/70">{finding.title}</p>
                </div>
                <p className="text-xs text-white/40 mb-2 leading-relaxed whitespace-pre-line">{finding.description}</p>
                {finding.evidence && (
                  <p className="text-[10px] font-mono text-white/20 mb-2">evidence: {finding.evidence}</p>
                )}
                {finding.remediation && (
                  <div className="mt-2 rounded-lg bg-white/3 border border-white/8 px-3 py-2">
                    <p className="text-[10px] font-mono uppercase text-white/20 mb-0.5">Remediation</p>
                    <p className="text-xs text-white/40 leading-relaxed">{finding.remediation}</p>
                  </div>
                )}
                <p className="text-[10px] font-mono text-white/15 mt-2">{finding.source}</p>
              </div>
            ))}
          </div>

          {/* Limitations */}
          {result.limitations && result.limitations.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Engine Limitations</p>
              <ul className="space-y-1">
                {result.limitations.map((l, i) => (
                  <li key={i} className="text-xs text-white/30 flex gap-2">
                    <span className="text-white/15 shrink-0">—</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Promotion requirements */}
          {result.promotionRequirements && result.promotionRequirements.length > 0 && (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">
                Promotion Requirements (PILOT_READY → LIVE_GOVERNED)
              </p>
              <ul className="space-y-1">
                {result.promotionRequirements.map((r, i) => (
                  <li key={i} className="text-xs text-white/30 flex gap-2">
                    <span className="text-amber-400/40 shrink-0">○</span>
                    <span>{r}</span>
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
