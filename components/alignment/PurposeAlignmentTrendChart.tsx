"use client";

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart
} from "recharts";

type Point = {
  label: string; // e.g., "March 2026" or "Q1 Brief"
  score: number; // Percentage score
};

type Props = {
  data: Point[];
  title?: string;
};

export default function PurposeAlignmentTrendChart({ 
  data, 
  title = "Alignment Trajectory" 
}: Props) {
  
  if (!data || data.length === 0) {
    return (
      <div className="city-gate-card flex h-[320px] items-center justify-center p-5 text-sm text-brand-cream-dim">
        No longitudinal data available for trend analysis.
      </div>
    );
  }

  return (
    <div className="city-gate-card flex flex-col gap-6 p-6 shadow-premium overflow-hidden">
      {/* Institutional Header */}
      <div className="flex items-end justify-between border-b border-brand-charcoal pb-4">
        <div>
          <h3 className="font-serif text-lg text-brand-cream">{title}</h3>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-cream-muted">
            Longitudinal Alignment Variance
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-[10px] text-brand-gold opacity-80 uppercase">
            Status: Institutional Trace
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
          >
            {/* Subtle Horizontal Grid Only for a cleaner "Forensic" look */}
            <CartesianGrid 
              stroke="#2A2A2A" 
              vertical={false} 
              strokeDasharray="4 4" 
            />
            
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: "#948F85", 
                fontSize: 10, 
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em"
              }} 
              dy={10}
            />
            
            <YAxis 
              domain={[0, 100]} 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fill: "#948F85", 
                fontSize: 10, 
                fontFamily: "var(--font-mono)" 
              }} 
            />
            
            <Tooltip 
              cursor={{ stroke: '#d6b26a', strokeWidth: 1 }}
              contentStyle={{ 
                backgroundColor: "#0F0F0F", 
                border: "1px solid #d6b26a",
                borderRadius: "4px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "#E5E1D8",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
              }}
              itemStyle={{ color: "#d6b26a" }}
              labelStyle={{ marginBottom: '4px', color: '#948F85' }}
            />

            {/* The Alignment Trace */}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#d6b26a" // Brand softGold
              strokeWidth={2.5}
              dot={{ 
                r: 4, 
                fill: "#0F0F0F", 
                stroke: "#d6b26a", 
                strokeWidth: 2 
              }}
              activeDot={{ 
                r: 6, 
                fill: "#d6b26a", 
                stroke: "#E5E1D8", 
                strokeWidth: 2,
                filter: "drop-shadow(0 0 8px rgba(214, 178, 106, 0.8))"
              }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Narrative Footer */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-brand-gold shadow-[0_0_5px_#d6b26a]" />
            <span className="font-mono text-[8px] uppercase tracking-widest text-brand-cream-dim">
              Current Vector
            </span>
          </div>
        </div>
        <span className="font-mono text-[8px] text-brand-charcoal-light uppercase">
          Abraham of London // Protocol 75
        </span>
      </div>
    </div>
  );
}