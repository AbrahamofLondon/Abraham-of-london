"use client";

/**
 * Reusable admin engagement bar chart.
 * Extracted from pages/board/intelligence.tsx.
 *
 * Usage:
 *   <EngagementBarChart
 *     data={[{ label: "Canon", value: 42 }, ...]}
 *     title="Content Engagement"
 *   />
 */

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

type BarDatum = { label: string; value: number };

const CHART_COLORS = { primary: "#C9A96E", secondary: "#6EE7B7" };

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
  padding: "12px",
  backdropFilter: "blur(10px)",
};

export default function EngagementBarChart({
  data,
  title = "Engagement",
  height = 256,
  emptyMessage = "No data available",
}: {
  data: BarDatum[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/40">{title}</span>
        <span className="text-[8px] font-mono text-white/20">{data.length} items</span>
      </div>
      <div style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={50}
              />
              <Tooltip
                cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#9CA3AF", fontSize: "11px", marginBottom: "4px" }}
                formatter={((v: number) => [v, "Count"]) as any}
              />
              <Bar dataKey="value" fill={CHART_COLORS.primary} radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/20">
            <Activity className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-[11px]">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
