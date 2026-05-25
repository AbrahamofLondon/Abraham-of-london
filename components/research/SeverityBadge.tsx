"use client";

import type { RunSeverity } from "@/lib/research/foundry-contract";

const SEVERITY_STYLES: Record<RunSeverity, { className: string }> = {
  INFO:     { className: "bg-white/5 text-white/30 border border-white/10" },
  LOW:      { className: "bg-sky-500/10 text-sky-400 border border-sky-500/20" },
  MEDIUM:   { className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" },
  HIGH:     { className: "bg-orange-500/10 text-orange-400 border border-orange-500/30" },
  CRITICAL: { className: "bg-red-500/15 text-red-400 border border-red-500/40 font-semibold" },
};

export function SeverityBadge({ severity }: { severity: RunSeverity }) {
  const config = SEVERITY_STYLES[severity] ?? { className: "bg-white/5 text-white/30 border border-white/10" };
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${config.className}`}>
      {severity}
    </span>
  );
}
