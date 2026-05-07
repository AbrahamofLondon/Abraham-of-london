/**
 * SpineRenderer — the single render contract for intelligence output.
 *
 * Every stage renders: contradiction, avoided decision, move, forecast, certainty.
 * Presentation adapts based on confidenceBand:
 *   low → interrogation, recovery prompts
 *   medium → partial framing, hedged conclusions
 *   high → full confrontation, direct language
 *
 * No stage renders intelligence differently. One contract. One truth.
 */

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  Shield,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";
import type { IntelligenceSpine, ConfidenceBand } from "@/lib/decision/intelligence-spine";
import { getGovernedOutput } from "@/lib/decision/spine-accessors";
import { controlShiftSummary } from "@/lib/decision/default-path-forecast";

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

export type SpineRendererProps = {
  spine: IntelligenceSpine;
  /** Optional: additional stage-specific content rendered after core blocks */
  children?: React.ReactNode;
  /** Whether to show the escalation CTA */
  showEscalation?: boolean;
  /** Escalation link */
  escalationHref?: string;
  /** Custom escalation label */
  escalationLabel?: string;
  /** Whether to show memory interrupt */
  showMemoryInterrupt?: boolean;
  /** Memory interrupt message */
  memoryInterruptMessage?: string;
  /** Callback when user acknowledges memory interrupt */
  onMemoryAcknowledged?: () => void;
  /** Integrity review message to show */
  integrityReviewMessage?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENCE-AWARE STYLING
// ─────────────────────────────────────────────────────────────────────────────

const BAND_STYLES: Record<ConfidenceBand, {
  borderColor: string;
  accentColor: string;
  textTone: string;
  label: string;
}> = {
  low: {
    borderColor: "border-red-500/30",
    accentColor: "text-red-400",
    textTone: "text-red-300",
    label: "Insufficient Signal",
  },
  medium: {
    borderColor: "border-amber-500/30",
    accentColor: "text-amber-400",
    textTone: "text-amber-200",
    label: "Partial Signal",
  },
  high: {
    borderColor: "border-emerald-500/30",
    accentColor: "text-emerald-400",
    textTone: "text-emerald-200",
    label: "Strong Signal",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpineRenderer({
  spine,
  children,
  showEscalation = false,
  escalationHref,
  escalationLabel = "Continue to next assessment",
  showMemoryInterrupt = false,
  memoryInterruptMessage,
  onMemoryAcknowledged,
  integrityReviewMessage,
}: SpineRendererProps) {
  const [memoryDismissed, setMemoryDismissed] = React.useState(false);
  const governed = getGovernedOutput(spine);
  const band = spine.c3.confidenceBand;
  const styles = BAND_STYLES[band];
  const synthesis = spine.synthesis;
  const forecast = spine.forecast;

  // ── Memory Interrupt ──────────────────────────────────────────────────────
  if (showMemoryInterrupt && memoryInterruptMessage && !memoryDismissed) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
              Pattern Detected — Prior Assessment Match
            </h3>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-amber-200/90">
            {memoryInterruptMessage}
          </p>
          <button
            onClick={() => {
              setMemoryDismissed(true);
              onMemoryAcknowledged?.();
            }}
            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20"
          >
            Acknowledged — proceed with new assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Signal Strength Bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${styles.accentColor}`} />
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
            Signal: {styles.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {["low", "medium", "high"].map((level) => (
              <div
                key={level}
                className={`h-2 w-6 rounded-full ${
                  (level === "low" && band !== "low") ||
                  (level === "medium" && band === "high") ||
                  level === band
                    ? styles.accentColor.replace("text-", "bg-")
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">
            {governed.conditionClass}
          </span>
        </div>
      </div>

      {/* ── Integrity Review Warning ────────────────────────────────────── */}
      {integrityReviewMessage && (
        <div className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-5">
          <div className="mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4 text-orange-400" />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-orange-400">
              System Integrity Check
            </span>
          </div>
          <p className="text-sm leading-relaxed text-orange-200/90">
            {integrityReviewMessage}
          </p>
        </div>
      )}

      {/* ── Block 1: The Verdict ─────────────────────────────────────────── */}
      {synthesis?.verdict && (
        <div className={`rounded-lg border ${styles.borderColor} bg-white/5 p-6`}>
          <div className="mb-3 flex items-center gap-2">
            <Target className={`h-4 w-4 ${styles.accentColor}`} />
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
              The Verdict
            </h3>
          </div>
          <p className={`font-serif text-lg leading-relaxed ${styles.textTone}`}>
            {synthesis.verdict}
          </p>
        </div>
      )}

      {/* ── Block 2: The Contradiction ───────────────────────────────────── */}
      {synthesis?.primaryContradiction && band !== "low" && (
        <div className={`rounded-lg border ${styles.borderColor} bg-white/5 p-6`}>
          <div className="mb-3 flex items-center gap-2">
            <Eye className={`h-4 w-4 ${styles.accentColor}`} />
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
              The Contradiction
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            {synthesis.primaryContradiction}
          </p>
        </div>
      )}

      {/* ── Block 3: The Avoided Decision ────────────────────────────────── */}
      {synthesis?.avoidedDecision && (
        <div className={`rounded-lg border ${styles.borderColor} bg-white/5 p-6`}>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${styles.accentColor}`} />
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
              What Is Being Avoided
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-white/80">
            {synthesis.avoidedDecision}
          </p>
        </div>
      )}

      {/* ── Block 4: Your Move ───────────────────────────────────────────── */}
      {synthesis?.concreteMove && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-6">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-amber-400" />
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400">
              Your Move — Within 72 Hours
            </h3>
          </div>
          <p className="text-sm font-medium leading-relaxed text-amber-200">
            {synthesis.concreteMove}
          </p>
        </div>
      )}

      {/* ── Block 5: Default Path Forecast ───────────────────────────────── */}
      {forecast && (
        <div className={`rounded-lg border ${styles.borderColor} bg-white/5 p-6`}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className={`h-4 w-4 ${styles.accentColor}`} />
            <h3 className="font-mono text-[9px] font-bold uppercase tracking-wider text-white/50">
              Default Path If Ignored
            </h3>
          </div>
          <div className="space-y-4">
            <ForecastLine label="7 days" text={forecast.sevenDays} />
            <ForecastLine label="30 days" text={forecast.thirtyDays} />
            <ForecastLine label="90 days" text={forecast.ninetyDays} />

            {forecast.optionCompression && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="text-xs text-white/50">
                  <span className="font-mono font-bold uppercase text-white/30">Option compression: </span>
                  {forecast.optionCompression}
                </p>
              </div>
            )}

            {/* Mathematical summary */}
            <div className="mt-2 flex flex-wrap gap-3 border-t border-white/10 pt-4">
              <MetricBadge
                label="Decay rate"
                value={`${Math.round(forecast.optionDecayRate * 100)}%/mo`}
              />
              <MetricBadge
                label="Control shift"
                value={`${Math.round(forecast.controlShiftProbability * 100)}%`}
              />
              <MetricBadge
                label="Risk trend"
                value={forecast.structuralRiskShift}
              />
            </div>

            <p className="mt-2 text-xs italic text-white/40">
              {controlShiftSummary(forecast)}
            </p>
          </div>
        </div>
      )}

      {/* ── Block 6: Certainty Boundary ──────────────────────────────────── */}
      {synthesis?.certaintyBoundary && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-3 w-3 text-white/30" />
            <h3 className="font-mono text-[8px] font-bold uppercase tracking-wider text-white/30">
              Certainty Boundary
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-white/40">
            {synthesis.certaintyBoundary}
          </p>
        </div>
      )}

      {/* ── Stage-specific content ───────────────────────────────────────── */}
      {children}

      {/* ── Escalation CTA ───────────────────────────────────────────────── */}
      {showEscalation && escalationHref && (
        <a
          href={escalationHref}
          className="group flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-6 py-4 transition-colors hover:bg-amber-500/20"
        >
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-amber-400">
              {escalationLabel}
            </p>
            <p className="mt-1 text-xs text-amber-200/60">
              The system deepens its reading at each stage. No resets.
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-400 transition-transform group-hover:translate-x-1" />
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ForecastLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-white/30">
        {label}
      </span>
      <p className="text-sm leading-relaxed text-white/70">{text}</p>
    </div>
  );
}

function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1">
      <span className="font-mono text-[7px] uppercase tracking-wider text-white/30">{label}: </span>
      <span className="font-mono text-[9px] font-bold text-white/60">{value}</span>
    </div>
  );
}
