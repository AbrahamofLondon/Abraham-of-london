"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Shows what the next stage can now detect — and why continuing increases advantage.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Props = {
  currentStage: string;
  nextStage: {
    name: string;
    href: string;
    whatItDetects: string;
    whyContinue: string;
  } | null;
  unresolvedItems?: string[];
  className?: string;
  variant?: LivingThemeVariant;
};

export default function NextLayerUnlockedPanel({ currentStage, nextStage, unresolvedItems, className = "", variant = "dark" }: Props) {
  const theme = getLivingTheme(variant);

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      {unresolvedItems && unresolvedItems.length > 0 && (
        <div className="mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: theme.muted }}>
            What remains unresolved
          </div>
          {unresolvedItems.map((item, i) => (
            <div key={i} className="text-sm leading-6" style={{ color: theme.body }}>
              {item}
            </div>
          ))}
        </div>
      )}

      {nextStage && (
        <div className="pt-4" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: theme.accent }}>
            Next layer unlocked
          </div>
          <p className="text-sm leading-6 mb-2" style={{ color: theme.heading }}>
            {nextStage.whatItDetects}
          </p>
          <p className="text-xs leading-5 mb-3" style={{ color: theme.muted }}>
            {nextStage.whyContinue}
          </p>
          <Link
            href={nextStage.href}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] border px-4 py-2 min-h-[44px] transition-colors"
            style={{ color: theme.link, borderColor: theme.buttonBorder }}
          >
            Continue to {nextStage.name}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!nextStage && (
        <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
          All available stages completed for this evidence level.
        </div>
      )}
    </div>
  );
}