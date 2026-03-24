/* components/admin/DenylistManager.tsx — Directorate Firewall UI */
"use client";

import React, { useState } from "react";
import { ShieldX, Plus, Globe, Trash2, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

export default function DenylistManager() {
  const [targetIp, setTargetIp] = useState("");
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleDeny = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetIp) return;

    setProcessing(true);
    setMessage(null);

    try {
      const res = await adminFetch("/api/admin/security/deny", {
        method: "POST",
        body: JSON.stringify({ ip: targetIp, reason, severity: "high" })
      });

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: 'success', text: `Identity ${targetIp} has been blacklisted.` });
        setTargetIp("");
        setReason("");
      } else {
        throw new Error(data.error || "Execution failed.");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <ShieldX className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Denylist Authority</h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Network Exclusion Management</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleDeny} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">IP Address / Host</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input 
                  type="text" 
                  value={targetIp}
                  onChange={(e) => setTargetIp(e.target.value)}
                  placeholder="e.g. 192.168.1.1"
                  className="w-full bg-black border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm font-mono text-amber-200 focus:border-rose-500/50 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Exclusion Reason</label>
              <input 
                type="text" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Violation of Protocol..."
                className="w-full bg-black border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-300 focus:border-amber-500/50 outline-none transition-all"
              />
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              [{message.type === 'success' ? 'CONFIRMED' : 'REJECTED'}] {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={processing || !targetIp}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl transition-all"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {processing ? "Executing..." : "Add to Denylist"}
          </button>
        </form>
      </div>

      <div className="px-6 pb-6 mt-2">
        <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest text-center italic">
          Note: Denylist entries are logged in the System Audit Trail for permanent record.
        </div>
      </div>
    </div>
  );
}