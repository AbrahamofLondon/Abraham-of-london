"use client";

/**
 * Reusable admin distribution pie chart.
 * Extracted from pages/board/intelligence.tsx.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Eye } from "lucide-react";

type PieDatum = { name: string; value: number };

const COLORS = ["#C9A96E", "#6EE7B7", "#60A5FA", "#F87171", "#A78BFA", "#FBBF24", "#34D399", "#F472B6"];

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #374151",
  borderRadius: "8px",
  padding: "12px",
  backdropFilter: "blur(10px)",
};

export default function DistributionPieChart({
  data,
  title = "Distribution",
  height = 256,
  emptyMessage = "No data available",
}: {
  data: PieDatum[];
  title?: string;
  height?: number;
  emptyMessage?: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/40">{title}</span>
        <span className="text-[8px] font-mono text-white/20">{data.length} segments</span>
      </div>
      <div style={{ height }}>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(p: any) => `${String(p.name ?? "")}: ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={((v: number) => [v, "Count"]) as any}
                contentStyle={tooltipStyle}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/20">
            <Eye className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-[11px]">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
