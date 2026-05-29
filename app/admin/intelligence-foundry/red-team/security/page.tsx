// app/admin/intelligence-foundry/red-team/security/page.tsx
// Security Red-Team — adversarial route guard and access control analysis.
// Static analysis only. No live HTTP probing. No production data touched.

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

const SCOPE_OPTIONS = [
  { value: "all",          label: "All Routes" },
  { value: "admin-routes", label: "Admin Routes Only" },
  { value: "api-routes",   label: "Public API Routes Only" },
];

type Mode = "clean" | "vulnerable";

export default function SecurityRedTeamPage() {
  const [scope, setScope] = React.useState("all");
  const [mode, setMode] = React.useState<Mode>("clean");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<RunResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    const payload: Record<string, unknown> = { scope };
    if (mode === "vulnerable") payload.useVulnerableFixture = true;
    else payload.useCleanFixture = true;

    try {
      const res = await fetch("/api/admin/intelligence-foundry/red-team/security/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Security red-team run failed");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error — is the dev server running?");
    } finally {
      setRunning(false);
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
          Red-Team · Access Control Audit
        </p>
        <h1 className="text-xl font-semibold text-white/80">Security Red-Team</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Adversarial analysis of route guard coverage, IDOR risk, sensitive field exposure,
          and rate limiting gaps. Static analysis — no live HTTP probing, no production data touched.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Run Configuration</p>

        {/* Scope */}
        <div>
          <p className="text-[10px] font-mono text-white/20 mb-2 uppercase tracking-wide">Scope</p>
          <div className="flex flex-wrap gap-2">
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setScope(s.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono border transition-all ${
                  scope === s.value
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-400/80"
                    : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div>
          <p className="text-[10px] font-mono text-white/20 mb-2 uppercase tracking-wide">Fixture</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMode("clean")}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono border transition-all ${
                mode === "clean"
                  ? "border-emerald-400/30 bg-emerald-400/8 text-emerald-400/80"
                  : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
              }`}
            >
              Clean fixture
            </button>
            <button
              onClick={() => setMode("vulnerable")}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono border transition-all ${
                mode === "vulnerable"
                  ? "border-red-400/30 bg-red-400/8 text-red-400/80"
                  : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
              }`}
            >
              Vulnerable fixture (detection test)
            </button>
          </div>
          <p className="text-[10px] font-mono text-white/20 mt-1.5">
            {mode === "vulnerable"
              ? "Runs against a known-bad route manifest to verify detection is working."
              : "Runs against a clean route manifest. Should return 0 violations."}
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-lg border border-red-400/20 bg-red-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-red-400/70 hover:border-red-400/35 hover:text-red-400/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {running ? "Running security red-team…" : "Run Security Red-Team"}
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
                <p className="text-[10px] font-mono text-white/20">security-red-team v{result.engineVersion}</p>
                <p className="text-[10px] font-mono text-white/15 mt-0.5">{result.durationMs}ms</p>
              </div>
            </div>
            <p className="text-sm text-white/50">{result.summary}</p>
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

          {/* Dry-run note */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">
              Static Analysis Note
            </p>
            <p className="text-xs text-white/30">
              All findings are derived from static route manifest declarations. No HTTP requests were made
              and no production endpoints were probed. Results require human verification against actual
              route implementation before remediation actions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
