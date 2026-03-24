/* components/admin/SecurityEventFeed.tsx — Tactical Oversight & Action Center */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  ShieldAlert, 
  UserPlus, 
  ExternalLink, 
  CheckCircle2, 
  XCircle,
  Terminal,
  Search,
  AlertOctagon,
  Loader2,
  ChevronRight // Added this missing import
} from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

// Define strict event interface based on Directorate Standards
interface SecurityEvent {
  id: string;
  action: string; 
  actorId: string;
  actorEmail: string;
  actorType: string;
  resourceId: string; 
  status: 'pending' | 'resolved_approved' | 'resolved_denied' | 'success' | 'failure';
  severity: 'low' | 'info' | 'warning' | 'high' | 'critical';
  createdAt: string;
  metadata: {
    reason?: string;
    requiredTier?: string;
    userTier?: string;
    finalDecision?: string;
    resolvedBy?: string;
    [key: string]: any;
  };
}

// Toast Notification State
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function SecurityEventFeed() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/admin/security/events?status=pending&severity=high,critical&limit=20");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("[OVERSIGHT_FEED_SYNC_ERROR]", err);
      addToast("Failed to synchronize with primary audit node.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message: string, type: Toast['type']) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleResolution = async (eventId: string, approved: boolean) => {
    if (processingId) return;
    setProcessingId(eventId);
    
    try {
      await adminFetch("/api/admin/security/resolve-appeal", {
        method: "POST",
        body: JSON.stringify({ eventId, approved }),
      });
      
      setEvents(prev => prev.filter(e => e.id !== eventId));
      addToast(approved ? "User clearance escalated successfully." : "Appeal denied.", 'success');
    } catch (err) {
      addToast("Administrative decision failed to propagate.", 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter(event => 
      event.actorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.resourceId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [events, searchTerm]);

  if (loading) return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
      <div className="animate-pulse h-6 bg-white/5 rounded w-1/4" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse h-24 bg-white/5 rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="absolute top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <div key={toast.id} className={`p-4 rounded-xl border flex gap-3 text-xs font-mono uppercase items-center animate-in slide-in-from-top ${
            toast.type === 'error' ? 'bg-rose-950/20 border-rose-500/50 text-rose-500' :
            toast.type === 'success' ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-500' :
            'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
            {toast.message}
          </div>
        ))}
      </div>

      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Terminal className="text-amber-500" size={18} />
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">
            Operational Oversight Feed // Directorate
          </h2>
          <span className={`px-3 py-1 text-[9px] font-bold rounded-full ${events.length > 5 ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-black'}`}>
            {events.length} Active Events
          </span>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Actor / Resource / Protocol"
            className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-slate-700/50 text-white text-[10px] font-mono rounded-xl focus:border-amber-500/50 focus:outline-none transition-all placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-800/50 max-h-[600px] overflow-y-auto custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center text-slate-700 text-[10px] uppercase font-mono tracking-widest italic leading-relaxed">
            No pending appeals or critical system events within the active monitoring window.
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isLockdown = event.action.includes('LOCKDOWN');
            const isAppeal = event.action === 'CLEARANCE_UPGRADE_REQUEST' && event.status === 'pending';
            const isCritical = event.severity === 'critical' || event.severity === 'high';

            return (
              <div key={event.id} className={`p-8 hover:bg-white/[0.02] transition-colors group relative ${
                isLockdown ? 'border-l-4 border-l-rose-500' : isCritical ? 'border-l-4 border-l-amber-500' : ''
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-5">
                    <div className={`p-3 rounded-2xl border transition-all ${
                      isLockdown 
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                        : isCritical
                          ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                          : "bg-slate-900 border-slate-700 text-slate-500"
                    }`}>
                      {isLockdown ? <AlertOctagon size={20} className="animate-pulse" /> : isAppeal ? <UserPlus size={20} /> : <Terminal size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-white text-sm font-bold tracking-tighter">
                          {event.actorEmail || `System Agent // ${event.actorType}`}
                        </span>
                        <span className="text-slate-600 text-[9px] font-mono uppercase tracking-tight">
                          @{new Date(event.createdAt).toLocaleTimeString([], {hour12: false})}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                        Protocol: <span className="text-white font-bold">{event.action.replace(/_/g, ' ')}</span> // ID: <span className="text-slate-600">{event.id}</span>
                      </p>
                    </div>
                  </div>
                  
                  {isAppeal && (
                    <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleResolution(event.id, true)}
                        disabled={!!processingId}
                        className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {processingId === event.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      </button>
                      <button 
                        onClick={() => handleResolution(event.id, false)}
                        disabled={!!processingId}
                        className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {processingId === event.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="ml-16 bg-black/40 border border-white/5 rounded-2xl p-6 relative">
                  <div className={`absolute top-0 left-0 h-full w-1 rounded-l-2xl ${
                    isLockdown ? 'bg-rose-500' : isCritical ? 'bg-amber-500' : 'bg-slate-700'
                  }`} />
                  
                  {isAppeal && (
                    <div className="mb-4 space-y-1">
                      <p className="text-[10px] font-black font-mono text-zinc-600 uppercase">Operational Request:</p>
                      <p className="text-zinc-200 text-xs italic font-sans leading-relaxed">
                        "{event.metadata?.reason || "No operational justification provided by agent."}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-4 border-t border-white/5 font-mono text-[9px] uppercase tracking-wider">
                    <div className="flex gap-2">
                      <ExternalLink size={11} className="text-slate-700 shrink-0" />
                      <span className="text-slate-600">Attempt:</span> 
                      <span className="text-slate-300 truncate">{event.resourceId || "Internal Command"}</span>
                    </div>
                    {isAppeal && (
                      <div className="flex gap-2 justify-end">
                        <span className="text-slate-600">Access:</span> 
                        <span className="text-amber-500 font-bold">{event.metadata?.userTier}</span>
                        <ChevronRight size={10} className="text-slate-700" />
                        <span className="text-emerald-500 font-bold">{event.metadata?.requiredTier}</span>
                      </div>
                    )}
                    {isLockdown && (
                      <div className="col-span-2 flex gap-2">
                        <AlertOctagon size={11} className="text-rose-700 shrink-0" />
                        <span className="text-slate-600">Reason:</span>
                        <span className="text-rose-400 italic">{event.metadata?.reason || "Administrative Lockdown"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}