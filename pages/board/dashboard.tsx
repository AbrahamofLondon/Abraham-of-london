/* pages/board/dashboard.tsx */
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import prisma from "@/lib/prisma"; // Standardized Prisma Client integration
import Layout from "@/components/Layout";
import { Users, Zap, Clock, ExternalLink } from "lucide-react";

// FIX: Import Security Primitives
import { validateAdminAccess } from "@/lib/server/validation";
import { logAuditEvent } from "@/lib/server/audit";

type DashboardProps = {
  members: any[];
  intakes: any[];
};

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const startTime = Date.now();

  // ---------------------------------------------------------------------------
  // 1. SECURITY BARRIER (CRITICAL)
  // ---------------------------------------------------------------------------
  const auth = await validateAdminAccess(req as any);

  if (!auth.valid) {
    // Log the attempted breach
    await logAuditEvent({
      actorType: "unknown",
      action: "unauthorized_access",
      resourceType: "board_dashboard",
      status: "failed",
      ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
      details: { 
        path: "/board/dashboard", 
        reason: auth.reason 
      }
    });

    // Obfuscate: Return 404 so attackers don't know this page exists
    return { notFound: true };
  }

  // ---------------------------------------------------------------------------
  // 2. DATA RETRIEVAL
  // ---------------------------------------------------------------------------
  try {
    /**
     * ARCHITECTURAL UPDATE: Prisma Fetching
     * reuses the internal connection pool managed by Prisma.
     * Parallel execution ensures low latency for institutional oversight.
     */
    const [members, intakes] = await Promise.all([
      prisma.innerCircleMember.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit results for performance
      }),
      prisma.strategyRoomIntake.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit results for performance
      })
    ]);

    // Log successful access
    await logAuditEvent({
      actorType: "admin",
      actorId: auth.userId,
      action: "view_dashboard",
      resourceType: "board_dashboard",
      status: "success",
      details: { durationMs: Date.now() - startTime }
    });

    return {
      props: {
        // Prisma returns Date objects; Next.js requires serialization
        members: JSON.parse(JSON.stringify(members)) || [],
        intakes: JSON.parse(JSON.stringify(intakes)) || [],
      },
    };
  } catch (error) {
    console.error("🔥 Institutional Dashboard Data Failure:", error);
    
    // Log the system failure
    await logAuditEvent({
      actorType: "system",
      action: "dashboard_error",
      resourceType: "board_dashboard",
      status: "failed",
      details: { error: String(error) }
    });

    // Graceful fallback to maintain uptime even during DB maintenance
    return { props: { members: [], intakes: [] } };
  }
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
                    <p className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">Prefix: {m.emailHashPrefix}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(m.createdAt).toLocaleDateString()}</span>
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
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${i.status === 'accepted' ? 'bg-amber-500' : 'bg-gray-800'}`} />

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-100">{i.fullName}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          i.status === 'accepted' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {i.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{i.organisation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-mono font-black text-white">{i.score}<span className="text-[10px] text-gray-600">/25</span></p>
                    </div>
                  </div>

                  <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5 italic">
                    <p className="text-[10px] uppercase text-amber-500/60 mb-2 font-black tracking-[0.2em] not-italic">Decision Anchor</p>
                    <p className="text-sm text-gray-300 leading-relaxed">&quot;{i.decisionStatement}&quot;</p>
                  </div>

                  <div className="mt-6 flex gap-4 pt-4 border-t border-white/5">
                    <button className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Open Full Dossier
                    </button>
                    <span className="text-[10px] text-gray-700 ml-auto">{new Date(i.createdAt).toLocaleString()}</span>
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