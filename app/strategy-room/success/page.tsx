'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, TrendingUp, ChevronRight, Download, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useClientIsReady } from '@/lib/router/useClientRouter';

// Framer Motion constraints for build safety - FIXED
const CONTAINER_TRANSITION = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1] as const // Use 'as const' instead of 'as any'
};

export default function StrategySuccessPage() {
  const isReady = useClientIsReady();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function fetchResults() {
      if (!id) return;
      try {
        const res = await fetch(`/api/strategy-room/results?id=${id}`);
        if (!res.ok) throw new Error('Data retrieval failed');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error("Critical: Failed to retrieve dossier", err);
      } finally {
        setLoading(false);
      }
    }
    if (isReady) fetchResults();
  }, [id, isReady]);

  // Prevent Hydration Mismatch
  if (!mounted || !isReady || loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono space-y-4">
        <Loader2 className="animate-spin text-amber-500" size={24} />
        <div className="text-zinc-500 uppercase tracking-[0.4em] text-[10px]">
          Decrypting_Strategic_Output...
        </div>
      </div>
    );
  }

  // Handle case where ID exists but no data returned
  if (!data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono space-y-4">
        <AlertTriangle className="text-red-500" size={24} />
        <div className="text-zinc-500 uppercase tracking-[0.4em] text-[10px]">
          Dossier_Not_Found
        </div>
        <Link href="/strategy-room" className="text-amber-500 text-[9px] uppercase tracking-widest mt-8">
          Return to Strategy Room
        </Link>
      </div>
    );
  }

  const score = data?.readinessScore ?? 0;
  const isHighRisk = score < 40;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-mono">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={CONTAINER_TRANSITION}
        className="max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-8 mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] uppercase tracking-widest font-bold">Analysis Complete</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic">
              Strategy_Dossier_#{id?.slice(-6).toUpperCase()}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-zinc-500 text-[10px] uppercase block">Principal Identity</span>
            <span className="text-white text-sm uppercase font-bold">{data?.fullName || 'Anonymous'}</span>
          </div>
        </div>

        {/* Score Visualization Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Main Score Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-8 rounded-3xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-zinc-500 text-[10px] uppercase mb-8 tracking-widest font-bold">Operational_Readiness_Index</h2>
              <div className="flex items-baseline gap-4">
                <span className={`text-7xl font-black tracking-tighter ${isHighRisk ? 'text-red-500' : 'text-amber-500'}`}>
                  {score}%
                </span>
                <span className="text-zinc-600 text-sm">/ 100.00</span>
              </div>
              <p className="mt-6 text-zinc-400 text-xs leading-relaxed max-w-md">
                {isHighRisk 
                  ? "CRITICAL: Structural dependencies and market friction exceed safety margins. Sovereignty pivot recommended."
                  : "STABLE: Institutional alignment is sufficient for current trajectory. Maintain autonomous protocols."}
              </p>
            </div>
            {/* Visual background gauge */}
            <div className="absolute bottom-0 left-0 h-1 bg-zinc-800 w-full">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1.5, delay: 0.5 }}
                className={`h-full ${isHighRisk ? 'bg-red-500' : 'bg-amber-500'}`} 
              />
            </div>
          </div>

          {/* Volatility Status Card */}
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl flex flex-col justify-between">
            <TrendingUp className="text-zinc-600 mb-4" size={32} />
            <div>
              <span className="text-zinc-500 text-[10px] uppercase block mb-1 font-bold">Market Context</span>
              <span className="text-white text-lg uppercase font-bold tracking-tight">{data?.volatility || 'UNKNOWN'}</span>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/briefings" className="group flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500/20 p-3 rounded-xl group-hover:bg-amber-500 group-hover:text-black transition-all">
                <ChevronRight size={20} />
              </div>
              <div>
                <span className="text-white font-bold block uppercase text-xs">Access Briefings</span>
                <span className="text-zinc-500 text-[9px] uppercase">Unlock Intelligence Portfolio</span>
              </div>
            </div>
          </Link>

          <button className="group flex items-center justify-between p-6 bg-zinc-900/50 border border-white/10 rounded-2xl opacity-40 cursor-not-allowed">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-700 p-3 rounded-xl">
                <Download className="text-zinc-400" size={20} />
              </div>
              <div>
                <span className="text-zinc-400 font-bold block uppercase text-xs">Export PDF</span>
                <span className="text-zinc-600 text-[9px] uppercase">Coming_Soon.exe</span>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center">
          <Link href="/strategy-room" className="inline-flex items-center gap-2 text-zinc-600 hover:text-amber-500 text-[9px] uppercase tracking-widest transition-colors font-bold">
            <RefreshCw size={10} /> Recalibrate_Assessment
          </Link>
        </div>
      </motion.div>
    </div>
  );
}