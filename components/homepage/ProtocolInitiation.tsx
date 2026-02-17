"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { 
  ShieldAlert, 
  Send, 
  Fingerprint, 
  ArrowRight, 
  Terminal,
  Cpu
} from "lucide-react";

export default function ProtocolInitiation() {
  return (
    <section className="relative bg-black py-24 lg:py-40 overflow-hidden">
      {/* 1. Structural Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-amber-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_70%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* --- Header: The Mandate --- */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/5 mb-8"
          >
            <ShieldAlert className="h-3 w-3 text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
              Protocol Engagement: Active
            </span>
          </motion.div>
          
          <h2 className="font-serif text-5xl md:text-6xl font-medium text-white tracking-tight mb-6">
            Initiate <span className="italic text-white/30">Protocol.</span>
          </h2>
          
          <p className="text-white/40 text-lg font-light max-w-xl mx-auto leading-relaxed">
            We do not accept all mandates. Engagement begins with a briefing 
            of your current architecture and desired state.
          </p>
        </div>

        {/* --- The Console: The Form --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 md:p-12 backdrop-blur-xl"
        >
          {/* Metadata Overlay */}
          <div className="absolute top-8 right-12 hidden md:block">
            <div className="flex items-center gap-4 text-[9px] font-mono text-white/20 uppercase tracking-widest">
              <span>Encrypted Submission</span>
              <Fingerprint className="h-4 w-4" />
            </div>
          </div>

          <form className="grid gap-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Field 1: Identity */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 ml-1">
                  01 // Principal Identity
                </label>
                <input 
                  type="text"
                  placeholder="Full Name / Entity"
                  className="w-full bg-transparent border-b border-white/10 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 transition-colors font-light tracking-wide"
                />
              </div>

              {/* Field 2: Contact */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 ml-1">
                  02 // Secure Channel
                </label>
                <input 
                  type="email"
                  placeholder="Email Address"
                  className="w-full bg-transparent border-b border-white/10 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 transition-colors font-light tracking-wide"
                />
              </div>
            </div>

            {/* Field 3: The Mandate */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 ml-1">
                03 // Mandate Specification
              </label>
              <textarea 
                rows={4}
                placeholder="Briefly describe the institutional challenge or the strategic objective..."
                className="w-full bg-transparent border border-white/10 rounded-2xl p-6 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 transition-colors font-light tracking-wide resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-6">
              <button 
                type="submit"
                className="group relative w-full overflow-hidden rounded-2xl bg-white py-6 transition-all hover:bg-amber-400"
              >
                <div className="relative z-10 flex items-center justify-center gap-4 text-black font-black uppercase tracking-[0.3em] text-xs">
                  <Send className="h-4 w-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  Submit Engagement Request
                </div>
                {/* Visual Glitch/Shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </button>
            </div>
          </form>

          {/* Technical Footer */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
            <div className="flex items-center gap-3">
              <Terminal className="h-4 w-4 text-white/20" />
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">
                System: AO-LDN-INIT-V2 // Response Latency: 24-48H
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-3 w-3 text-amber-500/40" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                Direct Governance Interface
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ✅ Fixed: Removed 'jsx' prop – now using a standard style tag */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </section>
  );
}