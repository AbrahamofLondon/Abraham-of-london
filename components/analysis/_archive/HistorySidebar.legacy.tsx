"use client";

import React, { useEffect, useState } from "react";
import { Clock, ChevronRight, Database, ShieldCheck, AlertCircle } from "lucide-react";

interface HistoryEntry {
  id: string;
  timestamp: string;
  resonance: number;
  alpha: number;
  status: string;
}

export default function HistorySidebar() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/sovereign/history');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("History Node Offline");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-white/[0.02] border border-white/5 p-8 h-full min-h-[400px]">
      <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
        <Database className="w-4 h-4 text-[#8A6A2F]" />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white">
          Intelligence Briefs
        </h3>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div 
              key={entry.id} 
              className="group p-4 border border-white/5 bg-black/20 hover:border-[#8A6A2F]/40 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-[9px] text-[#8A6A2F] font-bold tracking-widest">
                  {entry.id}
                </span>
                {entry.status === "APPROVED" ? (
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                )}
              </div>
              
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="block font-serif italic text-xs text-white">
                    {entry.resonance}% Resonance
                  </span>
                  <span className="block font-mono text-[8px] text-neutral-600">
                    {new Date(entry.timestamp).toLocaleDateString('en-GB')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="block font-mono text-[9px] text-neutral-400">ALPHA</span>
                  <span className="block font-mono text-[10px] font-bold text-white">
                    ${entry.alpha}M
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <span className="font-mono text-[7px] uppercase text-[#8A6A2F]">View Detailed Brief</span>
                <ChevronRight className="w-2 h-2 text-[#8A6A2F]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}