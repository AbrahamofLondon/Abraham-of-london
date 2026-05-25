"use client";

import type { ModuleStatus } from "@/lib/research/foundry-contract";

const STATUS_STYLES: Record<ModuleStatus, { label: string; className: string }> = {
  WIRED:          { label: "WIRED",          className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" },
  PARTIAL:        { label: "PARTIAL",        className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  ADAPTER_NEEDED: { label: "ADAPTER",        className: "bg-orange-500/10 text-orange-400 border border-orange-500/20" },
  DEMO:           { label: "DEMO",           className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  PLANNED:        { label: "PLANNED",        className: "bg-white/5 text-white/25 border border-white/10" },
  DEGRADED:       { label: "DEGRADED",       className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  DECOMMISSIONED: { label: "DECOMMISSIONED", className: "bg-red-500/5 text-red-400/40 border border-red-500/10 line-through" },
  DEPRECATED:     { label: "DEPRECATED",     className: "bg-white/5 text-white/20 border border-white/5 line-through" },
};

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  const config = STATUS_STYLES[status] ?? { label: status, className: "bg-white/5 text-white/30 border border-white/10" };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono ${config.className}`}>
      {config.label}
    </span>
  );
}
