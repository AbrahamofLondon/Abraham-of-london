"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Shows what the next stage can now detect — and why continuing increases advantage.
 */

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
};

export default function NextLayerUnlockedPanel({ currentStage, nextStage, unresolvedItems, className = "" }: Props) {
  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
      {unresolvedItems && unresolvedItems.length > 0 && (
        <div className="mb-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
            What remains unresolved
          </div>
          {unresolvedItems.map((item, i) => (
            <div key={i} className="text-sm text-zinc-400 leading-6">
              {item}
            </div>
          ))}
        </div>
      )}

      {nextStage && (
        <div className="border-t border-white/8 pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60 mb-2">
            Next layer unlocked
          </div>
          <p className="text-sm text-zinc-300 leading-6 mb-2">
            {nextStage.whatItDetects}
          </p>
          <p className="text-xs text-zinc-500 leading-5 mb-3">
            {nextStage.whyContinue}
          </p>
          <Link
            href={nextStage.href}
            className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-amber-400/80 hover:text-amber-300 border border-amber-500/20 px-4 py-2 min-h-[44px] transition-colors"
          >
            Continue to {nextStage.name}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {!nextStage && (
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          All available stages completed for this evidence level.
        </div>
      )}
    </div>
  );
}
