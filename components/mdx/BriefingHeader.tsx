'use client';

import React from 'react';
import { Shield, Hash, Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefingHeaderProps {
  title: string;
  refId?: string;
  classification?: 'UNCLASSIFIED' | 'INTERNAL' | 'SECRET' | 'TOP_SECRET';
  region?: string;
  date?: string;
}

export const BriefingHeader: React.FC<BriefingHeaderProps> = ({
  title,
  refId = "75-INTEL-B",
  classification = "INTERNAL",
  region = "GLOBAL_HQ",
  date = "FEB 2026"
}) => {
  const isSecure = classification.includes('SECRET');

  return (
    <div className="relative mb-16 border-b border-zinc-200 pb-8">
      {/* Top Meta Line */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className={cn(
            "px-2 py-0.5 text-[9px] font-black tracking-tighter rounded",
            isSecure ? "bg-red-600 text-white" : "bg-amber-500 text-black"
          )}>
            {classification}
          </div>
          <div className="h-[1px] w-8 bg-zinc-300" />
          <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
            {region} // PERSPECTIVE_V.01
          </span>
        </div>
        
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <Hash size={12} className="text-amber-600" />
          <span>REF: {refId}</span>
        </div>
      </div>

      {/* Main Title Area */}
      <h1 className="text-4xl md:text-5xl font-serif font-bold text-zinc-950 mb-6 leading-tight">
        {title}
      </h1>

      {/* Footer Meta Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Status</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-mono font-bold text-zinc-800 uppercase">Live Intel</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Archive Date</p>
          <p className="text-xs font-mono font-bold text-zinc-800 uppercase">{date}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Access Protocol</p>
          <div className="flex items-center gap-1.5">
            <Lock size={10} className="text-zinc-400" />
            <p className="text-xs font-mono font-bold text-zinc-800 uppercase">Sovereign_2026</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Network</p>
          <div className="flex items-center gap-1.5">
            <Globe size={10} className="text-zinc-400" />
            <p className="text-xs font-mono font-bold text-zinc-800 uppercase">ABRAHAM_LON</p>
          </div>
        </div>
      </div>

      {/* Decorative Corner Trace */}
      <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-zinc-200 pointer-events-none" />
    </div>
  );
};