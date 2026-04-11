"use client";

import * as React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import {
  ArrowDownRight,
  ArrowUpRight,
  Anchor,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

type DeltaMetricProps = {
  label: string;
  currentValue: string;
  baselineValue: string;
  deltaValue: string;
  positiveIsBetter?: boolean;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function formatSigned(value: number, decimals = 2): string {
  const abs = Math.abs(value).toFixed(decimals);
  return `${value >= 0 ? "+" : "-"}${abs}`;
}

function DeltaMetric({
  label,
  currentValue,
  baselineValue,
  deltaValue,
  positiveIsBetter = true,
}: DeltaMetricProps) {
  const numericDelta = Number(deltaValue);
  const isPositive = numericDelta >= 0;
  const favorable = positiveIsBetter ? isPositive : !isPositive;

  return (
    <div className="border border-white/[0.08] bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
            {label}
          </div>
          <div className="mt-3 font-serif text-2xl text-white/88">
            {currentValue}
          </div>
          <div className="mt-2 text-[11px] text-white/42">
            Baseline: {baselineValue}
          </div>
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-2 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]",
            favorable
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"
              : "border-red-500/20 bg-red-500/5 text-red-300",
          )}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {deltaValue}
        </div>
      </div>
    </div>
  );
}

export default function ComparisonDelta() {
  const {
    computed,
    baseline,
    setBaseline,
    clearBaseline,
    resonanceScore,
  } = useOGRStore();

  if (!baseline) {
    return (
      <button
        onClick={setBaseline}
        className={cn(
          "group relative w-full overflow-hidden border border-dashed border-amber-500/20 bg-white/[0.01] px-6 py-10 transition-all",
          "hover:border-amber-500/40 hover:bg-amber-500/[0.04]",
        )}
      >
        <div className="relative z-10 flex flex-col items-center">
          <Anchor className="mb-4 h-7 w-7 text-amber-400/80 transition-transform duration-300 group-hover:scale-105" />
          <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-white/68">
            Lock baseline
          </span>
          <p className="mt-3 max-w-md text-center text-[11px] leading-relaxed text-white/42">
            Capture the current state as a comparison point for future scenario changes.
          </p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/[0.03] opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  }

  const alphaDelta = computed.resonanceAlpha - baseline.resonanceAlpha;
  const certaintyDelta =
    computed.sovereignCertainty - baseline.sovereignCertainty;
  const velocityDelta =
    computed.velocityMultiplier - baseline.velocityMultiplier;
  const resonanceDelta = resonanceScore - baseline.resonanceScore;

  return (
    <div className="relative overflow-hidden border border-white/[0.08] bg-[#0A0C10] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mb-8 flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-amber-400/80" />
            <h3 className="font-serif text-2xl text-white">
              Baseline comparison
            </h3>
          </div>
          <p className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-white/34">
            Current scenario vs locked baseline
          </p>
        </div>

        <button
          onClick={clearBaseline}
          className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Clear baseline
        </button>
      </div>

      <div className="grid gap-4">
        <DeltaMetric
          label="Projected Alpha"
          currentValue={`$${computed.resonanceAlpha.toFixed(2)}M`}
          baselineValue={`$${baseline.resonanceAlpha.toFixed(2)}M`}
          deltaValue={`${formatSigned(alphaDelta)}M`}
          positiveIsBetter
        />

        <DeltaMetric
          label="Confidence to Proceed"
          currentValue={`${computed.sovereignCertainty.toFixed(2)}%`}
          baselineValue={`${baseline.sovereignCertainty.toFixed(2)}%`}
          deltaValue={`${formatSigned(certaintyDelta)}%`}
          positiveIsBetter
        />

        <DeltaMetric
          label="Execution Velocity"
          currentValue={`${computed.velocityMultiplier.toFixed(2)}x`}
          baselineValue={`${baseline.velocityMultiplier.toFixed(2)}x`}
          deltaValue={`${formatSigned(velocityDelta)}x`}
          positiveIsBetter
        />
      </div>

      <div className="mt-8 border-t border-white/8 pt-6">
        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
          Net resonance movement
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/54">
          {resonanceDelta >= 0 ? "Improved" : "Reduced"} core resonance by{" "}
          <span className="text-white/84">
            {Math.abs(resonanceDelta).toFixed(1)}%
          </span>{" "}
          relative to the locked baseline.
        </p>
      </div>
    </div>
  );
}