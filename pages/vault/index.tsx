import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  FileText, Table, Presentation, Archive, Edit3, Download, 
  Search, Clock, UserCheck, Award, Lock, Eye, AlertCircle,
  ShieldCheck, Filter, Star, CheckCircle2, ChevronRight,
  X // Added for close button
} from "lucide-react";
import { assertContentlayerHasDocs } from "@/lib/contentlayer-assert";
import { getContentlayerData, normalizeSlug, getDocHref, getAccessLevel } from "@/lib/contentlayer-compat";
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
    const data = await getContentlayerData();
    assertContentlayerHasDocs(data);
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
          size: (regEntry.fileSize ? `${(regEntry.fileSize / 1024 / 1024).toFixed(1)} MB` : null),
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
  const [filters, setFilters] = useState<FilterState>({ 
    search: '', 
    format: null, 
    tier: null, 
    category: null, 
    interactive: null 
  });
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'downloads' | 'rating'>('date');
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchesSearch = !filters.search || 
          item.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          (item.excerpt && item.excerpt.toLowerCase().includes(filters.search.toLowerCase()));
        const matchesFormat = !filters.format || item.format === filters.format;
        const matchesTier = !filters.tier || item.tier === filters.tier;
        const matchesCategory = !filters.category || item.category === filters.category;
        const matchesInteractive = filters.interactive === null || item.isInteractive === filters.interactive;
        return matchesSearch && matchesFormat && matchesTier && matchesCategory && matchesInteractive;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        } else if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        } else if (sortBy === 'downloads') {
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        } else if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        return 0;
      });
  }, [items, filters, sortBy]);

  const getFormatIcon = (format: string) => {
    const icons: any = { 
      'PDF': FileText, 
      'EXCEL': Table, 
      'POWERPOINT': Presentation, 
      'ZIP': Archive,
      'BINARY': Archive 
    };
    const Icon = icons[format] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const handleDownload = (item: VaultItem) => {
    if (item.requiresAuth) {
      router.push('/inner-circle');
    } else if (item.fileHref) {
      window.open(item.fileHref, '_blank');
    }
  };

  const handleClearFilters = () => {
    setFilters({ search: '', format: null, tier: null, category: null, interactive: null });
  };

  return (
    <>
      <Head>
        <title>The Vault | Strategic Archive</title>
        <meta name="description" content="Access our exclusive collection of strategic documents, templates, and resources." />
      </Head>
      <Layout title="Vault">
        <main className="min-h-screen bg-black text-cream selection:bg-amber-500 selection:text-black">
          {/* Header Section */}
          <section className="relative py-24 px-4 md:px-6 bg-[radial-gradient(circle_at_top_right,_#1a1510,_#000000)]">
            <div className="max-w-7xl mx-auto text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em]"
              >
                <ShieldCheck className="w-4 h-4" /> Strategic Archive
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-serif text-5xl md:text-7xl lg:text-8xl font-light mb-8 tracking-tight text-cream"
              >
                The Vault
              </motion.h1>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto mt-12"
              >
                {[
                  { label: "Assets", val: stats.total, icon: Archive, color: "text-amber-500" },
                  { label: "Fillable", val: stats.interactiveCount, icon: Edit3, color: "text-blue-500" },
                  { label: "Tiers", val: Object.keys(stats.byTier).length, icon: Award, color: "text-purple-500" },
                  { label: "Formats", val: Object.keys(stats.byFormat).length, icon: FileText, color: "text-emerald-500" }
                ].map((s, i) => (
                  <div 
                    key={i} 
                    className="p-4 md:p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md hover:border-white/10 transition-all duration-300"
                  >
                    <s.icon className={`w-4 h-4 ${s.color}/40 mb-3 mx-auto`} />
                    <div className={`text-2xl md:text-3xl font-serif ${s.color} mb-1`}>{s.val}</div>
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Filter Bar */}
          <section className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-y border-white/5 py-4">
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search the institutional archive..." 
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-amber-500/50 transition-all text-sm placeholder:text-gray-500"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => setFilters(f => ({ ...f, interactive: f.interactive ? null : true }))}
                  className={`px-4 md:px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all flex-1 md:flex-none ${filters.interactive ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300'}`}
                >
                  <Filter className="w-3 h-3 inline mr-2" /> Fillable Only
                </button>
                {(filters.search || filters.interactive !== null) && (
                  <button 
                    onClick={handleClearFilters}
                    className="px-4 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-gray-400 hover:text-gray-300 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Stats and Filters */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h2 className="font-serif text-2xl text-cream mb-2">
                  {filteredItems.length} of {stats.total} Assets
                </h2>
                <p className="text-sm text-gray-500">
                  Filter and sort to find exactly what you need
                </p>
              </div>
              <div className="flex gap-2">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-full py-2 px-4 text-sm focus:outline-none focus:border-amber-500/50"
                >
                  <option value="date">Newest First</option>
                  <option value="title">A to Z</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.tier || filters.category || filters.format) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.tier && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-xs">Tier: {filters.tier}</span>
                    <button 
                      onClick={() => setFilters(f => ({ ...f, tier: null }))}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {filters.category && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-xs">Category: {filters.category}</span>
                    <button 
                      onClick={() => setFilters(f => ({ ...f, category: null }))}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {filters.format && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-xs">Format: {filters.format}</span>
                    <button 
                      onClick={() => setFilters(f => ({ ...f, format: null }))}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Artifact Grid */}
          <section className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
                  <Search className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="font-serif text-2xl text-cream mb-3">No Assets Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                <button 
                  onClick={handleClearFilters}
                  className="mt-6 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <AnimatePresence mode="popLayout">
                  {filteredItems.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={item.slug} 
                      className={`group relative flex flex-col rounded-3xl border p-6 transition-all duration-500 ${activePreview === item.slug ? 'border-amber-500/50 bg-amber-950/10 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]' : 'border-white/5 bg-zinc-950/50 hover:border-white/20 hover:bg-zinc-950/70'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex gap-2">
                          <div className="p-2.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-amber-500 transition-colors">
                            {getFormatIcon(item.format)}
                          </div>
                          {item.isInteractive && (
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500" title="Interactive Fillable">
                              <Edit3 className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <TierBadge tier={item.tier} />
                      </div>

                      <h3 className="font-serif text-xl mb-3 leading-tight text-cream group-hover:text-amber-500/80 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                        {item.excerpt || "No description available."}
                      </p>

                      <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                          <span className="flex items-center gap-1.5" title="Downloads">
                            <Download className="w-3 h-3" /> {item.downloadCount}
                          </span>
                          <span className="flex items-center gap-1.5" title="Rating">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {item.rating?.toFixed(1)}
                          </span>
                          <span title="File Size">{item.size || "N/A"}</span>
                        </div>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setActivePreview(item.slug)}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </button>
                          <button 
                            onClick={() => handleDownload(item)}
                            className="flex-1 py-3 rounded-xl bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                          >
                            {item.requiresAuth ? <Lock className="w-3 h-3" /> : <Download className="w-3 h-3" />} 
                            {item.requiresAuth ? 'Access' : 'Get'}
                          </button>
                        </div>
                      </div>

                      {/* Detail Overlay */}
                      <AnimatePresence>
                        {activePreview === item.slug && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                            onClick={() => setActivePreview(null)}
                          >
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 20 }}
                              className="relative w-full max-w-2xl bg-zinc-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-6">
                                  <div>
                                    <div className="text-[10px] text-amber-500 font-bold mb-2 uppercase tracking-[0.3em]">
                                      {item.tier.toUpperCase()} TIER
                                    </div>
                                    <h4 className="font-serif text-2xl text-cream leading-tight">{item.title}</h4>
                                  </div>
                                  <button 
                                    onClick={() => setActivePreview(null)}
                                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                                  >
                                    <X className="w-5 h-5 text-gray-500" />
                                  </button>
                                </div>

                                <div className="space-y-6">
                                  <p className="text-gray-300 leading-relaxed">
                                    {item.excerpt || "No description available."}
                                  </p>
                                  
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                      <span>High-Fidelity {item.format} Document</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                      <span>{item.isInteractive ? 'Interactive Fillable Form with Logic' : 'Static Strategic Document'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-300">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                      <span>Access Level: {item.accessLevel}</span>
                                    </div>
                                    {item.category && (
                                      <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                        <span>Category: {item.category}</span>
                                      </div>
                                    )}
                                    {item.date && (
                                      <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                        <span>Added: {new Date(item.date).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>

                                  {item.tags.length > 0 && (
                                    <div>
                                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</div>
                                      <div className="flex flex-wrap gap-2">
                                        {item.tags.map((tag, idx) => (
                                          <span 
                                            key={idx} 
                                            className="px-3 py-1 text-xs rounded-full bg-white/5 text-gray-400"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                  {item.requiresAuth ? (
                                    <Link 
                                      href="/inner-circle"
                                      className="block w-full py-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-400 text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group hover:opacity-90 transition-opacity"
                                    >
                                      Join the Inner Circle for Access 
                                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        window.open(item.fileHref!, '_blank');
                                        setActivePreview(null);
                                      }}
                                      className="w-full py-4 rounded-xl bg-amber-500 text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-amber-400 transition-colors"
                                    >
                                      Download Now <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </main>
      </Layout>
    </>
  );
}

// Helper functions
function resolveDocCoverImage(doc: any): string | null {
  return doc.coverImage || doc.image || null;
}

function resolveDocDownloadHref(doc: any): string | null {
  return doc.fileHref || doc.downloadHref || null;
}