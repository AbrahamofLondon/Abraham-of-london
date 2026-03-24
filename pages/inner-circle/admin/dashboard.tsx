/* pages/inner-circle/admin/dashboard.tsx — Admin Control Surface */
import React, { useState, useRef, useEffect } from "react";
import SecuritySummary from "@/components/admin/SecuritySummary";
import DenylistManager from "@/components/admin/DenylistManager";
import { adminFetch } from "@/lib/api/admin-client";

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const denylistRef = useRef<HTMLDivElement>(null);

  // 1. Initial Intelligence Fetch
  useEffect(() => {
    async function fetchIntelligence() {
      try {
        const res = await adminFetch("/api/admin/system/logs?limit=100");
        const data = await res.json();
        if (data.ok) setLogs(data.logs);
      } catch (err) {
        console.error("Failed to fetch audit stream", err);
      } finally {
        setLoading(false);
      }
    }
    fetchIntelligence();
  }, []);

  // 2. Tactical Scroll to Denylist
  const scrollToDenylist = () => {
    denylistRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    // Optional: Auto-focus the IP input if we wanted to get fancy
    const input = denylistRef.current?.querySelector('input');
    input?.focus();
  };

  if (loading) return <div className="p-10 text-white font-mono uppercase animate-pulse">Synchronizing Data...</div>;

  return (
    <div className="min-h-screen bg-black text-slate-200 p-8">
      <header className="mb-12 border-l-4 border-blue-600 pl-6">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">
          Directorate <span className="text-blue-600">Command</span>
        </h1>
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">
          Vault Security & Intelligence Oversight — System v3.0
        </p>
      </header>

      {/* Primary Analytics Row */}
      <SecuritySummary logs={logs} onOpenDenylist={scrollToDenylist} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Audit Stream (Placeholder for your Log Table) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-900 rounded-xl p-6">
          <h2 className="text-sm font-black uppercase tracking-widest mb-6 text-slate-400">Live Audit Stream</h2>
          <div className="space-y-2 font-mono text-[10px]">
            {logs.map((log: any) => (
              <div key={log.id} className="p-2 border-b border-white/5 flex justify-between hover:bg-white/5">
                <span className="text-blue-500">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                <span className="text-slate-300 uppercase">{log.action}</span>
                <span className={`${log.severity === 'critical' ? 'text-red-500' : 'text-slate-500'}`}>
                  {log.status || 'SUCCESS'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security Controls */}
        <div className="space-y-6">
          <div ref={denylistRef}>
            <DenylistManager />
          </div>
          
          {/* Quick System Status Card */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Node Runtime Status</h4>
             <div className="flex items-center gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-xs font-mono">DB_CONNECTED: TRUE</span>
             </div>
             <div className="flex items-center gap-4 mt-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs font-mono">REDIS_SYNC: ACTIVE</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}