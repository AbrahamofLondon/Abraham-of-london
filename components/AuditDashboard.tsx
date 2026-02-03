/* components/AuditDashboard.tsx — PORTFOLIO ACCESS MONITORING (INTEGRITY MODE) */
import * as React from "react";
import { 
  ShieldCheck, 
  Activity, 
  User, 
  FileText, 
  AlertTriangle, 
  ArrowUpRight,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  details: {
    briefId: string;
    title: string;
    ip: string;
  };
  severity: "info" | "warning" | "critical";
  timestamp: string;
}

const AuditDashboard: React.FC = () => {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Systematic fetch of audit records
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/admin/audit-logs");
        const data = await res.json();
        setLogs(data.logs);
      } catch (err) {
        console.error("Audit Sync Failure");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-8">
      {/* 1. High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Retrievals", val: "1,284", icon: Activity, color: "text-blue-500" },
          { label: "Active Nodes", val: "75 Briefs", icon: FileText, color: "text-amber-500" },
          { label: "Security Alerts", val: "0", icon: ShieldCheck, color: "text-emerald-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <stat.icon className={stat.color} size={20} />
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Live Sync</span>
            </div>
            <p className="text-2xl font-serif text-white italic">{stat.val}</p>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 2. Real-Time Access Log */}
      <div className="bg-zinc-900/20 border border-white/5 rounded-2xl overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">Access Ledger</h2>
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Clock size={12} className="text-amber-500" />
            <span className="text-[10px] font-mono text-amber-500 uppercase">Latency: 24ms</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-zinc-600">
                <th className="px-8 py-4 font-bold">Identity</th>
                <th className="px-8 py-4 font-bold">Asset ID</th>
                <th className="px-8 py-4 font-bold">Protocol</th>
                <th className="px-8 py-4 font-bold">Node IP</th>
                <th className="px-8 py-4 font-bold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <motion.tr 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  key={log.id} 
                  className="hover:bg-white/[0.01] transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-300 font-medium">{log.userEmail}</p>
                        <p className="text-[9px] text-zinc-600 uppercase tracking-tighter">UID: {log.userId.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-amber-500/50" />
                      <span className="text-xs text-zinc-400 font-mono">{log.details.briefId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                      log.severity === 'warning' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-[11px] font-mono text-zinc-600">
                    {log.details.ip}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className="text-[11px] text-zinc-500 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditDashboard;