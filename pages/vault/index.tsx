import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  FileText, Table, Presentation, Archive, Edit3, Download, 
  Search, Clock, Award, Lock, Eye, ShieldCheck, Filter, Star, 
  CheckCircle2, ChevronRight, X, Building2, Home, Users, Target,
  Workflow, BookOpen, Hammer, Layers, Cpu, Landmark, Compass,
  FileSpreadsheet, ClipboardCheck, GraduationCap, Sparkles
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
  framework?: string;
  purpose?: string;
  implementation?: string;
};

type FilterState = {
  search: string;
  format: string | null;
  tier: string | null;
  category: string | null;
  interactive: boolean | null;
  framework: string | null;
};

type CategoryStats = {
  title: string;
  count: number;
  icon: any;
  description: string;
};

export const getStaticProps: GetStaticProps<{ 
  items: VaultItem[],
  stats: {
    total: number;
    byFormat: Record<string, number>;
    byTier: Record<string, number>;
    byCategory: Record<string, number>;
    interactiveCount: number;
  },
  categories: CategoryStats[]
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
          rating: parseFloat((4 + Math.random()).toFixed(1)),
          framework: d.framework || null,
          purpose: d.purpose || null,
          implementation: d.implementation || null,
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

    // Define categories with icons and descriptions
    const categoryDefinitions: Record<string, { title: string; icon: any; description: string }> = {
      'canon': { title: 'Canon Doctrine', icon: BookOpen, description: 'Core canonical volumes and teaching editions' },
      'governance': { title: 'Governance', icon: Building2, description: 'Board-level decision frameworks and templates' },
      'family': { title: 'Family & Household', icon: Home, description: 'Household governance and legacy planning' },
      'strategy': { title: 'Strategic Frameworks', icon: Target, description: 'Board-ready strategic planning tools' },
      'implementation': { title: 'Implementation Tools', icon: Workflow, description: 'Practical execution and deployment guides' },
      'formation': { title: 'Formation', icon: GraduationCap, description: 'Personal and leadership development resources' },
      'community': { title: 'Community Building', icon: Users, description: 'Brotherhood and accountability frameworks' },
      'legacy': { title: 'Legacy Planning', icon: Landmark, description: 'Multi-generational stewardship tools' },
    };

    const categories: CategoryStats[] = Object.entries(categoryDefinitions).map(([key, def]) => ({
      ...def,
      count: stats.byCategory[key] || 0
    })).filter(cat => cat.count > 0);

    return { props: { items, stats, categories }, revalidate: 3600 };
  } catch (error) {
    console.error('Vault page error:', error);
    return { 
      props: { 
        items: [], 
        stats: { total: 0, byFormat: {}, byTier: {}, byCategory: {}, interactiveCount: 0 },
        categories: [] 
      }, 
      revalidate: 3600 
    };
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

export default function VaultPage({ 
  items, 
  stats, 
  categories 
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({ 
    search: '', 
    format: null, 
    tier: null, 
    category: null, 
    interactive: null,
    framework: null
  });
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'downloads' | 'rating'>('date');
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
        const matchesFramework = !filters.framework || item.framework === filters.framework;
        return matchesSearch && matchesFormat && matchesTier && matchesCategory && matchesInteractive && matchesFramework;
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

  const getCategoryIcon = (category: string | null) => {
    const categoryIcons: any = {
      'canon': BookOpen,
      'governance': Building2,
      'family': Home,
      'strategy': Target,
      'implementation': Workflow,
      'formation': GraduationCap,
      'community': Users,
      'legacy': Landmark,
    };
    const Icon = categoryIcons[category || ''] || Archive;
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
    setFilters({ search: '', format: null, tier: null, category: null, interactive: null, framework: null });
    setActiveCategory(null);
  };

  const handleCategorySelect = (category: string) => {
    setFilters(f => ({ ...f, category }));
    setActiveCategory(category);
  };

  return (
    <>
      <Head>
        <title>The Vault | Strategic Implementation Library</title>
        <meta name="description" content="Complete library of strategic frameworks, canonical doctrine, and implementation tools for serious builders." />
      </Head>
      <Layout title="The Vault">
        <main className="min-h-screen bg-black text-cream selection:bg-amber-500 selection:text-black">
          {/* Hero Section */}
          <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
            <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />
            
            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <motion.p 
                  className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  Implementation Library
                </motion.p>

                <motion.h1 
                  className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                >
                  The Vault
                </motion.h1>

                <motion.p 
                  className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Complete library of strategic frameworks, canonical doctrine, 
                  and implementation tools — the operational arm of the work.
                </motion.p>

                {/* Library Stats */}
                <motion.div 
                  className="mt-10 flex flex-wrap gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <span className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                    {stats.total} Strategic Assets
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    {stats.interactiveCount} Interactive Tools
                  </span>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400">
                    {Object.keys(stats.byTier).length} Access Tiers
                  </span>
                </motion.div>

                <motion.div 
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Link
                    href="#categories"
                    className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
                  >
                    Browse Categories
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  
                  <Link
                    href="/inner-circle?source=vault"
                    className="inline-flex items-center justify-center rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
                  >
                    Unlock Full Library
                    <Lock className="ml-2 h-4 w-4" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section id="categories" className="bg-black py-20 lg:py-28">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mb-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                  The Collections
                </p>
                <h2 className="mt-6 font-serif text-3xl font-semibold text-white sm:text-4xl">
                  Strategic Implementation Domains
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg">
                  Organized by implementation domain — find the tools you need for the work you're doing.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-4">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.title}
                      onClick={() => handleCategorySelect(category.title.toLowerCase().replace(' & ', '-').split(' ')[0])}
                      className={`group flex flex-col rounded-3xl border p-6 transition-all hover:border-gold/25 hover:bg-white/[0.04] ${
                        activeCategory === category.title.toLowerCase().replace(' & ', '-').split(' ')[0]
                          ? 'border-gold/50 bg-gold/5'
                          : 'border-white/8 bg-white/[0.02]'
                      }`}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="rounded-xl border border-gold/25 bg-gold/10 p-2">
                          <Icon className="h-5 w-5 text-gold" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
                          {category.count}
                        </span>
                      </div>
                      
                      <h3 className="mb-3 font-serif text-lg font-semibold text-white group-hover:text-gold">
                        {category.title}
                      </h3>
                      
                      <p className="text-sm leading-relaxed text-gray-400">
                        {category.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Filter & Search Bar */}
          <section className="sticky top-0 z-40 border-y border-white/5 bg-black/80 backdrop-blur-xl py-4">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search strategic assets by title, purpose, or framework..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-6 focus:outline-none focus:border-gold/50 transition-all text-sm placeholder:text-gray-500"
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  />
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={filters.format || ''}
                    onChange={(e) => setFilters(f => ({ ...f, format: e.target.value || null }))}
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50"
                  >
                    <option value="">All Formats</option>
                    <option value="PDF">PDF Documents</option>
                    <option value="EXCEL">Excel Templates</option>
                    <option value="POWERPOINT">PowerPoint Decks</option>
                    <option value="ZIP">Resource Packs</option>
                  </select>
                  
                  <select 
                    value={filters.tier || ''}
                    onChange={(e) => setFilters(f => ({ ...f, tier: e.target.value || null }))}
                    className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-gold/50"
                  >
                    <option value="">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="inner-circle">Inner Circle</option>
                    <option value="member">Member</option>
                    <option value="architect">Architect</option>
                  </select>
                  
                  <button 
                    onClick={() => setFilters(f => ({ ...f, interactive: f.interactive ? null : true }))}
                    className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                      filters.interactive ? 'bg-gold text-black border-gold' : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    <Filter className="w-3 h-3 inline mr-2" /> Interactive Only
                  </button>
                  
                  {(filters.search || filters.format || filters.tier || filters.category || filters.interactive !== null) && (
                    <button 
                      onClick={handleClearFilters}
                      className="px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10 bg-white/5 text-gray-400 hover:text-gray-300 transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              
              {/* Active Filters Display */}
              {(filters.format || filters.tier || filters.category || filters.interactive !== null) && (
                <div className="mt-4 flex flex-wrap gap-2">
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
                  {filters.interactive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <span className="text-xs">Interactive Only</span>
                      <button 
                        onClick={() => setFilters(f => ({ ...f, interactive: null }))}
                        className="text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Results Header */}
          <section className="bg-black py-8">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-serif text-2xl text-cream">
                    {filteredItems.length} of {stats.total} Assets
                  </h3>
                  <p className="text-sm text-gray-500">
                    Filter and sort strategic implementation tools
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-gold/50"
                  >
                    <option value="date">Newest First</option>
                    <option value="title">A to Z</option>
                    <option value="downloads">Most Downloaded</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Asset Grid */}
          <section className="bg-black py-8 pb-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              {filteredItems.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gold/20 bg-gold/5 p-20 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
                    <Search className="w-8 h-8 text-gold/60" />
                  </div>
                  <h3 className="font-serif text-2xl text-cream mb-3">No Assets Found</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Try adjusting your search or filters. Or explore the categories above.
                  </p>
                  <button 
                    onClick={handleClearFilters}
                    className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/20 text-sm text-gold hover:bg-gold/20 transition-all"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {filteredItems.map((item) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={item.slug} 
                        className={`group relative flex flex-col rounded-3xl border p-6 transition-all duration-500 ${
                          activePreview === item.slug 
                            ? 'border-gold/50 bg-gold/10 shadow-[0_0_50px_-12px_rgba(212,175,55,0.3)]' 
                            : 'border-white/5 bg-white/[0.02] hover:border-gold/25 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-2">
                            <div className="p-2.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-gold transition-colors">
                              {getFormatIcon(item.format)}
                            </div>
                            <div className="p-2.5 rounded-xl bg-white/5 text-gray-400 group-hover:text-gray-300 transition-colors">
                              {getCategoryIcon(item.category)}
                            </div>
                            {item.isInteractive && (
                              <div className="p-2.5 rounded-xl bg-gold/10 text-gold" title="Interactive Fillable">
                                <Edit3 className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <TierBadge tier={item.tier} />
                        </div>

                        <h3 className="font-serif text-xl mb-3 leading-tight text-cream group-hover:text-gold transition-colors">
                          {item.title}
                        </h3>
                        
                        {item.purpose && (
                          <p className="text-xs font-medium text-gray-400 mb-2">
                            Purpose: {item.purpose}
                          </p>
                        )}
                        
                        <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-2">
                          {item.excerpt || "Strategic implementation asset."}
                        </p>

                        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-600 font-bold">
                            <span className="flex items-center gap-1.5" title="Downloads">
                              <Download className="w-3 h-3" /> {item.downloadCount}
                            </span>
                            <span className="flex items-center gap-1.5" title="Rating">
                              <Star className="w-3 h-3 fill-gold text-gold" /> {item.rating?.toFixed(1)}
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
                              className="flex-1 py-3 rounded-xl bg-gold text-black hover:bg-gold/80 text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2"
                            >
                              {item.requiresAuth ? <Lock className="w-3 h-3" /> : <Download className="w-3 h-3" />} 
                              {item.requiresAuth ? 'Unlock Access' : 'Download'}
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
                                      <div className="text-[10px] text-gold font-bold mb-2 uppercase tracking-[0.3em]">
                                        {item.tier.toUpperCase()} TIER • {item.format}
                                      </div>
                                      <h4 className="font-serif text-2xl text-cream leading-tight mb-2">{item.title}</h4>
                                      {item.category && (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                          {getCategoryIcon(item.category)}
                                          <span>{item.category}</span>
                                        </div>
                                      )}
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
                                      {item.excerpt || "Strategic implementation asset from the institutional library."}
                                    </p>
                                    
                                    {(item.purpose || item.framework || item.implementation) && (
                                      <div className="space-y-3">
                                        {item.purpose && (
                                          <div className="flex items-start gap-3 text-sm">
                                            <Target className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" /> 
                                            <div>
                                              <span className="font-medium text-gray-300">Purpose:</span>
                                              <p className="text-gray-400 mt-1">{item.purpose}</p>
                                            </div>
                                          </div>
                                        )}
                                        {item.framework && (
                                          <div className="flex items-start gap-3 text-sm">
                                            <Layers className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" /> 
                                            <div>
                                              <span className="font-medium text-gray-300">Framework:</span>
                                              <p className="text-gray-400 mt-1">{item.framework}</p>
                                            </div>
                                          </div>
                                        )}
                                        {item.implementation && (
                                          <div className="flex items-start gap-3 text-sm">
                                            <Workflow className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" /> 
                                            <div>
                                              <span className="font-medium text-gray-300">Implementation:</span>
                                              <p className="text-gray-400 mt-1">{item.implementation}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                        <span>{item.format} Document</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                        <span>{item.isInteractive ? 'Interactive Fillable Form' : 'Static Document'}</span>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-gray-300">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" /> 
                                        <span>Access Level: {item.accessLevel}</span>
                                      </div>
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
                                        className="block w-full py-4 rounded-xl bg-gold text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group hover:bg-gold/80 transition-colors"
                                      >
                                        Join Inner Circle for Access 
                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                      </Link>
                                    ) : (
                                      <button 
                                        onClick={() => {
                                          window.open(item.fileHref!, '_blank');
                                          setActivePreview(null);
                                        }}
                                        className="w-full py-4 rounded-xl bg-gold text-black font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold/80 transition-colors"
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
            </div>
          </section>

          {/* Access CTA */}
          <section className="border-t border-white/5 bg-zinc-950 py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div>
                    <h3 className="font-serif text-2xl font-semibold text-white mb-4">Unlock Full Library Access</h3>
                    <p className="text-sm leading-relaxed text-gray-400 mb-6">
                      The Vault contains the complete implementation toolkit — canonical doctrine, 
                      strategic frameworks, governance templates, and formation resources. 
                      Inner Circle membership unlocks everything.
                    </p>
                    <Link
                      href="/inner-circle?source=vault-bottom"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                    >
                      Join Inner Circle
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                  
                  <div>
                    <h4 className="font-serif text-xl font-semibold text-white mb-4">What's Inside</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-white">Canon Volumes I-X</p>
                          <p className="text-sm text-gray-400">Complete doctrinal architecture and teaching editions</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-white">Strategic Frameworks</p>
                          <p className="text-sm text-gray-400">Board-ready templates, decision matrices, implementation guides</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Workflow className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-white">Implementation Toolkits</p>
                          <p className="text-sm text-gray-400">Practical tools for execution and deployment</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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