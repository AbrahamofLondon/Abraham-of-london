/* components/dashboard/PortfolioSummary.tsx — INSTITUTIONAL COMMAND CENTER */
"use client";

import * as React from "react";
import Link from "next/link";

interface RegistryAsset {
  id: string;
  t: string;
  type: string;
  tier: string;
  d: string;
}

interface PortfolioStats {
  total: number;
  byTier: Record<string, number>;
  latest: RegistryAsset[];
}

export default function PortfolioSummary() {
  const [stats, setStats] = React.useState<PortfolioStats | null>(null);

  React.useEffect(() => {
    async function fetchStats() {
      const res = await fetch("/system/content-registry.json");
      const data = await res.json();
      
      const tiers = data.index.reduce((acc: any, curr: any) => {
        acc[curr.tier] = (acc[curr.tier] || 0) + 1;
        return acc;
      }, {});

      setStats({
        total: data.meta.total,
        byTier: tiers,
        latest: data.index.slice(0, 5) // Most recent based on registry order
      });
    }
    fetchStats();
  }, []);

  if (!stats) return <div className="animate-pulse h-64 bg-neutral-100 dark:bg-neutral-900 rounded-sm" />;

  return (
    <div className="space-y-12 py-10">
      {/* 1. ARCHIVE METRICS */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400 mb-8">Institutional Coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-800">
          <StatSquare label="Total Assets" value={stats.total} />
          <StatSquare label="Inner Circle" value={stats.byTier['inner-circle'] || 0} />
          <StatSquare label="Elite Access" value={stats.byTier['inner-circle-elite'] || 0} />
          <StatSquare label="Public Domain" value={stats.byTier['public'] || 0} />
        </div>
      </section>

      {/* 2. RECENT DISPATCHES */}
      <section>
        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-4">
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-neutral-400">Latest Intelligence</h2>
          <Link href="/vault" className="text-[10px] uppercase tracking-[0.2em] text-emerald-700 hover:text-emerald-600 transition-colors">
            View Full Archive →
          </Link>
        </div>
        
        <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
          {stats.latest.map((asset) => (
            <Link 
              key={asset.id} 
              href={`/vault/${asset.id}`}
              className="group flex items-center justify-between py-4 hover:px-2 transition-all duration-300"
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-500 transition-colors">
                  {asset.t}
                </span>
                <span className="text-[9px] uppercase tracking-tighter text-neutral-400 mt-1">
                  Ref: {asset.id} — {asset.tier}
                </span>
              </div>
              <time className="text-[10px] text-neutral-400 font-mono">
                {new Date(asset.d).toLocaleDateString('en-GB')}
              </time>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatSquare({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-white dark:bg-[#0f0f0f] p-8 flex flex-col items-center justify-center space-y-2">
      <span className="text-3xl font-light tracking-tighter text-neutral-900 dark:text-neutral-100">{value}</span>
      <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-400">{label}</span>
    </div>
  );
}