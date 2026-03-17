/* components/sections/TeaserHero.tsx — INSTITUTIONAL CINEMATIC VERSION */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import TeaserRequest from "@/components/TeaserRequest";

// --- Sub-component: The Cinematic Atmosphere ---
const CinematicBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    {/* Deep Depth Gradient */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
    
    {/* Shifting Smoke / Texture Filter */}
    <svg className="absolute w-full h-full opacity-[0.15] mix-blend-overlay">
      <filter id="crucible-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="1" stitchTiles="stitch">
          <animate attributeName="baseFrequency" from="0.015" to="0.02" dur="30s" repeatCount="indefinite" />
        </feTurbulence>
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#crucible-noise)" />
    </svg>

    {/* Moving Light Leak */}
    <motion.div 
      animate={{ 
        x: [-100, 100, -100],
        opacity: [0.1, 0.2, 0.1] 
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-0 left-0 w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent,rgba(245,158,11,0.03),transparent)]"
    />
  </div>
);

export default function TeaserHero() {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center py-24 overflow-hidden bg-zinc-950">
      <CinematicBackground />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Narrative Content */}
          <div className="lg:col-span-7 space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="h-[1px] w-8 bg-amber-500/50" />
                <span className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.5em] block">
                  Advance Intelligence Release
                </span>
              </div>

              <h1 className="text-6xl md:text-8xl font-serif font-bold text-white leading-[0.95] mb-8 tracking-tighter">
                Fathering <br />
                <span className="italic text-amber-400 font-light">Without Fear</span>
              </h1>
              
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-500/40 to-transparent" />
                <p className="text-zinc-400 text-xl md:text-2xl leading-relaxed max-w-xl font-light italic pl-2">
                  "A memoir forged in the crucible of loss, legal storms, and a father’s stubborn hope. For the men who keep showing up."
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-center gap-8 pt-6 border-t border-white/5"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 w-12 rounded-full border-2 border-zinc-900 bg-zinc-900 flex items-center justify-center text-[10px] text-amber-500 font-black shadow-xl ring-1 ring-white/5">
                    {i === 4 ? "50+" : <div className="w-1 h-1 bg-amber-500/40 rounded-full" />}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-white text-[10px] uppercase tracking-[0.2em] font-black">
                  Active Distribution
                </p>
                <p className="text-zinc-500 text-[9px] uppercase tracking-widest">
                  Early Access Briefings Distributed via Inner Circle
                </p>
              </div>
            </motion.div>
          </div>

          {/* Featured Request Component */}
          <div className="lg:col-span-5 relative">
            {/* Ambient Glow behind the form */}
            <div className="absolute -inset-4 bg-amber-500/5 blur-3xl rounded-full" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <TeaserRequest variant="featured" className="border-amber-500/20 shadow-2xl relative z-10" />
              
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-4 text-zinc-600">
                  <span className="h-[1px] w-4 bg-zinc-800" />
                  <p className="text-[9px] uppercase tracking-[0.4em] font-mono">
                    Secure Download • PDF • 4.2MB
                  </p>
                  <span className="h-[1px] w-4 bg-zinc-800" />
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Ornamental Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-20"
      >
        <span className="text-[8px] uppercase tracking-[0.5em] text-amber-500 mb-2">Protocol</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-amber-500 via-amber-500/20 to-transparent" />
      </motion.div>
    </section>
  );
}