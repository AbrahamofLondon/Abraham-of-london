// components/VaultActivityFeed.tsx — INSTITUTIONAL ACTIVITY STREAM
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Shield, Zap, Lock, Globe } from 'lucide-react';
import Link from 'next/link';
import { getDocHref } from '@/lib/content/unified-router';

interface AuditEntry {
  id: string;
  title: string;
  type: string;
  tier: 'public' | 'inner-circle' | 'private';
  date: string;
}

interface VaultActivityFeedProps {
  inventory: AuditEntry[];
}

export default function VaultActivityFeed({ inventory }: VaultActivityFeedProps) {
  // Sort by date and take the 5 most recent additions
  const recentActivity = [...inventory]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="w-full bg-black border border-white/5 p-6 rounded-sm">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio size={14} className="text-amber-500" />
            <span className="absolute inset-0 animate-ping bg-amber-500/40 rounded-full" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-white">
            Live Feed // Registry Updates
          </span>
        </div>
        <div className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">
          Node: London_Edge_01
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {recentActivity.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group relative flex items-start gap-4 p-3 hover:bg-white/[0.02] transition-colors rounded-sm border border-transparent hover:border-white/5"
            >
              {/* TIER INDICATOR */}
              <div className="mt-1">
                {entry.tier === 'public' ? (
                  <Globe size={12} className="text-zinc-500" />
                ) : (
                  <Lock size={12} className="text-amber-500" />
                )}
              </div>

              {/* CONTENT */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-[8px] uppercase tracking-tighter text-zinc-600">
                    {entry.type} // {entry.date}
                  </span>
                  {i === 0 && (
                    <span className="bg-amber-500/10 text-amber-500 font-mono text-[7px] px-1.5 py-0.5 rounded-full animate-pulse">
                      NEW_ENTRY
                    </span>
                  )}
                </div>
                
                <Link 
                  href={`/registry/${entry.type.toLowerCase()}s/${entry.id}`}
                  className="block text-sm font-serif italic text-zinc-300 group-hover:text-white transition-colors truncate"
                >
                  {entry.title}
                </Link>
              </div>

              <Zap size={10} className="mt-2 text-zinc-800 group-hover:text-amber-500 transition-colors" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        <Link 
          href="/registry"
          className="block w-full text-center py-3 border border-white/10 font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
        >
          View Full 163-Dispatch Archive
        </Link>
      </div>
    </div>
  );
}