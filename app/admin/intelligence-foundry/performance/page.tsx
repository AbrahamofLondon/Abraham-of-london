// app/admin/intelligence-foundry/performance/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import type { Finding } from "@/lib/research/foundry-contract";

type EngineOption = {
  id: string;
  name: string;
  callable: boolean;
};

type PerformanceResult = {
  engineId: string;
  engineName: string;
  iterations: number;
  minMs: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  totalMs: number;
  timeoutRisk: boolean;
  findings: Finding[];
  runId?: string;
};

export default function PerformanceRangePage() {
  const [engines, setEngines] = React.useState<EngineOption[]>([]);
  const [selectedEngine, setSelectedEngine] = React.useState<string>("");
  const [iterations, setIterations] = React.useState(10);
  const [results, setResults] = React.useState<PerformanceResult | null>(null);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/engines")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const callable = (data.engines ?? [])
            .filter((e: any) => e.status === "PRODUCTION_CALLABLE")
            .map((e: any) => ({ id: e.id, name: e.name, callable: true }));
          setEngines(callable);
          if (callable.length > 0) setSelectedEngine(callable[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleRun = async () => {
    if (!selectedEngine) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setSaveMsg(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/performance/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId: selectedEngine,
          iterations: Math.min(iterations, 25),
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Performance run failed");
        setRunning(false);
        return;
      }

      setResults(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setRunning(false);
  };

  const handleSave = async () => {
    if (!results) return;

    try {
      const res = await fetch("/api/admin/intelligence-foundry/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Performance: ${results.engineName} (${results.iterations} iterations)`,
          slug: `perf-${results.engineId}-${Date.now()}`,
          runType: "SCENARIO",
          module: "performance-range",
          moduleVersion: "1.0.0",
          inputJson: JSON.stringify({ engineId: selectedEngine, iterations }),
          outputJson: JSON.stringify(results),
          findingsJson: JSON.stringify(results.findings),
          severity: results.findings.some((f) => f.severity === "HIGH") ? "HIGH" : results.findings.some((f) => f.severity === "MEDIUM") ? "MEDIUM" : "INFO",
          status: "COMPLETE",
          durationMs: results.totalMs,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSaveMsg(`Saved as ResearchRun: ${data.run?.id ?? "unknown"}`);
      } else {
        setSaveMsg(`Save failed: ${data.error ?? "unknown"}`);
      }
    } catch (err) {
      setSaveMsg(`Save error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Performance Range</h1>
        <p className="text-sm text-white/35">
          Run safe performance benchmarks on callable engines. Captures min/avg/p95/max execution times.
          Maximum 25 iterations, 10-second timeout per run.
        </p>
      </div>

      <SimulationShell
        title="Engine Performance Benchmark"
        moduleId="performance-range"
        onRun={handleRun}
        onSave={handleSave}
        running={running}
        hasOutput={results !== null}
        inputsSlot={
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Engine</p>
              <select
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="w-full rounded border border-white/15 bg-[#0d0d0d] px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-white/30"
              >
                {engines.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Iterations</p>
              <input
                type="number"
                min={1}
                max={25}
                value={iterations}
                onChange={(e) => setIterations(Math.min(25, Math.max(1, Number(e.target.value))))}
                className="w-full rounded border border-white/15 bg-[#0d0d0d] px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-white/30"
              />
              <p className="text-[10px] text-white/20">1–25 iterations</p>
            </div>
          </div>
        }
        outputsSlot={
          results ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Engine", value: results.engineName },
                  { label: "Iterations", value: String(results.iterations) },
                  { label: "Min", value: `${results.minMs.toFixed(1)}ms` },
                  { label: "Avg", value: `${results.avgMs.toFixed(1)}ms` },
                  { label: "P95", value: `${results.p95Ms.toFixed(1)}ms` },
                  { label: "Max", value: `${results.maxMs.toFixed(1)}ms` },
                  { label: "Total", value: `${results.totalMs.toFixed(0)}ms` },
                  {
                    label: "Timeout Risk",
                    value: results.timeoutRisk ? "YES" : "No",
                    warn: results.timeoutRisk,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`rounded border ${m.warn ? "border-red-500/20 bg-red-500/5" : "border-white/8 bg-white/3"} p-3`}
                  >
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">{m.label}</p>
                    <p className={`text-lg font-semibold font-mono ${m.warn ? "text-red-400" : "text-white/70"}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {results.findings.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">Findings</p>
                  <FindingsList findings={results.findings} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">Run a benchmark to see results.</p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={selectedEngine ? "text-emerald-400" : "text-red-400"}>
                {selectedEngine ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Engine selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={iterations >= 1 && iterations <= 25 ? "text-emerald-400" : "text-red-400"}>
                {iterations >= 1 && iterations <= 25 ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Iterations 1–25</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={engines.length > 0 ? "text-emerald-400" : "text-red-400"}>
                {engines.length > 0 ? "✓" : "✗"}
              </span>
              <span className="text-white/50">{engines.length} callable engines</span>
            </div>
          </div>
        }
        actionsSlot={
          saveMsg ? (
            <p className="text-[11px] text-white/40 font-mono">{saveMsg}</p>
          ) : (
            <p className="text-[11px] text-white/20 italic">Run and save to capture a ResearchRun.</p>
          )
        }
      />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
