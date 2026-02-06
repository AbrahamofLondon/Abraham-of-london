/* pages/directorate/oversight.tsx */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import prisma from "@/lib/prisma";
import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import { Activity, ShieldAlert, BarChart3, Database } from "lucide-react";

interface IntakeRecord {
  id: string;
  fullName: string;
  organisation: string;
  status: string;
  score: number;
  createdAt: string;
}

const OversightDashboard: NextPage<{ records: IntakeRecord[] }> = ({ records }) => {
  return (
    <Layout title="Directorate Oversight" className="bg-[#050505]">
      <main className="min-h-screen font-mono text-[11px] p-6 lg:p-12 text-zinc-400">
        
        {/* Institutional Stats Ledger */}
        <div className="grid grid-cols-1 md:grid-cols-4 border border-zinc-800 mb-10 bg-black">
          {[
            { label: "Total Intakes", val: records.length, icon: Database },
            { label: "High Gravity", val: records.filter(r => r.score >= 20).length, icon: ShieldAlert },
            { label: "Mean Assessment", val: (records.reduce((a, b) => a + b.score, 0) / records.length || 0).toFixed(1), icon: BarChart3 },
            { label: "Node Health", val: "ACTIVE", icon: Activity },
          ].map((stat, i) => (
            <div key={i} className="p-6 border-r border-zinc-800 last:border-r-0">
              <div className="flex items-center gap-2 text-zinc-600 mb-2 uppercase tracking-tighter">
                <stat.icon size={12} /> {stat.label}
              </div>
              <span className="text-2xl text-zinc-100 font-sans">{stat.val}</span>
            </div>
          ))}
        </div>

        {/* Brutalist Ledger Table */}
        <div className="border border-zinc-800 bg-black">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800 text-zinc-500 uppercase tracking-widest">
                <th className="p-4 font-normal">Timestamp</th>
                <th className="p-4 font-normal">Principal/Org</th>
                <th className="p-4 font-normal text-center">Score</th>
                <th className="p-4 font-normal">Status</th>
                <th className="p-4 font-normal text-right">Dossier</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-zinc-900 hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-4 text-zinc-600">{new Date(r.createdAt).toISOString().split('T')[0]}</td>
                  <td className="p-4">
                    <div className="text-zinc-200 font-sans font-bold">{r.fullName}</div>
                    <div className="text-zinc-600 uppercase text-[9px]">{r.organisation}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`font-bold ${r.score >= 20 ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {r.score}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${r.status === 'ACCEPTED' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white underline underline-offset-4 decoration-zinc-700">
                      ACCESS_LOG
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const data = await prisma.strategyRoomIntake.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return {
    props: {
      records: JSON.parse(JSON.stringify(data)),
    },
  };
};

// EXPLICIT ROLE ENFORCEMENT via the updated HOC
export default withUnifiedAuth(OversightDashboard, { requiredRole: 'admin' });