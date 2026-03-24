/* components/admin/UpgradeTerminal.tsx — Access Escalation Interface */
"use client";

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCircle2, 
  ArrowUpRight, 
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { adminFetch } from "@/lib/api/admin-client";

interface UpgradeRequest {
  id: string;
  actorId: string;
  actorEmail: string;
  createdAt: string;
  metadata: {
    reason?: string;
    requiredTier?: string;
    userTier?: string;
  };
}

interface UpgradeTerminalProps {
  requests: UpgradeRequest[];
}

export default function UpgradeTerminal({ requests }: UpgradeTerminalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [localRequests, setLocalRequests] = useState(requests);

  const handleAction = async (eventId: string, approved: boolean) => {
    setProcessingId(eventId);
    try {
      const response = await adminFetch("/api/admin/security/resolve-appeal", {
        method: "POST",
        body: JSON.stringify({ eventId, approved }),
      });

      if (response.ok) {
        // Remove from view upon successful state mutation
        setLocalRequests(prev => prev.filter(r => r.id !== eventId));
      }
    } catch (error) {
      console.error("[TERMINAL_ACTION_ERROR]", error);
    } finally {
      setProcessingId(null);
    }
  };

  if (localRequests.length === 0) return null;

  return (
    <div className="bg-zinc-900/40 border border-amber-500/20 rounded-3xl overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.05)]">
      {/* Header */}
      <div className="p-6 border-b border-amber-500/10 bg-amber-500/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-amber-500" size={16} />
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
            Pending Clearance Escalations
          </h3>
        </div>
        <span className="text-[9px] font-mono text-amber-500/60 uppercase">
          {localRequests.length} Active Appeals
        </span>
      </div>

      {/* Request Grid */}
      <div className="divide-y divide-white/5">
        {localRequests.map((req) => (
          <div key={req.id} className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center group hover:bg-white/[0.02] transition-colors">
            
            {/* User Identity Segment */}
            <div className="flex items-center gap-4 min-w-[240px]">
              <div className="p-2 bg-zinc-800 rounded-full border border-white/5">
                <UserCircle2 size={24} className="text-zinc-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight">{req.actorEmail}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">{req.metadata.userTier || 'public'}</span>
                  <ArrowUpRight size={10} className="text-amber-500" />
                  <span className="text-[9px] font-mono text-emerald-500 font-bold uppercase">{req.metadata.requiredTier}</span>
                </div>
              </div>
            </div>

            {/* Justification Segment */}
            <div className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-[11px] text-zinc-400 italic leading-relaxed">
                "{req.metadata.reason || "Operational necessity for higher clearance."}"
              </p>
            </div>

            {/* Action Segment */}
            <div className="flex gap-3 shrink-0">
              <button
                disabled={!!processingId}
                onClick={() => handleAction(req.id, false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all disabled:opacity-20"
              >
                {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Deny
              </button>
              <button
                disabled={!!processingId}
                onClick={() => handleAction(req.id, true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] disabled:opacity-20"
              >
                {processingId === req.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}