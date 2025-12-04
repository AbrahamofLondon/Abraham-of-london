// pages/content/index.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  Download,
  Users,
  Star,
  Layers,
  Grid,
  Filter,
  ChevronDown,
  Bookmark,
  Eye,
  TrendingUp,
} from "lucide-react";

import Layout from "@/components/Layout";
import { getAllContent } from "@/lib/mdx";
import type { RawContentEntry } from "@/lib/mdx";

/* -------------------------------------------------------------------------- */
/* TYPE DEFINITIONS                                                           */
/* -------------------------------------------------------------------------- */

type ContentKind = "blog" | "book" | "download" | "event" | "print" | "resource" | "canon";
type FilterKey = ContentKind | "all" | "featured";
type ViewMode = "grid" | "compact";

interface ContentResource {
  kind: ContentKind;
  title: string;
  slug: string;
  href: string;
  date?: string;
  description?: string;
  subtitle?: string;
  excerpt?: string;
  category?: string;
  tags: string[];
  featured?: boolean;
  readTime?: string;
  coverImage?: string;
  author?: string;
}

interface ContentPageProps {
  items: ContentResource[];
  contentStats: {
    total: number;
    blog: number;
    book: number;
    download: number;
    event: number;
    print: number;
    resource: number;
    canon: number;
    featured: number;
  };
}

/* -------------------------------------------------------------------------- */
/* LUXURY COMPONENTS                                                          */
/* -------------------------------------------------------------------------- */

const GlassSurface: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = "", hover = true }) => (
  <div className={`
    relative overflow-hidden
    bg-gradient-to-b from-charcoal/80 to-charcoal
    border border-softGold/10
    backdrop-blur-sm
    ${hover ? "transition-all duration-500 hover:border-softGold/30 hover:shadow-2xl hover:shadow-softGold/10" : ""}
    ${className}
  `}>
    <div className="absolute inset-0 bg-[url('/assets/images/texture-paper.png')] opacity-5" />
    <div className="relative z-10">{children}</div>
  </div>
);

const ContentTypeBadge: React.FC<{ kind: ContentKind }> = ({ kind }) => {
  const labels = {
    blog: "Essay",
    book: "Volume",
    download: "Tool",
    event: "Session",
    print: "Print",
    resource: "Framework",
    canon: "Canon",
  };

  const colors = {
    blog: "text-emerald-200 border-emerald-400/20 bg-emerald-500/5",
    book: "text-violet-200 border-violet-400/20 bg-violet-500/5",
    download: "text-amber-200 border-amber-400/20 bg-amber-500/5",
    event: "text-rose-200 border-rose-400/20 bg-rose-500/5",
    print: "text-cyan-200 border-cyan-400/20 bg-cyan-500/5",
    resource: "text-indigo-200 border-indigo-400/20 bg-indigo-500/5",
    canon: "text-softGold border-softGold/20 bg-softGold/5",
  };

  return (
    <span className={`rounded-full border px-2 py-1 text-xs font-medium tracking-wide ${colors[kind]}`}>
      {labels[kind]}
    </span>
  );
};

const ContentCard: React.FC<{
  item: ContentResource;
  variant?: "grid" | "compact";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (variant === "compact") {
    return (
      <Link href={item.href}>
        <GlassSurface className="p-4" hover>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ContentTypeBadge kind={item.kind} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-serif text-sm font-light text-ivory group-hover:text-softGold transition-colors duration-300">
                {item.title}
              </h4>
              {item.date && (
                <time className="text-xs text-ivory/40">
                  {new Date(item.date).toLocaleDateString('en-GB', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </time>
              )}
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-softGold/40 transition-transform group-hover:translate-x-1" />
          </div>
        </GlassSurface>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassSurface className="overflow-hidden" hover>
        {/* Cover Image */}
        {item.coverImage && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-charcoal/20 via-transparent to-charcoal/60" />
            <img
              src={item.coverImage}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <ContentTypeBadge kind={item.kind} />
              <div className="flex items-center gap-2 text-xs text-ivory/40">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </time>
                )}
                {item.readTime && (
                  <>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </>
                )}
              </div>
            </div>

            <h3 className="font-serif text-lg font-light text-ivory mb-2 group-hover:text-softGold transition-colors duration-300 line-clamp-2">
              {item.title}
            </h3>

            {item.subtitle && (
              <p className="text-sm text-ivory/60 mb-3 line-clamp-2">
                {item.subtitle}
              </p>
            )}

            {item.description && (
              <p className="text-sm text-ivory/40 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-ivory/30 hover:text-ivory/50 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-softGold/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-ivory/30">
                  Read {item.kind === 'blog' ? 'essay' : item.kind}
                </span>
              </div>
              <ArrowRight className={`h-4 w-4 text-softGold/40 transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : ''
              }`} />
            </div>
          </div>
        </div>
      </GlassSurface>
    </Link>
  );
};

const StatItem: React.FC<{
  value: number;
  label: string;
  icon: React.ReactNode;
}> = ({ value, label, icon }) => (
  <div className="text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-softGold/10 bg-gradient-to-b from-softGold/5 to-transparent mb-3">
      <div className="text-softGold/80">{icon}</div>
    </div>
    <div className="text-3xl font-serif font-light text-ivory mb-1">{value}</div>
    <div className="text-xs text-ivory/40 uppercase tracking-wider">{label}</div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({ items, contentStats }) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter items
  const filteredItems = React.useMemo(() => {
    let result = items;

    // Apply type filter
    if (activeFilter !== "all") {
      if (activeFilter === "featured") {
        result = result.filter(item => item.featured);
      } else {
        result = result.filter(item => item.kind === activeFilter);
      }
    }

    // Apply search
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.subtitle?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [items, activeFilter, debouncedQuery]);

  // Sort items by date (newest first)
  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredItems]);

  // Group items by type
  const groupedItems = React.useMemo(() => {
    const groups: Record<ContentKind, ContentResource[]> = {
      blog: [],
      book: [],
      download: [],
      event: [],
      print: [],
      resource: [],
      canon: [],
    };

    sortedItems.forEach(item => {
      groups[item.kind].push(item);
    });

    return groups;
  }, [sortedItems]);

  const filterOptions = [
    { key: "all" as FilterKey, label: "All Content", count: contentStats.total },
    { key: "featured" as FilterKey, label: "Featured", count: contentStats.featured },
    { key: "blog" as FilterKey, label: "Essays", count: contentStats.blog },
    { key: "book" as FilterKey, label: "Volumes", count: contentStats.book },
    { key: "download" as FilterKey, label: "Tools", count: contentStats.download },
    { key: "event" as FilterKey, label: "Sessions", count: contentStats.event },
    { key: "print" as FilterKey, label: "Prints", count: contentStats.print },
    { key: "resource" as FilterKey, label: "Frameworks", count: contentStats.resource },
    { key: "canon" as FilterKey, label: "Canon", count: contentStats.canon },
  ];

  return (
    <Layout pageTitle="Complete Library | Abraham of London">
      <Head>
        <meta name="description" content="The complete collection of essays, volumes, frameworks, and tools for builders of enduring work." />
        <meta property="og:title" content="Complete Library | Abraham of London" />
        <meta property="og:description" content="Every essay, volume, framework, and tool in one curated collection." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.abrahamoflondon.org/content" />
        <meta property="og:image" content="/assets/images/og-library.jpg" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal via-softBlack to-charcoal">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal/95 to-charcoal" />
          <div className="absolute inset-0 bg-[url('/assets/images/texture-paper.png')] opacity-10 mix-blend-overlay" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-8">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-softGold/30" />
                <span className="text-xs uppercase tracking-[0.25em] text-softGold">
                  The Complete Collection
                </span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-softGold/30" />
              </div>
              
              <h1 className="font-serif text-4xl md:text-5xl font-light text-ivory mb-6">
                The Library
              </h1>
              
              <p className="text-lg text-ivory/70 leading-relaxed mb-12 max-w-2xl mx-auto">
                Every essay, volume, framework, and tool. Curated for depth, 
                structured for application, preserved for those who build.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <StatItem
                  value={contentStats.total}
                  label="Total Works"
                  icon={<Layers className="w-6 h-6" />}
                />
                <StatItem
                  value={contentStats.featured}
                  label="Featured"
                  icon={<Star className="w-6 h-6" />}
                />
                <StatItem
                  value={contentStats.blog}
                  label="Essays"
                  icon={<FileText className="w-6 h-6" />}
                />
                <StatItem
                  value={contentStats.download}
                  label="Tools"
                  icon={<Download className="w-6 h-6" />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="py-8 border-y border-softGold/10 bg-gradient-to-b from-black/40 to-transparent">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Search */}
              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-ivory/40" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search the library..."
                    className="w-full pl-12 pr-4 py-3 bg-black/20 border border-softGold/10 rounded-lg text-ivory placeholder-ivory/40 focus:outline-none focus:border-softGold/30 focus:ring-1 focus:ring-softGold/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-3 border border-softGold/10 rounded-lg text-ivory/70 hover:text-ivory hover:border-softGold/30 transition-all duration-300"
                >
                  <Filter className="h-5 w-5" />
                  <span>Filter</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <div className="flex items-center gap-1 rounded-lg border border-softGold/10 p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? 'bg-softGold/10 text-softGold' : 'text-ivory/40 hover:text-ivory'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`p-2 rounded ${viewMode === "compact" ? 'bg-softGold/10 text-softGold' : 'text-ivory/40 hover:text-ivory'}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="h-0.5 w-3 bg-current" />
                      <div className="h-0.5 w-3 bg-current" />
                      <div className="h-0.5 w-3 bg-current" />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-softGold/10">
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setActiveFilter(option.key)}
                      className={`px-4 py-2 rounded-full border text-sm transition-all duration-300 ${
                        activeFilter === option.key
                          ? 'border-softGold bg-softGold/10 text-softGold'
                          : 'border-softGold/10 text-ivory/60 hover:text-ivory hover:border-softGold/30'
                      }`}
                    >
                      {option.label} ({option.count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            {activeFilter === "all" ? (
              // Show by category
              <div className="space-y-20">
                {Object.entries(groupedItems).map(([kind, items]) => {
                  if (items.length === 0) return null;
                  
                  return (
                    <div key={kind} className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h2 className="font-serif text-2xl font-light text-ivory">
                          {kind === 'blog' ? 'Essays' :
                           kind === 'book' ? 'Volumes' :
                           kind === 'download' ? 'Tools' :
                           kind === 'event' ? 'Sessions' :
                           kind === 'print' ? 'Prints' :
                           kind === 'resource' ? 'Frameworks' : 'Canon'}
                        </h2>
                        <span className="text-sm text-ivory/40">
                          {items.length} {items.length === 1 ? 'work' : 'works'}
                        </span>
                      </div>
                      
                      <div className={`grid gap-6 ${
                        viewMode === 'grid' 
                          ? 'md:grid-cols-2 lg:grid-cols-3'
                          : 'md:grid-cols-1'
                      }`}>
                        {items.slice(0, viewMode === 'compact' ? 5 : undefined).map((item) => (
                          <ContentCard
                            key={`${item.kind}-${item.slug}`}
                            item={item}
                            variant={viewMode}
                          />
                        ))}
                      </div>
                      
                      {items.length > 5 && viewMode === 'compact' && (
                        <div className="text-center pt-6">
                          <button className="text-sm text-softGold hover:text-softGold/80 transition-colors">
                            View all {items.length} {kind === 'blog' ? 'essays' : kind + 's'} →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Show filtered view
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="font-serif text-2xl font-light text-ivory mb-2">
                      {filterOptions.find(f => f.key === activeFilter)?.label}
                    </h2>
                    <p className="text-ivory/60">
                      {sortedItems.length} {sortedItems.length === 1 ? 'work' : 'works'} found
                    </p>
                  </div>
                </div>
                
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'md:grid-cols-2 lg:grid-cols-3'
                    : 'md:grid-cols-1'
                }`}>
                  {sortedItems.map((item) => (
                    <ContentCard
                      key={`${item.kind}-${item.slug}`}
                      item={item}
                      variant={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {sortedItems.length === 0 && (
              <div className="py-32 text-center">
                <div className="mb-6">
                  <Search className="h-12 w-12 mx-auto text-ivory/20" />
                </div>
                <h3 className="font-serif text-xl text-ivory mb-3">No works found</h3>
                <p className="text-ivory/60 max-w-md mx-auto">
                  {searchQuery
                    ? `Nothing matched "${searchQuery}". Try a different term or clear the search.`
                    : "There are no works in this category yet."}
                </p>
                {(searchQuery || activeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveFilter('all');
                    }}
                    className="mt-6 text-softGold hover:text-softGold/80 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 border-t border-softGold/10">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-softGold/10 bg-gradient-to-b from-softGold/5 to-transparent mb-8">
                <Bookmark className="h-8 w-8 text-softGold" />
              </div>
              <h3 className="font-serif text-2xl font-light text-ivory mb-6">
                Preserve the Signal
              </h3>
              <p className="text-ivory/60 mb-10 max-w-2xl mx-auto leading-relaxed">
                This library represents years of thinking, testing, and refinement. 
                Each work is designed not for consumption, but for application in 
                contexts that matter.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/about"
                  className="px-8 py-3 border border-softGold/20 text-softGold hover:border-softGold/40 hover:bg-softGold/5 transition-all duration-300"
                >
                  About the Collection
                </a>
                <a
                  href="/contact"
                  className="px-8 py-3 bg-softGold/10 border border-softGold/20 text-softGold hover:bg-softGold/20 transition-all duration-300"
                >
                  Request Access
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA PROCESSING                                                            */
/* -------------------------------------------------------------------------- */

const processContent = (): ContentResource[] => {
  const contentTypes: ContentKind[] = ['blog', 'book', 'download', 'event', 'print', 'resource', 'canon'];
  const allItems: ContentResource[] = [];

  contentTypes.forEach(kind => {
    try {
      const items = getAllContent(kind) as RawContentEntry[];
      
      items.forEach((item: RawContentEntry) => {
        const href = kind === 'blog' ? `/${item.slug}` : `/${kind}s/${item.slug}`;
        
        allItems.push({
          kind,
          title: item.title || 'Untitled',
          slug: item.slug || '',
          href,
          date: item.date,
          description: item.description,
          subtitle: item.subtitle,
          excerpt: item.excerpt,
          category: item.category,
          tags: Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : [],
          featured: item.featured || false,
          readTime: item.readTime || item.readtime,
          coverImage: item.coverImage,
          author: item.author,
        });
      });
    } catch (error) {
      console.error(`Error processing ${kind}:`, error);
    }
  });

  return allItems;
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const allItems = processContent();
  
  // Calculate stats
  const contentStats = {
    total: allItems.length,
    blog: allItems.filter(i => i.kind === 'blog').length,
    book: allItems.filter(i => i.kind === 'book').length,
    download: allItems.filter(i => i.kind === 'download').length,
    event: allItems.filter(i => i.kind === 'event').length,
    print: allItems.filter(i => i.kind === 'print').length,
    resource: allItems.filter(i => i.kind === 'resource').length,
    canon: allItems.filter(i => i.kind === 'canon').length,
    featured: allItems.filter(i => i.featured).length,
  };

  return {
    props: {
      items: JSON.parse(JSON.stringify(allItems)),
      contentStats,
    },
    revalidate: 3600,
  };
};

export default ContentPage;