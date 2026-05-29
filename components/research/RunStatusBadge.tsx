"use client";

import type { RunStatus } from "@/lib/research/foundry-contract";

const STATUS_STYLES: Record<RunStatus, { label: string; className: string }> = {
  PENDING:                  { label: "Pending",            className: "bg-white/5 text-white/40 border border-white/10" },
  PROCESSING:               { label: "Processing",         className: "bg-blue-500/8 text-blue-300/70 border border-blue-500/15 animate-pulse" },
  IN_PROGRESS:              { label: "In Progress",        className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  COMPLETE:                 { label: "Complete",           className: "bg-green-500/10 text-green-400 border border-green-500/20" },
  RECORDED:                 { label: "Recorded",           className: "bg-teal-500/10 text-teal-400 border border-teal-500/20" },
  ACTION_REQUIRED:          { label: "Action Required",    className: "bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold" },
  OWNER_DECISION_REQUIRED:  { label: "Owner Decision",     className: "bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold" },
  REVIEWED:                 { label: "Reviewed",           className: "bg-sky-500/10 text-sky-400 border border-sky-500/20" },
  IMPLEMENTED:              { label: "Implemented",        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  DEFERRED:                 { label: "Deferred",           className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  FAILED:                   { label: "Failed",             className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  ARCHIVED:                 { label: "Archived",           className: "bg-white/5 text-white/20 border border-white/5" },
  // Maturity-aware statuses (Phase 3)
  SIMULATION_RECORDED:      { label: "Simulation",         className: "bg-purple-500/10 text-purple-400/80 border border-purple-500/20" },
  PILOT_RECORDED:           { label: "Pilot",              className: "bg-violet-500/10 text-violet-400/80 border border-violet-500/20" },
  PARTIAL:                  { label: "Partial",            className: "bg-amber-500/10 text-amber-400/70 border border-amber-500/15" },
  SKIPPED:                  { label: "Skipped",            className: "bg-white/5 text-white/30 border border-white/8" },
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const config = STATUS_STYLES[status] ?? { label: status, className: "bg-white/5 text-white/30 border border-white/10" };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono ${config.className}`}>
      {config.label}
    </span>
  );
}
