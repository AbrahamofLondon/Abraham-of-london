"use client";

/**
 * Shows what action is now required, what evidence supports it,
 * and what proves progress. Consumes real engine output.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Props = {
  requiredAction: string | null;
  whyThisAction: string | null;
  whatProvesProgress: string | null;
  whatHappensNext: string | null;
  evidenceBasis?: string[];
  className?: string;
  variant?: LivingThemeVariant;
};

export default function GovernedActionPanel({
  requiredAction,
  whyThisAction,
  whatProvesProgress,
  whatHappensNext,
  evidenceBasis,
  className = "",
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);
  if (!requiredAction) return null;

  return (
    <div className={`p-5 ${className}`} style={{ border: `1px solid ${theme.amber}22`, backgroundColor: variant === 'dark' ? 'rgba(251,191,36,0.03)' : 'rgba(180,130,30,0.04)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.amber }}>
        Required action
      </div>

      <p className="text-base leading-7 mb-4" style={{ color: theme.heading }}>
        {requiredAction}
      </p>

      {whyThisAction && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            Why this action
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whyThisAction}</p>
        </div>
      )}

      {whatProvesProgress && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            What proves progress
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whatProvesProgress}</p>
        </div>
      )}

      {whatHappensNext && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            What happens next
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whatHappensNext}</p>
        </div>
      )}

      {evidenceBasis && evidenceBasis.length > 0 && (
        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.dim }}>
            Evidence basis
          </div>
          {evidenceBasis.map((e, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.muted }}>{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}