"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { ChartDataPoint } from "./ChartContent";

// Dynamically import the chart content with SSR disabled
const ChartContent = dynamic(
  () => import("./ChartContent").then((mod) => mod.ChartContent),
  { ssr: false }
);

interface RegistryAsset {
  d: string;
}

export default function GrowthChart() {
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    setIsLoaded(true);
    async function processData() {
      try {
        const res = await fetch("/system/content-registry.json");
        if (!res.ok) throw new Error("Registry fetch failed");

        const data = await res.json();
        const assets: RegistryAsset[] = data.index || [];

        const monthlyMap: Record<string, number> = {};
        assets.forEach((asset) => {
          if (asset.d) {
            const month = asset.d.substring(0, 7);
            monthlyMap[month] = (monthlyMap[month] || 0) + 1;
          }
        });

        const sortedMonths = Object.keys(monthlyMap).sort();
        let cumulative = 0;
        const formattedData: ChartDataPoint[] = sortedMonths.map((month) => {
          cumulative += monthlyMap[month] || 0;
          return {
            name: new Date(month + "-01").toLocaleDateString("en-GB", {
              month: "short",
              year: "2-digit",
            }),
            assets: cumulative,
          };
        });

        setChartData(formattedData);
      } catch (error) {
        console.error("Institutional Chart Error:", error);
      }
    }
    processData();
  }, []);

  if (!isLoaded) {
    return <div className="h-[300px] w-full animate-pulse bg-zinc-900/10" />;
  }

  return (
    <div className="border border-neutral-100 bg-white p-8 dark:border-neutral-800 dark:bg-[#0f0f0f]">
      <div className="mb-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          Content Velocity
        </h2>
        <p className="mt-1 text-xs font-light italic text-neutral-500">
          Cumulative Briefing Growth (2025-2026)
        </p>
      </div>

      <div className="h-[300px] w-full">
        <ChartContent data={chartData} />
      </div>
    </div>
  );
}