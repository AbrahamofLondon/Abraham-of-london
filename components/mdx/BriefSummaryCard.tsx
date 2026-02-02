// components/mdx/BriefSummaryCard.tsx — INTEL SPEC
'use client';

import React from 'react';
import { Shield, Clock, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BriefSummaryCardProps {
  category?: string;
  classification?: string;
  author?: string;
  date?: string;
  readingTime?: string;
  className?: string;
}

export const BriefSummaryCard: React.FC<BriefSummaryCardProps> = ({
  category = "LITERATURE",
  classification = "PROPRIETARY",
  author = "Abraham of London",
  date,
  readingTime,
  className,
}) => {
  return (
    <div className={cn(
      "my-12 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-sm",
      className
    )}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-3">
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-gold" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            {classification} // INTEL_CORE
          </span>
        </div>
        <div className="font-mono text-[9px] text-white/20 uppercase tracking-widest">
          Ref: {Math.random().toString(36).substring(2, 8).toUpperCase()}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        <div className="bg-zinc-950 p-6">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <FileText size={14} className="text-gold/50" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Domain</span>
          </div>
          <p className="text-sm font-medium text-white tracking-wide">{category}</p>
        </div>

        <div className="bg-zinc-950 p-6">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <User size={14} className="text-gold/50" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Authority</span>
          </div>
          <p className="text-sm font-medium text-white tracking-wide">{author}</p>
        </div>

        <div className="bg-zinc-950 p-6">
          <div className="flex items-center gap-3 text-white/40 mb-2">
            <Clock size={14} className="text-gold/50" />
            <span className="font-mono text-[9px] uppercase tracking-widest">Temporal</span>
          </div>
          <p className="text-sm font-medium text-white tracking-wide">
            {date || new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BriefSummaryCard;