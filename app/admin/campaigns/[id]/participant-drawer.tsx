'use client';

import { X, CheckCircle2, Activity, Circle } from "lucide-react";
import { useEffect, useState } from "react";

interface ParticipantDrawerProps {
  participant: any | null;
  onClose: () => void;
}

export function ParticipantDrawer({ participant, onClose }: ParticipantDrawerProps) {
  if (!participant) return null;

  // Mocking the domain structure for the Sovereign OGR Protocol
  const domains = [
    "Strategic_Intent",
    "Operational_Clarity",
    "Cultural_Resonance",
    "Leadership_Trust",
    "Resource_Equity"
  ];

  // Logic to determine progress based on current audit status
  const completedCount = participant.status === 'completed' ? domains.length : (participant.status === 'opened' ? 2 : 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-neutral-200 p-10 flex flex-col animate-in slide-in-from-right duration-300">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-neutral-100 transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="mb-12">
          <span className="px-2 py-0.5 bg-[#8A6A2F] text-white text-[8px] font-black uppercase tracking-[0.2em]">Audit Observer</span>
          <h2 className="text-3xl font-black uppercase tracking-tighter mt-4 break-words">
            {participant.membership?.fullName || "Awaiting Identity"}
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase">{participant.email}</p>
        </div>

        <div className="flex-1 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">Telemetry Sequence</h4>
          
          {domains.map((domain, index) => {
            const isCompleted = index < completedCount;
            const isActive = index === completedCount && participant.status === 'opened';

            return (
              <div key={domain} className={`p-4 border transition-all flex items-center justify-between ${isActive ? 'border-black bg-neutral-50 shadow-sm' : 'border-neutral-100'}`}>
                <div className="flex items-center gap-4">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-[#8A6A2F]" />
                  ) : isActive ? (
                    <Activity className="w-4 h-4 animate-pulse text-black" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-200" />
                  )}
                  <span className={`text-[11px] font-black uppercase tracking-widest ${isCompleted || isActive ? 'text-black' : 'text-neutral-300'}`}>
                    {domain.replace('_', ' ')}
                  </span>
                </div>
                {isActive && <span className="text-[8px] font-black text-white bg-black px-2 py-0.5 uppercase">Live</span>}
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-8 border-t border-neutral-100">
           <div className="bg-black p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8A6A2F] mb-2">Integrity Note</p>
              <p className="text-[9px] text-white/60 leading-relaxed italic uppercase font-medium">
                Individual responses are siloed. Observer view tracks velocity only to prevent analytical bias.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}