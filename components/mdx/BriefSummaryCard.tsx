// components/mdx/BriefSummaryCard.tsx — INTEL SPEC
'use client';

import React, { useMemo } from 'react';
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
  // Deterministic reference code based on props – same on server and client
  const refCode = useMemo(() => {
    const input = `${category}-${author}-${date || ''}-${classification}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0; // convert to 32‑bit integer
    }
    // Convert to positive hex‑like string, pad to 6 characters
    return Math.abs(hash).toString(36).substring(0, 6).toUpperCase().padStart(6, '0');
  }, [category, author, date, classification]);

  // Stable date display – avoids client‑side `new Date()` mismatches
  const displayDate = useMemo(() => {
    if (!date) return "Unknown date";
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return "Invalid date";
    }
  }, [date]);

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
          Ref: {refCode}
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
          <p className="text-sm font-medium text-white tracking-wide">{displayDate}</p>
        </div>
      </div>
    </div>
  );
};

export default BriefSummaryCard;