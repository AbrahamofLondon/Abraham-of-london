"use client";

import type { EngineRegistryEntry, EngineStatus } from "@/lib/research/engine-adapter-contract";

const ENGINE_STATUS_STYLES: Record<EngineStatus, { label: string; className: string }> = {
  PRODUCTION_CALLABLE:    { label: "Callable",       className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" },
  PRODUCTION_NEEDS_WRAP:  { label: "Needs Adapter",  className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  DOCUMENTATION_ONLY:     { label: "Docs Only",       className: "bg-white/5 text-white/30 border border-white/10" },
  HUMAN_PROCESS:          { label: "Human Process",   className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  DECOMMISSIONED:         { label: "Decommissioned",  className: "bg-red-500/5 text-red-400/40 border border-red-500/10 line-through" },
};

export function EngineStatusCard({
  engine,
  onRequestAdapter,
}: {
  engine: EngineRegistryEntry;
  onRequestAdapter?: (engineId: string) => void;
}) {
  const styleConfig = ENGINE_STATUS_STYLES[engine.status];
  const isCallable = engine.status === "PRODUCTION_CALLABLE";

  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-white/75">{engine.name}</h3>
          <p className="text-[11px] text-white/30 font-mono">{engine.id} · v{engine.version}</p>
        </div>
        <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-mono ${styleConfig.className}`}>
          {styleConfig.label}
        </span>
      </div>

      <p className="text-xs text-white/50">{engine.description}</p>

      {engine.limitationReason && (
        <div className="rounded border border-amber-500/15 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] text-amber-400/70">{engine.limitationReason}</p>
        </div>
      )}

      {engine.adapterRequired && (
        <div className="rounded border border-white/8 bg-white/2 px-3 py-2">
          <p className="text-[10px] font-mono text-white/25 uppercase mb-1">Adapter required</p>
          <p className="text-[11px] text-white/40 font-mono">{engine.adapterRequired}</p>
        </div>
      )}

      {!isCallable && onRequestAdapter && engine.status !== "DECOMMISSIONED" && (
        <button
          onClick={() => onRequestAdapter(engine.id)}
          className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/60 hover:border-white/25 transition-colors"
        >
          Request Adapter
        </button>
      )}
    </div>
  );
}
