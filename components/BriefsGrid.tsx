/* components/BriefsGrid.tsx — PORTFOLIO VISUALIZATION */
import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, ArrowUpRight } from 'lucide-react';

export function BriefsGrid({ briefs }: { briefs: any[] }) {
  const [filter, setFilter] = useState('All');

  const categories = ['All', ...new Set(briefs.map(b => b.category))];
  const filteredBriefs = filter === 'All' ? briefs : briefs.filter(b => b.category === filter);

  return (
    <div className="space-y-12">
      {/* 1. Systematic Filter Bar */}
      <div className="flex gap-4 border-b border-white/5 pb-6 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-[10px] uppercase tracking-widest px-4 py-2 rounded-full transition-all ${
              filter === cat ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-500 hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. Responsive 75-Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBriefs.map((brief) => (
          <Link key={brief.slug} href={`/vault/${brief.slug}`} className="group relative bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:border-amber-500/50 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-mono text-amber-500/70">{brief.series} // VOL. {brief.volume}</span>
              {brief.classification === 'Restricted' ? <Lock size={12} className="text-rose-500" /> : <Shield size={12} className="text-emerald-500" />}
            </div>
            <h3 className="text-lg font-serif italic text-white group-hover:text-amber-500 transition-colors mb-2">{brief.title}</h3>
            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-6">{brief.excerpt}</p>
            <div className="flex justify-between items-center text-[9px] uppercase tracking-[0.2em] text-zinc-600">
              <span>{brief.readTime}</span>
              <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}