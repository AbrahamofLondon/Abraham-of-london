'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShieldCheck, Trophy, ArrowRight, Share2, Download, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AssessmentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract scores from URL (pushed from the POST response)
  const score = searchParams.get('score') || '0';
  const band = searchParams.get('band') || 'Emergent';
  const numericScore = parseInt(score, 10);

  // Determine accent color based on the Band
  const getBandColor = () => {
    if (band === 'Sovereign') return '#8A6A2F'; // Gold
    if (band === 'Aligned') return '#D4D4D8';   // Zinc-300
    return '#3F3F46';                           // Zinc-700
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6 font-sans">
      <div className="max-w-2xl w-full">
        
        {/* ENTRANCE ANIMATION FOR INSTITUTIONAL WEIGHT */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative border border-white/10 bg-white/[0.02] p-12 md:p-20 text-center overflow-hidden"
        >
          {/* BACKGROUND BRAND MARK */}
          <Landmark className="absolute top-[-20px] left-[-20px] w-40 h-40 text-white/[0.01] rotate-12" />

          <header className="relative z-10 mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 mb-6">
              <ShieldCheck className="w-8 h-8 text-[#8A6A2F]" />
            </div>
            <h1 className="text-[10px] uppercase tracking-[0.5em] text-[#8A6A2F] font-bold mb-4">
              Commitment Verified
            </h1>
            <h2 className="text-4xl md:text-5xl font-serif font-light tracking-tight mb-2">
              The Registry is <span className="italic text-zinc-400">Updated.</span>
            </h2>
            <p className="text-zinc-500 text-sm font-light max-w-xs mx-auto">
              Your institutional resonance has been successfully synchronized.
            </p>
          </header>

          {/* THE OGR SCORE DISPLAY */}
          <section className="relative z-10 py-12 border-y border-white/5 mb-12">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-4">
                Current Alignment Resonance
              </span>
              <div className="relative group">
                <div 
                  className="text-8xl md:text-9xl font-serif font-light tabular-nums transition-colors duration-1000"
                  style={{ color: getBandColor() }}
                >
                  {numericScore}%
                </div>
                {/* Subtle pulse under the score */}
                <div className="absolute inset-0 bg-[#8A6A2F]/5 blur-3xl rounded-full opacity-50" />
              </div>
              <div className="mt-4 px-6 py-2 border border-white/10 bg-black">
                <span className="text-xs uppercase tracking-[0.4em] font-medium text-white">
                  Status: <span style={{ color: getBandColor() }}>{band}</span>
                </span>
              </div>
            </div>
          </section>

          {/* ACTION SUITE */}
          <footer className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-[#8A6A2F] text-black font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-all duration-500"
            >
              View Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              disabled
              className="flex items-center justify-center gap-3 px-8 py-4 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.2em] opacity-50 cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Extract PDF Report
            </button>
          </footer>

          {/* INTEGRITY FOOTNOTE */}
          <div className="mt-12 pt-8 border-t border-white/5 text-[8px] font-mono text-zinc-700 uppercase tracking-widest">
            Protocol: OGR-V4-ENTERPRISE // UUID: {Math.random().toString(16).slice(2, 10).toUpperCase()}
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <button className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-[9px] uppercase tracking-widest">
            <Share2 size={12} />
            Share Result Internally
          </button>
        </div>
      </div>

      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('/grain.png')]" />
    </main>
  );
}