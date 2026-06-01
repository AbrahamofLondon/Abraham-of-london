"use client";

/**
 * Shows the user's decision memory — what the system remembers
 * from prior interactions and how it compounds intelligence.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type MemoryEntry = {
  stage: string;
  date: string;
  finding: string;
};

type Props = {
  entries: MemoryEntry[];
  dominantPattern?: string | null;
  escalationTrend?: "stable" | "rising" | "falling" | "insufficient_data" | null;
  className?: string;
  variant?: LivingThemeVariant;
};

export default function OutcomeMemoryPreview({
  entries,
  dominantPattern,
  escalationTrend,
  className = "",
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);
  if (entries.length === 0) return null;

  const trendColor = escalationTrend === "rising" ? theme.red :
    escalationTrend === "falling" ? theme.emerald :
    theme.body;

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
        Decision memory
      </div>

      <div className="space-y-2 mb-3">
        {entries.slice(0, 5).map((entry, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="font-mono text-[9px] uppercase tracking-wide shrink-0 w-24" style={{ color: theme.dim }}>
              {entry.stage}
            </span>
            <span className="flex-1" style={{ color: theme.body }}>{entry.finding}</span>
            <span className="font-mono text-[9px] shrink-0" style={{ color: theme.dim }}>
              {entry.date}
            </span>
          </div>
        ))}
      </div>

      {(dominantPattern || escalationTrend) && (
        <div className="flex gap-4 pt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          {dominantPattern && (
            <div>
              <span className="font-mono text-[9px] uppercase" style={{ color: theme.dim }}>Pattern: </span>
              <span className="text-sm" style={{ color: theme.body }}>{dominantPattern}</span>
            </div>
          )}
          {escalationTrend && escalationTrend !== "insufficient_data" && (
            <div>
              <span className="font-mono text-[9px] uppercase" style={{ color: theme.dim }}>Trend: </span>
              <span className="text-sm" style={{ color: trendColor }}>{escalationTrend}</span>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs leading-5" style={{ color: theme.dim }}>
        The system remembers prior readings. Each return visit builds a deeper, more accurate picture.
      </p>
    </div>
  );
}