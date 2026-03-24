"use client";

import React from "react";
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Item = {
  domain: string;
  percent: number;
};

export default function PurposeAlignmentRadarChart({
  data,
}: {
  data: Item[];
}) {
  if (!data.length) {
    return (
      <div className="rounded-[22px] border bg-[#FCFBF7] p-5 text-sm text-neutral-600">
        No domain data available yet.
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full rounded-[22px] border bg-[#FCFBF7] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius="72%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Radar dataKey="percent" strokeWidth={2} fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}