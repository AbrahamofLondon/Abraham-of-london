// app/admin/intelligence-foundry/chaos/page.tsx
// Chaos Range — fault injection and resilience testing for Foundry engines.
// Dry-run only. No records mutated. No production data touched.

"use client";

import * as React from "react";
import Link from "next/link";

type ChaosTestResult = {
  testId: string;
  label: string;
  engineId: string;
  threw: boolean;
  errorMessage: string | null;
  outputValid: boolean;
  hasFindings: boolean;
  findingCount: number;
  durationMs: number;
  outcome: "PASS" | "FAIL" | "EXPECTED_THROW";
  notes: string;
};

type ChaosRunResult = {
  engineId: string;
  engineVersion: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  expectedThrowCount: number;
  tests: ChaosTestResult[];
  resilienceScore: number;
  summary: string;
  durationMs: number;
};

const CALLABLE_ENGINES = [
  { id: "fast-diagnostic", label: "Fast Diagnostic" },
  { id: "pattern-recurrence", label: "Pattern Recurrence" },
  { id: "constitutional-diagnostic", label: "Constitutional Diagnostic" },
  { id: "strategy-room", label: "Strategy Room" },
  { id: "boardroom-dossier", label: "Boardroom Mode" },
  { id: "executive-reporting", label: "Executive Reporting" },
  { id: "executive-report-boardroom-bridge", label: "ER → Boardroom Bridge" },
  { id: "cost-of-delay", label: "Cost of Delay" },
  { id: "cohort-privacy", label: "Cohort Privacy" },
  { id: "editorial-style-checker", label: "Editorial Style Checker" },
  { id: "enforcement-gates", label: "Enforcement Gates" },
  { id: "outbound-policy-gate", label: "Outbound Policy Gate" },
  { id: "report-lineage", label: "Report Lineage" },
];

const OUTCOME_CHIP: Record<string, string> = {
  PASS: "bg-emerald-400/10 text-emerald-400/80 border border-emerald-400/20",
  FAIL: "bg-red-400/10 text-red-400/80 border border-red-400/20",
  EXPECTED_THROW: "bg-amber-400/10 text-amber-400/80 border border-amber-400/20",
};

const OUTCOME_LABEL: Record<string, string> = {
  PASS: "PASS",
  FAIL: "FAIL",
  EXPECTED_THROW: "CAUGHT",
};

export default function ChaosRangePage() {
  const [selectedEngine, setSelectedEngine] = React.useState(CALLABLE_ENGINES[0]?.id ?? "");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<ChaosRunResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/chaos/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId: selectedEngine }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Chaos run failed");
      } else {
        setResult(data.result);
      }
    } catch {
      setError("Network error");
    } finally {
      setRunning(false);
    }
  };

  const scoreColor =
    !result ? "text-white/30"
    : result.resilienceScore >= 90 ? "text-emerald-400/80"
    : result.resilienceScore >= 70 ? "text-amber-400/80"
    : "text-red-400/80";

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
          Adversarial Testing · Dry Run
        </p>
        <h1 className="text-xl font-semibold text-white/80">Chaos Range</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Fault injection and resilience testing. Subjects callable engines to null inputs,
          type violations, boundary conditions, and extreme strings. No records mutated.
        </p>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">Engine Selection</p>

        <div className="flex flex-wrap gap-2">
          {CALLABLE_ENGINES.map((eng) => (
            <button
              key={eng.id}
              onClick={() => setSelectedEngine(eng.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-mono border transition-all ${
                selectedEngine === eng.id
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-400/80"
                  : "border-white/8 bg-white/2 text-white/35 hover:border-white/15 hover:text-white/50"
              }`}
            >
              {eng.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="rounded-lg border border-red-400/20 bg-red-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-red-400/70 hover:border-red-400/35 hover:text-red-400/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {running ? "Running chaos tests…" : "Run Chaos Tests"}
        </button>

        {error && (
          <p className="text-xs text-red-400/70 font-mono">{error}</p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-xl border border-white/8 bg-white/2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/25 mb-1">
                  Resilience Score
                </p>
                <p className={`text-3xl font-mono font-bold ${scoreColor}`}>
                  {result.resilienceScore}
                  <span className="text-base text-white/30 ml-1">/100</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono text-white/25">{result.engineId}</p>
                <p className="text-[10px] font-mono text-white/15">v{result.engineVersion}</p>
                <p className="text-[10px] font-mono text-white/15 mt-1">{result.durationMs}ms total</p>
              </div>
            </div>
            <p className="text-sm text-white/50">{result.summary}</p>

            {/* Counts */}
            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-emerald-400/80">{result.passCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Pass</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-red-400/80">{result.failCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Fail</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-amber-400/80">{result.expectedThrowCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Caught</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-white/50">{result.totalTests}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Total</p>
              </div>
            </div>
          </div>

          {/* Test results */}
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Test Results
            </p>
            {result.tests.map((test) => (
              <div
                key={test.testId}
                className={`rounded-lg border p-4 ${
                  test.outcome === "FAIL"
                    ? "border-red-400/15 bg-red-400/5"
                    : test.outcome === "EXPECTED_THROW"
                    ? "border-amber-400/10 bg-amber-400/[0.03]"
                    : "border-white/8 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-white/20 uppercase">{test.testId}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider ${OUTCOME_CHIP[test.outcome]}`}
                      >
                        {OUTCOME_LABEL[test.outcome]}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white/65">{test.label}</p>
                  </div>
                  <span className="text-[10px] font-mono text-white/20 shrink-0">{test.durationMs}ms</span>
                </div>

                <p className="text-xs text-white/30 mb-2">{test.notes}</p>

                <div className="flex flex-wrap gap-3 text-[10px] font-mono text-white/20">
                  <span>output valid: {test.outputValid ? "✓" : "✗"}</span>
                  <span>threw: {test.threw ? "yes" : "no"}</span>
                  <span>findings: {test.findingCount}</span>
                </div>

                {test.errorMessage && (
                  <p className="mt-2 text-[10px] font-mono text-red-400/60 leading-relaxed">
                    {test.errorMessage.slice(0, 300)}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Compliance note */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">
              Dry-Run Compliance
            </p>
            <p className="text-xs text-white/30">
              All chaos tests run against adapter logic only. No database records were created or modified.
              No production case data was touched. Results are for resilience analysis only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
