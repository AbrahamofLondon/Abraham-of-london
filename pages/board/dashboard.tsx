/* pages/board/dashboard.tsx */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { createClient } from "@supabase/supabase-js";
import Layout from "@/components/Layout";
import { Shield, Users, Zap, Clock, ExternalLink } from "lucide-react";

type DashboardProps = {
  members: any[];
  intakes: any[];
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const getServerSideProps: GetServerSideProps = async () => {
  // Parallel fetch for enterprise performance
  const [membersRes, intakesRes] = await Promise.all([
    supabase.from("inner_circle_members").select("*").order("created_at", { ascending: false }),
    supabase.from("strategy_room_intakes").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    props: {
      members: membersRes.data || [],
      intakes: intakesRes.data || [],
    },
  };
};

const BoardDashboard: NextPage<DashboardProps> = ({ members, intakes }) => {
  return (
    <Layout title="Board Intelligence">
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-[#050609] text-white p-6 md:p-12">
        {/* HEADER SECTION */}
        <header className="max-w-7xl mx-auto mb-12 border-b border-white/10 pb-8 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500/60 italic mb-2">
              Institutional Oversight
            </p>
            <h1 className="text-4xl font-serif font-bold italic text-white">
              Board Intelligence <span className="text-white/30">Dashboard</span>
            </h1>
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Network Resilience</p>
                <p className="text-xs text-emerald-400 font-mono uppercase">Status: Operational</p>
             </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-10">
          
          {/* COLUMN 1: INNER CIRCLE SHORTS (MEMBERS) */}
          <section className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Members</h2>
              <span className="ml-auto text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">
                {members.length}
              </span>
            </div>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="group border border-white/5 bg-white/[0.02] p-4 rounded-xl hover:bg-white/[0.04] transition-all">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-gray-200">{m.name || "Access Key User"}</p>
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">Prefix: {m.email_hash_prefix}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(m.created_at).toLocaleDateString()}</span>
                    <span className="font-mono text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">IP: {m.last_ip || "Locked"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* COLUMN 2 & 3: STRATEGIC INTAKES */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Intake Intelligence</h2>
              <span className="ml-auto text-xs font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">
                {intakes.length}
              </span>
            </div>

            <div className="grid gap-4">
              {intakes.map((i) => (
                <div key={i.id} className={`relative overflow-hidden border p-6 rounded-2xl transition-all ${
                  i.status === 'accepted' ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/5 bg-white/[0.01]'
                }`}>
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${i.status === 'accepted' ? 'bg-amber-500' : 'bg-gray-800'}`} />

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-100">{i.full_name}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          i.status === 'accepted' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {i.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{i.organisation} • {i.email_hash ? "Hashed Entry" : "Legacy Entry"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-black text-white">{i.score}<span className="text-[10px] text-gray-600">/25</span></p>
                      <p className="text-[9px] uppercase font-bold text-gray-600 tracking-tighter">Audit Score</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5 italic">
                    <p className="text-[10px] uppercase text-amber-500/60 mb-2 font-black tracking-[0.2em] not-italic">Decision Anchor</p>
                    <p className="text-sm text-gray-300 leading-relaxed">"{i.decision_statement}"</p>
                  </div>

                  <div className="mt-6 flex gap-4 pt-4 border-t border-white/5">
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Open Full Dossier
                    </button>
                    <span className="text-[10px] text-gray-700 ml-auto">{new Date(i.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default BoardDashboard;