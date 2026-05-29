// app/admin/intelligence-foundry/data-poisoning/page.tsx
// Data Poisoning Lab — adversarial and corrupted input testing for Foundry engines.
// Dry-run only. No records mutated. No production data touched.

"use client";

import * as React from "react";
import Link from "next/link";

type PoisonTestResult = {
  testId: string;
  label: string;
  category: string;
  engineId: string;
  threw: boolean;
  errorMessage: string | null;
  outputValid: boolean;
  durationMs: number;
  outcome: "CLEAN" | "VULNERABLE" | "EXPECTED_ERROR";
  notes: string;
};

type PoisonRunResult = {
  engineId: string;
  engineVersion: string;
  totalTests: number;
  cleanCount: number;
  vulnerableCount: number;
  expectedErrorCount: number;
  tests: PoisonTestResult[];
  securityScore: number;
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
  CLEAN: "bg-emerald-400/10 text-emerald-400/80 border border-emerald-400/20",
  VULNERABLE: "bg-red-400/10 text-red-400/80 border border-red-400/20",
  EXPECTED_ERROR: "bg-amber-400/10 text-amber-400/80 border border-amber-400/20",
};

const OUTCOME_LABEL: Record<string, string> = {
  CLEAN: "CLEAN",
  VULNERABLE: "VULNERABLE",
  EXPECTED_ERROR: "HANDLED",
};

const CATEGORY_COLORS: Record<string, string> = {
  Injection: "text-red-400/60",
  "Resource exhaustion": "text-amber-400/60",
  Encoding: "text-purple-400/60",
  "Type safety": "text-blue-400/60",
  "Object security": "text-orange-400/60",
  Serialisation: "text-cyan-400/60",
};

export default function DataPoisoningLabPage() {
  const [selectedEngine, setSelectedEngine] = React.useState(CALLABLE_ENGINES[0]?.id ?? "");
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState<PoisonRunResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/data-poisoning/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId: selectedEngine }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error ?? "Data poisoning run failed");
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
    : result.securityScore >= 90 ? "text-emerald-400/80"
    : result.securityScore >= 70 ? "text-amber-400/80"
    : "text-red-400/80";

  // Group tests by category
  const testsByCategory = React.useMemo(() => {
    if (!result) return {};
    return result.tests.reduce<Record<string, PoisonTestResult[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category]!.push(t);
      return acc;
    }, {});
  }, [result]);

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
        <h1 className="text-xl font-semibold text-white/80">Data Poisoning Lab</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Adversarial and corrupted input testing. SQL injection, XSS, path traversal,
          prototype pollution, oversized payloads, and encoding attacks.
          No records mutated.
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
                  ? "border-red-400/30 bg-red-400/10 text-red-400/80"
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
          className="rounded-lg border border-red-400/25 bg-red-400/8 px-4 py-2 text-xs font-mono uppercase tracking-wide text-red-400/70 hover:border-red-400/40 hover:text-red-400/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {running ? "Running poison tests…" : "Run Poison Tests"}
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
                  Security Score
                </p>
                <p className={`text-3xl font-mono font-bold ${scoreColor}`}>
                  {result.securityScore}
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

            <div className="flex gap-4 mt-4">
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-emerald-400/80">{result.cleanCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Clean</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-red-400/80">{result.vulnerableCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Vulnerable</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-amber-400/80">{result.expectedErrorCount}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Handled</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-mono font-semibold text-white/50">{result.totalTests}</p>
                <p className="text-[10px] font-mono text-white/25 uppercase">Total</p>
              </div>
            </div>
          </div>

          {/* Test results by category */}
          {Object.entries(testsByCategory).map(([category, catTests]) => (
            <div key={category} className="space-y-2">
              <p className={`text-[10px] font-mono uppercase tracking-widest ${CATEGORY_COLORS[category] ?? "text-white/20"}`}>
                {category}
              </p>
              {catTests.map((test) => (
                <div
                  key={test.testId}
                  className={`rounded-lg border p-4 ${
                    test.outcome === "VULNERABLE"
                      ? "border-red-400/20 bg-red-400/5"
                      : test.outcome === "EXPECTED_ERROR"
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
                  </div>

                  {test.errorMessage && (
                    <p className="mt-2 text-[10px] font-mono text-red-400/60 leading-relaxed">
                      {test.errorMessage.slice(0, 300)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Compliance note */}
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-1">
              Dry-Run Compliance
            </p>
            <p className="text-xs text-white/30">
              All data-poisoning tests run against adapter logic only. No database records were created
              or modified. No production case data was touched. Results are for security analysis only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
