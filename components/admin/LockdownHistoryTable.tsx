/* components/admin/LockdownHistoryTable.tsx — Directorate Audit Log */
"use client";

import React, { useEffect, useState } from "react";
import { Lock, Unlock, Clock, FileText, Search } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

interface LockdownEvent {
  id: string;
  action: 'SYSTEM_LOCKED' | 'SYSTEM_UNLOCKED';
  metadata: {
    locked: boolean;
    reason: string;
    timestamp: string;
    adminEmail?: string; // Captured if available
  };
  createdAt: string;
}

export default function LockdownHistoryTable() {
  const [history, setHistory] = useState<LockdownEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Query only for Lockdown State Changes
        const res = await adminFetch("/api/admin/security/events?action=SYSTEM_LOCKED,SYSTEM_UNLOCKED&limit=50");
        const data = await res.json();
        // Cast the events to the strict type
        setHistory(data.events || []);
      } catch (err) {
        console.error("[LOCKDOWN_AUDIT_SYNC_ERROR]", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="animate-pulse h-48 bg-white/5 rounded-3xl" />;

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl">
      
      {/* HEADER */}
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <FileText className="text-zinc-500" size={16} />
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Institutional State Protocol Audit Log
          </h2>
        </div>
        <span className="bg-slate-800 text-slate-400 text-[9px] font-bold px-3 py-1 rounded-full font-mono">
          {history.length} PROTOCOL ENTRIES
        </span>
      </div>

      {/* Audit List */}
      <div className="divide-y divide-slate-800/50 max-h-[400px] overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-12 text-center text-slate-700 text-[10px] uppercase font-mono tracking-widest leading-relaxed">
            No system state mutations logged within the active retention window.
          </div>
        ) : (
          history.map((event) => {
            const isLocked = event.action === 'SYSTEM_LOCKED';
            
            return (
              <div key={event.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-6 p-6 hover:bg-white/[0.01] transition-colors">
                
                {/* State Icon */}
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isLocked 
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30" 
                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                }`}>
                  {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                </div>

                {/* Event Details */}
                <div className="space-y-1.5 font-mono">
                  <p className={`text-xs font-bold uppercase ${isLocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isLocked ? "LOCKDOWN_INITIATED" : "PERIMETER_NORMALIZED"}
                  </p>
                  <p className="text-white/80 text-[10px] italic leading-relaxed">
                    "{event.metadata.reason || "Manual Directorate Override"} // By {event.metadata.adminEmail || 'Unknown Admin'}"
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-right font-mono text-zinc-600 text-[9px] uppercase space-y-0.5">
                  <div className="flex items-center gap-1.5 justify-end">
                    <Clock size={10} />
                    {new Date(event.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                  </div>
                  <p>{new Date(event.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}