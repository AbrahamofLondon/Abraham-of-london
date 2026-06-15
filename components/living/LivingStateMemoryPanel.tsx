"use client";

/**
 * components/living/LivingStateMemoryPanel.tsx
 *
 * Generic render of LivingStateObject.memory — recurrence, regression, and
 * resolution across runs. Honest about durability: this reflects what the system
 * has actually remembered, not a claim of institutional memory beyond the store.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";
import type { LivingStateMemory } from "@/lib/living-intelligence/living-state-object-contract";

type Props = {
  memory: LivingStateMemory;
  variant?: LivingThemeVariant;
  className?: string;
};

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function LivingStateMemoryPanel({
  memory,
  variant = "dark",
  className = "",
}: Props) {
  const theme = getLivingTheme(variant);

  const chips: Array<{ label: string; color: string }> = [];
  if (memory.recurrenceCount > 1) chips.push({ label: `Seen ${memory.recurrenceCount}×`, color: theme.amber });
  else chips.push({ label: "First seen", color: theme.accent });
  if (memory.regressionDetected) chips.push({ label: "Regression", color: theme.red });
  if (memory.resolvedSinceLastRun) chips.push({ label: "Resolved since last run", color: theme.emerald });

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.divider}` }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.muted }}>
        Memory
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((chip, i) => (
          <span
            key={i}
            className="font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-1"
            style={{ color: chip.color, border: `1px solid ${chip.color}33` }}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.dim }}>First seen</span>
        <span className="text-xs" style={{ color: theme.body }}>{formatWhen(memory.firstSeen)}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.dim }}>Last seen</span>
        <span className="text-xs" style={{ color: theme.body }}>{formatWhen(memory.lastSeen)}</span>
        {memory.previousStage && (
          <>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em]" style={{ color: theme.dim }}>Stage change</span>
            <span className="text-xs" style={{ color: theme.body }}>{memory.previousStage} → {memory.currentStage}</span>
          </>
        )}
      </div>
    </div>
  );
}
