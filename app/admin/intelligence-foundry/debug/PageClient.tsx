// app/admin/intelligence-foundry/debug/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";

type ModuleStatusReport = {
  moduleId: string;
  declaredStatus: string;
  computedStatus: string;
  routeExists: boolean;
  engineCallable: boolean;
  reason: string;
};

type DebugData = {
  moduleRegistry: {
    total: number;
    wiredClaimed: number;
    wiredActual: number;
    statusMismatches: ModuleStatusReport[];
    allStatuses: ModuleStatusReport[];
  };
  engineRegistry: { total: number; callable: number; needsWrap: number };
  health: { total: number; criticalUnresolved: number; byStatus: Record<string, number>; bySeverity: Record<string, number> };
  honestyConstitution: { status: string; laws: number; enforced: string[] };
  enforcement: Record<string, boolean>;
};

export default function FoundryDebugPage() {
  const isDev = process.env.NODE_ENV === "development";
  const [data, setData] = React.useState<DebugData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isDev) return;
    fetch("/api/admin/intelligence-foundry/debug")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setData(d.debug); else setError(d.error ?? "Failed"); })
      .catch(() => setError("Network error"));
  }, [isDev]);

  if (!isDev) {
    return (
      <div className="p-6">
        <p className="text-sm text-white/30">Debug surface is only available in development mode.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Foundry Debug</h1>
        <p className="text-sm text-white/35">Development only — computed module statuses, enforcement flags, registry state.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}

      {!data && !error && (
        <p className="text-xs text-white/25 animate-pulse">Loading debug data…</p>
      )}

      {data && (
        <>
          {data.moduleRegistry.statusMismatches.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/70">
                Status Mismatches ({data.moduleRegistry.statusMismatches.length}) — Declared ≠ Computed
              </p>
              <div className="space-y-2">
                {data.moduleRegistry.statusMismatches.map((r) => (
                  <div key={r.moduleId} className="text-xs font-mono space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white/40 w-44 truncate">{r.moduleId}</span>
                      <span className="text-white/25 line-through">{r.declaredStatus}</span>
                      <span className="text-white/10">→</span>
                      <span className="text-amber-400">{r.computedStatus}</span>
                    </div>
                    <p className="text-white/20 pl-44">{r.reason}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-400/50">
                Declared WIRED: {data.moduleRegistry.wiredClaimed} · Computed WIRED: {data.moduleRegistry.wiredActual}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">
              Module Registry — Computed Statuses ({data.moduleRegistry.total})
            </p>
            <div className="space-y-1">
              {data.moduleRegistry.allStatuses.map((r) => (
                <div key={r.moduleId} className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-white/25 w-48 truncate">{r.moduleId}</span>
                  <span className={`text-[10px] ${
                    r.computedStatus === "WIRED" ? "text-emerald-400" :
                    r.computedStatus === "DEMO" ? "text-purple-400" :
                    r.computedStatus === "PLANNED" ? "text-white/20" :
                    "text-amber-400/70"
                  }`}>
                    {r.computedStatus}
                  </span>
                  {r.declaredStatus !== r.computedStatus && (
                    <span className="text-white/15 line-through text-[10px]">{r.declaredStatus}</span>
                  )}
                  <span className={`text-[10px] ${r.routeExists ? "text-emerald-400/40" : "text-red-400/40"}`}>
                    {r.routeExists ? "route✓" : "route✗"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">Engine Registry ({data.engineRegistry.total})</p>
            <div className="text-xs font-mono text-white/40 space-y-1">
              <p>Callable: <span className="text-emerald-400">{data.engineRegistry.callable}</span></p>
              <p>Needs wrap: <span className="text-amber-400">{data.engineRegistry.needsWrap}</span></p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">Enforcement Flags</p>
            <div className="text-xs font-mono space-y-1">
              {Object.entries(data.enforcement).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={v ? "text-emerald-400" : "text-red-400"}>{v ? "✓" : "✗"}</span>
                  <span className="text-white/40">{k}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/2 p-5 space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/25">Health Snapshot</p>
            <div className="text-xs font-mono text-white/40 space-y-1">
              <p>Total active runs: {data.health.total}</p>
              <p>Critical unresolved: <span className={data.health.criticalUnresolved > 0 ? "text-red-400" : "text-emerald-400"}>{data.health.criticalUnresolved}</span></p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
