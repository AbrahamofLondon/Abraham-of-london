/* components/admin/CommandCenter.tsx — UNIFIED MONITORING & REMEDIATION */
import React, { useEffect, useState } from 'react';
import { ShieldAlert, Database, Zap, RefreshCw, Loader2 } from 'lucide-react';

interface HealthReport {
  ok: boolean;
  overallStatus: string;
  performanceScore: number;
  subsystems: {
    cache: { status: string; performanceScore: number };
    rateLimiter: { status: string; performanceScore: number };
  };
}

interface AuditReport {
  ok: boolean;
  summary: {
    totalActiveSessions: number;
    driftCount: number;
    syncRate: string;
  };
  details: Array<{
    email: string;
    syncStatus: string;
    innerCircleTier: string;
    globalUserTier: string;
  }>;
}

export const CommandCenter = () => {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [audit, setAudit] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFixing, setIsFixing] = useState(false);

  const refreshCommand = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}` };
      
      const [hRes, aRes] = await Promise.all([
        fetch('/api/admin/system-health', { headers }),
        fetch('/api/admin/identity-audit', { headers })
      ]);

      setHealth(await hRes.json());
      setAudit(await aRes.json());
    } catch (err) {
      console.error("COMMAND_CENTER_FAILURE", err);
    } finally {
      setLoading(false);
    }
  };

  /** ⚡ Atomic Remediation Trigger */
  const runSyncFix = async () => {
    if (!confirm("INITIATE_ATOMIC_SYNC: Force Global User table to match Institutional Inner Circle records?")) return;
    
    setIsFixing(true);
    try {
      const res = await fetch('/api/admin/sync-fix', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      if (data.ok) {
        alert(`REMEDIATION_COMPLETE: ${data.fixed} identity records synchronized.`);
        await refreshCommand(); // Force refresh to clear drift warnings
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (err) {
      alert(`REMEDIATION_FAILURE: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsFixing(false);
    }
  };

  useEffect(() => { refreshCommand(); }, []);

  if (loading && !health) return (
    <div className="p-8 text-zinc-500 animate-pulse font-mono flex items-center gap-3">
      <Loader2 className="animate-spin" size={18} />
      INITIALIZING_COMMAND_ARRAY...
    </div>
  );

  return (
    <div className="bg-black text-zinc-100 p-6 font-mono border border-zinc-800 space-y-6">
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-xl italic font-serif">Sovereign Command Center</h1>
          <p className="text-xs text-zinc-500 tracking-widest uppercase">Protocol V7.1 — 2026 Audit</p>
        </div>
        <button 
          onClick={refreshCommand} 
          disabled={loading}
          className="px-4 py-2 border border-zinc-700 hover:bg-zinc-900 disabled:opacity-50 transition-colors text-xs flex items-center gap-2"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          REFRESH_TELEMETRY
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SECTION 1: INFRASTRUCTURE (EDGE) */}
        <div className="p-4 border border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-2 mb-4 text-emerald-500">
            <Zap size={16} />
            <h2 className="text-sm font-bold uppercase tracking-tighter">Infrastructure (Edge)</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Overall Status:</span>
              <span className={health?.ok ? "text-emerald-400" : "text-amber-500"}>{health?.overallStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Performance Score:</span>
              <span>{health?.performanceScore}%</span>
            </div>
            <div className="mt-4 pt-2 border-t border-zinc-900 flex gap-4">
              <span className={`px-2 py-0.5 text-[10px] rounded-sm ${health?.subsystems.cache.status === 'healthy' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>REDIS</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-sm ${health?.subsystems.rateLimiter.status === 'healthy' ? 'bg-emerald-900/20 text-emerald-500' : 'bg-red-900/20 text-red-500'}`}>RATELIMIT</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: IDENTITY (NODE) */}
        <div className="p-4 border border-zinc-800 bg-zinc-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 text-blue-500">
              <Database size={16} />
              <h2 className="text-sm font-bold uppercase tracking-tighter">Identity (Node)</h2>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sync Rate:</span>
                <span>{audit?.summary.syncRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Drift Detected:</span>
                <span className={audit?.summary.driftCount === 0 ? "text-emerald-400" : "text-red-500"}>
                  {audit?.summary.driftCount} Accounts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Active Sessions:</span>
                <span>{audit?.summary.totalActiveSessions}</span>
              </div>
            </div>
          </div>
          
          {/* Fix Button Integrated into Identity Box */}
          <button 
            onClick={runSyncFix}
            disabled={isFixing || audit?.summary.driftCount === 0}
            className="mt-4 w-full py-2 bg-blue-900/10 border border-blue-900/50 text-blue-400 hover:bg-blue-900/30 disabled:opacity-30 disabled:grayscale transition-all text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-2"
          >
            {isFixing ? <Loader2 className="animate-spin" size={12} /> : null}
            {isFixing ? "EXECUTING_SYNC..." : "Atomic_Sync_Remediation"}
          </button>
        </div>
      </div>

      {/* DRIFT TABLE — ONLY VISIBLE WHEN DRIFT > 0 */}
      {audit && audit.summary.driftCount > 0 && (
        <div className="border border-red-900/30 bg-red-950/5 p-4 animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex items-center gap-2 mb-3 text-red-500 text-xs font-bold uppercase">
            <ShieldAlert size={14} /> Critical Integrity Warning: Data Drift Detected
          </div>
          <table className="w-full text-[10px] text-zinc-400">
            <thead>
              <tr className="text-left border-b border-zinc-900">
                <th className="pb-2 font-medium">IDENTIFIER</th>
                <th className="pb-2 text-center font-medium uppercase tracking-tighter">IC_Tier (Source)</th>
                <th className="pb-2 text-center font-medium uppercase tracking-tighter">Global_Tier (Target)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {audit.details.filter(d => d.syncStatus === 'drift_detected').map((d, i) => (
                <tr key={i} className="group hover:bg-zinc-900/30 transition-colors">
                  <td className="py-2 italic font-serif text-zinc-300">{d.email}</td>
                  <td className="py-2 text-center font-bold text-zinc-100">{d.innerCircleTier}</td>
                  <td className="py-2 text-center text-red-500/80">{d.globalUserTier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};