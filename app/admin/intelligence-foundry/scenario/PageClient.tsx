"use client";
// app/admin/intelligence-foundry/scenario/page.tsx
// Scenario Workbench — select a callable engine, run it with custom inputs,
// inspect formula traces, and capture ResearchRuns.
// Status: PARTIAL — engine selection and run capture work. Baseline comparison
// and run-replay are deferred to v1.1.

import { useState, useEffect } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type EngineEntry = {
  id: string;
  name: string;
  status: string;
  description: string;
  version: string;
  limitationReason?: string;
};

type FormulaStep = {
  label: string;
  value: string | number;
};

type Finding = {
  category?: string;
  severity: "RED" | "AMBER" | "GREEN";
  message: string;
};

type RunResult = {
  engineId: string;
  version: string;
  score?: number;
  label?: string;
  findings: Finding[];
  formulaTrace: FormulaStep[];
  limitations: string[];
  metadata?: Record<string, unknown>;
};

type ResearchRun = {
  id: string;
  engineId: string;
  status: string;
  createdAt: string;
};

// ─── Engine payload templates ─────────────────────────────────────────────────

const PAYLOAD_TEMPLATES: Record<string, object> = {
  "fast-diagnostic": {
    purposeClarity: 65,
    decisionVelocity: 55,
    resourceAlignment: 45,
    externalSignalIntegration: 70,
    teamCohesion: 60,
    leadershipPresence: 50,
  },
  "market-response": {
    text: "We work with founders who have built evidence-based authority in their sector and want to communicate it without compromise. Book a diagnostic call.",
    platform: "linkedin-post",
    isHeadline: false,
  },
  "content-red-team": {
    text: "Our platform guarantees results and is trusted by thousands of leading organisations across the UK.",
    contentType: "marketing",
  },
  "security-red-team": {
    scope: "all",
  },
  "constitutional-diagnostic": {
    responses: {},
  },
};

const DEFAULT_PAYLOAD = "{}";

// ─── Components ───────────────────────────────────────────────────────────────

function SeverityChip({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    RED:   "bg-red-500/10 text-red-400 border border-red-500/20",
    AMBER: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    GREEN: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${styles[severity] ?? "bg-white/5 text-white/40"}`}>
      {severity}
    </span>
  );
}

function StatusChip({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PRODUCTION_CALLABLE:      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    PRODUCTION_NEEDS_WRAP:    "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    DOCUMENTATION_ONLY:       "bg-white/5 text-white/30 border border-white/10",
    PLACEHOLDER:              "bg-white/5 text-white/20 border border-white/8",
    DEMO:                     "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };
  const labels: Record<string, string> = {
    PRODUCTION_CALLABLE:   "Callable",
    PRODUCTION_NEEDS_WRAP: "Needs wrap",
    DOCUMENTATION_ONLY:    "Doc only",
    PLACEHOLDER:           "Placeholder",
    DEMO:                  "Demo",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${styles[status] ?? "bg-white/5 text-white/30"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// ─── API endpoint map ────────────────────────────────────────────────────────

function apiEndpointFor(engineId: string): string | null {
  const map: Record<string, string> = {
    // Core engines with dedicated run routes
    "fast-diagnostic":                    "/api/admin/intelligence-foundry/engines/fast-diagnostic/run",
    "strategy-room":                      "/api/admin/intelligence-foundry/engines/strategy-room/run",
    "boardroom-dossier":                  "/api/admin/intelligence-foundry/engines/boardroom-mode/run",
    "executive-reporting":                "/api/admin/intelligence-foundry/engines/executive-reporting/run",
    "executive-report-boardroom-bridge":  "/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run",
    // Specialist lab endpoints
    "market-response":                    "/api/admin/intelligence-foundry/market/analyze",
    "editorial-style-checker":            "/api/admin/intelligence-foundry/content/analyze",
    "outbound-policy-gate":               "/api/admin/intelligence-foundry/outbound/analyze",
    // Constitutional diagnostic
    "constitutional-diagnostic":          "/api/admin/intelligence-foundry/engines/constitutional-diagnostic/run",
    // Red-team endpoints
    "content-red-team":                   "/api/admin/intelligence-foundry/red-team/content/run",
    "security-red-team":                  "/api/admin/intelligence-foundry/red-team/security/run",
  };
  return map[engineId] ?? null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScenarioWorkbenchPage() {
  const [engines,      setEngines]      = useState<EngineEntry[]>([]);
  const [loadingList,  setLoadingList]  = useState(true);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [payload,      setPayload]      = useState(DEFAULT_PAYLOAD);
  const [payloadError, setPayloadError] = useState<string | null>(null);
  const [running,      setRunning]      = useState(false);
  const [runResult,    setRunResult]    = useState<RunResult | null>(null);
  const [savedRun,     setSavedRun]     = useState<ResearchRun | null>(null);
  const [runError,     setRunError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/intelligence-foundry/engines")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEngines(data.engines ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  function selectEngine(id: string) {
    setSelectedId(id);
    setRunResult(null);
    setSavedRun(null);
    setRunError(null);
    const template = PAYLOAD_TEMPLATES[id];
    setPayload(template ? JSON.stringify(template, null, 2) : DEFAULT_PAYLOAD);
    setPayloadError(null);
  }

  function validatePayload(): object | null {
    try {
      return JSON.parse(payload);
    } catch {
      setPayloadError("Invalid JSON — check syntax");
      return null;
    }
  }

  async function runScenario() {
    if (!selectedId) return;
    const parsedPayload = validatePayload();
    if (!parsedPayload) return;

    const endpoint = apiEndpointFor(selectedId);
    if (!endpoint) {
      setRunError(`No Foundry API endpoint registered for engine: ${selectedId}. Use the Engine Testing Range to request an adapter.`);
      return;
    }

    setRunning(true);
    setRunError(null);
    setRunResult(null);
    setSavedRun(null);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedPayload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "Run failed");
      setRunResult(data.result ?? data);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  const callable = engines.filter((e) => e.status === "PRODUCTION_CALLABLE");
  const nonCallable = engines.filter((e) => e.status !== "PRODUCTION_CALLABLE");
  const selected = engines.find((e) => e.id === selectedId);
  const hasEndpoint = selectedId ? Boolean(apiEndpointFor(selectedId)) : false;

  return (
    <div className="space-y-6 p-6 max-w-5xl">
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
            Scenario Workbench · PARTIAL
          </p>
          <span className="rounded px-1.5 py-0.5 text-[8px] font-mono uppercase bg-amber-500/10 text-amber-400/60 border border-amber-500/20">
            v1.0 — baseline comparison deferred
          </span>
        </div>
        <h1 className="text-xl font-semibold text-white/80">Scenario Workbench</h1>
        <p className="mt-1 text-sm text-white/40 max-w-xl">
          Select a callable engine, edit the input payload, run the scenario, and inspect
          formula traces. ResearchRun capture available for supported engines.
          Baseline locking and run replay are deferred to v1.1.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Engine selector panel */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
            Callable Engines ({callable.length})
          </p>
          {loadingList ? (
            <p className="text-xs text-white/25">Loading…</p>
          ) : (
            <>
              {callable.map((e) => (
                <button
                  key={e.id}
                  onClick={() => selectEngine(e.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    selectedId === e.id
                      ? "border-amber-400/25 bg-amber-400/5"
                      : "border-white/8 bg-white/[0.02] hover:border-white/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-medium text-white/70">{e.name}</p>
                    <StatusChip status={e.status} />
                  </div>
                  <p className="text-[10px] font-mono text-white/25">{e.id}</p>
                  {!apiEndpointFor(e.id) && (
                    <p className="text-[9px] text-amber-400/40 mt-1">No Foundry endpoint — adapter only</p>
                  )}
                </button>
              ))}
              {nonCallable.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[10px] font-mono uppercase text-white/20 cursor-pointer hover:text-white/35">
                    Non-callable ({nonCallable.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {nonCallable.map((e) => (
                      <div key={e.id} className="rounded-lg border border-white/5 bg-white/[0.01] p-2">
                        <p className="text-[10px] text-white/30">{e.name}</p>
                        <StatusChip status={e.status} />
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>

        {/* Scenario run panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              {/* Engine info */}
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex items-start gap-2 mb-2">
                  <StatusChip status={selected.status} />
                  <p className="text-xs font-medium text-white/65">{selected.name}</p>
                  <p className="text-[10px] font-mono text-white/25 ml-auto">v{selected.version}</p>
                </div>
                <p className="text-xs text-white/35 leading-relaxed">{selected.description}</p>
                {selected.limitationReason && (
                  <p className="text-[10px] text-amber-400/40 mt-2 leading-relaxed">
                    Limitation: {selected.limitationReason}
                  </p>
                )}
                {!hasEndpoint && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[10px] text-amber-400/50">
                      This engine has no Foundry API endpoint registered. Use the{" "}
                      <Link href="/admin/intelligence-foundry/engines" className="text-amber-400/70 hover:text-amber-400">
                        Engine Testing Range
                      </Link>{" "}
                      to run it or request an adapter.
                    </p>
                  </div>
                )}
              </div>

              {/* Payload editor */}
              {hasEndpoint && (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">Input Payload (JSON)</p>
                  <textarea
                    value={payload}
                    onChange={(e) => { setPayload(e.target.value); setPayloadError(null); }}
                    rows={8}
                    spellCheck={false}
                    className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/65 font-mono placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-y"
                  />
                  {payloadError && (
                    <p className="text-[10px] text-red-400">{payloadError}</p>
                  )}
                  <button
                    onClick={runScenario}
                    disabled={running}
                    className="rounded-lg px-4 py-2 text-sm font-medium bg-amber-400/10 text-amber-400 border border-amber-400/20 hover:bg-amber-400/15 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {running ? "Running…" : "Run Scenario"}
                  </button>
                </div>
              )}

              {/* Error */}
              {runError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-xs text-red-400">{runError}</p>
                </div>
              )}

              {/* Results */}
              {runResult && (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3 mb-2">
                      {runResult.label && (
                        <span className={`rounded px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                          runResult.label === "PASS" || runResult.label === "CLEAR" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          runResult.label === "FAIL" || runResult.label === "BLOCKED" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {runResult.label}
                        </span>
                      )}
                      {runResult.score !== undefined && (
                        <span className="text-sm font-mono text-white/60">Score: {runResult.score}</span>
                      )}
                      <p className="text-[10px] font-mono text-white/25 ml-auto">
                        {runResult.engineId} v{runResult.version}
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs text-white/40">
                      <span>{runResult.findings.filter((f) => f.severity === "RED").length} RED</span>
                      <span>{runResult.findings.filter((f) => f.severity === "AMBER").length} AMBER</span>
                      <span>{runResult.findings.filter((f) => f.severity === "GREEN").length} GREEN</span>
                    </div>
                  </div>

                  {/* Findings */}
                  {runResult.findings.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-mono uppercase text-white/20">Findings</p>
                      {runResult.findings.slice(0, 10).map((f, i) => (
                        <div key={i} className={`rounded-lg border p-3 ${f.severity === "RED" ? "border-red-500/20 bg-red-500/[0.04]" : f.severity === "AMBER" ? "border-amber-500/15 bg-amber-500/[0.03]" : "border-emerald-500/15 bg-emerald-500/[0.03]"}`}>
                          <div className="flex gap-2 mb-1">
                            <SeverityChip severity={f.severity} />
                            {f.category && <span className="text-[9px] font-mono text-white/25">{f.category}</span>}
                          </div>
                          <p className="text-xs text-white/55">{f.message}</p>
                        </div>
                      ))}
                      {runResult.findings.length > 10 && (
                        <p className="text-[10px] text-white/25">+{runResult.findings.length - 10} more findings</p>
                      )}
                    </div>
                  )}

                  {/* Formula trace */}
                  {runResult.formulaTrace?.length > 0 && (
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <p className="text-[10px] font-mono uppercase text-white/20 mb-2">Formula Trace</p>
                      <div className="space-y-1">
                        {runResult.formulaTrace.map((step, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-white/35">{step.label}</span>
                            <span className={`font-mono text-[10px] ${
                              String(step.value) === "FAIL" ? "text-red-400" :
                              String(step.value) === "PASS" ? "text-emerald-400/70" :
                              "text-white/50"
                            }`}>
                              {String(step.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save run */}
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <p className="text-[10px] font-mono uppercase text-white/20 mb-2">Capture</p>
                    <p className="text-xs text-white/30 mb-3">
                      ResearchRun capture is available from the dedicated simulation pages for supported engines.
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Link
                        href="/admin/intelligence-foundry/runs"
                        className="text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                      >
                        View Run Vault →
                      </Link>
                      <Link
                        href="/admin/intelligence-foundry/simulation/fast-diagnostic"
                        className="text-xs text-white/35 hover:text-white/55 transition-colors"
                      >
                        Fast Diagnostic Simulator →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/[0.02] p-8 text-center">
              <p className="text-sm text-white/30">Select an engine from the left to begin a scenario run.</p>
              <p className="text-xs text-white/20 mt-2">Only PRODUCTION_CALLABLE engines can be exercised here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Deferred capabilities */}
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">
          Deferred to v1.1
        </p>
        <ul className="space-y-1 text-xs text-white/30">
          <li>· Baseline locking — save a run as a named baseline and compare future runs against it</li>
          <li>· Drift detection — flag when a later run diverges from a locked baseline beyond a threshold</li>
          <li>· Run replay — re-run a saved ResearchRun with the same inputs against a newer engine version</li>
          <li>· Side-by-side comparison — run two engines against the same payload and compare outputs</li>
        </ul>
      </div>
    </div>
  );
}
