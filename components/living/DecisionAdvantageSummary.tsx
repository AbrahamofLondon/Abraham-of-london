"use client";

/**
 * Shows the unfair advantage the user now has — what the system sees that others can't.
 */

type Advantage = {
  label: string;
  description: string;
};

type Props = {
  advantages: Advantage[];
  confidenceBand?: "low" | "medium" | "high" | null;
  limitations?: string[];
  className?: string;
};

export default function DecisionAdvantageSummary({
  advantages,
  confidenceBand,
  limitations,
  className = "",
}: Props) {
  if (advantages.length === 0) return null;

  return (
    <div className={`border border-amber-500/15 bg-amber-500/[0.03] p-4 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-3">
        Your decision advantage
      </div>

      <div className="space-y-3 mb-4">
        {advantages.map((a) => (
          <div key={a.label}>
            <div className="text-sm font-medium text-zinc-200">{a.label}</div>
            <div className="text-sm text-zinc-400 leading-6">{a.description}</div>
          </div>
        ))}
      </div>

      {confidenceBand && (
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
            Confidence:
          </span>
          <span className={`font-mono text-[10px] uppercase ${
            confidenceBand === "high" ? "text-emerald-400/70" :
            confidenceBand === "medium" ? "text-amber-400/70" :
            "text-zinc-500"
          }`}>
            {confidenceBand}
          </span>
        </div>
      )}

      {limitations && limitations.length > 0 && (
        <div className="border-t border-white/8 pt-3 mt-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
            Limitations
          </div>
          {limitations.map((l, i) => (
            <div key={i} className="text-xs text-zinc-500 leading-5">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
