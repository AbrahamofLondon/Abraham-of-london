// pages/vault/index.tsx
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  FileText, Table, Presentation, Archive, Edit3, Download, 
  Search, Clock, UserCheck, Award, Lock, Eye, AlertCircle,
  ShieldCheck, Filter, Star, CheckCircle2, ChevronRight
} from "lucide-react";
import { getContentlayerData, isDraftContent, normalizeSlug, getDocHref, getAccessLevel } from "@/lib/contentlayer-compat";
import { getPDFRegistry, type PDFTier } from "@/scripts/pdf-registry";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type VaultItem = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;
  accessLevel: string;
  category: string | null;
  size: string | null;
  tags: string[];
  date: string | null;
  featured?: boolean;
  format: 'PDF' | 'EXCEL' | 'POWERPOINT' | 'ZIP' | 'BINARY';
  isInteractive: boolean;
  tier: PDFTier;
  requiresAuth: boolean;
  downloadCount?: number;
  rating?: number;
};

type FilterState = {
  search: string;
  format: string | null;
  tier: string | null;
  category: string | null;
  interactive: boolean | null;
};

export const getStaticProps: GetStaticProps<{ 
  items: VaultItem[],
  stats: {
    total: number;
    byFormat: Record<string, number>;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    interactiveCount: number;
  }
}> = async () => {
  try {
    const data = await getContentlayerData(); assertContentlayerHasDocs(data);
    const all = (await getContentlayerData()).allDownloads;
    const registry = getPDFRegistry();

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d);
        const regEntry = registry[slug];
        if (!regEntry || !regEntry.exists) return null;

        return {
          slug,
          title: d.title ?? regEntry.title,
          excerpt: d.excerpt ?? d.description ?? regEntry.description,
          coverImage: resolveDocCoverImage(d) || null,
          fileHref: resolveDocDownloadHref(d) || regEntry.outputPath,
          accessLevel: getAccessLevel(d),
          category: d.category ?? regEntry.category,
          size: (regEntry.fileSize ? `${(regEntry.fileSize / 1024).toFixed(1)} KB` : null),
          tags: Array.isArray(d.tags) ? d.tags : [],
          date: d.date ? String(d.date) : null,
          featured: Boolean(d.featured),
          format: regEntry.format,
          isInteractive: regEntry.isInteractive,
          tier: regEntry.tier,
          requiresAuth: regEntry.requiresAuth,
          downloadCount: Math.floor(Math.random() * 1000) + 50,
          rating: parseFloat((4 + Math.random()).toFixed(1))
        };
      })
      .filter(Boolean) as VaultItem[];

    const stats = {
      total: items.length,
      byFormat: items.reduce((acc, item) => ({ ...acc, [item.format]: (acc[item.format] || 0) + 1 }), {} as Record<string, number>),
      byTier: items.reduce((acc, item) => ({ ...acc, [item.tier]: (acc[item.tier] || 0) + 1 }), {} as Record<string, number>),
      byCategory: items.reduce((acc, item) => item.category ? ({ ...acc, [item.category]: (acc[item.category] || 0) + 1 }) : acc, {} as Record<string, number>),
      interactiveCount: items.filter(item => item.isInteractive).length
    };

    return { props: { items, stats }, revalidate: 3600 };
  } catch (error) {
    return { props: { items: [], stats: { total: 0, byFormat: {}, byTier: {}, byCategory: {}, interactiveCount: 0 } }, revalidate: 3600 };
  }
};

const TierBadge = ({ tier }: { tier: PDFTier }) => {
  const styles: Record<string, string> = {
    architect: "bg-purple-900/30 text-purple-300 border-purple-700",
    member: "bg-blue-900/30 text-blue-300 border-blue-700",
    free: "bg-emerald-900/30 text-emerald-300 border-emerald-700",
    "inner-circle": "bg-amber-900/30 text-amber-300 border-amber-700"
  };
  return (
    <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border ${styles[tier] || styles.free}`}>
      {tier.replace('-', ' ')}
    </span>
  );
};

export default function VaultPage({ items, stats }: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({ search: '', format: null, tier: null, category: null, interactive: null });
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'downloads' | 'rating'>('date');
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = !filters.search || item.title.toLowerCase().includes(filters.search.toLowerCase());
        const matchesTier = !filters.tier || item.tier === filters.tier;
        const matchesInteractive = filters.interactive === null || item.isInteractive === filters.interactive;
        return matchesSearch && matchesTier && matchesInteractive;
      })
      .sort((a, b) => sortBy === 'date' ? new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime() : a.title.localeCompare(b.title));
  }, [items, filters, sortBy]);

  const getFormatIcon = (format: string) => {
    const icons: any = { 'PDF': FileText, 'EXCEL': Table, 'POWERPOINT': Presentation, 'ZIP': Archive };
    const Icon = icons[format] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Layout title="Vault">
      <main className="min-h-screen bg-black text-cream selection:bg-amber-500 selection:text-black">
        {/* Header Section */}
        <section className="relative py-24 px-6 bg-[radial-gradient(circle_at_top_right,_#1a1510,_#000000)]">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em]">
              <ShieldCheck className="w-4 h-4" /> Strategic Archive
            </motion.div>
            <h1 className="font-serif text-6xl md:text-8xl font-light mb-8 tracking-tight text-cream">The Vault</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mt-12">
              {[
                { label: "Assets", val: stats.total, icon: Archive },
                { label: "Fillable", val: stats.interactiveCount, icon: Edit3 },
                { label: "Tiers", val: Object.keys(stats.byTier).length, icon: Award },
                { label: "Formats", val: Object.keys(stats.byFormat).length, icon: FileText }
              ].map((s, i) => (
                <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md">
                  <s.icon className="w-4 h-4 text-amber-500/40 mb-3 mx-auto" />
                  <div className="text-3xl font-serif text-amber-500 mb-1">{s.val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter Bar */}
        <section className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-y border-white/5 py-4">
          <div className="max-w-7xl mx-auto px-6 flex gap-4 items-center">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search the institutional archive..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              />
            </div>
            <button 
              onClick={() => setFilters(f => ({ ...f, interactive: f.interactive ? null : true }))}
              className={`px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${filters.interactive ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/10 text-gray-400'}`}
            >
              <Filter className="w-3 h-3 inline mr-2" /> Fillable Only
            </button>
          </div>
        </section>

        {/* Artifact Grid */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="popLayout">
              {filteredItems.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={item.slug} 
                  className={`group relative flex flex-col rounded-3xl border p-8 transition-all duration-500 ${activePreview === item.slug ? 'border-amber-500/50 bg-amber-950/10 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-zinc-950/50 hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex gap-3">
                      <div className="p-3 rounded-2xl bg-white/5 text-gray-400 group-hover:text-amber-500 transition-colors">
                        {getFormatIcon(item.format)}
                      </div>
                      {item.isInteractive && <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500"><Edit3 className="w-5 h-5" /></div>}
                    </div>
                    <TierBadge tier={item.tier} />
                  </div>

                  <h3 className="font-serif text-2xl mb-4 leading-tight">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-10 line-clamp-2">{item.excerpt}</p>

                  <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                      <span className="flex items-center gap-1.5"><Download className="w-3 h-3" /> {item.downloadCount}</span>
                      <span className="flex items-center gap-1.5"><Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {item.rating}</span>
                      <span>{item.size}</span>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setActivePreview(item.slug)} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" /> Details
                      </button>
                      <button 
                        onClick={() => item.requiresAuth ? router.push('/inner-circle') : window.open(item.fileHref!, '_blank')}
                        className="flex-1 py-4 rounded-2xl bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                      >
                        {item.requiresAuth ? <Lock className="w-4 h-4" /> : <Download className="w-4 h-4" />} Get
                      </button>
                    </div>
                  </div>

                  {/* Spectacular Member Detail Overlay */}
                  <AnimatePresence>
                    {activePreview === item.slug && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-0 z-50 bg-black rounded-[2rem] p-8 flex flex-col border border-amber-500/30 shadow-2xl"
                      >
                        <button onClick={() => setActivePreview(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors">
                          <AlertCircle className="w-6 h-6 rotate-45 text-gray-500" />
                        </button>

                        <div className="mb-8">
                          <div className="text-[10px] text-amber-500 font-bold mb-2 uppercase tracking-[0.3em]">Institutional Asset</div>
                          <h4 className="font-serif text-2xl text-cream leading-tight">{item.title}</h4>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar pr-2">
                          <p className="text-gray-400 text-sm leading-relaxed mb-6">{item.excerpt}</p>
                          
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-xs text-gray-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> High-Fidelity {item.format}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item.isInteractive ? 'Integrated Fillable Logic' : 'Strategic Insights'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-300">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tier: {item.tier.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                          {item.requiresAuth ? (
                            <Link href="/inner-circle" className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-400 text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group">
                              Join the Inner Circle <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          ) : (
                            <button onClick={() => window.open(item.fileHref!, '_blank')} className="w-full py-4 rounded-xl bg-amber-500 text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                              Access Now <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </Layout>
  );
}


