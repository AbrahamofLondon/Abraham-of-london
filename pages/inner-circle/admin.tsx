/* pages/inner-circle/admin.tsx — INSTITUTIONAL CONSOLE (INTEGRITY MODE) */
import * as React from "react";
import type { NextPage } from "next";
import { LayoutGrid, Users, ShieldAlert, Database, RefreshCw, AlertCircle } from "lucide-react";
import Layout from "@/components/Layout";

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * 1. Strictly synchronizes with lib/server/auth/admin-session logic.
 * 2. Enforces institutional header naming: 'x-admin-token'.
 */
const AdminInnerCirclePage: NextPage = () => {
  const [adminToken, setAdminToken] = React.useState("");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStats = async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    
    try {
      // Institutional API endpoint for Postgres data export
      const res = await fetch("/api/admin/inner-circle/export", {
        headers: { 
          "x-admin-token": adminToken,
          "Content-Type": "application/json"
        }
      });
      
      const json = await res.json();
      
      if (res.ok && json.ok) {
        setData(json);
      } else {
        throw new Error(json.error || "Authorization failed: Invalid token.");
      }
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="IC Admin Console">
      <main className="min-h-screen bg-black text-cream pt-32 px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          {/* HEADER SECTION */}
          <header className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
            <div>
              <h1 className="font-serif text-4xl font-bold text-white">Inner Circle Console</h1>
              <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest italic">
                Privacy-Safe Membership Management
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="password" 
                value={adminToken} 
                onChange={e => setAdminToken(e.target.value)} 
                placeholder="Institutional Admin Token" 
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-gold focus:border-gold/50 outline-none transition-all w-full sm:w-64" 
              />
              <button 
                onClick={fetchStats} 
                disabled={loading}
                className="bg-gold text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gold/80 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : "Authorize"}
              </button>
            </div>
          </header>

          {/* ERROR FEEDBACK */}
          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {/* STATS OVERVIEW */}
          {data && (
            <div className="grid gap-6 grid-cols-2 md:grid-cols-4 mb-12">
               <StatCard label="Total Members" val={data.stats.totalMembers} icon={Users} />
               <StatCard label="Active Keys" val={data.stats.totalKeys} icon={Database} />
               <StatCard label="Total Unlocks" val={data.stats.totalUnlocks} icon={ShieldAlert} />
               <StatCard label="System Integrity" val="Verified" icon={LayoutGrid} color="text-emerald-400" />
            </div>
          )}

          {/* DATA TABLE */}
          <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 font-mono uppercase tracking-tighter text-gray-500 border-b border-white/5">
                  <tr>
                    <th className="p-5 font-bold">Registration Date</th>
                    <th className="p-5 font-bold">Identity (Hash)</th>
                    <th className="p-5 font-bold">Key Suffix</th>
                    <th className="p-5 font-bold">Status</th>
                    <th className="p-5 text-right font-bold">Engagement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.rows.length > 0 ? (
                    data.rows.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-colors group">
                        <td className="p-5 text-gray-400">{new Date(row.created_at).toLocaleDateString("en-GB")}</td>
                        <td className="p-5 font-mono text-gold/60">{row.email_hash_prefix}...</td>
                        <td className="p-5 font-mono text-white/80">****{row.key_suffix}</td>
                        <td className="p-5">
                          <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                            row.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-5 text-right font-mono text-gray-300">
                          {row.total_unlocks} <span className="text-gray-600">Unlocks</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-gray-600 italic font-serif text-lg">
                        Waiting for institutional authorization...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

const StatCard = ({ label, val, icon: Icon, color = "text-gold" }: any) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm group hover:border-gold/30 transition-all">
    <div className="flex items-center gap-3 mb-2 text-gray-500 group-hover:text-gold/60 transition-colors">
      <Icon size={14} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-mono font-bold ${color}`}>{val}</div>
  </div>
);

export default AdminInnerCirclePage;