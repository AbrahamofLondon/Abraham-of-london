"use client";

/**
 * components/living/LivingStateNextActions.tsx
 *
 * Generic render of LivingStateObject.nextActions. The engine decides which
 * actions are admissible and which (if any) are safe to automate; this component
 * only displays them. It never implies an action is safe when the engine did not.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";
import type { LivingStateNextAction } from "@/lib/living-intelligence/living-state-object-contract";

type Props = {
  nextActions: LivingStateNextAction[];
  variant?: LivingThemeVariant;
  className?: string;
};

export default function LivingStateNextActions({
  nextActions,
  variant = "dark",
  className = "",
}: Props) {
  const theme = getLivingTheme(variant);
  if (nextActions.length === 0) return null;

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.accent }}>
        Next governed actions
      </div>
      <div className="space-y-3">
        {nextActions.map((action, i) => {
          const isStop = action.actionType === "do_not_proceed";
          return (
            <div key={`${action.actionType}-${i}`} className="pl-3" style={{ borderLeft: `2px solid ${isStop ? theme.red : theme.accent}` }}>
              <div className="text-sm font-medium" style={{ color: isStop ? theme.red : theme.heading }}>
                {action.label}
              </div>
              {action.description && (
                <p className="text-xs leading-5 mt-1" style={{ color: theme.body }}>
                  {action.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.dim }}>
                  Owner: {action.owner}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: action.safeToAutomate ? theme.emerald : theme.muted }}>
                  {action.safeToAutomate ? "Safe to automate" : "Requires human"}
                </span>
                {action.route && (
                  <span className="font-mono text-[9px]" style={{ color: theme.link }}>
                    {action.route}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
