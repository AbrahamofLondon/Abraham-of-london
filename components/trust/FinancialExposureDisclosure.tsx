"use client";

/**
 * FinancialExposureDisclosure — renders real financial exposure from the
 * canonical sections engine and cost-of-delay engine.
 *
 * When user-supplied financial data exists, shows computed exposure.
 * When it doesn't, shows that no financial figure is claimed.
 * Never fabricates numbers. Labels assumptions. Shows confidence.
 *
 * Reads from: lib/decision/canonical-sections.ts (financialExposure)
 *             lib/diagnostics/cost-of-delay-engine.ts
 */

import type { CostBand } from "@/lib/diagnostics/cost-of-delay-engine";

type CanonicalFinancialExposure = {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
  replacementCostFormatted: string;
  executionLossFormatted: string;
  totalExposureFormatted: string;
};

type Props = {
  /** From canonical sections engine — null if not yet computed */
  canonicalExposure?: CanonicalFinancialExposure | null;
  /** From cost-of-delay engine */
  delayExposureScore?: number | null;
  delayBand?: CostBand | null;
  estimatedFinancialExposure?: number | null;
  /** User-declared financial inputs */
  userDeclaredRevenue?: number | null;
  userDeclaredDecisionValue?: number | null;
  /** Is this a sample/preview or real computation? */
  isSample?: boolean;
  className?: string;
};

const BAND_LABELS: Record<CostBand, { label: string; color: string }> = {
  LOW: { label: "Low exposure", color: "text-zinc-400" },
  MODERATE: { label: "Moderate exposure", color: "text-amber-400/70" },
  HIGH: { label: "High exposure", color: "text-amber-400" },
  CRITICAL: { label: "Critical exposure", color: "text-red-400/80" },
};

export default function FinancialExposureDisclosure({
  canonicalExposure,
  delayExposureScore,
  delayBand,
  estimatedFinancialExposure,
  userDeclaredRevenue,
  userDeclaredDecisionValue,
  isSample = false,
  className = "",
}: Props) {
  const hasCanonical = canonicalExposure && canonicalExposure.totalExposure > 0;
  const hasDelayEstimate = estimatedFinancialExposure != null && estimatedFinancialExposure > 0;
  const hasUserFinancials = (userDeclaredRevenue != null && userDeclaredRevenue > 0) ||
    (userDeclaredDecisionValue != null && userDeclaredDecisionValue > 0);
  const bandConfig = delayBand ? BAND_LABELS[delayBand] : null;

  if (isSample) {
    return (
      <div className={`border border-white/10 bg-white/[0.02] p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500/60">
            Example only — not personalised
          </span>
        </div>
        <p className="text-sm leading-6 text-zinc-400">
          Financial exposure figures shown are sample illustrations demonstrating the report
          format. Your report will use figures derived from your specific inputs and evidence.
        </p>
      </div>
    );
  }

  return (
    <div className={`border border-white/10 bg-white/[0.02] p-4 space-y-3 ${className}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500/60">
        Financial exposure assessment
      </div>

      {/* Delay band from cost-of-delay engine */}
      {delayBand && bandConfig && (
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs font-medium ${bandConfig.color}`}>
            {bandConfig.label}
          </span>
          {delayExposureScore != null && (
            <span className="font-mono text-[10px] text-zinc-600">
              Score: {delayExposureScore}/100
            </span>
          )}
        </div>
      )}

      {/* Canonical financial exposure from decision engine */}
      {hasCanonical && (
        <div className="border border-white/8 bg-white/[0.01] p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-zinc-500">Replacement cost</div>
            <div className="text-zinc-300 text-right">{canonicalExposure.replacementCostFormatted}</div>
            <div className="text-zinc-500">Execution loss</div>
            <div className="text-zinc-300 text-right">{canonicalExposure.executionLossFormatted}</div>
            <div className="text-zinc-400 font-medium border-t border-white/10 pt-1">Total exposure</div>
            <div className="text-white/80 font-medium text-right border-t border-white/10 pt-1">{canonicalExposure.totalExposureFormatted}</div>
          </div>
        </div>
      )}

      {/* Cost-of-delay engine estimate */}
      {hasDelayEstimate && !hasCanonical && (
        <div className="text-sm text-zinc-400">
          Estimated exposure:{" "}
          <span className="text-zinc-300 font-medium">
            &pound;{estimatedFinancialExposure.toLocaleString()}
          </span>
        </div>
      )}

      {/* No financial data */}
      {!hasCanonical && !hasDelayEstimate && (
        <p className="text-sm text-zinc-500">
          No financial exposure computed. Financial projections require user-supplied revenue
          or decision-value data. The system does not fabricate financial figures.
        </p>
      )}

      {/* Assumptions and disclosure */}
      <div className="border-t border-white/8 pt-3 space-y-1.5">
        {hasUserFinancials && (
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Input basis:</strong>{" "}
            {userDeclaredRevenue ? `Declared revenue exposure £${userDeclaredRevenue.toLocaleString()}` : ""}
            {userDeclaredRevenue && userDeclaredDecisionValue ? " · " : ""}
            {userDeclaredDecisionValue ? `Declared decision value £${userDeclaredDecisionValue.toLocaleString()}` : ""}
          </p>
        )}
        <p className="text-xs text-zinc-600">
          Scenario projection using cost-of-delay engine with exposure scoring.
          Not a financial forecast. Not audited. Not investment advice. You remain
          responsible for financial decisions.
        </p>
      </div>
    </div>
  );
}
