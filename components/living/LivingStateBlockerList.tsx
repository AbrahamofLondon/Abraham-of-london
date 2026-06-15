"use client";

/**
 * components/living/LivingStateBlockerList.tsx
 *
 * Generic, domain-agnostic render of LivingStateObject.blockers. Consumes real
 * engine output — never invents state. Reused by every domain's surface; no
 * product-specific blocker list should exist.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";
import type {
  LivingStateBlocker,
  LivingStateSeverity,
} from "@/lib/living-intelligence/living-state-object-contract";

type Props = {
  blockers: LivingStateBlocker[];
  variant?: LivingThemeVariant;
  className?: string;
};

function severityColor(
  severity: LivingStateSeverity,
  theme: ReturnType<typeof getLivingTheme>,
): string {
  switch (severity) {
    case "blocker":
      return theme.red;
    case "warning":
      return theme.amber;
    case "governed_tension":
      return theme.accent;
    case "informational":
      return theme.muted;
  }
}

export default function LivingStateBlockerList({
  blockers,
  variant = "dark",
  className = "",
}: Props) {
  const theme = getLivingTheme(variant);
  if (blockers.length === 0) {
    return (
      <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.divider}` }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.emerald }}>
          No blockers
        </div>
        <p className="text-sm leading-6 mt-1" style={{ color: theme.body }}>
          Nothing is currently blocking this subject. Advancement still requires the governed next actions below.
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.amber }}>
        Blockers ({blockers.length})
      </div>
      <div className="space-y-3">
        {blockers.map((blocker, i) => {
          const color = severityColor(blocker.severity, theme);
          return (
            <div key={`${blocker.code}-${i}`} className="pl-3" style={{ borderLeft: `2px solid ${color}` }}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium" style={{ color: theme.heading }}>
                  {blocker.label}
                </span>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color }}>
                  {blocker.severity}
                </span>
              </div>
              <p className="text-xs leading-5 mt-1" style={{ color: theme.body }}>
                {blocker.explanation}
              </p>
              <p className="text-xs leading-5 mt-1" style={{ color: theme.muted }}>
                <span style={{ color: theme.dim }}>Required: </span>
                {blocker.requiredAction}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.dim }}>
                  Owner: {blocker.actionOwner}
                </span>
                {blocker.repairRoute && (
                  <span className="font-mono text-[9px]" style={{ color: theme.link }}>
                    Repair: {blocker.repairRoute}
                  </span>
                )}
                {!blocker.repairRoute && (
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.red }}>
                    No repair route
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
