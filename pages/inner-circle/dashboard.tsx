/* pages/inner-circle/dashboard.tsx — MEMBER CONSOLE (PRODUCTION READY, ROUTER-SAFE) */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { BookOpen, ShieldCheck, Lock, RefreshCw, Search, ArrowRight, TrendingUp } from "lucide-react";

// Contentlayer integration (with defensive import)
import { allBriefs } from "contentlayer/generated";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast, type Tier } from "@/lib/server/auth/tokenStore.postgres";

import Layout from "@/components/Layout";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

interface DashboardProps {
  access: {
    hasAccess: boolean;
    userId?: string | null;
    tier: string;
  };
  initialData: {
    content: any[];
    stats: {
      total: number;
      totalViews: number;
    };
    user: {
      name: string;
      tier: string;
      lastLogin: string;
    };
  };
  error?: string;
}

export default function InnerCircleDashboard({ access, initialData, error }: DashboardProps) {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Dynamic filter for the 75+ briefs
  const filteredContent = React.useMemo(() => {
    if (!initialData?.content) return [];
    if (!searchTerm) return initialData.content;
    const term = searchTerm.toLowerCase();
    return initialData.content.filter(
      (item) => 
        item.title?.toLowerCase().includes(term) || 
        item.excerpt?.toLowerCase().includes(term) ||
        item.kind?.toLowerCase().includes(term)
    );
  }, [searchTerm, initialData.content]);

  const handleRefresh = () => {
    if (!router) return;
    setLoading(true);
    router.reload();
  };

  // ✅ Early return during SSR/prerender
  if (!router) {
    return (
      <Layout title="Member Dashboard | Abraham of London">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="System Error | Abraham of London">
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-zinc-950/50 p-12 rounded-3xl border border-red-500/20">
            <ShieldCheck className="h-12 w-12 text-red-500/50 mx-auto mb-6" />
            <h1 className="text-2xl font-serif font-bold text-red-500 mb-4">Vault Sync Error</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-gold text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-white transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout title="Member Dashboard | Abraham of London" className="bg-black text-cream">
        <main className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* WELCOME HEADER */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {access.tier} Clearance
                  </span>
                  <span className="text-zinc-600 text-xs font-mono italic">
                    Sync: {initialData.user.lastLogin ? new Date(initialData.user.lastLogin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                  </span>
                </div>

                <h1 className="font-serif text-4xl md:text-5xl font-bold text-white tracking-tight">The Kingdom Vault</h1>
                <p className="mt-4 text-zinc-400 max-w-xl text-lg leading-relaxed">
                  Welcome back, <span className="text-white italic">{initialData.user.name}</span>. Accessing institutional-grade strategic manuscripts.
                </p>
              </div>

              <button
                onClick={handleRefresh}
                disabled={loading}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-zinc-400 hover:text-gold"
              >
                <RefreshCw size={20} className={loading ? "animate-spin text-gold" : ""} />
              </button>
            </header>

            {/* QUICK STATS */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
              <StatTile label="Briefs Available" val={initialData.stats.total} icon={BookOpen} />
              <StatTile label="Vault Tier" val={access.tier.toUpperCase()} icon={ShieldCheck} />
              <StatTile label="Session Integrity" val="Verified" icon={TrendingUp} />
              <StatTile label="Identity Protection" val="AES-256" icon={Lock} color="text-emerald-500" />
            </section>

            <div className="grid lg:grid-cols-4 gap-12">
              {/* CONTENT GRID */}
              <div className="lg:col-span-3">
                <div className="mb-10 relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-gold transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder="Search restricted manuscripts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl py-5 pl-14 pr-4 text-white focus:border-gold/40 outline-none transition-all placeholder:text-zinc-700"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredContent.length > 0 ? (
                    filteredContent.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        className="group p-8 rounded-[2rem] border border-white/5 bg-zinc-950/40 hover:bg-zinc-900/60 hover:border-gold/20 transition-all flex flex-col h-full relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6">
                          <ArrowRight className="h-5 w-5 text-zinc-800 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="mb-6">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/60 py-1 px-2 bg-gold/5 rounded border border-gold/10">
                            {item.kind}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-white mb-3 group-hover:text-gold transition-colors leading-tight">
                          {item.title}
                        </h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 mb-8 flex-grow leading-relaxed">{item.excerpt}</p>
                        <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                          <span>{item.date}</span>
                          <span>{item.readTime}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="sm:col-span-2 py-32 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/[0.01]">
                      <Lock size={32} className="mx-auto text-zinc-800 mb-4" />
                      <p className="text-zinc-600 italic font-serif text-lg">No manuscripts found in the current clearance level.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SIDEBAR TOOLS */}
              <aside className="space-y-8">
                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-gold/10 to-transparent border border-gold/20 shadow-xl">
                  <h3 className="font-serif text-2xl font-bold text-white mb-3">Institutional Advisory</h3>
                  <p className="text-xs text-zinc-400 mb-8 leading-relaxed">Direct access for board-level diagnostics or strategic household alignment.</p>
                  <Link href="/contact?intent=consultation" className="block w-full py-4 rounded-xl bg-gold text-black text-center text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg shadow-gold/10">
                    Request Diagnostic
                  </Link>
                </div>

                <div className="p-8 rounded-[2rem] bg-zinc-950 border border-white/5">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <TrendingUp size={14} className="text-gold" /> System Rhythms
                  </h3>
                  <div className="space-y-6">
                    <RhythmItem label="Next Salon" val="Feb 2026" />
                    <RhythmItem label="Intel Cycle" val="Active" />
                    <RhythmItem label="Vault Pulse" val="Operational" />
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </Layout>
    </ErrorBoundary>
  );
}

const StatTile = ({ label, val, icon: Icon, color = "text-gold" }: any) => (
  <div className="bg-zinc-950 border border-white/5 p-6 rounded-2xl flex flex-col items-center text-center">
    <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 mb-4"><Icon size={16} /></div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">{label}</span>
    <div className={`text-xl font-mono font-bold ${color}`}>{val}</div>
  </div>
);

const RhythmItem = ({ label, val }: any) => (
  <div className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-mono text-gold/80">{val}</span>
  </div>
);

/* -----------------------------------------------------------------------------
  SERVER SIDE GATEWAY (Hardened for Production)
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return { redirect: { destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`, permanent: false } };
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx.session || !ctx.member) {
       return { redirect: { destination: "/inner-circle", permanent: false } };
    }

    const required: Tier = "inner-circle";
    if (!tierAtLeast(ctx.tier as any, required)) {
      return { redirect: { destination: "/inner-circle/locked", permanent: false } };
    }

    // Dynamic Brief Injection from Contentlayer
    const content = allBriefs
      .filter((b) => b.status === "published" || process.env.NODE_ENV === "development")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((b) => ({
        title: b.title,
        kind: b.category || "Brief",
        excerpt: b.excerpt || b.summary || "Restricted briefing summary.",
        href: `/inner-circle/briefs/${b._raw.flattenedPath}`,
        date: b.date ? new Date(b.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "2026",
        readTime: b.readingTime?.text || "10m",
      }));

    return {
      props: {
        access: { hasAccess: true, userId: ctx.member.id, tier: ctx.tier },
        initialData: {
          content,
          stats: { total: content.length, totalViews: ctx.member.viewCount || 0 },
          user: {
            name: ctx.member.name || "Member",
            tier: ctx.tier,
            lastLogin: ctx.session.lastActivity?.toISOString() || new Date().toISOString(),
          },
        },
      },
    };
  } catch (err) {
    console.error("[VAULT_FATAL]:", err);
    return { props: { error: "Institutional Vault connectivity lost. Systems re-aligning." } };
  }
};