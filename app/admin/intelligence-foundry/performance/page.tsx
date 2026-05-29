// app/admin/intelligence-foundry/performance/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import type { Finding } from "@/lib/research/foundry-contract";

// ─── Types ────────────────────────────────────────────────────────────────────

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

/** Local (localStorage) baseline — fast QA access */
type LocalBaseline = {
  engineId: string;
  engineName: string;
  iterations: number;
  minMs: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  capturedAt: string;
};

/** Server baseline — governance record (from /api/admin/intelligence-foundry/performance/baseline) */
type ServerBaseline = {
  id: string;
  engineId: string;
  baselineMs: number;
  p95Ms: number;
  sampleSize: number;
  environment: string;
  notes: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

/** 25% avg degradation = regression (mirrors server REGRESSION_FACTOR = 1.25) */
const REGRESSION_FACTOR = 1.25;

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

const BASELINE_STORAGE_KEY = "foundry-perf-baselines";

function loadBaselines(): Record<string, LocalBaseline> {
  try {
    const raw = localStorage.getItem(BASELINE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalBaseline(baseline: LocalBaseline): void {
  try {
    const existing = loadBaselines();
    existing[baseline.engineId] = baseline;
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // localStorage unavailable — no-op
  }
}

function clearLocalBaseline(engineId: string): void {
  try {
    const existing = loadBaselines();
    delete existing[engineId];
    localStorage.setItem(BASELINE_STORAGE_KEY, JSON.stringify(existing));
  } catch {}
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function fmtDelta(
  current: number,
  baseline: number,
): { text: string; positive: boolean; neutral: boolean } {
  const diff = current - baseline;
  const pct  = baseline > 0 ? ((diff / baseline) * 100).toFixed(1) : "0.0";
  const text  = diff > 0 ? `+${diff.toFixed(1)}ms (+${pct}%)` : `${diff.toFixed(1)}ms (${pct}%)`;
  return { text, positive: diff < 0, neutral: Math.abs(diff) < 1 };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformanceRangePage() {
  const [engines,         setEngines]         = React.useState<EngineOption[]>([]);
  const [selectedEngine,  setSelectedEngine]  = React.useState<string>("");
  const [iterations,      setIterations]      = React.useState(10);
  const [results,         setResults]         = React.useState<PerformanceResult | null>(null);
  const [running,         setRunning]         = React.useState(false);
  const [error,           setError]           = React.useState<string | null>(null);
  const [saveMsg,         setSaveMsg]         = React.useState<string | null>(null);

  // Local baseline state
  const [baselines,    setBaselines]    = React.useState<Record<string, LocalBaseline>>({});
  const [baselineMsg,  setBaselineMsg]  = React.useState<string | null>(null);

  // Server baseline state
  const [serverBaseline,        setServerBaseline]        = React.useState<ServerBaseline | null>(null);
  const [serverBaselineLoading, setServerBaselineLoading] = React.useState(false);
  const [serverBaselineSaving,  setServerBaselineSaving]  = React.useState(false);
  const [serverBaselineMsg,     setServerBaselineMsg]     = React.useState<string | null>(null);

  // Load local baselines from localStorage on mount
  React.useEffect(() => {
    setBaselines(loadBaselines());
  }, []);

  // Load callable engines
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

  // Fetch server baseline whenever engine selection changes
  React.useEffect(() => {
    if (!selectedEngine) {
      setServerBaseline(null);
      return;
    }
    setServerBaselineLoading(true);
    setServerBaseline(null);
    setServerBaselineMsg(null);

    fetch(`/api/admin/intelligence-foundry/performance/baseline?engineId=${encodeURIComponent(selectedEngine)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setServerBaseline(data.baseline ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setServerBaselineLoading(false));
  }, [selectedEngine]);

  const currentLocalBaseline = selectedEngine ? baselines[selectedEngine] ?? null : null;

  // ── Regression check against server baseline ──────────────────────────────
  const regression = React.useMemo(() => {
    if (!results || !serverBaseline) return null;
    const isRegressed = results.avgMs > serverBaseline.baselineMs * REGRESSION_FACTOR;
    const deltaMs     = results.avgMs - serverBaseline.baselineMs;
    const deltaPct    = serverBaseline.baselineMs > 0
      ? ((deltaMs / serverBaseline.baselineMs) * 100).toFixed(1)
      : "0.0";
    return { isRegressed, deltaMs, deltaPct };
  }, [results, serverBaseline]);

  // ── Run benchmark ─────────────────────────────────────────────────────────
  const handleRun = async () => {
    if (!selectedEngine) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setSaveMsg(null);
    setBaselineMsg(null);
    setServerBaselineMsg(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/performance/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId:   selectedEngine,
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

  // ── Save ResearchRun ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!results) return;

    try {
      const res = await fetch("/api/admin/intelligence-foundry/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     `Performance: ${results.engineName} (${results.iterations} iterations)`,
          slug:      `perf-${results.engineId}-${Date.now()}`,
          runType:   "SCENARIO",
          module:    "performance-range",
          moduleVersion: "1.0.0",
          inputJson:  JSON.stringify({ engineId: selectedEngine, iterations }),
          outputJson: JSON.stringify(results),
          findingsJson: JSON.stringify(results.findings),
          severity:
            results.findings.some((f) => f.severity === "HIGH")
              ? "HIGH"
              : results.findings.some((f) => f.severity === "MEDIUM")
              ? "MEDIUM"
              : "INFO",
          status:     "COMPLETE",
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

  // ── Local baseline ────────────────────────────────────────────────────────
  const handleSetLocalBaseline = () => {
    if (!results) return;
    const baseline: LocalBaseline = {
      engineId:   results.engineId,
      engineName: results.engineName,
      iterations: results.iterations,
      minMs:      results.minMs,
      avgMs:      results.avgMs,
      p95Ms:      results.p95Ms,
      maxMs:      results.maxMs,
      capturedAt: new Date().toISOString(),
    };
    saveLocalBaseline(baseline);
    setBaselines((prev) => ({ ...prev, [results.engineId]: baseline }));
    setBaselineMsg(`Local baseline set at ${new Date().toLocaleTimeString()}.`);
  };

  const handleClearLocalBaseline = () => {
    if (!selectedEngine) return;
    clearLocalBaseline(selectedEngine);
    setBaselines((prev) => {
      const next = { ...prev };
      delete next[selectedEngine];
      return next;
    });
    setBaselineMsg("Local baseline cleared.");
  };

  // ── Server baseline ───────────────────────────────────────────────────────
  const handleSaveServerBaseline = async () => {
    if (!results) return;
    setServerBaselineSaving(true);
    setServerBaselineMsg(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/performance/baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engineId:    results.engineId,
          baselineMs:  results.avgMs,
          p95Ms:       results.p95Ms,
          sampleSize:  results.iterations,
          environment: "production",
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setServerBaseline(data.baseline);
        setServerBaselineMsg(`Server baseline saved at ${new Date().toLocaleTimeString()}.`);
      } else {
        setServerBaselineMsg(`Server save failed: ${data.error ?? "unknown"}`);
      }
    } catch (err) {
      setServerBaselineMsg(`Network error: ${err instanceof Error ? err.message : "unknown"}`);
    }

    setServerBaselineSaving(false);
  };

  const handleClearServerBaseline = async () => {
    if (!selectedEngine) return;
    setServerBaselineSaving(true);
    setServerBaselineMsg(null);

    try {
      const res = await fetch(
        `/api/admin/intelligence-foundry/performance/baseline?engineId=${encodeURIComponent(selectedEngine)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.ok) {
        setServerBaseline(null);
        setServerBaselineMsg("Server baseline cleared.");
      } else {
        setServerBaselineMsg(`Clear failed: ${data.error ?? "unknown"}`);
      }
    } catch (err) {
      setServerBaselineMsg(`Network error: ${err instanceof Error ? err.message : "unknown"}`);
    }

    setServerBaselineSaving(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/admin/intelligence-foundry"
          className="text-[11px] text-white/25 hover:text-white/45 font-mono"
        >
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Performance Range</h1>
        <p className="text-sm text-white/35">
          Run safe performance benchmarks on callable engines. Captures min/avg/p95/max execution
          times. Maximum 25 iterations, 10-second timeout per run.
        </p>
        <p className="mt-1 text-xs text-amber-400/40 font-mono">
          Performance Range runs bounded internal benchmarks only. It does not load-test production
          traffic.
        </p>
      </div>

      {/* ── Server baseline banner ─────────────────────────────────────── */}
      {serverBaselineLoading && (
        <div className="rounded-lg border border-white/6 bg-white/2 p-3 text-[11px] text-white/25 font-mono">
          Loading server baseline…
        </div>
      )}

      {!serverBaselineLoading && serverBaseline && (
        <div
          className={`rounded-lg border p-3 flex items-start justify-between gap-4 ${
            regression?.isRegressed
              ? "border-red-500/25 bg-red-500/5"
              : "border-emerald-500/15 bg-emerald-500/4"
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-mono uppercase tracking-widest mb-0.5 ${
                regression?.isRegressed ? "text-red-400/60" : "text-emerald-400/60"
              }`}
            >
              Server Baseline
              {regression?.isRegressed && " — REGRESSION DETECTED"}
            </p>
            <p className="text-xs text-white/50">
              Engine {serverBaseline.engineId} · {serverBaseline.sampleSize} samples ·{" "}
              {serverBaseline.environment} ·{" "}
              {serverBaseline.updatedBy ? `by ${serverBaseline.updatedBy} · ` : ""}
              updated {new Date(serverBaseline.updatedAt).toLocaleString()}
            </p>
            <p className="text-[11px] font-mono text-white/35 mt-1">
              avg {serverBaseline.baselineMs.toFixed(1)}ms &nbsp;·&nbsp; p95{" "}
              {serverBaseline.p95Ms.toFixed(1)}ms
            </p>
            {regression?.isRegressed && (
              <p className="text-[11px] font-mono text-red-400/70 mt-1">
                Current avg is {regression.deltaMs > 0 ? "+" : ""}
                {regression.deltaMs.toFixed(1)}ms ({regression.deltaPct}%) vs server baseline —
                exceeds 25% regression threshold.
              </p>
            )}
          </div>
          <button
            onClick={handleClearServerBaseline}
            disabled={serverBaselineSaving}
            className="shrink-0 rounded border border-white/8 bg-white/3 px-2 py-1 text-[10px] font-mono text-white/30 hover:text-white/50 hover:border-white/15 disabled:opacity-40 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {!serverBaselineLoading && !serverBaseline && selectedEngine && (
        <div className="rounded-lg border border-white/6 bg-white/2 p-3">
          <p className="text-[11px] text-white/25 font-mono">
            No server baseline set for this engine. Run a benchmark and click &quot;Save server
            baseline&quot; to establish a governance record.
          </p>
        </div>
      )}

      {/* ── Local baseline banner ──────────────────────────────────────── */}
      {currentLocalBaseline && (
        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400/60 mb-0.5">
              Local Baseline (this browser)
            </p>
            <p className="text-xs text-white/50">
              {currentLocalBaseline.engineName} · captured{" "}
              {new Date(currentLocalBaseline.capturedAt).toLocaleString()}
            </p>
            <p className="text-[11px] font-mono text-white/35 mt-1">
              avg {currentLocalBaseline.avgMs.toFixed(1)}ms &nbsp;·&nbsp; p95{" "}
              {currentLocalBaseline.p95Ms.toFixed(1)}ms &nbsp;·&nbsp; max{" "}
              {currentLocalBaseline.maxMs.toFixed(1)}ms &nbsp;·&nbsp;{" "}
              {currentLocalBaseline.iterations} iter
            </p>
          </div>
          <button
            onClick={handleClearLocalBaseline}
            className="shrink-0 rounded border border-white/8 bg-white/3 px-2 py-1 text-[10px] font-mono text-white/30 hover:text-white/50 hover:border-white/15 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

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
                onChange={(e) => {
                  setSelectedEngine(e.target.value);
                  setResults(null);
                  setSaveMsg(null);
                  setBaselineMsg(null);
                  setServerBaselineMsg(null);
                }}
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
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                Iterations
              </p>
              <input
                type="number"
                min={1}
                max={25}
                value={iterations}
                onChange={(e) =>
                  setIterations(Math.min(25, Math.max(1, Number(e.target.value))))
                }
                className="w-full rounded border border-white/15 bg-[#0d0d0d] px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-white/30"
              />
              <p className="text-[10px] text-white/20">1–25 iterations</p>
            </div>
          </div>
        }
        outputsSlot={
          results ? (
            <div className="space-y-4">
              {/* Regression alert banner */}
              {regression?.isRegressed && (
                <div className="rounded border border-red-500/25 bg-red-500/6 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/70 mb-1">
                    Regression vs Server Baseline
                  </p>
                  <p className="text-xs text-red-300/70">
                    Average is{" "}
                    {regression.deltaMs > 0 ? "+" : ""}
                    {regression.deltaMs.toFixed(1)}ms ({regression.deltaPct}%) above server
                    baseline — exceeds 25% regression threshold. Do not promote until resolved.
                  </p>
                </div>
              )}

              {/* Primary metrics grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Engine",     value: results.engineName },
                  { label: "Iterations", value: String(results.iterations) },
                  { label: "Min",        value: `${results.minMs.toFixed(1)}ms` },
                  { label: "Avg",        value: `${results.avgMs.toFixed(1)}ms` },
                  { label: "P95",        value: `${results.p95Ms.toFixed(1)}ms` },
                  { label: "Max",        value: `${results.maxMs.toFixed(1)}ms` },
                  { label: "Total",      value: `${results.totalMs.toFixed(0)}ms` },
                  {
                    label: "Timeout Risk",
                    value: results.timeoutRisk ? "YES" : "No",
                    warn:  results.timeoutRisk,
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`rounded border ${
                      m.warn
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-white/8 bg-white/3"
                    } p-3`}
                  >
                    <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                      {m.label}
                    </p>
                    <p
                      className={`text-lg font-semibold font-mono ${
                        m.warn ? "text-red-400" : "text-white/70"
                      }`}
                    >
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Server baseline delta */}
              {serverBaseline && (
                <div
                  className={`rounded border p-3 space-y-2 ${
                    regression?.isRegressed
                      ? "border-red-500/15 bg-red-500/4"
                      : "border-emerald-500/10 bg-emerald-500/3"
                  }`}
                >
                  <p
                    className={`text-[10px] font-mono uppercase tracking-widest ${
                      regression?.isRegressed
                        ? "text-red-400/50"
                        : "text-emerald-400/50"
                    }`}
                  >
                    Delta vs Server Baseline
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { label: "Avg", current: results.avgMs, base: serverBaseline.baselineMs },
                        { label: "P95", current: results.p95Ms, base: serverBaseline.p95Ms },
                      ] as const
                    ).map(({ label, current, base }) => {
                      const delta = fmtDelta(current, base);
                      return (
                        <div key={label} className="rounded border border-white/6 bg-white/2 p-2">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                            {label}
                          </p>
                          <p
                            className={`text-sm font-mono font-semibold ${
                              delta.neutral
                                ? "text-white/40"
                                : delta.positive
                                ? "text-emerald-400/80"
                                : "text-red-400/80"
                            }`}
                          >
                            {delta.text}
                          </p>
                          <p className="text-[10px] text-white/25">
                            {current.toFixed(1)}ms vs {base.toFixed(1)}ms
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Local baseline delta */}
              {currentLocalBaseline && (
                <div className="rounded border border-violet-500/12 bg-violet-500/4 p-3 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-violet-400/50">
                    Delta vs Local Baseline
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { label: "Min", current: results.minMs, base: currentLocalBaseline.minMs },
                        { label: "Avg", current: results.avgMs, base: currentLocalBaseline.avgMs },
                        { label: "P95", current: results.p95Ms, base: currentLocalBaseline.p95Ms },
                        { label: "Max", current: results.maxMs, base: currentLocalBaseline.maxMs },
                      ] as const
                    ).map(({ label, current, base }) => {
                      const delta = fmtDelta(current, base);
                      return (
                        <div key={label} className="rounded border border-white/6 bg-white/2 p-2">
                          <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
                            {label}
                          </p>
                          <p
                            className={`text-sm font-mono font-semibold ${
                              delta.neutral
                                ? "text-white/40"
                                : delta.positive
                                ? "text-emerald-400/80"
                                : "text-red-400/80"
                            }`}
                          >
                            {delta.text}
                          </p>
                          <p className="text-[10px] text-white/25">
                            {current.toFixed(1)}ms vs {base.toFixed(1)}ms
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {results.findings.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">
                    Findings
                  </p>
                  <FindingsList findings={results.findings} />
                </div>
              )}

              {/* Baseline CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Server baseline */}
                <button
                  onClick={handleSaveServerBaseline}
                  disabled={serverBaselineSaving}
                  className="rounded border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-[11px] font-mono text-emerald-300/70 hover:text-emerald-200/90 hover:border-emerald-500/35 disabled:opacity-40 transition-colors"
                >
                  {serverBaselineSaving
                    ? "Saving…"
                    : serverBaseline
                    ? "Update server baseline"
                    : "Save server baseline"}
                </button>

                {/* Local baseline */}
                <button
                  onClick={handleSetLocalBaseline}
                  className="rounded border border-violet-500/20 bg-violet-500/8 px-3 py-1.5 text-[11px] font-mono text-violet-300/70 hover:text-violet-200/90 hover:border-violet-500/35 transition-colors"
                >
                  {currentLocalBaseline ? "Update local baseline" : "Set local baseline"}
                </button>

                {(baselineMsg || serverBaselineMsg) && (
                  <p className="text-[11px] text-white/35 font-mono">
                    {serverBaselineMsg ?? baselineMsg}
                  </p>
                )}
              </div>
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
            <div className="flex items-center gap-2">
              <span className={serverBaseline ? "text-emerald-400" : "text-white/20"}>
                {serverBaseline ? "✓" : "○"}
              </span>
              <span className="text-white/50">
                {serverBaseline ? "Server baseline set" : "No server baseline"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={currentLocalBaseline ? "text-violet-400" : "text-white/20"}>
                {currentLocalBaseline ? "✓" : "○"}
              </span>
              <span className="text-white/50">
                {currentLocalBaseline ? "Local baseline set" : "No local baseline"}
              </span>
            </div>
            {regression?.isRegressed && (
              <div className="flex items-center gap-2">
                <span className="text-red-400">✗</span>
                <span className="text-red-400/70">
                  Regression: +{regression.deltaPct}% vs server
                </span>
              </div>
            )}
          </div>
        }
        actionsSlot={
          saveMsg ? (
            <p className="text-[11px] text-white/40 font-mono">{saveMsg}</p>
          ) : (
            <p className="text-[11px] text-white/20 italic">
              Run and save to capture a ResearchRun.
            </p>
          )
        }
      />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
