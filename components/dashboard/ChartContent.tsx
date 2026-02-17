"use client";

import * as React from "react";

// Use require to avoid TypeScript type conflicts with recharts
const Recharts = require("recharts");

export interface ChartDataPoint {
  name: string;
  assets: number;
}

interface ChartContentProps {
  data: ChartDataPoint[];
}

export function ChartContent({ data }: ChartContentProps) {
  const {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
  } = Recharts;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#064e3b" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#064e3b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 9, fill: "#a3a3a3", letterSpacing: "0.1em" }}
          dy={10}
        />
        <YAxis hide domain={["dataMin - 10", "auto"]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#111",
            border: "none",
            borderRadius: 0,
            fontSize: "10px",
            color: "#fff",
          }}
          itemStyle={{ color: "#10b981" }}
          cursor={{ stroke: "#064e3b", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="assets"
          stroke="#064e3b"
          strokeWidth={1.5}
          fillOpacity={1}
          fill="url(#colorAssets)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}