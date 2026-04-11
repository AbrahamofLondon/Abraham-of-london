/* components/admin/reporting/intervention-scheduler.tsx */
"use client";

import React from 'react';
import { 
  listTribunalCases, 
  saveTribunalCase 
} from "@/lib/constitution/observability-store";
import { Loader2, Zap, AlertTriangle } from "lucide-react";

export interface InterventionSchedulerProps {
  targetTeam: string;
  delta: number;
  fragilityScore: number;
}

/**
 * ✅ NAMED EXPORT: This matches the import in /app/admin/snapshot/page.tsx
 */
export function InterventionScheduler({ 
  targetTeam, 
  delta, 
  fragilityScore 
}: InterventionSchedulerProps) {
  return (
    <div className="bg-white border border-neutral-200 p-8 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">
            Deployment Target
          </h3>
          <p className="text-xl font-bold tracking-tight">{targetTeam}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-red-600 mb-1 justify-end">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Dissonance Delta
            </span>
          </div>
          <p className="text-2xl font-black">{delta}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-neutral-50 border border-neutral-100">
          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">
            Fragility Score
          </p>
          <p className="text-lg font-bold">{fragilityScore}/100</p>
        </div>
        <div className="p-4 bg-neutral-50 border border-neutral-100">
          <p className="text-[8px] font-black uppercase tracking-widest text-neutral-400 mb-1">
            Status
          </p>
          <p className="text-lg font-bold text-amber-600 uppercase tracking-tight">Pending</p>
        </div>
      </div>

      <button className="w-full flex items-center justify-center gap-3 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all">
        <Zap className="w-3 h-3 text-[#8A6A2F] fill-current" />
        Initialize Constitutional Correction
      </button>
    </div>
  );
}

// Optional: Default export for flexibility, though named is required for your current setup
export default InterventionScheduler;