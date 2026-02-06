/* pages/dashboard.tsx — INSTITUTIONAL ASSET INDEX */
import * as React from "react";
import type { NextPage, GetServerSideProps } from "next";
import Link from "next/link";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma"; 
import { ChevronRight, Fingerprint, Zap, Lock } from "lucide-react";
import Layout from "@/components/Layout";

interface DashboardProps {
  user: {
    email: string;
    name?: string;
  };
  aol: {
    tier: string;
    isInternal: boolean;
  };
  latestBriefs: any[];
  totalBriefs: number;
}

const MemberDashboard: NextPage<DashboardProps> = ({ user, aol, latestBriefs, totalBriefs }) => {
  return (
    <Layout title="Registry | Abraham of London">
      <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative">
        
        {/* The Institutional Backdrop */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-[0.03] mix-blend-overlay" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pt-40 pb-24">
          
          {/* Header: Utilizing 'editorial' and high-contrast typography */}
          <header className="mb-24 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-12 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-none">
                  <Zap className="h-2.5 w-2.5 text-primary animate-pulse fill-primary" />
                  <span className="text-[9px] uppercase tracking-[0.4em] text-primary font-bold font-mono">Node Active</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-mono">
                  <Lock size={10} className="text-zinc-700" />
                  Clearance: <span className="text-zinc-400">{aol.tier}</span>
                </div>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white font-editorial leading-none">
                The <span className="italic text-primary/90">Sovereign</span> Registry.
              </h1>
            </div>
            
            <div className="text-right font-mono text-[9px] text-zinc-500 uppercase tracking-[0.3em] leading-relaxed">
              <p>Protocol <span className="text-white ml-2">AOL-INST-4.2</span></p>
              <p>Hashed Identity <span className="text-white ml-2">{user.email.split('@')[0]}...</span></p>
              <p>Active Assets <span className="text-white ml-2">{totalBriefs}</span></p>
            </div>
          </header>

          {/* Ledger Grid: Pure Brutalist Rows */}
          <div className="divide-y divide-white/5 border-y border-white/5">
            {latestBriefs.map((brief: any) => (
              <Link 
                key={brief.id} 
                href={`/strategy/${brief.slug}`}
                className="group flex flex-col md:flex-row md:items-center justify-between py-12 px-4 bg-transparent hover:bg-white/[0.02] transition-all duration-700 relative overflow-hidden"
              >
                {/* Hover Accent Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-bottom" />
                
                <div className="flex items-start md:items-center gap-12 relative z-10">
                  <span className="hidden md:block text-[10px] font-mono text-zinc-800 group-hover:text-primary transition-colors mt-1">
                    [ 0{latestBriefs.indexOf(brief) + 1} ]
                  </span>
                  <div className="space-y-3">
                    <h2 className="text-3xl md:text-4xl font-light text-zinc-400 group-hover:text-white transition-colors tracking-tighter font-editorial">
                      {brief.title}
                    </h2>
                    <div className="flex items-center gap-4">
                      <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-700 group-hover:text-zinc-500 transition-colors">
                        Classification: Level {aol.isInternal ? 'Directorate' : 'Inner-Circle'}
                      </p>
                      <span className="h-px w-8 bg-zinc-800 group-hover:bg-primary/30 transition-colors" />
                      <span className="text-[9px] font-mono text-zinc-800 uppercase">{new Date(brief.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 md:mt-0 flex items-center gap-6 relative z-10">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-800 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-700 font-mono">
                    View Dossier
                  </span>
                  <div className="p-3 border border-white/5 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all duration-500">
                    <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Institutional Integrity Footer */}
          <footer className="mt-40 pt-24 border-t border-white/5 flex flex-col items-center gap-12">
            <div className="relative group">
               <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative p-6 rounded-full bg-surface border border-white/5 shadow-soft">
                 <Fingerprint className="h-8 w-8 text-zinc-800 group-hover:text-primary transition-colors" />
               </div>
            </div>
            
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-wrap justify-center gap-x-16 gap-y-4 text-[9px] uppercase tracking-[0.5em] text-zinc-700 font-mono">
                <span className="hover:text-white transition-colors cursor-crosshair">Identity Validated</span>
                <span className="hover:text-white transition-colors cursor-crosshair">Node: LONDON_CANARY_WHARF</span>
                <span className="hover:text-white transition-colors cursor-crosshair">Protocol: V.{new Date().getFullYear()}.BETA</span>
              </div>
              <p className="text-sm text-zinc-800 italic font-editorial tracking-[0.2em] opacity-50">
                Abraham of London — The Architecture of Sovereign Intelligence
              </p>
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  // Redirect unauthenticated users to the specific login terminal
  if (!session) {
    return {
      redirect: {
        destination: "/admin/login?callbackUrl=/dashboard",
        permanent: false,
      },
    };
  }

  try {
    // Standardizing on Prisma for the index query
    const [briefs, totalCount] = await Promise.all([
      prisma.contentMetadata.findMany({ 
        take: 75, // Your request for 75 briefs in the portfolio
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contentMetadata.count(),
    ]);

    return {
      props: {
        user: session.user,
        aol: (session as any).aol || { tier: "Private", isInternal: false },
        latestBriefs: JSON.parse(JSON.stringify(briefs)),
        totalBriefs: totalCount,
      },
    };
  } catch (error) {
    console.error("[Registry Error]:", error);
    return { 
      props: { 
        user: session.user, 
        aol: { tier: "Error", isInternal: false }, 
        latestBriefs: [], 
        totalBriefs: 0 
      } 
    };
  }
};

export default MemberDashboard;