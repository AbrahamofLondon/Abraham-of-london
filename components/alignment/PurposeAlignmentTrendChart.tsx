"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Crown } from "lucide-react";

type AssessmentRoute = "STRATEGY" | "DIAGNOSTIC" | "REJECT";

type AssessmentPoint = {
  label: string;
  score: number;
  route?: AssessmentRoute;
  confidence?: number;
};

type Props = {
  data: AssessmentPoint[];
  currentScore?: number;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: AssessmentPoint;
  }>;
};

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function normalizeScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function normalizeConfidence(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(1, n));
}

function normalizeData(data: AssessmentPoint[]): AssessmentPoint[] {
  if (!Array.isArray(data)) return [];
  return data.map((item, index) => ({
    label: String(item?.label || `Point ${index + 1}`),
    score: normalizeScore(item?.score),
    route:
      item?.route === "STRATEGY" ||
      item?.route === "DIAGNOSTIC" ||
      item?.route === "REJECT"
        ? item.route
        : undefined,
    confidence: normalizeConfidence(item?.confidence),
  }));
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-md">
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40">
        {point.label}
      </div>

      <div className="mt-2 text-xl font-light text-white">{point.score}%</div>

      {point.route ? (
        <div className="mt-1 flex items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              point.route === "STRATEGY"
                ? "bg-emerald-400"
                : point.route === "DIAGNOSTIC"
                  ? "bg-amber-400"
                  : "bg-white/20",
            )}
          />
          <span className="text-[9px] font-mono text-white/40">
            {point.route === "STRATEGY"
              ? "Strategy qualified"
              : point.route === "DIAGNOSTIC"
                ? "Diagnostic route"
                : "Below threshold"}
          </span>
        </div>
      ) : null}

      {typeof point.confidence === "number" ? (
        <div className="mt-1 text-[8px] font-mono text-white/25">
          Confidence: {Math.round(point.confidence * 100)}%
        </div>
      ) : null}
    </div>
  );
}

export default function ConstitutionalTrendChart({
  data,
  currentScore,
}: Props) {
  const safeData = React.useMemo(() => normalizeData(data), [data]);

  if (safeData.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-black/30 p-8 text-center backdrop-blur-sm">
        <div className="text-sm text-white/40">
          No historical trace available. Complete assessments to build the constitutional record.
        </div>
      </div>
    );
  }

  const lastPoint = safeData[safeData.length - 1]!;
  const previousPoint = safeData.length > 1 ? safeData[safeData.length - 2] ?? null : null;
  const trend = previousPoint ? lastPoint.score - previousPoint.score : 0;

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0 ? "text-emerald-400" : trend < 0 ? "text-red-400" : "text-amber-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h3 className="font-serif text-lg text-white">Constitutional Trace</h3>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            Longitudinal alignment variance
          </p>
        </div>

        {typeof currentScore === "number" ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
            <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/30">
              Current Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-white">
                {Math.max(0, Math.min(100, currentScore))}
              </span>
              <span className="text-xs text-white/40">/100</span>
              <TrendIcon className={cn("ml-1 h-3 w-3", trendColor)} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={safeData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.3)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
              dy={8}
            />
            <YAxis
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "rgba(255,255,255,0.2)",
                fontSize: 9,
                fontFamily: "var(--font-mono)",
              }}
              tickCount={5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#c9a96a"
              strokeWidth={2.5}
              dot={{
                r: 3.5,
                fill: "#0a0a0a",
                stroke: "#c9a96a",
                strokeWidth: 1.5,
              }}
              activeDot={{
                r: 5,
                fill: "#c9a96a",
                stroke: "#ffffff",
                strokeWidth: 1.5,
              }}
              animationDuration={1200}
              animationBegin={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Strategy Room
          </div>
          <div className="mt-1 text-xs font-medium text-emerald-400/60">≥82%</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Executive Reporting
          </div>
          <div className="mt-1 text-xs font-medium text-amber-400/60">60–81%</div>
        </div>

        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2">
          <div className="text-[8px] font-mono uppercase tracking-[0.16em] text-white/25">
            Foundation Required
          </div>
          <div className="mt-1 text-xs font-medium text-white/25">&lt;60%</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Crown className="h-2.5 w-2.5 text-white/20" />
          <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-white/15">
            Constitutional Protocol
          </span>
        </div>
        <span className="font-mono text-[7px] text-white/15">
          Abraham of London
        </span>
      </div>
    </motion.div>
  );
}