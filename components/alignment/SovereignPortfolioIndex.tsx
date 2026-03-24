"use client";

import React, { useState } from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { useOGRTelemetry } from "@/hooks/useOGRTelemetry";
import { Lock, ShieldCheck, EyeOff, Search, ChevronRight, Key } from "lucide-react";

export default function SovereignPortfolioIndex() {
  useOGRTelemetry();
  const { isAuthorized, validateKey, computed } = useOGRStore();
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const success = validateKey(passkey);
    if (!success) setError(true);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#2C2416] font-sans relative">
      
      {/* 1. THE APPROVAL OVERLAY */}
      {!isAuthorized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-[#2C2416]/40 p-6">
          <div className="w-full max-w-md bg-white border border-[#D4C5A8] p-12 shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="p-4 bg-[#8A6A2F]/10 rounded-full">
                <Lock className="w-8 h-8 text-[#8A6A2F]" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="font-serif text-2xl italic uppercase tracking-tighter">Sovereign Approval Required</h2>
              <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
                Entry Protocol: AOL-INDEX-075 // Restricted Access
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="password"
                  placeholder="AUTHORIZATION KEY"
                  value={passkey}
                  onChange={(e) => { setPasskey(e.target.value); setError(false); }}
                  className={`w-full pl-12 pr-4 py-4 bg-[#F9F7F2] border ${error ? 'border-red-500' : 'border-[#D4C5A8]'} font-mono text-xs focus:outline-none`}
                />
              </div>
              <button className="w-full py-4 bg-[#2C2416] text-white font-mono text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-[#8A6A2F] transition-all">
                Validate Identity
              </button>
              {error && <p className="text-center font-mono text-[8px] text-red-600 uppercase">Invalid Sovereign Key</p>}
            </form>
          </div>
        </div>
      )}

      {/* 2. THE RESTRICTED CONTENT */}
      <div className={`transition-all duration-1000 ${!isAuthorized ? 'blur-lg grayscale pointer-events-none select-none' : 'blur-0'}`}>
        <div className="p-12 lg:p-24">
          <header className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#8A6A2F]">Institutional Portfolio</span>
              <h1 className="font-serif text-6xl italic leading-none">
                Intelligence <span className="not-italic text-[#8A6A2F]">Index</span>
              </h1>
            </div>

            {/* LIVE TELEMETRY STATS (Visible only to Approved Users) */}
            <div className="flex gap-12 border-l border-[#2C2416]/10 pl-12">
               <div className="space-y-1">
                 <span className="block font-mono text-[8px] uppercase text-neutral-400 tracking-tighter">Aggregate Alpha</span>
                 <span className="block font-serif text-2xl">${(computed.resonanceAlpha * 0.75).toFixed(1)}B</span>
               </div>
               <div className="space-y-1">
                 <span className="block font-mono text-[8px] uppercase text-neutral-400 tracking-tighter">Portfolio Certainty</span>
                 <span className="block font-serif text-2xl text-[#8A6A2F] italic">{computed.sovereignCertainty}%</span>
               </div>
            </div>
          </header>

          {/* SEARCH & FILTERS */}
          <div className="flex items-center gap-6 mb-12 border-b border-[#2C2416]/10 pb-8">
            <div className="relative flex-1">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input type="text" placeholder="FILTER BY SECTOR, REGION, OR VECTOR ID..." className="w-full pl-8 bg-transparent font-mono text-[10px] uppercase tracking-widest focus:outline-none" />
            </div>
            <div className="flex gap-4">
               <div className="px-3 py-1 bg-green-50 text-green-700 text-[8px] font-mono border border-green-200 uppercase font-bold">Stable: 68</div>
               <div className="px-3 py-1 bg-red-50 text-red-700 text-[8px] font-mono border border-red-200 uppercase font-bold">Risk: 07</div>
            </div>
          </div>

          {/* THE GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
            {[...Array(9)].map((_, i) => (
              <BriefCard key={i} id={`AOL-0${i + 70}`} title={`Strategic Vector 0${i + 1}`} sector="Global Markets" region="International" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefCard({ id, title, sector, region }: { id: string, title: string, sector: string, region: string }) {
  return (
    <div className="bg-white border border-[#D4C5A8]/30 p-10 hover:bg-[#FDFBF7] transition-all group">
      <div className="flex justify-between items-start mb-10">
        <span className="font-mono text-[9px] text-neutral-400 tracking-widest">{id}</span>
        <ShieldCheck className="w-4 h-4 text-[#8A6A2F]" />
      </div>
      <h3 className="font-serif text-2xl mb-8 group-hover:italic transition-all">{title}</h3>
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <span className="block font-mono text-[7px] uppercase text-neutral-400">Classification</span>
          <span className="block font-mono text-[9px] uppercase font-bold tracking-tighter">{sector} // {region}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-[#2C2416] group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}