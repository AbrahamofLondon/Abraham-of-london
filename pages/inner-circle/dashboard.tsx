/* pages/inner-circle/dashboard.tsx — MEMBER CONSOLE (UNIFIED 2026) */
import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { 
  BookOpen, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Search, 
  ArrowRight, 
  TrendingUp,
  Zap
} from "lucide-react";

// Contentlayer integration
import { allBriefs } from "contentlayer/generated";

// Authentication Hooks
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";

import Layout from "@/components/layout/Layout";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);

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
    setLoading(true);
    router.reload();
  };

  if (error) {
    return (
      <Layout title="Vault Error | Abraham of London" noSidebar>
        <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-white p-12 border border-red-100 shadow-2xl">
            <ShieldCheck className="h-12 w-12 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-4">Vault Sync Error</h1>
            <p className="text-gray-500 mb-8 font-light italic">{error}</p>
            <button
              onClick={handleRefresh}
              className="w-full bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all"
            >
              Retry Protocol Connection
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout 
        title="Member Dashboard | Abraham of London" 
        currentPath="/inner-circle/dashboard"
        className="bg-white"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-blue-50 text-blue-700 border border-blue-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                  {access.tier} Clearance
                </span>
                <span className="text-gray-400 text-[10px] font-mono uppercase tracking-widest">
                  Sync: {initialData.user.lastLogin ? new Date(initialData.user.lastLogin).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                </span>
              </div>

              <h1 className="font-serif text-5xl md:text-6xl text-gray-900 tracking-tighter leading-none italic">
                The Kingdom <span className="text-gray-300">Vault.</span>
              </h1>
              <p className="mt-6 text-gray-500 max-w-xl text-lg font-light leading-relaxed italic">
                Welcome back, <span className="text-gray-900 font-medium">{initialData.user.name}</span>. Accessing institutional-grade strategic manuscripts.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-4 rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all text-gray-400 hover:text-blue-600 group"
            >
              <RefreshCw size={18} className={`${loading ? "animate-spin text-blue-600" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            </button>
          </header>

          {/* Stat Grid */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <StatTile label="Briefs Available" val={initialData.stats.total} icon={BookOpen} />
            <StatTile label="Vault Tier" val={access.tier.toUpperCase()} icon={ShieldCheck} />
            <StatTile label="Session Integrity" val="Verified" icon={Zap} />
            <StatTile label="Identity Protection" val="AES-256" icon={Lock} />
          </section>

          <div className="grid lg:grid-cols-4 gap-16">
            <div className="lg:col-span-3">
              {/* Search Bar */}
              <div className="mb-12 relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input
                  type="text"
                  placeholder="Filter restricted manuscripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-full py-5 pl-16 pr-6 text-gray-900 focus:bg-white focus:border-blue-200 outline-none transition-all placeholder:text-gray-300 font-light"
                />
              </div>

              {/* Briefs Grid */}
              <div className="grid gap-8 sm:grid-cols-2">
                {filteredContent.length > 0 ? (
                  filteredContent.map((item, i) => (
                    <Link
                      key={i}
                      href={item.href}
                      className="group p-8 border border-gray-100 bg-white hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-500/5 transition-all flex flex-col h-full relative"
                    >
                      <div className="absolute top-0 right-0 p-8">
                        <ArrowRight className="h-5 w-5 text-gray-200 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="mb-6">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600/60 py-1 px-3 bg-blue-50 rounded-full">
                          {item.kind}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors leading-tight italic">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-8 flex-grow leading-relaxed font-light">{item.excerpt}</p>
                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        <span>{item.date}</span>
                        <span>{item.readTime}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="sm:col-span-2 py-32 text-center border border-dashed border-gray-100 rounded-lg">
                    <Lock size={32} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 italic font-serif text-lg">No manuscripts found matching your query.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar / Advisory */}
            <aside className="space-y-12">
              <div className="p-10 bg-gray-900 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
                <h3 className="font-serif text-2xl font-bold mb-4 italic">Institutional Advisory</h3>
                <p className="text-sm text-gray-400 mb-10 leading-relaxed font-light">Direct access for board-level diagnostics or strategic household alignment.</p>
                <Link href="/contact?intent=consultation" className="block w-full py-5 bg-white text-black text-center text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-50 transition-all">
                  Request Diagnostic
                </Link>
              </div>

              <div className="p-8 border-l border-gray-100">
                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                  <TrendingUp size={14} className="text-blue-600" /> System Rhythms
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
      </Layout>
    </ErrorBoundary>
  );
}

const StatTile = ({ label, val, icon: Icon }: any) => (
  <div className="bg-gray-50 border border-gray-100 p-8 hover:bg-white hover:shadow-xl transition-all">
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 mb-6 shadow-sm border border-gray-100">
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2 block">{label}</span>
    <div className="text-2xl font-serif italic font-bold text-gray-900">{val}</div>
  </div>
);

const RhythmItem = ({ label, val }: any) => (
  <div className="flex items-center justify-between border-b border-gray-50 pb-5 last:border-0 last:pb-0">
    <span className="text-[10px] text-gray-400 uppercase tracking-widest">{label}</span>
    <span className="text-[10px] font-mono text-gray-900 font-bold">{val}</span>
  </div>
);

/* -----------------------------------------------------------------------------
  SERVER SIDE GATEWAY
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return { 
        redirect: { 
          destination: `/inner-circle?returnTo=${encodeURIComponent(context.resolvedUrl)}`, 
          permanent: false 
        } 
      };
    }

    const ctx = await getSessionContext(sessionId);
    
    if (!ctx.ok || !ctx.valid) {
       return { redirect: { destination: "/inner-circle", permanent: false } };
    }

    const required = "inner-circle";
    if (!tierAtLeast(ctx.tier, required)) {
      return { redirect: { destination: "/inner-circle/locked", permanent: false } };
    }

    // Dynamic Brief Injection from Contentlayer Generation
    const content = allBriefs
      .filter((b) => b.status === "published" || process.env.NODE_ENV === "development")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((b) => ({
        title: b.title,
        kind: b.category || "Briefing",
        excerpt: b.excerpt || b.summary || "Institutional strategic summary.",
        href: `/inner-circle/briefs/${b._raw.flattenedPath}`,
        date: b.date ? new Date(b.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : "2026",
        readTime: b.readingTime?.text || "12m",
      }));

    return {
      props: {
        access: { 
          hasAccess: true, 
          userId: ctx.memberId || null, 
          tier: ctx.tier || "public" 
        },
        initialData: {
          content,
          stats: { 
            total: content.length, 
          },
          user: {
            name: ctx.name || "Member",
            tier: ctx.tier || "public",
            lastLogin: ctx.expiresAt || new Date().toISOString(),
          },
        },
      },
    };
  } catch (err) {
    console.error("[VAULT_FATAL]:", err);
    return { props: { error: "Institutional Vault connectivity lost. Systems re-aligning." } };
  }
};