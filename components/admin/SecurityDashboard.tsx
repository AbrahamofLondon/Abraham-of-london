/* components/admin/SecurityDashboard.tsx — Unified Command & Intelligence */
"use client";

import React, { useMemo } from 'react';
import {
  ShieldAlert,
  TrendingUp,
  Users,
  Activity,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import SecuritySummary from './SecuritySummary';
import UpgradeTerminal from './UpgradeTerminal';

interface EngagementMetric {
  resourceId: string;
  totalViews: number;
  totalPrints: number;
  severityScore: number;
}

// ALIGNED INTERFACE: Matches your global logging and summary expectations
interface SecurityLog {
  id: string;
  resourceId: string;
  action: string;
  severity: 'info' | 'warning' | 'high' | 'critical'; // Changed 'low' to 'info'
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  timestamp: string;
  status?: string;
  metadata?: any;
  [key: string]: any;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

export const SecurityDashboard: React.FC<{ logs: SecurityLog[] }> = ({ logs }) => {
  // 1. Calculate Intelligence Heatmap Metrics
  const metrics = useMemo(() => {
    const map: Record<string, EngagementMetric> = {};

    logs.forEach((log) => {
      const rid = log.resourceId || 'SYSTEM';
      let entry = map[rid];
      if (!entry) {
        entry = { resourceId: rid, totalViews: 0, totalPrints: 0, severityScore: 0 };
        map[rid] = entry;
      }

      if (log.action === 'VIEW') entry.totalViews++;
      if (log.action === 'BOARD_MEMO_PRINT') entry.totalPrints++;
      
      // Scoring based on Institutional Risk Model
      if (log.severity === 'critical') entry.severityScore += 15;
      if (log.severity === 'high') entry.severityScore += 10;
      if (log.action === 'ACCESS_DENIED_PROTECTED_PATH') entry.severityScore += 5;
    });

    return Object.values(map).sort((a, b) => b.severityScore - a.severityScore);
  }, [logs]);

  // 2. Filter for Upgrade Appeals
  const upgradeRequests = useMemo(() => 
    logs.filter(l => l.action === "CLEARANCE_UPGRADE_REQUEST" && l.status === "pending")
    .map(l => ({
      id: l.id,
      actorId: l.actorId,
      actorEmail: l.actorEmail || 'unknown@institution.com',
      metadata: l.metadata,
      createdAt: l.timestamp // Mapping timestamp to createdAt for component compatibility
    })), [logs]);

  return (
    <div className="space-y-8 p-8 bg-black min-h-screen text-white font-sans selection:bg-rose-500/30">
      {/* Strategic Header Analytics */}
      <SecuritySummary logs={logs} />

      {/* Institutional KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Intel Events" value={logs.length} icon={<Activity size={18} className="text-blue-500" />} />
        <StatCard title="Active Principals" value={new Set(logs.map((l) => l.actorId)).size} icon={<Users size={18} className="text-emerald-500" />} />
        <StatCard title="Critical Breaches" value={logs.filter((l) => l.severity === 'critical').length} icon={<ShieldAlert size={18} className="text-rose-500" />} />
        <StatCard title="High-Risk Activity" value={logs.filter((l) => l.severity === 'high').length} icon={<TrendingUp size={18} className="text-amber-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Tactical Action: Clearance Oversight */}
          {upgradeRequests.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               <UpgradeTerminal requests={upgradeRequests} />
            </div>
          )}

          {/* Intelligence Heatmap */}
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-zinc-500">
              <BarChart3 size={14} className="text-blue-500" /> Asset Intelligence Heatmap
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.slice(0, 6).map((m) => (
                <div key={m.resourceId} className="group relative bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.03] hover:border-blue-500/20 transition-all duration-500">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300 group-hover:text-blue-400 transition-colors">
                      {m.resourceId.replace(/-/g, ' ')}
                    </span>
                    <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/10">
                      RISK: {m.severityScore}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <ProgressBar label="Engagement" value={m.totalViews} max={50} color="bg-blue-500" />
                    <ProgressBar label="Exfiltration" value={m.totalPrints} max={20} color="bg-emerald-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Critical Feed */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md h-fit sticky top-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-rose-500">
            <AlertCircle size={14} /> Critical Audit Feed
          </h3>
          <div className="space-y-6">
            {logs
              .filter((l) => l.severity === 'high' || l.severity === 'critical')
              .slice(0, 12)
              .map((log, i) => (
                <div key={log.id || i} className="flex gap-4 border-l-2 border-rose-500/20 pl-4 py-1 group hover:border-rose-500 transition-all duration-300">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter group-hover:text-rose-400 transition-colors">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[9px] text-zinc-600 mt-1 font-mono uppercase tracking-tight">
                      {log.actorEmail?.split('@')[0] || 'SYSTEM'} // {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}
                    </p>
                  </div>
                  <ShieldAlert size={12} className={`shrink-0 mt-1 ${log.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'} opacity-20 group-hover:opacity-100 transition-opacity`} />
                </div>
              ))}
            
            {logs.filter((l) => l.severity === 'high' || l.severity === 'critical').length === 0 && (
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest text-center py-8">
                Perimeter secure // No active threats
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* Internal Helper Components */

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl hover:bg-white/[0.02] transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">{icon}</div>
    </div>
    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">{title}</p>
    <h4 className="text-3xl font-mono font-bold mt-1 tracking-tighter tabular-nums">{value}</h4>
  </div>
);

const ProgressBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => (
  <div>
    <div className="flex justify-between items-center mb-1.5 font-mono">
      <span className="text-[9px] uppercase font-black tracking-widest text-zinc-500">{label}</span>
      <span className="text-[9px] text-zinc-400">{value}</span>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }} 
      />
    </div>
  </div>
);