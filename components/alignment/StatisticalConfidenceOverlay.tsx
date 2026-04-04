"use client";

import * as React from "react";

interface StatisticalConfidenceProps {
  score: number; // 0 to 100
  sampleSize?: number;
  marginOfError?: number;
  confidenceInterval?: [number, number];
}

interface ConfidenceStatus {
  label: string;
  description: string;
  color: string;
  glow: string;
  surface: string;
  threshold: "high" | "medium" | "low";
}

const CONFIDENCE_CONFIG: Record<string, ConfidenceStatus> = {
  high: {
    label: "High Precision",
    description: "Statistically significant. Suitable for high-confidence intervention and structural interpretation.",
    color: "#C9A96A",
    glow: "0 0 18px rgba(201,169,106,0.22)",
    surface: "border-[#C9A96A]/20 bg-[#C9A96A]/[0.05]",
    threshold: "high",
  },
  medium: {
    label: "Indicative Signal",
    description: "Directionally useful. Strong enough for disciplined inquiry, but not yet maximal confidence.",
    color: "#D6B77A",
    glow: "none",
    surface: "border-amber-500/20 bg-amber-500/[0.05]",
    threshold: "medium",
  },
  low: {
    label: "Low Sample Reliability",
    description: "Insufficient signal density for decisive structural conclusions. Treat as preliminary only.",
    color: "#F59E0B",
    glow: "none",
    surface: "border-orange-500/20 bg-orange-500/[0.05]",
    threshold: "low",
  },
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getConfidenceStatus(score: number): ConfidenceStatus {
  if (score >= 85) return CONFIDENCE_CONFIG.high;
  if (score >= 60) return CONFIDENCE_CONFIG.medium;
  return CONFIDENCE_CONFIG.low;
}

function formatSampleSize(size: number | undefined): string {
  if (!size || size <= 0) return "Insufficient";
  if (size < 30) return `Small (n=${size})`;
  if (size < 100) return `Moderate (n=${size})`;
  return `Large (n=${size})`;
}

export function StatisticalConfidenceOverlay({
  score,
  sampleSize,
  marginOfError,
  confidenceInterval,
}: StatisticalConfidenceProps) {
  // Input validation and sanitization
  const validatedScore = clamp(score, 0, 100);
  const validatedSampleSize = sampleSize && sampleSize > 0 ? Math.floor(sampleSize) : undefined;
  const validatedMarginOfError = marginOfError && marginOfError > 0 ? clamp(marginOfError, 0, 100) : undefined;
  
  const status = getConfidenceStatus(validatedScore);
  const isHighConfidence = validatedScore >= 85;
  const isMediumConfidence = validatedScore >= 60 && validatedScore < 85;
  
  // Calculate confidence interval display
  const intervalDisplay = confidenceInterval 
    ? `${confidenceInterval[0].toFixed(1)}% – ${confidenceInterval[1].toFixed(1)}%`
    : validatedMarginOfError 
      ? `±${validatedMarginOfError.toFixed(1)}%`
      : null;

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[24px] border p-6",
        "bg-white/[0.02] shadow-sm",
        status.surface,
      ].join(" ")}
    >
      {/* Subtle background elements */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neutral-200/20 to-transparent" />
      <div className="absolute -right-4 -top-5 select-none font-mono text-[38px] font-light opacity-[0.03] text-neutral-800">
        CI-95
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.02),transparent_65%)] pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-neutral-400">
              Statistical Confidence
            </span>
            <h4
              className="mt-1.5 font-serif text-base font-light tracking-tight"
              style={{ color: status.color }}
            >
              {status.label}
            </h4>
          </div>

          <div className="text-right">
            <span className="font-mono text-2xl font-light text-neutral-800">
              {validatedScore}
              <span className="ml-0.5 text-[10px] text-neutral-400">%</span>
            </span>
            {validatedSampleSize && (
              <div className="text-[6px] font-mono text-neutral-400 mt-0.5">
                {formatSampleSize(validatedSampleSize)}
              </div>
            )}
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mt-5">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-neutral-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${validatedScore}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out"
              style={{
                backgroundColor: status.color,
                boxShadow: status.glow,
              }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="mt-4 text-[10px] leading-relaxed text-neutral-500">
          {status.description}
        </p>

        {/* Additional Metrics Grid */}
        {(validatedSampleSize || validatedMarginOfError || intervalDisplay) && (
          <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-neutral-100">
            {validatedSampleSize && (
              <div>
                <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">
                  Sample Size
                </span>
                <span className="text-[9px] font-mono text-neutral-600">
                  {validatedSampleSize}
                </span>
              </div>
            )}
            {intervalDisplay && (
              <div>
                <span className="text-[6px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">
                  Confidence Interval
                </span>
                <span className="text-[8px] font-mono text-neutral-500">
                  {intervalDisplay}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recommendation based on confidence level */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <p className="text-[7px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
            {isHighConfidence ? "Recommended Action" : isMediumConfidence ? "Interpretive Guidance" : "Data Advisory"}
          </p>
          <p className="text-[8px] text-neutral-500 leading-relaxed">
            {isHighConfidence 
              ? "Confidence sufficient for strategic deployment and board-level interpretation."
              : isMediumConfidence
              ? "Use for directional signal; complement with qualitative validation before escalation."
              : "Collect additional data points before drawing structural conclusions."}
          </p>
        </div>

        {/* Subtle accent line */}
        <div
          className="absolute bottom-0 left-0 h-px w-full opacity-20 transition-all duration-500 group-hover:opacity-50"
          style={{
            background: `linear-gradient(90deg, transparent, ${status.color}, transparent)`,
          }}
        />
      </div>
    </div>
  );
}