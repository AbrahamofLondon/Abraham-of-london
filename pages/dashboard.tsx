/* pages/dashboard.tsx — SOVEREIGN REGISTRY (LEGACY PAGES ROUTER) */
import * as React from "react";
import Link from "next/link";
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; 
import { ChevronRight, Fingerprint, Zap, Lock, BarChart3 } from "lucide-react";
import Layout from "@/components/Layout";

// The interactive controls we built for the OGR commit/toast logic
import { ReportActions } from "./controls"; 

interface Brief {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
}

interface DashboardProps {
  briefs: Brief[];
  totalCount: number;
  userEmail: string;
  aol: {
    tier: string;
    isInternal: boolean;
  };
}

export default function MemberDashboard({ briefs, totalCount, userEmail, aol }: DashboardProps) {
  return (
    <Layout title="The Sovereign Registry" className="bg-[#050505]">
      <main className="min-h-screen text-white font-sans selection:bg-[#8A6A2F]/30 relative overflow-x-hidden">
        
        {/* BACKGROUND TEXTURE LAYER */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[url('/grain.png')] pointer-events-none" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-[#8A6A2F]/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-32 pb-24">
          
          {/* INSTITUTIONAL HEADER */}
          <header className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-12 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#8A6A2F]/10 border border-[#8A6A2F]/20">
                  <Zap className="h-2.5 w-2.5 text-[#8A6A2F] animate-pulse fill-[#8A6A2F]" />
                  <span className="text-[9px] uppercase tracking-[0.4em] text-[#8A6A2F] font-bold font-mono">
                    Node Active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-mono">
                  <Lock size={10} className="text-zinc-700" />
                  Clearance: <span className="text-zinc-400">{aol.tier}</span>
                </div>
              </div>

              <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white font-serif leading-none">
                The <span className="italic text-[#8A6A2F]/90">Sovereign</span> Registry.
              </h1>
            </div>

            <div className="text-right font-mono text-[9px] text-zinc-500 uppercase tracking-[0.3em] leading-relaxed">
              <p>Protocol <span className="text-white ml-2">AOL-INST-4.2</span></p>
              <p>Hashed Identity <span className="text-white ml-2">{userEmail.split("@")[0]}...</span></p>
              <p>Active Assets <span className="text-white ml-2">{totalCount}</span></p>
            </div>
          </header>

          {/* INTEGRATED OGR COMMAND BAR */}
          <section className="mb-24 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 bg-white/[0.01] border border-white/5 backdrop-blur-sm">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8A6A2F]">Operational Intelligence</h3>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Real-time synchronization with the OGR Engine. Adjust parameters in the live terminal to update institutional certainty.
              </p>
              <div className="pt-4">
                  <ReportActions />
              </div>
            </div>
            <div className="flex items-center justify-center lg:border-l border-white/5">
                <Link href="/dashboard/live" className="group flex flex-col items-center gap-4">
                   <div className="p-4 rounded-full border border-[#8A6A2F]/20 group-hover:bg-[#8A6A2F]/10 transition-all duration-500">
                     <BarChart3 className="w-8 h-8 text-[#8A6A2F]" />
                   </div>
                   <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                     Open OGR Terminal
                   </span>
                </Link>
            </div>
          </section>

          {/* THE ASSET INDEX */}
          <div className="divide-y divide-white/5 border-y border-white/5">
            {briefs.map((brief, index) => (
              <Link
                key={brief.id}
                href={`/strategy/${brief.slug}`}
                className="group flex flex-col md:flex-row md:items-center justify-between py-12 px-4 bg-transparent hover:bg-white/[0.02] transition-all duration-700 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-[#8A6A2F] scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom" />

                <div className="flex items-start md:items-center gap-12 relative z-10">
                  <span className="hidden md:block text-[10px] font-mono text-zinc-800 group-hover:text-[#8A6A2F] transition-colors mt-1">
                    [ {String(index + 1).padStart(2, '0')} ]
                  </span>
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-light text-zinc-400 group-hover:text-white transition-colors tracking-tighter font-serif">
                      {brief.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-700 group-hover:text-zinc-500 transition-colors">
                        Classification: Level {aol.isInternal ? "Directorate" : "Inner-Circle"}
                      </p>
                      <span className="h-px w-8 bg-zinc-800 group-hover:bg-[#8A6A2F]/30 transition-colors" />
                      <span className="text-[9px] font-mono text-zinc-800 uppercase">
                        {new Date(brief.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-0 flex items-center gap-6 relative z-10">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-700 font-mono">
                    View Dossier
                  </span>
                  <div className="p-3 border border-white/5 group-hover:border-[#8A6A2F]/40 group-hover:bg-[#8A6A2F]/5 transition-all duration-500">
                    <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-[#8A6A2F] group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* INSTITUTIONAL FOOTER */}
          <footer className="mt-40 pt-24 border-t border-white/5 flex flex-col items-center gap-12">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#8A6A2F]/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 rounded-full bg-[#0A0A0A] border border-white/5">
                <Fingerprint className="h-8 w-8 text-zinc-800 group-hover:text-[#8A6A2F] transition-colors" />
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-x-16 gap-y-4 text-[9px] uppercase tracking-[0.5em] text-zinc-700 font-mono">
                <span>Identity Validated</span>
                <span>Node: LONDON_CANARY_WHARF</span>
                <span>Protocol: V.2026.BETA</span>
              </div>
              <p className="text-sm text-zinc-800 italic font-serif tracking-[0.2em] opacity-50 text-center">
                Abraham of London — The Architecture of Sovereign Intelligence
              </p>
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/admin/login?returnTo=/dashboard",
        permanent: false,
      },
    };
  }

  try {
    const [briefs, totalCount] = await Promise.all([
      prisma.contentMetadata.findMany({
        take: 75,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          createdAt: true,
        }
      }),
      prisma.contentMetadata.count(),
    ]);

    return {
      props: {
        userEmail: session.user?.email || "anonymous",
        briefs: JSON.parse(JSON.stringify(briefs)),
        totalCount,
        aol: (session as any).aol || { tier: "Private", isInternal: false }
      }
    };
  } catch (error) {
    console.error("[Registry Fetch Error]:", error);
    return {
      props: {
        userEmail: session.user?.email || "anonymous",
        briefs: [],
        totalCount: 0,
        aol: { tier: "Private", isInternal: false }
      }
    };
  }
};