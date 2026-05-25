"use client";

import * as React from "react";

type DeltaField = {
  label: string;
  baseline: string | number | null | undefined;
  current: string | number | null | undefined;
};

export function ComparisonDelta({
  fields,
  title = "Baseline vs Current",
}: {
  fields: DeltaField[];
  title?: string;
}) {
  const changed = fields.filter((f) => String(f.baseline ?? "") !== String(f.current ?? ""));

  return (
    <div className="rounded-lg border border-white/10 bg-white/2 p-4">
      <p className="mb-3 text-[11px] font-mono uppercase tracking-wider text-white/35">{title}</p>

      {fields.length === 0 && (
        <p className="text-xs text-white/25 italic">No fields to compare.</p>
      )}

      {changed.length === 0 && fields.length > 0 && (
        <p className="text-xs text-emerald-400/60">No drift detected — baseline matches current.</p>
      )}

      <div className="space-y-2">
        {fields.map((field) => {
          const isDifferent = String(field.baseline ?? "") !== String(field.current ?? "");
          return (
            <div key={field.label} className="grid grid-cols-[120px_1fr_1fr] gap-2 text-xs">
              <span className="text-white/30 font-mono text-[11px] truncate">{field.label}</span>
              <span className="text-white/40 truncate">{String(field.baseline ?? "—")}</span>
              <span className={isDifferent ? "text-amber-400 truncate" : "text-white/40 truncate"}>
                {isDifferent && <span className="mr-1">→</span>}
                {String(field.current ?? "—")}
              </span>
            </div>
          );
        })}
      </div>

      {changed.length > 0 && (
        <p className="mt-3 text-[11px] text-amber-400/60 font-mono">
          {changed.length} field{changed.length > 1 ? "s" : ""} changed from baseline
        </p>
      )}
    </div>
  );
}
