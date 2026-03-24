/* components/admin/LiveTrafficMonitor.tsx — Real-Time Activity Feed */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Activity, Radio, Zap, ExternalLink } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

type TrafficEvent = {
  id: string;
  action: string;
  severity: string;
  ipAddress?: string;
  createdAt: string;
  actorEmail?: string;
};

export default function LiveTrafficMonitor() {
  const [events, setEvents] = useState<TrafficEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const streamTraffic = async () => {
    try {
      const res = await adminFetch("/api/admin/audit/logs?limit=15");
      const data = await res.json();
      if (data.ok) {
        setEvents(data.logs);
        setLastSync(new Date());
      }
    } catch (err) {
      console.error("Stream interrupted.");
    }
  };

  useEffect(() => {
    if (isLive) {
      streamTraffic();
      timerRef.current = setInterval(streamTraffic, 4000); // 4s Pulse
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive]);

  return (
    <div className="bg-black border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[500px] shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className={`w-4 h-4 ${isLive ? "text-emerald-500" : "text-slate-600"}`} />
            {isLive && (
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
            )}
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">
            Live Intelligence Stream
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
            Last Sync: {lastSync.toLocaleTimeString()}
          </span>
          <button 
            onClick={() => setIsLive(!isLive)}
            className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${
              isLive 
                ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" 
                : "border-slate-700 text-slate-500 hover:text-white"
            }`}
          >
            {isLive ? "LIVE" : "PAUSED"}
          </button>
        </div>
      </div>

      {/* Stream Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono custom-scrollbar bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/20 to-black">
        {events.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-700 text-[10px] uppercase tracking-widest">
            Waiting for handshake...
          </div>
        )}
        
        {events.map((ev, i) => (
          <div 
            key={ev.id} 
            className={`group flex items-center gap-4 p-2 rounded-lg hover:bg-white/[0.02] transition-all border border-transparent hover:border-white/5 animate-in fade-in slide-in-from-left-2 duration-500`}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex-shrink-0 w-16 text-[9px] text-slate-600">
              {new Date(ev.createdAt).toLocaleTimeString([], { hour12: false })}
            </div>
            
            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              ev.severity === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
              ev.severity === 'high' ? 'bg-orange-500' :
              ev.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-300 truncate tracking-tight uppercase">
                  {ev.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[9px] text-slate-600 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  ID: {ev.id.slice(0,8)}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                <Zap className="w-2.5 h-2.5 text-amber-500/50" />
                <span>{ev.ipAddress || "SYSTEM_PROCESS"}</span>
                {ev.actorEmail && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span className="text-blue-400/70">{ev.actorEmail}</span>
                  </>
                )}
              </div>
            </div>

            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/5 rounded transition-all">
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ))}
      </div>

      {/* Footer Status */}
      <div className="p-2 bg-slate-950 border-t border-slate-900 flex justify-center">
        <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-[0.3em]">
          <Activity className="w-2.5 h-2.5 animate-pulse text-emerald-500" />
          Directorate Network Hub Active
        </div>
      </div>
    </div>
  );
}