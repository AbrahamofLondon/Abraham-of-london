// pages/inner-circle/admin.tsx

import * as React from "react";
import type { NextPage } from "next";
import { LayoutGrid, Users, ShieldAlert, Database, Download, Trash2 } from "lucide-react";
import Layout from "@/components/Layout";

const AdminInnerCirclePage: NextPage = () => {
  const [adminKey, setAdminKey] = React.useState("");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inner-circle/export", {
        headers: { "x-inner-circle-admin-key": adminKey }
      });
      const json = await res.json();
      if (json.ok) setData(json);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="IC Admin">
      <main className="min-h-screen bg-black text-cream pt-32 px-6">
        <div className="mx-auto max-w-6xl">
          <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
            <div>
              <h1 className="font-serif text-4xl font-bold">Inner Circle Console</h1>
              <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-widest">Privacy-Safe Membership Management</p>
            </div>
            <div className="flex gap-4">
              <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="System Admin Key" className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs font-mono" />
              <button onClick={fetchStats} className="bg-gold text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Authorize</button>
            </div>
          </header>

          {data && (
            <div className="grid gap-6 md:grid-cols-4 mb-12">
               <StatCard label="Total Members" val={data.stats.totalMembers} icon={Users} />
               <StatCard label="Active Keys" val={data.stats.totalKeys} icon={Database} />
               <StatCard label="Total Unlocks" val={data.stats.totalUnlocks} icon={ShieldAlert} />
               <StatCard label="System Health" val="Stable" icon={LayoutGrid} color="text-emerald-400" />
            </div>
          )}

          <div className="bg-zinc-900/50 rounded-3xl border border-white/5 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 font-mono uppercase tracking-tighter text-gray-500">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Identity (Hash)</th>
                  <th className="p-4">Key Suffix</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.rows.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-gray-400">{new Date(row.created_at).toLocaleDateString()}</td>
                    <td className="p-4 font-mono text-gold/60">{row.email_hash_prefix}...</td>
                    <td className="p-4 font-mono">****{row.key_suffix}</td>
                    <td className="p-4"><span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold text-[9px]">{row.status}</span></td>
                    <td className="p-4 text-right font-mono">{row.total_unlocks} Unlocks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </Layout>
  );
};

const StatCard = ({ label, val, icon: Icon, color = "text-gold" }: any) => (
  <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
    <div className="flex items-center gap-3 mb-2 text-gray-500">
      <Icon size={14} />
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-2xl font-mono font-bold ${color}`}>{val}</div>
  </div>
);

export default AdminInnerCirclePage;

