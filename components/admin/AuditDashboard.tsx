/* components/admin/AuditDashboard.tsx — Authenticated Visualizer */
"use client";

import React, { useEffect, useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Search,
  RefreshCw
} from "lucide-react";
import { adminFetch } from "@/lib/api/admin-client";

type AuditLog = {
  id: string;
  action: string;
  severity: "info" | "warning" | "high" | "critical";
  actorEmail?: string;
  ipAddress?: string;
  createdAt: string;
  metadata?: any;
};

export default function AuditDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // ✅ Now using the secure adminFetch wrapper
      const res = await adminFetch("/api/admin/audit/logs"); 
      const data = await res.json();
      if (data.ok) setLogs(data.logs);
    } catch (err) {
      console.error("Audit Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-900/20 text-red-400 border-red-500/50";
      case "high": return "bg-orange-900/20 text-orange-400 border-orange-500/50";
      case "warning": return "bg-yellow-900/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-blue-900/20 text-blue-400 border-blue-500/50";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical": return <ShieldAlert className="w-4 h-4" />;
      case "high": return <AlertTriangle className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(filter.toLowerCase()) ||
    log.actorEmail?.toLowerCase().includes(filter.toLowerCase()) ||
    log.ipAddress?.includes(filter)
  );

  return (
    <div className="space-y-6 bg-black text-slate-200">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white font-serif italic">Institutional Audit Trail</h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Real-time Directorate Oversight</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-md transition-all text-xs font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? "SYNCING..." : "REFRESH TRAIL"}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input 
          type="text"
          placeholder="Filter by action, email, or IP address..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="overflow-hidden border border-slate-800 rounded-xl bg-slate-950/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Event Action</th>
                <th className="px-6 py-4">Actor Entity</th>
                <th className="px-6 py-4">Network IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/40 transition-colors group">
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center w-fit gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getSeverityStyles(log.severity)}`}>
                      {getSeverityIcon(log.severity)}
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {log.actorEmail || <span className="text-slate-700 italic">kernel_process</span>}
                  </td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-mono">
                    {log.ipAddress || "INTERNAL"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredLogs.length === 0 && (
          <div className="p-20 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-800" />
            <p className="text-slate-600 text-sm font-mono uppercase tracking-widest">No matching logs found in current buffer.</p>
          </div>
        )}
      </div>
    </div>
  );
}