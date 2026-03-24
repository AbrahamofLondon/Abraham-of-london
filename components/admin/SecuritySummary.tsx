/* components/admin/SecuritySummary.tsx — Threat Intelligence Aggregator */
"use client";

import React, { useMemo } from "react";
import { 
  ShieldAlert, 
  Globe, 
  Activity, 
  Lock,
  ChevronRight,
  AlertTriangle
} from "lucide-react";

/**
 * Type aligned with SystemAuditLog Prisma model
 */
type AuditLog = {
  id: string;
  action: string;
  severity: "info" | "warning" | "high" | "critical";
  ipAddress?: string | null;
  status?: string | null;
  category?: string | null;
  metadata?: any;
};

interface Props {
  logs: AuditLog[];
  onOpenDenylist?: () => void;
}

export default function SecuritySummary({ logs, onOpenDenylist }: Props) {
  const stats = useMemo(() => {
    const ipCounts: Record<string, number> = {};
    const severityCounts = { info: 0, warning: 0, high: 0, critical: 0 };
    let threatActions = 0;
    let failureCount = 0;

    logs.forEach(log => {
      // 1. Count Severities
      if (severityCounts[log.severity] !== undefined) {
        severityCounts[log.severity]++;
      }

      // 2. Track Top IPs for "Threat" actions or repeated failures
      if (log.ipAddress && (log.severity === "high" || log.severity === "critical" || log.status === "denied")) {
        ipCounts[log.ipAddress] = (ipCounts[log.ipAddress] || 0) + 1;
        threatActions++;
      }

      // 3. Track Operational Failures
      if (log.status === "error" || log.status === "failure" || log.status === "denied") {
        failureCount++;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return { severityCounts, topIPs, threatActions, failureCount };
  }, [logs]);

  // Determine Security Posture Color/Text
  const isCompromised = stats.severityCounts.critical > 0;
  const isHighRisk = stats.severityCounts.high > 2 || stats.failureCount > 10;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. SEVERITY BREAKDOWN */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-400">
          <Activity className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Health</span>
        </div>
        <div className="space-y-3">
          {(Object.entries(stats.severityCounts) as [keyof typeof stats.severityCounts, number][])
            .reverse()
            .map(([sev, count]) => (
            <div key={sev} className="flex items-center justify-between">
              <span className="text-xs font-medium capitalize text-slate-500">{sev}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      sev === 'critical' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                      sev === 'high' ? 'bg-orange-500' : 
                      sev === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${logs.length ? (count / logs.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. TOP THREAT VECTORS (IPs) */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-rose-500">
          <Globe className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Target Vectors</span>
        </div>
        <div className="space-y-2">
          {stats.topIPs.length > 0 ? (
            stats.topIPs.map(([ip, count]) => (
              <div key={ip} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-rose-500/30 transition-colors group">
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-rose-400 transition-colors">{ip}</span>
                <span className="text-[9px] font-black text-rose-500">
                  {count} <span className="opacity-50">PTS</span>
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-slate-600">
              <ShieldAlert className="w-8 h-8 opacity-10 mb-2" />
              <p className="text-[10px] uppercase tracking-widest italic">No Vectors Identified</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECURITY POSTURE STATUS */}
      <div className={`rounded-xl p-5 relative overflow-hidden border transition-all duration-700 ${
        isCompromised ? 'bg-red-950/20 border-red-500/30' : 
        isHighRisk ? 'bg-amber-950/20 border-amber-500/30' : 
        'bg-blue-950/20 border-blue-500/30'
      }`}>
        <div className={`flex items-center gap-2 mb-4 ${
          isCompromised ? 'text-red-400' : isHighRisk ? 'text-amber-400' : 'text-blue-400'
        }`}>
          {isCompromised ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Lock className="w-4 h-4" />}
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Directorate Posture</span>
        </div>
        
        <div className="relative z-10">
          <h3 className={`text-2xl font-black uppercase tracking-tighter ${
            isCompromised ? 'text-red-500' : isHighRisk ? 'text-amber-500' : 'text-white'
          }`}>
            {isCompromised ? "Incursion Detected" : isHighRisk ? "Elevated Risk" : "Stable Environment"}
          </h3>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-2 uppercase tracking-wide">
            {stats.threatActions} critical events flagged. <br/>
            {stats.failureCount} operational denials recorded.
          </p>
        </div>

        <button 
          onClick={onOpenDenylist}
          className={`mt-6 w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
            isCompromised ? 'bg-red-600 hover:bg-red-500 text-white' : 
            isHighRisk ? 'bg-amber-600 hover:bg-amber-500 text-black' : 
            'bg-blue-600 hover:bg-blue-500 text-white'
          }`}
        >
          Neutralize Threats
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Decorative background icon */}
        <Lock className={`absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] ${
          isCompromised ? 'text-red-500' : 'text-blue-500'
        }`} />
      </div>
    </div>
  );
}