"use client";

import React, { useState, useEffect } from "react";
import { Zap, FastForward, Target, BarChart3, ChevronRight, Wind } from "lucide-react";

export default function VelocityVectorSimulation() {
  const [marketFriction, setMarketFriction] = useState(65); // Legacy competitor friction
  const [ogrResonance, setOgrResonance] = useState(94); // Current client resonance
  const [velocityGap, setVelocityGap] = useState(0);

  useEffect(() => {
    // Logic: Velocity is the inverse of friction. 
    // OGR organizations move at a rate relative to their resonance score.
    const gap = (ogrResonance / (100 - marketFriction)).toFixed(1);
    setVelocityGap(parseFloat(gap));
  }, [marketFriction, ogrResonance]);

  return (
    <div className="mx-auto max-w-6xl bg-[#0F1115] border border-white/10 shadow-2xl my-20 overflow-hidden font-sans">
      
      {/* 1. Simulation Header */}
      <div className="p-10 border-b border-white/5 bg-gradient-to-r from-[#16191E] to-[#0F1115] flex justify-between items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#8A6A2F]" />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">
              Stage III.B // Velocity Projection
            </span>
          </div>
          <h2 className="font-serif text-3xl text-white italic">
            The Velocity <span className="not-italic text-[#8A6A2F]">Vector</span>
          </h2>
        </div>
        <div className="text-right space-y-1">
          <span className="block font-mono text-[10px] text-neutral-500 uppercase">System Status</span>
          <span className="block font-mono text-xs text-green-500 animate-pulse uppercase tracking-widest">Active Simulation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* 2. Parameters: The Market vs. The Core */}
        <div className="lg:col-span-4 p-10 border-r border-white/5 space-y-12 bg-[#16191E]/50">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 font-bold text-[#8A6A2F]">Competitor Friction</h3>
              <span className="font-mono text-xs text-white">{marketFriction}%</span>
            </div>
            <input 
              type="range" min="10" max="90" value={marketFriction}
              onChange={(e) => setMarketFriction(parseInt(e.target.value))}
              className="w-full accent-[#C44D4D] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
              Estimated internal drag of a typical Tier-1 legacy competitor.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F] font-bold">Your Resonance</h3>
              <span className="font-mono text-xs text-white">{ogrResonance}%</span>
            </div>
            <input 
              type="range" min="50" max="100" value={ogrResonance}
              onChange={(e) => setOgrResonance(parseInt(e.target.value))}
              className="w-full accent-[#8A6A2F] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <p className="text-[10px] text-neutral-500 leading-relaxed italic">
              Verified OGR Phase II Stability score.
            </p>
          </div>
        </div>

        {/* 3. The Visual Output: The Velocity Gap */}
        <div className="lg:col-span-8 p-12 relative flex flex-col justify-center bg-black">
          
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'linear-gradient(#8A6A2F 0.5px, transparent 0.5px), linear-gradient(90deg, #8A6A2F 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }} />

          <div className="relative z-10 space-y-16">
            
            {/* The Visual Comparison Bars */}
            <div className="space-y-10">
              <div className="space-y-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 italic">Legacy Market Pace</span>
                  <span className="font-mono text-xs text-neutral-500">1.0x</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="bg-neutral-700 h-full w-[25%]" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A6A2F] font-bold">Your Penetration Velocity</span>
                  <span className="font-mono text-xl text-white">{velocityGap}x</span>
                </div>
                <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden flex items-center p-1">
                  <div 
                    className="bg-gradient-to-r from-[#8A6A2F] to-[#B8A77C] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(138,106,47,0.4)]"
                    style={{ width: `${Math.min(velocityGap * 25, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Practical Outcome Deliverable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div className="flex gap-4">
                <div className="p-3 bg-[#8A6A2F]/10 rounded-lg h-fit">
                  <FastForward className="w-5 h-5 text-[#8A6A2F]" />
                </div>
                <div>
                  <h4 className="font-serif text-white text-lg italic">Strategic Advantage</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mt-2">
                    Every 1 month of your execution is equivalent to <span className="text-white font-bold">{velocityGap} months</span> of competitor progress.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-[#8A6A2F]/10 rounded-lg h-fit">
                  <Wind className="w-5 h-5 text-[#8A6A2F]" />
                </div>
                <div>
                  <h4 className="font-serif text-white text-lg italic">Capital Efficiency</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mt-2">
                    Reduced "Time-to-Value" allows for rapid re-investment of capital into Domain Expansion.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8">
              <button className="px-12 py-4 bg-[#8A6A2F] text-white font-mono text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-[#B8A77C] transition-all hover:shadow-[0_0_30px_rgba(138,106,47,0.3)]">
                Authorise Phase III Execution
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[#0A0C0F] border-t border-white/5 text-center">
        <p className="font-mono text-[7px] uppercase tracking-[0.6em] text-neutral-600">
          Abraham of London // Kinetic Forensics // MMXXVI
        </p>
      </div>
    </div>
  );
}