// pages/vault/index.tsx
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  FileText, 
  Table, 
  Presentation, 
  Archive, 
  Edit3, 
  ShieldCheck, 
  Download, 
  ExternalLink,
  Filter,
  Search,
  Clock,
  UserCheck,
  Award,
  Lock,
  Eye,
  AlertCircle
} from "lucide-react";
import {
  assertContentlayerHasDocs,
  getAllDownloads,
  normalizeSlug,
  resolveDocCoverImage,
  resolveDocDownloadHref,
  getAccessLevel,
} from "@/lib/contentlayer-helper";
import { getPDFRegistry, getAllPDFs, type PDFConfig, type PDFTier } from "@/scripts/pdf-registry";
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
    assertContentlayerHasDocs();

    const all = getAllDownloads();
    const registry = getPDFRegistry();

    const items: VaultItem[] = all
      .map((d: any) => {
        const slug = normalizeSlug(d);
        const regEntry = registry[slug];

        if (!regEntry || !regEntry.exists) return null;

        // Simulate download count and rating (in production, fetch from DB)
        const downloadCount = Math.floor(Math.random() * 1000) + 50;
        const rating = 4 + Math.random(); // 4.0 - 5.0 stars

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
          downloadCount,
          rating: parseFloat(rating.toFixed(1))
        };
      })
      .filter(Boolean) as VaultItem[];

    // Calculate statistics
    const stats = {
      total: items.length,
      byFormat: items.reduce((acc, item) => {
        acc[item.format] = (acc[item.format] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byTier: items.reduce((acc, item) => {
        acc[item.tier] = (acc[item.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCategory: items.reduce((acc, item) => {
        if (item.category) {
          acc[item.category] = (acc[item.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      interactiveCount: items.filter(item => item.isInteractive).length
    };

    return { 
      props: { 
        items, 
        stats 
      }, 
      revalidate: 3600 
    };

  } catch (error) {
    console.error('Error in vault getStaticProps:', error);
    return {
      props: {
        items: [],
        stats: {
          total: 0,
          byFormat: {},
          byTier: {},
          byCategory: {},
          interactiveCount: 0
        }
      },
      revalidate: 3600
    };
  }
};

// Tier badge component
const TierBadge = ({ tier }: { tier: PDFTier }) => {
  const colors = {
    'architect': 'bg-purple-900/30 text-purple-300 border-purple-700',
    'member': 'bg-blue-900/30 text-blue-300 border-blue-700',
    'free': 'bg-emerald-900/30 text-emerald-300 border-emerald-700',
    'inner-circle': 'bg-amber-900/30 text-amber-300 border-amber-700'
  };

  const labels = {
    'architect': 'Architect',
    'member': 'Member',
    'free': 'Free',
    'inner-circle': 'Inner Circle'
  };

  return (
    <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${colors[tier]}`}>
      {labels[tier]}
    </span>
  );
};

// Star rating component
const StarRating = ({ rating }: { rating: number }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < fullStars ? 'text-amber-500 fill-amber-500' : hasHalfStar && i === fullStars ? 'text-amber-500 fill-amber-500' : 'text-gray-700 fill-gray-700'}`}
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
};

export default function VaultPage({ 
  items, 
  stats 
}: InferGetStaticPropsType<typeof getStaticProps>) {
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
    let filtered = [...items];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.excerpt?.toLowerCase().includes(searchLower) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Format filter
    if (filters.format) {
      filtered = filtered.filter(item => item.format === filters.format);
    }

    // Tier filter
    if (filters.tier) {
      filtered = filtered.filter(item => item.tier === filters.tier);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Interactive filter
    if (filters.interactive !== null) {
      filtered = filtered.filter(item => item.isInteractive === filters.interactive);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'downloads':
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, filters, sortBy]);

  const getFormatIcon = (format: VaultItem['format']) => {
    const icons = {
      'PDF': FileText,
      'EXCEL': Table,
      'POWERPOINT': Presentation,
      'ZIP': Archive,
      'BINARY': Archive
    };
    
    const Icon = icons[format] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const handleDownload = async (item: VaultItem) => {
    // In production, you would check authentication here
    if (item.requiresAuth) {
      // Redirect to login or show modal
      router.push(`/auth/login?returnTo=/vault&download=${item.slug}`);
      return;
    }

    // Track download (you would implement this in production)
    console.log('Downloading:', item.slug);
    
    // Direct download
    if (item.fileHref) {
      window.open(item.fileHref, '_blank');
    }
  };

  const handlePreview = (item: VaultItem) => {
    setActivePreview(item.slug);
    // In production, you would show a modal with PDF preview
    console.log('Preview:', item.slug);
  };

  return (
    <Layout title="Vault">
      <Head>
        <title>Strategic Artifacts Vault | Abraham of London</title>
        <meta name="description" content="Heirloom-grade tools for institutional design. Fillable frameworks, decision matrices, and governance templates." />
        <meta name="keywords" content="PDF, frameworks, tools, legacy, strategy, leadership, templates" />
      </Head>
      
      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-amber-950/30">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_70%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-24">
            <div className="text-center">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-serif text-5xl md:text-6xl text-cream font-medium mb-6"
              >
                Strategic Artifacts
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-6 max-w-3xl mx-auto text-xl text-gray-300"
              >
                Heirloom-grade tools for institutional design. Fillable frameworks, 
                decision matrices, and governance templates designed for lasting impact.
              </motion.p>
              
              {/* Stats */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{stats.total}</div>
                  <div className="text-sm text-gray-400">Total Artifacts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{stats.interactiveCount}</div>
                  <div className="text-sm text-gray-400">Interactive Tools</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{Object.keys(stats.byFormat).length}</div>
                  <div className="text-sm text-gray-400">Formats</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-500">{Object.keys(stats.byTier).length}</div>
                  <div className="text-sm text-gray-400">Access Tiers</div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Filters & Controls */}
        <section className="relative -mt-10 z-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search artifacts by title, description, or tags..."
                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/30"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select
                    className="bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="date">Most Recent</option>
                    <option value="title">Alphabetical</option>
                    <option value="downloads">Most Popular</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, interactive: prev.interactive === true ? null : true }))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.interactive === true ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800/50 text-gray-400 border border-white/10 hover:border-amber-500/30'}`}
                >
                  <Edit3 className="inline-block w-4 h-4 mr-2" />
                  Interactive Only
                </button>
                
                {Object.entries(stats.byTier).map(([tier, count]) => (
                  <button
                    key={tier}
                    onClick={() => setFilters(prev => ({ ...prev, tier: prev.tier === tier ? null : tier }))}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filters.tier === tier ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-zinc-800/50 text-gray-400 border border-white/10 hover:border-amber-500/30'}`}
                  >
                    {tier === 'architect' && <Award className="inline-block w-4 h-4 mr-2" />}
                    {tier === 'member' && <UserCheck className="inline-block w-4 h-4 mr-2" />}
                    {tier === 'free' && <Eye className="inline-block w-4 h-4 mr-2" />}
                    {tier === 'inner-circle' && <Lock className="inline-block w-4 h-4 mr-2" />}
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} ({count})
                  </button>
                ))}
              </div>

              {/* Active Filters */}
              {(filters.search || filters.format || filters.tier || filters.category || filters.interactive !== null) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-400">Active filters:</span>
                  {filters.search && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm flex items-center gap-1">
                      Search: "{filters.search}"
                      <button onClick={() => setFilters(prev => ({ ...prev, search: '' }))} className="ml-1 hover:text-white">×</button>
                    </span>
                  )}
                  {filters.tier && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm flex items-center gap-1">
                      Tier: {filters.tier}
                      <button onClick={() => setFilters(prev => ({ ...prev, tier: null }))} className="ml-1 hover:text-white">×</button>
                    </span>
                  )}
                  {filters.interactive !== null && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm flex items-center gap-1">
                      {filters.interactive ? 'Interactive Only' : 'Non-interactive Only'}
                      <button onClick={() => setFilters(prev => ({ ...prev, interactive: null }))} className="ml-1 hover:text-white">×</button>
                    </span>
                  )}
                  <button
                    onClick={() => setFilters({ search: '', format: null, tier: null, category: null, interactive: null })}
                    className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Artifacts Grid */}
        <section className="mx-auto max-w-7xl px-6 py-12">
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <AlertCircle className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">No artifacts found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  Try adjusting your filters or search terms. If you believe something should be here, please contact support.
                </p>
                <button
                  onClick={() => setFilters({ search: '', format: null, tier: null, category: null, interactive: null })}
                  className="mt-6 px-6 py-3 bg-amber-500 text-black font-semibold rounded-xl hover:bg-amber-400 transition-colors"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">
                    <span className="text-amber-500">{filteredItems.length}</span> artifacts found
                  </h2>
                  <div className="text-sm text-gray-400">
                    Showing {Math.min(filteredItems.length, 12)} of {filteredItems.length}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence>
                    {filteredItems.map((item, index) => (
                      <motion.div
                        key={item.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 to-black p-8 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10"
                      >
                        {/* Tier Badge */}
                        <div className="absolute top-4 right-4">
                          <TierBadge tier={item.tier} />
                        </div>

                        {/* Format & Interactive Badges */}
                        <div className="mb-6 flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {getFormatIcon(item.format)} {item.format}
                          </span>
                          {item.isInteractive && (
                            <span className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                              <Edit3 className="w-3 h-3" /> Fillable
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-serif text-2xl text-cream group-hover:text-amber-500 transition-colors mb-3">
                          {item.title}
                        </h2>
                        
                        {/* Excerpt */}
                        <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-3 mb-6">
                          {item.excerpt}
                        </p>

                        {/* Metadata */}
                        <div className="mt-auto space-y-4">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            {item.category && (
                              <span className="px-3 py-1 bg-white/5 rounded-full">
                                {item.category}
                              </span>
                            )}
                            {item.size && (
                              <span className="flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                {item.size}
                              </span>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              {item.downloadCount && (
                                <span className="flex items-center gap-1">
                                  <Download className="w-3 h-3" />
                                  {item.downloadCount.toLocaleString()}
                                </span>
                              )}
                              {item.rating && <StarRating rating={item.rating} />}
                              {item.date && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(item.date).getFullYear()}
                                </span>
                              )}
                            </div>
                            {item.requiresAuth && (
                              <span className="flex items-center gap-1 text-amber-500">
                                <Lock className="w-3 h-3" />
                                Auth Required
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 pt-6 border-t border-white/10">
                            <button
                              onClick={() => handlePreview(item)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800/50 text-gray-300 rounded-xl hover:bg-zinc-700/50 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              Preview
                            </button>
                            <button
                              onClick={() => handleDownload(item)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all text-sm font-bold"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Load More (if needed) */}
                {filteredItems.length > 12 && (
                  <div className="mt-12 text-center">
                    <button className="px-8 py-4 border border-white/10 rounded-xl text-white hover:border-amber-500/30 hover:bg-amber-500/10 transition-all font-medium">
                      Load More Artifacts
                    </button>
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </section>

        {/* Call to Action */}
        <section className="mx-auto max-w-4xl px-6 py-20">
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl p-12 text-center">
            <Award className="w-16 h-16 text-amber-500 mx-auto mb-6" />
            <h2 className="text-3xl font-semibold text-white mb-4">
              Unlock Premium Access
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Upgrade to Architect tier for exclusive access to interactive frameworks, 
              premium templates, and institutional-grade tools for legacy design.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                View Pricing Tiers
              </Link>
              <Link
                href="/contact"
                className="px-8 py-4 border border-amber-500/30 text-amber-500 font-bold rounded-xl hover:bg-amber-500/10 transition-all"
              >
                Contact for Enterprise
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}