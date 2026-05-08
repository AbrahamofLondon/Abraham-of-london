"use client";

/**
 * Shows what the system learned from this stage — real intelligence, not copy.
 * Reads from the intelligence spine to show actual computed findings.
 */

type Finding = { label: string; value: string };

type Props = {
  stage: string;
  findings: Finding[];
  className?: string;
};

export default function IntelligenceGainPanel({ stage, findings, className = "" }: Props) {
  if (findings.length === 0) return null;

  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-3">
        What the system now knows
      </div>
      <div className="space-y-2">
        {findings.map((f) => (
          <div key={f.label} className="flex gap-3 text-sm">
            <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wide shrink-0 w-32">
              {f.label}
            </span>
            <span className="text-zinc-300">{f.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-zinc-600">
        Stage: {stage}
      </div>
    </div>
  );
}
