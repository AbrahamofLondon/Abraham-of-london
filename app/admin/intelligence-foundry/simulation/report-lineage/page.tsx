// app/admin/intelligence-foundry/simulation/report-lineage/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChainStatus = "COMPLETE" | "PARTIAL" | "BROKEN";

type SimulatedEvent = {
  eventType: string;
  canonicalRecord: string;
  sourceSurface: string;
  adminOwnerSurface: string;
  foundryModule?: string;
  requiredActorRole: string;
  downstreamEffects: string[];
  auditRequired: boolean;
  lineageRequired: boolean;
  registrySource: {
    productSurface?: string;
    canonicalRecord?: string;
    governanceEvent?: string;
    operatingSpineEntry?: string;
  };
};

type Gap = {
  gapType: string;
  severity: string;
  eventType: string;
  explanation: string;
  recommendation: string;
  sourceRule: string;
};

type Finding = {
  title: string;
  description: string;
  severity: string;
  source: string;
  recommendation: string;
};

type ChainResult = {
  chainId: string;
  title: string;
  status: ChainStatus;
  events: SimulatedEvent[];
  gaps: Gap[];
  findings: Finding[];
  researchRunRecommended: boolean;
};

type ChainSummary = {
  chainId: string;
  title: string;
  status: ChainStatus;
  eventCount: number;
  gapCount: number;
  findingCount: number;
  researchRunRecommended: boolean;
};

// ─── Styling ──────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ChainStatus, string> = {
  COMPLETE: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20",
  PARTIAL: "bg-amber-400/12 text-amber-300 border border-amber-400/20",
  BROKEN: "bg-red-500/15 text-red-300 border border-red-500/20",
};

const STATUS_DOT: Record<ChainStatus, string> = {
  COMPLETE: "bg-emerald-400",
  PARTIAL: "bg-amber-400",
  BROKEN: "bg-red-500",
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "bg-red-500/15 text-red-300 border-red-500/20",
  HIGH: "bg-orange-500/12 text-orange-300 border-orange-500/20",
  MEDIUM: "bg-amber-400/10 text-amber-300 border-amber-400/15",
  LOW: "bg-white/5 text-white/50 border-white/10",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportLineageSimulationPage() {
  const [chains, setChains] = React.useState<ChainSummary[]>([]);
  const [selectedChain, setSelectedChain] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ChainResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load chain list on mount
  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/lineage/simulate")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setChains(data.chains);
      })
      .catch(() => {});
  }, []);

  const handleRunChain = async (chainId: string) => {
    setLoading(true);
    setError(null);
    setSelectedChain(chainId);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/lineage/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chainId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Simulation failed");
      } else {
        setResult(data.result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setLoading(false);
  };

  const handleRunAll = async () => {
    setLoading(true);
    setError(null);
    setSelectedChain(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/lineage/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Simulation failed");
      } else {
        // Show first result
        setResult(data.results?.[0] ?? null);
        setSelectedChain(data.results?.[0]?.chainId ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Report Lineage Simulation</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Runtime proof of the governed product operating architecture. Simulates governance event chains
          and validates them against the Pass 1 registries. Missing coverage creates source-backed gaps
          and FoundryFindings.
        </p>
      </div>

      {/* Chain selector */}
      <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Lineage Chains</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRunAll}
            disabled={loading}
            className="rounded-lg border border-white/10 bg-white/3 px-3 py-1.5 text-[11px] text-white/50 hover:text-white/70 hover:border-white/20 transition-all disabled:opacity-40"
          >
            Run All
          </button>
          {chains.map((chain) => (
            <button
              key={chain.chainId}
              onClick={() => handleRunChain(chain.chainId)}
              disabled={loading}
              className={[
                "rounded-lg border px-3 py-1.5 text-[11px] transition-all disabled:opacity-40",
                selectedChain === chain.chainId
                  ? "border-amber-400/35 bg-amber-400/7 text-amber-300/80"
                  : "border-white/8 bg-white/2 text-white/40 hover:border-white/15 hover:text-white/60",
              ].join(" ")}
            >
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[chain.status]}`} />
                {chain.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}

      {/* Simulation result */}
      {result && (
        <div className="space-y-6">
          {/* Chain status banner */}
          <div className={`rounded-lg border p-4 ${
            result.status === "COMPLETE" ? "border-emerald-400/25 bg-emerald-400/5"
            : result.status === "PARTIAL" ? "border-amber-400/20 bg-amber-400/5"
            : "border-red-500/20 bg-red-500/5"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest ${STATUS_STYLE[result.status]}`}>
                {result.status}
              </span>
              <span className="text-xs text-white/40 font-mono">
                {result.events.length} events · {result.gaps.length} gaps · {result.findings.length} findings
              </span>
            </div>
            <p className="text-sm text-white/60">{result.title}</p>
            {result.researchRunRecommended && (
              <p className="mt-2 text-[11px] text-amber-400/60 font-mono">
                ⚠ ResearchRun recommended — findings require action
              </p>
            )}
          </div>

          {/* Event sequence timeline */}
          <div className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-2">Event Sequence Timeline</p>
            {result.events.map((event, i) => (
              <div key={event.eventType} className="flex gap-3">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                    event.auditRequired ? "bg-amber-400/60" : "bg-white/20"
                  }`} />
                  {i < result.events.length - 1 && <div className="w-px flex-1 bg-white/8" />}
                </div>
                {/* Event card */}
                <div className="flex-1 pb-4">
                  <div className="rounded-lg border border-white/8 bg-white/2 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-amber-300/80">{event.eventType}</span>
                      <span className="text-[9px] text-white/20 font-mono">{event.canonicalRecord}</span>
                      <span className="ml-auto text-[9px] text-white/15 font-mono">{event.requiredActorRole}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded ${event.auditRequired ? "bg-amber-400/10 text-amber-400/60" : "bg-white/5 text-white/25"}`}>
                        {event.auditRequired ? "audit" : "no-audit"}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded ${event.lineageRequired ? "bg-emerald-400/10 text-emerald-400/60" : "bg-white/5 text-white/25"}`}>
                        {event.lineageRequired ? "lineage" : "no-lineage"}
                      </span>
                      {event.foundryModule && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-400/60">
                          {event.foundryModule}
                        </span>
                      )}
                    </div>
                    {/* Registry proof */}
                    <div className="border-t border-white/5 pt-1.5 mt-1 space-y-0.5">
                      <p className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Registry sources</p>
                      {event.registrySource.productSurface && (
                        <p className="text-[9px] font-mono text-white/30">· {event.registrySource.productSurface}</p>
                      )}
                      {event.registrySource.canonicalRecord && (
                        <p className="text-[9px] font-mono text-white/30">· {event.registrySource.canonicalRecord}</p>
                      )}
                      {event.registrySource.governanceEvent && (
                        <p className="text-[9px] font-mono text-white/30">· {event.registrySource.governanceEvent}</p>
                      )}
                    </div>
                    {/* Downstream effects */}
                    {event.downstreamEffects.length > 0 && (
                      <div className="border-t border-white/5 pt-1.5 mt-1">
                        <p className="text-[8px] font-mono text-white/15 uppercase tracking-wider">Downstream</p>
                        <p className="text-[9px] font-mono text-white/30">{event.downstreamEffects.join(" → ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Gaps panel */}
          {result.gaps.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Coverage Gaps ({result.gaps.length})</p>
              {result.gaps.map((gap, i) => (
                <div key={i} className={`rounded-lg border p-3 ${SEVERITY_STYLE[gap.severity] ?? "border-white/10 bg-white/2"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider">{gap.gapType}</span>
                    <span className="text-[9px] font-mono text-white/30">· {gap.severity}</span>
                    <span className="text-[9px] font-mono text-white/20 ml-auto">{gap.eventType}</span>
                  </div>
                  <p className="text-[11px] text-white/60 mb-1">{gap.explanation}</p>
                  <p className="text-[10px] text-white/30 font-mono">→ {gap.recommendation}</p>
                  <p className="text-[8px] text-white/15 font-mono mt-1">source: {gap.sourceRule}</p>
                </div>
              ))}
            </div>
          )}

          {/* Findings panel */}
          {result.findings.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Findings ({result.findings.length})</p>
              {result.findings.map((finding, i) => (
                <div key={i} className={`rounded-lg border p-3 ${SEVERITY_STYLE[finding.severity] ?? "border-white/10 bg-white/2"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium">{finding.title}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      finding.severity === "CRITICAL" ? "bg-red-500/20 text-red-300"
                      : finding.severity === "HIGH" ? "bg-orange-500/15 text-orange-300"
                      : "bg-amber-400/10 text-amber-300"
                    }`}>{finding.severity}</span>
                  </div>
                  <p className="text-[11px] text-white/50 mb-1">{finding.description}</p>
                  <p className="text-[10px] text-white/30 font-mono">→ {finding.recommendation}</p>
                  <p className="text-[8px] text-white/15 font-mono mt-1">source: {finding.source}</p>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {result.researchRunRecommended && (
              <button
                className="rounded-lg border border-amber-400/25 bg-amber-400/5 px-4 py-2 text-xs text-amber-300/80 hover:bg-amber-400/10 transition-all"
                onClick={() => alert("ResearchRun creation would go through ResearchRunRepository. This is wired in the simulation page for the next pass.")}
              >
                Create ResearchRun
              </button>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-8 text-center">
          <p className="text-sm text-white/30">Select a lineage chain above to simulate.</p>
          <p className="text-xs text-white/20 mt-1">
            Each chain validates events against governance-event-types, records against canonical-record-registry,
            surfaces against product-ladder-registry, and admin owners against admin-domain-registry.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-white/8 bg-white/2 p-8 text-center">
          <p className="text-sm text-white/30 font-mono">Simulating...</p>
        </div>
      )}
    </div>
  );
}
