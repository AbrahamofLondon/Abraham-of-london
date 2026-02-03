/* components/dashboard/GrowthChart.tsx — INSTITUTIONAL VELOCITY */
"use client";

import * as React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";

interface RegistryAsset {
  d: string;
}

export default function GrowthChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function processData() {
      const res = await fetch("/system/content-registry.json");
      const data = await res.json();
      const assets: RegistryAsset[] = data.index;

      // 1. Group by Month
      const monthlyMap: Record<string, number> = {};
      assets.forEach(asset => {
        const month = asset.d.substring(0, 7); // YYYY-MM
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
      });

      // 2. Sort and Accumulate
      const sortedMonths = Object.keys(monthlyMap).sort();
      let cumulative = 0;
      const formattedData = sortedMonths.map(month => {
        cumulative += monthlyMap[month];
        return {
          name: new Date(month + "-01").toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
          assets: cumulative
        };
      });

      setChartData(formattedData);
    }
    processData();
  }, []);

  return (
    <div className="bg-white dark:bg-[#0f0f0f] border border-neutral-100 dark:border-neutral-800 p-8">
      <div className="mb-8">
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Content Velocity</h2>
        <p className="text-xs text-neutral-500 mt-1 font-light italic">Cumulative Briefing Growth (2025-2026)</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#064e3b" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#064e3b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#a3a3a3', letterSpacing: '0.1em' }} 
              dy={10}
            />
            <YAxis 
              hide={true} 
              domain={['dataMin - 10', 'auto']} 
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#111', 
                border: 'none', 
                borderRadius: '0px',
                fontSize: '10px',
                color: '#fff' 
              }}
              itemStyle={{ color: '#10b981' }}
              cursor={{ stroke: '#064e3b', strokeWidth: 1 }}
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
      </div>
    </div>
  );
}