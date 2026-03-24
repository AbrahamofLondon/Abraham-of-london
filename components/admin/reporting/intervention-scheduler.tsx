'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { suggestIntensity, InterventionType } from '@/lib/alignment/scheduler-engine';

interface InterventionSchedulerProps {
  targetTeam: string;
  delta: number;
  fragilityScore: number;
}

export function InterventionScheduler({ targetTeam, delta, fragilityScore }: InterventionSchedulerProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedType, setSelectedType] = useState<InterventionType>('STRATEGIC_PULSE');
  
  const intensity = suggestIntensity(delta, fragilityScore);

  const handleDeploy = () => {
    setIsDeploying(true);
    // Logic to push to Sovereign DB
    setTimeout(() => setIsDeploying(false), 2000);
  };

  return (
    <div className="bg-black text-white p-10 border border-neutral-800 shadow-2xl relative overflow-hidden group">
      {/* Background Pulse */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#8A6A2F]/5 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 text-[#8A6A2F]" />
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">Deployment Engine</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* CONFIGURATION */}
          <div>
            <h3 className="text-3xl font-black uppercase tracking-tighter mb-6">
              Protocol for {targetTeam}
            </h3>
            
            <div className="space-y-4">
              <label className="block">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Intervention Type</span>
                <select 
                  className="w-full bg-neutral-900 border border-neutral-700 p-4 text-xs font-bold uppercase tracking-widest focus:border-[#8A6A2F] outline-none"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as InterventionType)}
                >
                  <option value="STRATEGIC_PULSE">Strategic Pulse (Low Friction)</option>
                  <option value="COHORT_SYNCHRONIZATION">Cohort Synchronization (Mid Friction)</option>
                  <option value="DIRECTIVE_REINFORCEMENT">Directive Reinforcement (High Friction)</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900 p-4 border border-neutral-800">
                  <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Recommended Intensity</p>
                  <p className={`text-sm font-black ${intensity === 'HIGH' ? 'text-red-500' : 'text-[#8A6A2F]'}`}>{intensity}</p>
                </div>
                <div className="bg-neutral-900 p-4 border border-neutral-800">
                  <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Dissonance Delta</p>
                  <p className="text-sm font-black text-white">{delta}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* SCHEDULING & ACTION */}
          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-neutral-400">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Earliest Start: T-Minus 24h</span>
              </div>
              <div className="flex items-center gap-4 text-neutral-400">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Duration: 14 Day Cycle</span>
              </div>
              <p className="text-[11px] text-neutral-500 italic leading-relaxed">
                This intervention will deploy anonymized re-alignment directives to the cohort's terminal, 
                monitoring for resonance shifts in real-time.
              </p>
            </div>

            <button 
              onClick={handleDeploy}
              disabled={isDeploying}
              className={`mt-8 w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                isDeploying ? 'bg-neutral-800 text-neutral-500' : 'bg-[#8A6A2F] text-white hover:bg-[#A6803B] shadow-xl'
              }`}
            >
              {isDeploying ? (
                <>Synchronizing Nodes... <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /></>
              ) : (
                <>Initialize Protocol <Play className="w-3 h-3 fill-current" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER AUDIT */}
      <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center opacity-40">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span className="text-[8px] font-bold uppercase tracking-widest">Sovereign Governance Compliant</span>
        </div>
        <span className="text-[8px] font-mono uppercase tracking-widest italic">Auth-ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
      </div>
    </div>
  );
}