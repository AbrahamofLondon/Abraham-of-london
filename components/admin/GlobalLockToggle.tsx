/* components/admin/GlobalLockToggle.tsx — The Kill Switch */
"use client";

import React, { useState } from "react";
import { Lock, Unlock, AlertOctagon, RefreshCw } from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

export default function GlobalLockToggle() {
  const [isLocked, setIsLocked] = useState(false); // Should be synced with DB on mount
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const toggleSystemLock = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/security/toggle-lock", {
        method: "POST",
        body: JSON.stringify({ 
          locked: !isLocked, 
          reason: "Administrative Directorate Override" 
        })
      });

      if (res.ok) {
        setIsLocked(!isLocked);
        setConfirming(false);
      }
    } catch (err) {
      console.error("Critical: Global toggle failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`transition-all duration-500 rounded-2xl border p-6 ${
      isLocked 
        ? "bg-rose-950/20 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]" 
        : "bg-slate-950 border-slate-800"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-colors ${
            isLocked ? "bg-rose-500 text-white animate-pulse" : "bg-slate-900 text-slate-500"
          }`}>
            {isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">
              Global Security Status: {isLocked ? "RESTRICTED" : "OPERATIONAL"}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
              {isLocked 
                ? "All non-admin traffic is currently being diverted." 
                : "System is accepting all authorized Inner Circle requests."}
            </p>
          </div>
        </div>

        <button
          onClick={toggleSystemLock}
          disabled={loading}
          className={`relative px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all overflow-hidden ${
            confirming 
              ? "bg-white text-black scale-105" 
              : isLocked 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                : "bg-rose-600 hover:bg-rose-500 text-white"
          }`}
        >
          <div className="flex items-center gap-2">
            {loading ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : confirming ? (
              <AlertOctagon className="w-3 h-3" />
            ) : null}
            {confirming ? "CONFIRM OVERRIDE?" : isLocked ? "LIFT LOCKDOWN" : "INITIATE LOCKDOWN"}
          </div>
        </button>
      </div>

      {confirming && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] text-rose-400 font-mono leading-relaxed italic">
            WARNING: Initiating a lockdown will immediately terminate all active sessions 
            and restrict access to verified Directorate IPs only.
          </p>
          <button 
            onClick={() => setConfirming(false)}
            className="mt-2 text-[9px] text-slate-500 hover:text-white uppercase font-bold tracking-tighter"
          >
            Cancel Protocol
          </button>
        </div>
      )}
    </div>
  );
}