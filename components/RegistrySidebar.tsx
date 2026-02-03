// components/RegistrySidebar.tsx — HARDENED (Contextual Intel Panel)
'use client';

import React from 'react';
import { 
  Clock, 
  ShieldCheck, 
  Hash, 
  FileText, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  metadata: {
    readingTime: string;
    wordCount: number;
    classification: string;
    category: string;
    tags: string[];
    date: string;
  };
}

export default function RegistrySidebar({ metadata }: SidebarProps) {
  const isClassified = metadata.classification !== 'public';

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="sticky top-32 space-y-10">
        
        {/* SECTION 1: SYSTEM CLASSIFICATION */}
        <div className="border border-white/5 bg-zinc-950/50 p-6 backdrop-blur-sm">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center justify-between">
            Classification 
            <ShieldCheck size={12} className={isClassified ? "text-amber-500" : "text-zinc-700"} />
          </h4>
          
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-amber-500/50 uppercase tracking-widest">Protocol</span>
              <span className="text-lg font-serif italic text-zinc-200 capitalize">
                {metadata.classification.replace('-', ' ')}
              </span>
            </div>
            
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">Status</span>
                <span className="text-[10px] font-mono text-zinc-300 uppercase">Verified Asset</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* SECTION 2: DISPATCH METRICS */}
        <div className="px-2 space-y-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2">
            <TrendingUp size={12} /> Dispatch Metrics
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 text-zinc-400 group">
              <Clock size={14} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
              <span className="font-mono text-[11px] uppercase tracking-widest">{metadata.readingTime}</span>
            </div>
            
            <div className="flex items-center gap-3 text-zinc-400 group">
              <FileText size={14} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
              <span className="font-mono text-[11px] uppercase tracking-widest">{metadata.wordCount.toLocaleString()} Words</span>
            </div>

            <div className="flex items-center gap-3 text-zinc-400 group">
              <Hash size={14} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
              <span className="font-mono text-[11px] uppercase tracking-widest">{metadata.category}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: REGISTRY TAGS */}
        {metadata.tags && metadata.tags.length > 0 && (
          <div className="px-2">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500 mb-6">Related Identifiers</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag) => (
                <button 
                  key={tag}
                  className="px-3 py-1.5 border border-white/5 bg-white/[0.02] font-mono text-[9px] uppercase tracking-widest text-zinc-500 hover:text-amber-500 hover:border-amber-500/20 transition-all"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: INSTITUTIONAL FOOTNOTE */}
        <div className="px-2 pt-10 opacity-30 group hover:opacity-100 transition-opacity">
          <p className="font-mono text-[8px] leading-relaxed text-zinc-600 uppercase tracking-tighter">
            Information contained herein is the property of Abraham of London. 
            Redistribution without encryption-key authorization is a violation 
            of institutional protocol {metadata.date.split('-')[0]}.
          </p>
        </div>

      </div>
    </aside>
  );
}