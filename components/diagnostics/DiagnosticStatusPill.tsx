/* components/diagnostics/DiagnosticStatusPill.tsx */

import * as React from "react";

export default function DiagnosticStatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : tone === "warn"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : tone === "bad"
      ? "border-red-500/20 bg-red-500/10 text-red-300"
      : "border-white/10 bg-white/[0.04] text-white/60";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] ${cls}`}
    >
      {label}
    </span>
  );
}