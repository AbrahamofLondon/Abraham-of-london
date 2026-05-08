"use client";

/**
 * Shows what action is now required, what evidence supports it,
 * and what proves progress. Consumes real engine output.
 */

type Props = {
  requiredAction: string | null;
  whyThisAction: string | null;
  whatProvesProgress: string | null;
  whatHappensNext: string | null;
  evidenceBasis?: string[];
  className?: string;
};

export default function GovernedActionPanel({
  requiredAction,
  whyThisAction,
  whatProvesProgress,
  whatHappensNext,
  evidenceBasis,
  className = "",
}: Props) {
  if (!requiredAction) return null;

  return (
    <div className={`border border-amber-500/20 bg-amber-500/[0.03] p-5 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/70 mb-3">
        Required action
      </div>

      <p className="text-base leading-7 text-white/85 mb-4">
        {requiredAction}
      </p>

      {whyThisAction && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
            Why this action
          </div>
          <p className="text-sm leading-6 text-zinc-400">{whyThisAction}</p>
        </div>
      )}

      {whatProvesProgress && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
            What proves progress
          </div>
          <p className="text-sm leading-6 text-zinc-400">{whatProvesProgress}</p>
        </div>
      )}

      {whatHappensNext && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500 mb-1">
            What happens next
          </div>
          <p className="text-sm leading-6 text-zinc-400">{whatHappensNext}</p>
        </div>
      )}

      {evidenceBasis && evidenceBasis.length > 0 && (
        <div className="border-t border-white/8 pt-3 mt-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-600 mb-1">
            Evidence basis
          </div>
          {evidenceBasis.map((e, i) => (
            <div key={i} className="text-xs text-zinc-500 leading-5">{e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
