"use client";

/**
 * Shows the user's decision memory — what the system remembers
 * from prior interactions and how it compounds intelligence.
 */

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
};

export default function OutcomeMemoryPreview({
  entries,
  dominantPattern,
  escalationTrend,
  className = "",
}: Props) {
  if (entries.length === 0) return null;

  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-3">
        Decision memory
      </div>

      <div className="space-y-2 mb-3">
        {entries.slice(0, 5).map((entry, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <span className="text-zinc-600 font-mono text-[9px] uppercase tracking-wide shrink-0 w-24">
              {entry.stage}
            </span>
            <span className="text-zinc-400 flex-1">{entry.finding}</span>
            <span className="text-zinc-600 font-mono text-[9px] shrink-0">
              {entry.date}
            </span>
          </div>
        ))}
      </div>

      {(dominantPattern || escalationTrend) && (
        <div className="border-t border-white/8 pt-3 flex gap-4">
          {dominantPattern && (
            <div>
              <span className="font-mono text-[9px] text-zinc-600 uppercase">Pattern: </span>
              <span className="text-sm text-zinc-400">{dominantPattern}</span>
            </div>
          )}
          {escalationTrend && escalationTrend !== "insufficient_data" && (
            <div>
              <span className="font-mono text-[9px] text-zinc-600 uppercase">Trend: </span>
              <span className={`text-sm ${
                escalationTrend === "rising" ? "text-red-400/70" :
                escalationTrend === "falling" ? "text-emerald-400/70" :
                "text-zinc-400"
              }`}>
                {escalationTrend}
              </span>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-zinc-600 leading-5">
        The system remembers prior readings. Each return visit builds a deeper, more accurate picture.
      </p>
    </div>
  );
}
