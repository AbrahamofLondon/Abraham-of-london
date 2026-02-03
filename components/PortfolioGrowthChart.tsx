// components/PortfolioGrowthChart.tsx — INSTITUTIONAL VISUALIZATION
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, Archive } from 'lucide-react';

interface AuditEntry {
  date: string;
  type: string;
  tier: string;
}

interface PortfolioGrowthChartProps {
  auditData: {
    totalAssets: number;
    inventory: AuditEntry[];
  };
}

export default function PortfolioGrowthChart({ auditData }: PortfolioGrowthChartProps) {
  // Process inventory into monthly growth buckets
  const chartData = useMemo(() => {
    const months: Record<string, number> = {};
    
    // Sort inventory by date
    const sortedInventory = [...auditData.inventory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningTotal = 0;
    sortedInventory.forEach(item => {
      const month = item.date.substring(0, 7); // YYYY-MM
      runningTotal++;
      months[month] = runningTotal;
    });

    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [auditData]);

  const maxValue = auditData.totalAssets;

  return (
    <div className="w-full bg-zinc-950 border border-white/5 p-8 rounded-sm overflow-hidden relative group">
      {/* BACKGROUND TEXTURE */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-3 text-amber-500 mb-2">
              <TrendingUp size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em]">Archive Trajectory</span>
            </div>
            <h3 className="text-3xl font-serif italic text-white">Institutional Growth</h3>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono text-white tracking-tighter">{auditData.totalAssets}</div>
            <div className="text-zinc-600 font-mono text-[8px] uppercase tracking-widest">Active Dispatches</div>
          </div>
        </div>

        {/* THE CHART GRID */}
        <div className="h-64 flex items-end gap-1 relative">
          {chartData.map((d, i) => (
            <motion.div
              key={d.name}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: `${(d.value / maxValue) * 100}%`, opacity: 1 }}
              transition={{ delay: i * 0.02, duration: 0.8 }}
              className="flex-1 min-w-[4px] bg-zinc-800 hover:bg-amber-500 transition-colors relative group/bar"
            >
              {/* TOOLTIP ON HOVER */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover/bar:block z-20">
                <div className="bg-white text-black text-[9px] font-mono py-1 px-2 whitespace-nowrap uppercase">
                  {d.name}: {d.value} Assets
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <Activity size={12} className="text-zinc-600" />
            <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">Velocity: Optimal</span>
          </div>
          <div className="flex items-center gap-3 justify-center">
            <Archive size={12} className="text-zinc-600" />
            <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-widest">Integrity: Verified</span>
          </div>
          <div className="flex items-center gap-3 justify-end text-emerald-500">
             <span className="font-mono text-[9px] uppercase tracking-widest">+{(chartData[chartData.length-1]?.value - chartData[chartData.length-4]?.value) || 0} QTR</span>
          </div>
        </div>
      </div>
    </div>
  );
}