// pages/canon/index.tsx - MODERNIZED RESPONSIVE VERSION
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Lock, Star, Search, Filter, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import CanonCard from "@/components/CanonCard";
import { getPublicCanon, type Canon } from "@/lib/canon";

// Device detection hook
const useDeviceType = () => {
  const [deviceType, setDeviceType] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType('mobile');
      else if (width < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CanonIndexItem = {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  volumeNumber?: number | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
};

type PageProps = {
  items: CanonIndexItem[];
  maxVolume: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const CanonIndexPage: NextPage<PageProps> = ({ items, maxVolume }) => {
  const deviceType = useDeviceType();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>(deviceType === 'mobile' ? 'list' : 'grid');

  React.useEffect(() => {
    // Auto-adjust view mode based on device
    if (deviceType === 'mobile') {
      setViewMode('list');
    } else {
      setViewMode('grid');
    }
  }, [deviceType]);

  // Filter items based on search and featured filter
  const filteredItems = React.useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Featured filter
      const matchesFeatured = !showFeaturedOnly || item.featured;

      return matchesSearch && matchesFeatured;
    });
  }, [items, searchQuery, showFeaturedOnly]);

  const hasItems = filteredItems.length > 0;
  const totalSegments = 5;
  const activeSegments = Math.max(0, Math.min(totalSegments, maxVolume || filteredItems.length || 0));
  const segments = Array.from({ length: totalSegments }, (_, i) => i + 1);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  return (
    <Layout 
      title="The Canon"
      description="A curated canon of strategic, theological, and civilisational volumes — catalogued for serious builders and fathers who think in generations, not news cycles."
    >
      <Head>
        <title>The Canon | Abraham of London</title>
        <meta
          name="description"
          content="A curated canon of strategic, theological, and civilisational volumes — catalogued for serious builders and fathers who think in generations, not news cycles."
        />
        <link
          rel="canonical"
          href={`${siteUrl}/canon`}
        />
        <meta property="og:title" content="The Canon | Abraham of London" />
        <meta
          property="og:description"
          content="Harrods-library atmosphere. Ancient Near Eastern gravitas. Modern strategic intelligence. A living canon for men who build."
        />
        <meta
          property="og:url"
          content={`${siteUrl}/canon`}
        />
        <meta property="og:type" content="website" />
        <meta 
          property="og:image" 
          content={`${siteUrl}/api/og/canon?title=The%20Canon`} 
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="The Canon | Abraham of London" />
        <meta name="twitter:description" content="A living library for men who build, father, and lead with purpose." />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-gray-950">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-800">
          {/* Background effects */}
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 -top-32 h-64 bg-[radial-gradient(circle_at_top,rgba(226,197,120,0.15),transparent_65%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80" />
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Canon · Catalogue
                </span>
              </div>

              {/* Title */}
              <div className="space-y-4">
                <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  The Canon
                  <span className="block mt-2 text-amber-400 font-semibold">
                    of Purpose, Power & Stewardship
                  </span>
                </h1>
                
                {/* Progress indicator - only on desktop */}
                {deviceType !== 'mobile' && (
                  <div className="flex items-center gap-4 pt-4">
                    <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                        style={{ width: `${(activeSegments / totalSegments) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm text-gray-400">
                      <span className="text-amber-400 font-semibold">Volume {activeSegments}</span> of {totalSegments}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <p className="text-lg leading-relaxed text-gray-300">
                    This is not a blog roll. It is a living library — volumes
                    that sit at the intersection of{" "}
                    <span className="font-medium text-amber-400">
                      theology, strategy, civilisation, and human destiny
                    </span>
                    . Each entry is catalogued, not casually posted.
                  </p>

                  <p className="text-sm leading-relaxed text-gray-400">
                    Think of it as <strong className="text-white">Harrods Library</strong> meets{" "}
                    <strong className="text-white">Ancient Near Eastern gravitas</strong>, wrapped in{" "}
                    <strong className="text-white">modern strategic intelligence</strong>. It&apos;s built for
                    men who lead, fathers who refuse to disappear, and builders who
                    understand that ideas outlive news cycles.
                  </p>
                </div>

                {/* Stats card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-gray-800 bg-gradient-to-br from-gray-900/80 to-black/80 p-6 backdrop-blur-sm"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                        Catalogued Volumes
                      </p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {items.length.toString().padStart(2, "0")}
                      </p>
                    </div>
                    
                    {/* Volume segments - simplified for mobile */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        {segments.map((seg) => {
                          const active = seg <= activeSegments;
                          return (
                            <div
                              key={seg}
                              className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                                active
                                  ? "bg-gradient-to-r from-amber-500 to-amber-600"
                                  : "bg-gray-800"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-400">
                        <span className="text-amber-400">Foundational pillars</span> in progress
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Controls Section - Sticky on desktop, normal on mobile */}
        <section className={`sticky top-0 z-10 border-b border-gray-800 bg-black/95 backdrop-blur-sm py-4 ${deviceType === 'mobile' ? 'relative' : ''}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search volumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  aria-label="Search Canon volumes"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Featured filter */}
                <button
                  onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    showFeaturedOnly
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 border border-gray-700'
                  }`}
                  aria-label={showFeaturedOnly ? "Show all volumes" : "Show featured only"}
                >
                  <Star className="h-4 w-4" />
                  <span>Featured</span>
                </button>

                {/* View toggle - hidden on mobile (defaults to list) */}
                {deviceType !== 'mobile' && (
                  <div className="flex rounded-lg border border-gray-700 bg-gray-900/50 p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`rounded-md p-2 transition-colors ${
                        viewMode === 'grid' 
                          ? 'bg-amber-500 text-white' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      aria-label="Grid view"
                    >
                      <div className="h-4 w-4 grid grid-cols-2 gap-0.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="bg-current rounded-sm" />
                        ))}
                      </div>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`rounded-md p-2 transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-amber-500 text-white' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                      aria-label="List view"
                    >
                      <div className="h-4 w-4 flex flex-col justify-between">
                        <div className="h-0.5 w-full bg-current rounded" />
                        <div className="h-0.5 w-full bg-current rounded" />
                        <div className="h-0.5 w-full bg-current rounded" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {!hasItems ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/30 p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  No volumes found
                </h3>
                <p className="text-gray-400">
                  {searchQuery || showFeaturedOnly
                    ? 'Try adjusting your search or filter criteria'
                    : 'The catalogue is being prepared. Check back soon or join the Inner Circle for early access.'
                  }
                </p>
                {(searchQuery || showFeaturedOnly) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowFeaturedOnly(false);
                    }}
                    className="mt-4 text-sm font-medium text-amber-400 hover:text-amber-300"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                {/* Results header */}
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-white sm:text-3xl">
                      Catalogued Volumes
                    </h2>
                    <p className="mt-1 text-sm text-gray-400">
                      Showing <span className="font-semibold text-white">{filteredItems.length}</span> of{' '}
                      <span className="font-semibold text-white">{items.length}</span> volumes
                    </p>
                  </div>
                  {filteredItems.length < items.length && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setShowFeaturedOnly(false);
                      }}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Canon Cards */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    viewMode === 'grid' 
                      ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
                      : 'space-y-4'
                  }`}
                >
                  {filteredItems.map((item) => (
                    <motion.div
                      key={item.slug}
                      variants={itemVariants}
                      className={viewMode === 'list' ? 'max-w-3xl' : ''}
                    >
                      <CanonCard
                        canon={item}
                        variant={viewMode}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {/* CTA Section */}
            {hasItems && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-16 rounded-2xl bg-gradient-to-r from-gray-900 to-black border border-gray-800 p-8"
              >
                <div className="grid gap-6 md:grid-cols-2 md:items-center">
                  <div>
                    <h3 className="mb-3 font-serif text-2xl font-semibold text-white">
                      Want deeper access?
                    </h3>
                    <p className="text-gray-300">
                      Some volumes are reserved for the Inner Circle — early drafts, 
                      advanced frameworks, and direct dialogue with Abraham.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/inner-circle"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      Join Inner Circle
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/books/the-architecture-of-human-purpose"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-500/10"
                    >
                      Read Public Prelude
                      <BookOpen className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      {/* Mobile optimizations */}
      <style jsx global>{`
        /* Mobile optimizations */
        @media (max-width: 768px) {
          /* Prevent zoom on iOS inputs */
          input, 
          select,
          textarea {
            font-size: 16px !important;
          }
          
          /* Better touch targets */
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimize sticky header */
          .sticky {
            position: -webkit-sticky;
            position: sticky;
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Focus styles */
        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }
        
        /* Improve text rendering */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </Layout>
  );
};

export default CanonIndexPage;

// ---------------------------------------------------------------------------
// Static Generation
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    const docs: Canon[] = getPublicCanon();

    const items: CanonIndexItem[] = docs.map((doc) => {
      const vol = toNumberOrNull(doc.volumeNumber);
      const safeTitle = doc.title ?? "Untitled Canon Volume";
      const safeSlug = doc.slug ?? "";

      return {
        slug: safeSlug,
        title: safeTitle,
        subtitle: doc.subtitle ?? null,
        excerpt: doc.excerpt ?? null,
        description: doc.description ?? null,
        coverImage: doc.coverImage ?? null,
        volumeNumber: vol,
        date: doc.date ?? null,
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        featured: Boolean(doc.featured),
        accessLevel: doc.accessLevel ?? null,
        lockMessage: doc.lockMessage ?? null,
      };
    });

    // Sort items: featured first, then by volume number, then by date
    items.sort((a, b) => {
      // Featured items first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then by volume number (lower first)
      const volA = a.volumeNumber ?? Infinity;
      const volB = b.volumeNumber ?? Infinity;
      if (volA !== volB) return volA - volB;
      
      // Then by date (newer first)
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    const volumeNumbers = items
      .map((item) => item.volumeNumber)
      .filter((v): v is number => typeof v === "number");

    const maxVolume: number =
      volumeNumbers.length > 0 ? Math.max(...volumeNumbers) : 0;

    return {
      props: {
        items,
        maxVolume,
      },
      revalidate: 3600,
    };
  } catch (err) {
    console.error("Error in getStaticProps for /canon:", err);
    return {
      props: {
        items: [],
        maxVolume: 0,
      },
      revalidate: 600,
    };
  }
};