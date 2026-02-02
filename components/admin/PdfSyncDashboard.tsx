import React, { useState } from "react";
import { 
  ShieldAlert, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Loader2,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncMeta {
  durationMs: number;
  totalTasks: number;
  success: number;
  failed: number;
  mode: string;
}

interface SyncResult {
  id: string;
  action: string;
  status: string;
  error?: string;
}

export default function PdfSyncDashboard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [stats, setStats] = useState<SyncMeta | null>(null);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = async () => {
    setIsSyncing(true);
    setError(null);
    setStats(null);

    try {
      const response = await fetch("/api/generate-all-pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: forceRefresh, batchSize: 10 }),
      });

      if (response.status === 404) throw new Error("Endpoint obfuscated or unauthorized.");
      if (response.status === 429) throw new Error("Rate limit exceeded. System cooling down.");
      
      const data = await response.json();
      
      if (!data.success) throw new Error(data.error || "Sync failed");

      setStats(data.meta);
      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-zinc-950 border border-zinc-900 rounded-xl shadow-2xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-12 border-b border-zinc-900 pb-8">
        <div>
          <h2 className="text-2xl font-serif italic text-white flex items-center gap-3">
            <ShieldAlert className="text-amber-500" size={24} />
            Institutional Asset Registry
          </h2>
          <p className="text-zinc-500 text-sm mt-1 font-mono uppercase tracking-widest">
            Portfolio Status: 163 Intelligence Briefs
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-500 transition-colors">
              FORCE PREMIUM UPGRADE
            </span>
            <div 
              onClick={() => setForceRefresh(!forceRefresh)}
              className={`w-10 h-5 rounded-full p-1 transition-colors ${forceRefresh ? 'bg-amber-600' : 'bg-zinc-800'}`}
            >
              <motion.div 
                animate={{ x: forceRefresh ? 20 : 0 }}
                className="w-3 h-3 bg-white rounded-full" 
              />
            </div>
          </label>

          <button
            onClick={triggerSync}
            disabled={isSyncing}
            className={`px-6 py-2 rounded-full font-mono text-[11px] flex items-center gap-2 transition-all ${
              isSyncing 
              ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-amber-500 hover:text-white'
            }`}
          >
            {isSyncing ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            {isSyncing ? "SYNCHRONIZING..." : "INITIATE SYNC"}
          </button>
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          label="Total Briefs" 
          value="163" 
          icon={<FileText size={16} />} 
          sub="Indexed in Registry"
        />
        <StatCard 
          label="Last Sync Status" 
          value={stats ? `${stats.success}/${stats.totalTasks}` : "--"} 
          icon={<CheckCircle2 size={16} className="text-emerald-500" />} 
          sub={stats ? `Duration: ${stats.durationMs}ms` : "No recent activity"}
        />
        <StatCard 
          label="Operational Mode" 
          value={forceRefresh ? "Premium" : "Incremental"} 
          icon={<Zap size={16} className="text-amber-500" />} 
          sub={forceRefresh ? "Overwriting MD5 matches" : "Missing assets only"}
        />
      </div>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 mb-8 bg-red-950/20 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400 text-sm font-mono"
          >
            <AlertTriangle size={18} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECENT ACTIVITY TABLE */}
      {results.length > 0 && (
        <div className="border border-zinc-900 rounded-lg overflow-hidden bg-black/40">
          <div className="p-4 bg-zinc-900/50 border-b border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Detailed Transmission Log
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-zinc-950 shadow-sm">
                <tr className="text-[9px] font-mono text-zinc-600 uppercase">
                  <th className="p-4">Asset ID</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-mono text-zinc-400">
                {results.map((res, i) => (
                  <tr key={i} className="border-t border-zinc-900 hover:bg-white/[0.02]">
                    <td className="p-4 text-zinc-300">{res.id}</td>
                    <td className="p-4 italic">{res.action}</td>
                    <td className="p-4">
                      <span className={res.status === "OK" ? "text-emerald-500" : "text-red-500"}>
                        {res.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string, value: string, icon: React.ReactNode, sub: string }) {
  return (
    <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-lg">
      <div className="flex items-center gap-2 text-zinc-500 mb-4 font-mono text-[9px] uppercase tracking-widest">
        {icon} {label}
      </div>
      <div className="text-3xl font-serif italic text-white mb-2">{value}</div>
      <div className="text-[10px] text-zinc-600 font-mono">{sub}</div>
    </div>
  );
}