"use client";

import React from "react";
import { useOGRStore } from "@/store/useOGRStore";
import { useOGRTelemetry } from "@/hooks/useOGRTelemetry";
import { ShieldAlert, Radio, LogOut, Lock } from "lucide-react";

export default function SovereignHeader() {
  // Initialize the real-time telemetry stream
  useOGRTelemetry();

  const { isAuthenticated, marketFriction, logout } = useOGRStore();

  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-0 left-0 w-full z-[100] bg-[#0A0A0A] border-b border-[#8A6A2F]/20 px-8 py-4 flex justify-between items-center backdrop-blur-md">
      {/* 1. Live Pulse Indicator */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8A6A2F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8A6A2F]"></span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F]">
            Resonance Active
          </span>
        </div>
        
        <div className="h-4 w-px bg-white/10" />
        
        <div className="flex items-center gap-3 font-mono text-[9px] text-neutral-400">
          <Radio className="w-3 h-3" />
          <span>DRIFT: {marketFriction.toFixed(4)}%</span>
        </div>
      </div>

      {/* 2. Command Controls */}
      <div className="flex items-center gap-4">
        <button 
          onClick={logout}
          className="px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
        >
          <Lock className="w-3 h-3" /> Secure Exit
        </button>
        
        <button 
          onClick={() => {
            if (confirm("INITIATE EMERGENCY LOCKOUT? This will purge all local session data.")) {
              logout();
            }
          }}
          className="group px-4 py-2 bg-red-950/20 border border-red-900/50 text-red-500 font-mono text-[9px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.1)]"
        >
          <ShieldAlert className="w-3 h-3 group-hover:animate-pulse" />
          Emergency Lockout
        </button>
      </div>
    </header>
  );
}