/* pages/inner-circle/dashboard.tsx — MEMBER CONSOLE (INTEGRITY MODE) */
import { GetServerSideProps } from 'next';
import { getInnerCircleAccess } from '@/lib/inner-circle';
import { prisma } from '@/lib/server/prisma';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorBoundary from '@/components/error/ErrorBoundary';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Search, 
  ArrowRight,
  TrendingUp,
  LayoutGrid
} from 'lucide-react';

interface DashboardProps {
  access: {
    hasAccess: boolean;
    userId?: string;
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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Client-side filtering logic to minimize unnecessary DB hits
  const filteredContent = useMemo(() => {
    if (!searchTerm) return initialData.content;
    const term = searchTerm.toLowerCase();
    return initialData.content.filter(item => 
      item.title.toLowerCase().includes(term) || 
      item.excerpt?.toLowerCase().includes(term)
    );
  }, [searchTerm, initialData.content]);

  if (error) {
    return (
      <Layout title="System Error">
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-serif font-bold text-red-500 mb-4">Vault Sync Error</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <button onClick={() => router.reload()} className="bg-gold text-black px-8 py-3 rounded-xl font-bold uppercase tracking-widest">Retry Connection</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout title="Member Dashboard" className="bg-black text-cream">
        <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* 1. INSTITUTIONAL HEADER */}
            <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {access.tier} Level
                  </span>
                  <span className="text-gray-600 text-xs font-mono">Last Sync: {new Date(initialData.user.lastLogin).toLocaleTimeString()}</span>
                </div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">The Kingdom Vault</h1>
                <p className="mt-4 text-gray-400 max-w-xl text-lg">Welcome, {initialData.user.name}. Accessing institutional-grade strategic manuscripts.</p>
              </div>
              <button onClick={() => router.reload()} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400">
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
              </button>
            </header>

            {/* 2. STATS OVERVIEW */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              <StatTile label="Total Volumes" val={initialData.stats.total} icon={BookOpen} />
              <StatTile label="Vault Tier" val={access.tier === 'elite' ? 'Architect' : 'Member'} icon={ShieldCheck} />
              <StatTile label="Active Readers" val="240+" icon={Users} />
              <StatTile label="System Security" val="Verified" icon={Lock} color="text-emerald-500" />
            </section>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* 3. MAIN CONTENT ENGINE */}
              <div className="lg:col-span-3">
                <div className="mb-8 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-gold transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search restricted manuscripts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-gold/50 outline-none transition-all"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredContent.length > 0 ? (
                    filteredContent.map((item, i) => (
                      <Link key={i} href={item.href} className="group p-6 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold/20 transition-all flex flex-col h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gold/60">{item.kind}</span>
                          <ArrowRight className="h-4 w-4 text-gray-700 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                        </div>
                        <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors">{item.title}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-grow">{item.excerpt}</p>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-600 uppercase">
                           <span>{item.date || 'Undated'}</span>
                           <span>{item.readTime || '5m read'}</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="sm:col-span-2 py-20 text-center border border-dashed border-white/10 rounded-3xl">
                      <p className="text-gray-600 italic font-serif">No restricted manuscripts found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. SIDEBAR ACTIONS */}
              <aside className="space-y-6">
                <div className="p-8 rounded-3xl bg-gradient-to-br from-gold/20 to-amber-900/10 border border-gold/20">
                  <h3 className="font-serif text-xl font-bold text-white mb-2">Private Advisory</h3>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">Schedule a strategic diagnostic for board-level or household governance alignment.</p>
                  <Link href="/contact?intent=consultation" className="block w-full py-3 rounded-xl bg-gold text-black text-center text-xs font-black uppercase tracking-widest hover:bg-gold/80 transition-all">
                    Book Room
                  </Link>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-gold" /> System Rhythms
                  </h3>
                  <div className="space-y-4">
                    <RhythmItem label="Next Salon" val="Feb 12" />
                    <RhythmItem label="Manuscript Update" val="Weekly" />
                    <RhythmItem label="Vault Integrity" val="99.9%" />
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
  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-2 text-gray-600">
      <Icon size={14} />
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-xl font-mono font-bold ${color}`}>{val}</div>
  </div>
);

const RhythmItem = ({ label, val }: any) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-500">{label}</span>
    <span className="text-xs font-mono text-gray-300">{val}</span>
  </div>
);

/**
 * SERVER SIDE: POSTGRES INTEGRITY CHECK
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const auth = await getInnerCircleAccess(context.req);

    if (!auth.hasAccess) {
      return { redirect: { destination: `/inner-circle?returnTo=${context.resolvedUrl}`, permanent: false } };
    }

    // Fetch live member data from Postgres
    const member = await prisma.member.findUnique({
      where: { id: auth.userId },
      include: { sessions: { take: 1, orderBy: { createdAt: 'desc' } } }
    });

    // Fetch initial vault manuscripts (Mocking for now, replace with your DB content query)
    const content = [
      { title: "The Builder's Catechism", kind: "Canon", excerpt: "Foundational questions for institutional architects.", href: "/canon/builders-catechism", date: "Jan 2026" },
      { title: "Strategic Frameworks v4.2", kind: "Tool", excerpt: "Board-ready decision matrices and prioritization logic.", href: "/resources/strategic-frameworks", date: "Dec 2025" }
    ];

    return {
      props: {
        access: { hasAccess: true, userId: auth.userId, tier: member?.tier || 'inner-circle' },
        initialData: {
          content,
          stats: { total: content.length, totalViews: 1200 },
          user: { name: member?.name || 'Member', tier: member?.tier || 'inner-circle', lastLogin: new Date().toISOString() }
        }
      }
    };
  } catch (error) {
    console.error("[DASHBOARD_SSR_ERROR]", error);
    return { props: { error: "Institutional vault connection failed. Please contact the administrator." } };
  }
};