/* components/Admin/SecurityDashboard.tsx */
import React from 'react';
import { 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Activity, 
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface EngagementMetric {
  resourceId: string;
  totalViews: number;
  totalPrints: number;
  severityScore: number; // Calculated based on 'HIGH' severity actions
}

export const SecurityDashboard: React.FC<{ logs: any[] }> = ({ logs }) => {
  // Logic: Distill raw logs into Engagement Metrics
  const metrics = React.useMemo(() => {
    const map: Record<string, EngagementMetric> = {};
    
    logs.forEach(log => {
      if (!map[log.resourceId]) {
        map[log.resourceId] = { resourceId: log.resourceId, totalViews: 0, totalPrints: 0, severityScore: 0 };
      }
      if (log.action === 'VIEW') map[log.resourceId].totalViews++;
      if (log.action === 'BOARD_MEMO_PRINT') map[log.resourceId].totalPrints++;
      if (log.severity === 'HIGH' || log.severity === 'CRITICAL') map[log.resourceId].severityScore += 10;
    });

    return Object.values(map).sort((a, b) => b.severityScore - a.severityScore);
  }, [logs]);

  return (
    <div className="space-y-8 p-8 bg-black min-h-screen text-white">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Intel Events" value={logs.length} icon={<Activity className="text-blue-500" />} />
        <StatCard title="Active Principals" value={new Set(logs.map(l => l.actorId)).size} icon={<Users className="text-emerald-500" />} />
        <StatCard title="High-Severity Prints" value={logs.filter(l => l.severity === 'HIGH').length} icon={<ShieldAlert className="text-amber-500" />} />
        <StatCard title="Risk Assessments" value={logs.filter(l => l.action.includes('RISK')).length} icon={<TrendingUp className="text-rose-500" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Engagement Heatmap List */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3">
            <BarChart3 size={18} className="text-zinc-500" /> Intelligence Heatmap
          </h3>
          <div className="space-y-4">
            {metrics.slice(0, 5).map((m) => (
              <div key={m.resourceId} className="group relative bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-all">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold uppercase tracking-tighter text-zinc-300">{m.resourceId.replace(/-/g, ' ')}</span>
                  <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Score: {m.severityScore}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${Math.min(m.totalViews * 10, 100)}%` }} />
                     <span className="text-[9px] uppercase text-zinc-500 mt-2 block">Views: {m.totalViews}</span>
                   </div>
                   <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{ width: `${Math.min(m.totalPrints * 20, 100)}%` }} />
                     <span className="text-[9px] uppercase text-zinc-500 mt-2 block">Prints: {m.totalPrints}</span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Critical Feed */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-rose-500">
            <AlertCircle size={18} /> Critical Feed
          </h3>
          <div className="space-y-6">
            {logs.filter(l => l.severity === 'HIGH').slice(0, 8).map((log, i) => (
              <div key={i} className="flex gap-4 border-l-2 border-rose-500 pl-4 py-1">
                <div className="flex-1">
                  <p className="text-xs font-bold text-white uppercase">{log.action}</p>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">
                    {log.actorName} // {new Date(log.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
    </div>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
    <h4 className="text-3xl font-mono font-bold mt-1">{value}</h4>
  </div>
);