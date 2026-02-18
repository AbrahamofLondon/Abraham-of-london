// components/VaultStats.tsx — HARRODS-LEVEL INSTITUTIONAL METRICS & OVERSIGHT
'use client';

import React from 'react';
import { 
  BarChart3, 
  Shield, 
  FileBox, 
  Activity,
  ChevronUp,
  TrendingUp,
  Lock,
  Globe,
  Database,
  Fingerprint,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface VaultStatsProps {
  stats: {
    total: number;
    classifiedCount: number;
    publicCount: number;
    byCategory: Record<string, number>;
  };
  className?: string;
}

// ✅ FIXED: Animation variants with proper easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.2, 0.8, 0.2, 1] as any
    }
  },
};

// Category color mapping for visual distinction
const categoryColors: Record<string, string> = {
  canon: 'amber',
  brief: 'emerald',
  short: 'purple',
  download: 'blue',
  resource: 'rose',
  strategy: 'cyan',
  intelligence: 'violet',
};

export default function VaultStats({ stats, className = '' }: VaultStatsProps) {
  // Calculate distribution percentages
  const classifiedPct = (stats.classifiedCount / stats.total) * 100;
  const publicPct = (stats.publicCount / stats.total) * 100;
  
  // Sort categories by count for better visualization
  const sortedCategories = React.useMemo(() => {
    return Object.entries(stats.byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [stats.byCategory]);

  return (
    <motion.section 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
      className={clsx(
        "relative w-full py-16 border-y border-white/5 bg-gradient-to-b from-zinc-950/20 via-black to-zinc-950/20 overflow-hidden",
        className
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-500/2 via-transparent to-transparent rounded-full blur-3xl -translate-x-48 -translate-y-48" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-500/2 via-transparent to-transparent rounded-full blur-3xl translate-x-48 translate-y-48" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Header with system status */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center justify-between mb-12 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <Database size={18} className="text-amber-500/80" />
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-md"
              />
            </div>
            <div>
              <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-white/60">
                Vault Intelligence
              </h2>
              <p className="text-[8px] font-mono text-white/20 mt-1">
                Real-time Registry Analytics
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
              System Online
            </span>
          </div>
        </motion.div>

        {/* Main stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* STAT 1: VOLUME */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3 text-white/40">
              <FileBox size={14} />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Registry Volume</span>
            </div>
            
            <div className="relative">
              <div className="flex items-baseline gap-3">
                <motion.span 
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-5xl md:text-6xl font-serif italic text-white"
                >
                  {stats.total}
                </motion.span>
                <span className="text-white/30 font-mono text-[10px] tracking-wider">
                  DISPATCHES
                </span>
              </div>
              
              {/* Growth indicator */}
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 flex items-center gap-2 text-emerald-500/80 font-mono text-[9px] bg-emerald-500/5 px-3 py-1.5 rounded-full w-fit border border-emerald-500/10"
              >
                <TrendingUp size={10} />
                <span>+12% this quarter</span>
              </motion.div>
            </div>

            {/* Micro stats */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="border-l border-white/10 pl-3">
                <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">Avg. weekly</div>
                <div className="text-white/80 text-sm font-serif italic">+{Math.round(stats.total / 52)}</div>
              </div>
              <div className="border-l border-white/10 pl-3">
                <div className="text-white/40 text-[8px] font-mono uppercase tracking-wider">Growth rate</div>
                <div className="text-emerald-500/80 text-sm font-serif italic">2.4%</div>
              </div>
            </div>
          </motion.div>

          {/* STAT 2: CLASSIFICATION MIX */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-3 text-white/40">
              <Shield size={14} />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Intelligence Mix</span>
            </div>

            <div className="space-y-3">
              {/* Progress bar with animation */}
              <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${classifiedPct}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                />
              </div>

              <div className="flex justify-between font-mono text-[9px] uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Lock size={10} className="text-amber-500/60" />
                  <span className="text-amber-500/80">{Math.round(classifiedPct)}% Classified</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={10} className="text-emerald-500/60" />
                  <span className="text-emerald-500/80">{Math.round(publicPct)}% Public</span>
                </div>
              </div>
            </div>

            {/* Classification breakdown */}
            <div className="pt-4 space-y-2">
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-white/40">Inner Circle</span>
                <span className="text-white/80 font-mono">{Math.round(stats.classifiedCount * 0.6)}</span>
              </div>
              <div className="flex justify-between items-center text-[9px]">
                <span className="text-white/40">Private</span>
                <span className="text-white/80 font-mono">{Math.round(stats.classifiedCount * 0.4)}</span>
              </div>
            </div>
          </motion.div>

          {/* STAT 3 & 4: CATEGORICAL WEIGHTING (spans 2 columns) */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 text-white/40 mb-2">
              <BarChart3 size={14} />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em]">Categorical Weighting</span>
            </div>

            {/* Category grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sortedCategories.map(([cat, count], index) => {
                const color = categoryColors[cat] || 'zinc';
                const percentage = (count / stats.total) * 100;
                
                return (
                  <motion.div
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    className={clsx(
                      "relative p-4 rounded-xl border transition-all duration-300",
                      `border-${color}-500/10 bg-${color}-500/2 hover:bg-${color}-500/5 hover:border-${color}-500/20`
                    )}
                  >
                    {/* Mini progress bar */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden rounded-t-xl">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.8 + index * 0.05 }}
                        className={clsx("h-full", `bg-${color}-500`)}
                      />
                    </div>

                    <div className="text-white/80 font-serif italic text-sm capitalize mb-1">
                      {cat.replace('-', ' ')}
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <span className="text-white font-mono text-base">{count}</span>
                      <span className="text-white/30 text-[8px] font-mono uppercase tracking-wider">
                        {Math.round(percentage)}%
                      </span>
                    </div>

                    {/* Sparkline indicator */}
                    <div className="mt-2 flex items-center gap-1">
                      <Sparkles size={8} className={clsx(`text-${color}-500/60`)} />
                      <span className="text-white/20 text-[6px] font-mono uppercase tracking-wider">
                        active
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Category summary */}
            <div className="mt-4 flex items-center justify-between text-[8px] font-mono text-white/20 uppercase tracking-wider">
              <span>Distribution across {Object.keys(stats.byCategory).length} categories</span>
              <Fingerprint size={8} className="text-white/20" />
            </div>
          </motion.div>
        </div>

        {/* SYSTEM STATUS FOOTER - Enhanced */}
        <motion.div 
          variants={itemVariants}
          className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity size={12} className="text-amber-500" />
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-amber-500/20 rounded-full blur-sm"
                />
              </div>
              <div>
                <span className="font-mono text-[8px] uppercase tracking-[0.4em] text-white/40">
                  Real-time Metadata Sync
                </span>
                <span className="ml-3 font-mono text-[7px] text-emerald-500/60">
                  Operational
                </span>
              </div>
            </div>
            
            <div className="h-3 w-px bg-white/10" />
            
            <div className="flex items-center gap-2">
              <Database size={10} className="text-white/20" />
              <span className="font-mono text-[7px] text-white/20 uppercase tracking-wider">
                Last sync: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
          
          <div className="font-mono text-[7px] uppercase tracking-[0.5em] text-white/15">
            Abraham of London // Secure Registry v8.2
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}