"use client";

/**
 * Shows the unfair advantage the user now has — what the system sees that others can't.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Advantage = {
  label: string;
  description: string;
};

type Props = {
  advantages: Advantage[];
  confidenceBand?: "low" | "medium" | "high" | null;
  limitations?: string[];
  className?: string;
  variant?: LivingThemeVariant;
};

export default function DecisionAdvantageSummary({
  advantages,
  confidenceBand,
  limitations,
  className = "",
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);
  if (advantages.length === 0) return null;

  const confidenceColor = confidenceBand === "high" ? theme.emerald :
    confidenceBand === "medium" ? theme.amber :
    theme.muted;

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.accent}22`, backgroundColor: variant === 'dark' ? 'rgba(201,169,110,0.03)' : 'rgba(138,106,47,0.04)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
        Your decision advantage
      </div>

      <div className="space-y-3 mb-4">
        {advantages.map((a) => (
          <div key={a.label}>
            <div className="text-sm font-medium" style={{ color: theme.heading }}>{a.label}</div>
            <div className="text-sm leading-6" style={{ color: theme.body }}>{a.description}</div>
          </div>
        ))}
      </div>

      {confidenceBand && (
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: theme.muted }}>
            Confidence:
          </span>
          <span className="font-mono text-[10px] uppercase" style={{ color: confidenceColor }}>
            {confidenceBand}
          </span>
        </div>
      )}

      {limitations && limitations.length > 0 && (
        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.dim }}>
            Limitations
          </div>
          {limitations.map((l, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.muted }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}