// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Calendar, Clock, ArrowRight, BookOpen, FileText, Download, Users, Star } from "lucide-react";

import Layout from "@/components/Layout";
import {
  LIBRARY_AESTHETICS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";

type FilterKey =
  | "all"
  | "page"
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "featured";

type LibraryProps = {
  items: UnifiedContent[];
};

/* -------------------------------------------------------------------------- */
/* ENHANCED UI PRIMITIVES                                                     */
/* -------------------------------------------------------------------------- */

const StatBadge: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10">
    <div className="text-lg text-amber-400">{icon}</div>
    <div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  </div>
);

const EnhancedFilterPill: React.FC<{
  label: string;
  value: FilterKey;
  active: boolean;
  count: number;
  icon?: React.ReactNode;
  onClick: () => void;
}> = ({ label, value, active, count, icon, onClick }) => {
  const isDisabled = value !== "all" && count === 0;

  return (
    <button
      type="button"
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      className={`
        group relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300
        ${active 
          ? 'bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25' 
          : 'bg-white/5 hover:bg-white/10 border border-white/10'}
        ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}
      `}
    >
      <div className="flex items-center gap-2">
        {icon && <div className={`${active ? 'text-white' : 'text-amber-400'}`}>{icon}</div>}
        <span className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-200'}`}>
          {label}
        </span>
      </div>
      <div className={`
        rounded-full px-2 py-1 text-xs font-bold min-w-[28px] text-center
        ${active ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-400'}
      `}>
        {count}
      </div>
      
      {active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-amber-400 to-amber-200 rounded-full" />
      )}
    </button>
  );
};

const ContentTypeBadge: React.FC<{ 
  type: UnifiedContent["type"]; 
  variant?: "card" | "pill" 
}> = ({ type, variant = "card" }) => {
  const config = {
    page: { label: "Page", color: CONTENT_CATEGORIES.CANON.color, icon: "📜", bg: "from-blue-500/10 to-blue-600/10" },
    post: { label: "Essay", color: CONTENT_CATEGORIES.POSTS.color, icon: "✒", bg: "from-emerald-500/10 to-emerald-600/10" },
    book: { label: "Book", color: CONTENT_CATEGORIES.BOOKS.color, icon: "📚", bg: "from-amber-500/10 to-amber-600/10" },
    download: { label: "Tool", color: CONTENT_CATEGORIES.RESOURCES.color, icon: "⬇", bg: "from-violet-500/10 to-violet-600/10" },
    event: { label: "Event", color: CONTENT_CATEGORIES.EVENTS.color, icon: "🕯", bg: "from-rose-500/10 to-rose-600/10" },
    print: { label: "Print", color: CONTENT_CATEGORIES.PRINTS.color, icon: "🖼", bg: "from-cyan-500/10 to-cyan-600/10" },
    resource: { label: "Resource", color: CONTENT_CATEGORIES.RESOURCES.color, icon: "⚙", bg: "from-indigo-500/10 to-indigo-600/10" },
  }[type];

  if (variant === "pill") {
    return (
      <div className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm">
        <span className="text-sm">{config.icon}</span>
        <span className="text-xs font-medium text-white">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10">
      <div className={`rounded-lg bg-gradient-to-br ${config.bg} p-2 backdrop-blur-sm`}>
        <span className="text-lg" style={{ color: config.color }}>{config.icon}</span>
      </div>
    </div>
  );
};

const EnhancedLibraryCard: React.FC<{ item: UnifiedContent; featured?: boolean }> = ({ item, featured = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Link 
      href={item.url || "#"} 
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className={`
        relative h-full overflow-hidden rounded-2xl border transition-all duration-500
        ${featured 
          ? 'border-amber-400/30 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10' 
          : 'border-white/10 bg-gradient-to-br from-white/5 via-gray-900/50 to-black/50'
        }
        group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-black/50
        ${isHovered ? '-translate-y-2' : ''}
      `}>
        {/* Featured badge */}
        {featured && (
          <div className="absolute right-4 top-4 z-10">
            <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1">
              <Star className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold text-white">Featured</span>
            </div>
          </div>
        )}

        {/* Type badge */}
        <ContentTypeBadge type={item.type} />

        {/* Card background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/50" />
        
        {/* Header section */}
        <div className="relative p-5 pb-0">
          <h3 className={`
            mb-3 font-serif text-xl font-bold leading-tight transition-all duration-300
            ${featured ? 'text-white' : 'text-gray-100'}
            ${isHovered ? 'text-amber-100' : ''}
          `}>
            {item.title || "Untitled"}
          </h3>
          
          {(item.description || item.excerpt) && (
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-300">
              {item.description || item.excerpt}
            </p>
          )}
        </div>

        {/* Footer section */}
        <div className="relative mt-4 border-t border-white/10 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {item.date && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
              )}
              
              {(item.tags || []).slice(0, 2).map((tag) => (
                <span 
                  key={tag}
                  className="rounded-full bg-white/5 px-2 py-1 text-[0.65rem] font-medium text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            <div className={`
              flex items-center gap-1 text-sm font-medium transition-all duration-300
              ${featured ? 'text-amber-300' : 'text-gray-400'}
              group-hover:text-amber-400
            `}>
              <span>View</span>
              <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className={`
          absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/10
          opacity-0 transition-opacity duration-500 group-hover:opacity-100
        `} />
      </article>
    </Link>
  );
};

const FeaturedSpotlight: React.FC<{ items: UnifiedContent[] }> = ({ items }) => {
  const featuredItems = items.filter(item => item.featured).slice(0, 3);
  
  if (featuredItems.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-2">
            <Star className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-white">Featured Highlights</h2>
            <p className="text-sm text-gray-400">Curated selections worth starting with</p>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {featuredItems.map((item, index) => (
          <div 
            key={item.id} 
            className="transform transition-all duration-500 hover:-translate-y-2"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <EnhancedLibraryCard item={item} featured />
          </div>
        ))}
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentLibraryPage: NextPage<LibraryProps> = ({ items }) => {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"newest" | "title">("newest");
  const [showFilters, setShowFilters] = React.useState(false);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const counts = {
      all: items.length,
      page: 0,
      post: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
      featured: items.filter(item => item.featured).length,
    };

    for (const item of items) {
      if (item.type in counts) {
        counts[item.type as keyof typeof counts]++;
      }
    }

    return {
      total: items.length,
      categories: Object.keys(counts).filter(k => k !== 'all').length,
      featured: counts.featured,
      newest: items.filter(item => {
        const date = new Date(item.date || 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date > thirtyDaysAgo;
      }).length,
    };
  }, [items]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    let result = items;

    // Apply type filter
    if (filter !== "all") {
      if (filter === "featured") {
        result = result.filter(item => item.featured);
      } else {
        result = result.filter(item => item.type === filter);
      }
    }

    // Apply search filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.excerpt || "").toLowerCase().includes(q) ||
          (item.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    } else {
      result = [...result].sort((a, b) => 
        (a.title || "").localeCompare(b.title || "")
      );
    }

    return result;
  }, [items, filter, query, sortBy]);

  // Filter options with icons
  const filterOptions: Array<{ key: FilterKey; label: string; icon: React.ReactNode }> = [
    { key: "all", label: "All Content", icon: <Filter className="h-4 w-4" /> },
    { key: "featured", label: "Featured", icon: <Star className="h-4 w-4" /> },
    { key: "post", label: "Essays", icon: <FileText className="h-4 w-4" /> },
    { key: "book", label: "Books", icon: <BookOpen className="h-4 w-4" /> },
    { key: "download", label: "Tools", icon: <Download className="h-4 w-4" /> },
    { key: "event", label: "Events", icon: <Users className="h-4 w-4" /> },
    { key: "page", label: "Pages", icon: <FileText className="h-4 w-4" /> },
    { key: "print", label: "Prints", icon: "🖼" },
    { key: "resource", label: "Resources", icon: <Download className="h-4 w-4" /> },
  ];

  return (
    <Layout
      title="Content Library"
      description="A comprehensive library of essays, books, tools, and resources for builders of legacy."
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Abraham of London — Content Library",
      }}
    >
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-transparent via-black/50 to-transparent" />
      </div>

      <div className="relative min-h-screen">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="mb-12 max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Complete Archive
                </span>
              </div>
              
              <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                The Content Library
                <span className="mt-4 block bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-3xl font-normal text-transparent sm:text-4xl">
                  Every resource, essay, and tool in one place
                </span>
              </h1>
              
              <p className="mb-10 text-lg leading-relaxed text-gray-300">
                A meticulously organized collection of writings, tools, and resources designed to help 
                fathers, founders, and builders think clearly, act decisively, and build work that endures.
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap gap-4">
                <StatBadge icon="📚" value={stats.total} label="Total Items" />
                <StatBadge icon="⭐" value={stats.featured} label="Featured" />
                <StatBadge icon="🆕" value={stats.newest} label="Last 30 Days" />
                <StatBadge icon="📁" value={stats.categories} label="Categories" />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <FeaturedSpotlight items={items} />

        {/* Main Content Area */}
        <section className="relative pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Controls Bar */}
            <div className="sticky top-4 z-30 mb-8 rounded-2xl border border-white/10 bg-black/80 p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search essays, tools, books, resources..."
                      className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-3 text-white placeholder:text-gray-400 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters and Sort */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
                    >
                      <Filter className="h-4 w-4" />
                      Filters
                      <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                        {filter !== 'all' ? '1' : '0'}
                      </span>
                    </button>

                    {showFilters && (
                      <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-white/10 bg-black/90 p-4 backdrop-blur-xl shadow-2xl">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Sort By</div>
                        <div className="space-y-2">
                          {[
                            { value: "newest", label: "Newest First" },
                            { value: "title", label: "Alphabetical" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setSortBy(option.value as any)}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                                sortBy === option.value
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'text-gray-300 hover:bg-white/5'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="mt-6">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Browse by Category</div>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => {
                    const count = option.key === 'featured' 
                      ? stats.featured 
                      : items.filter(item => item.type === option.key).length;
                    
                    return (
                      <EnhancedFilterPill
                        key={option.key}
                        label={option.label}
                        value={option.key}
                        active={filter === option.key}
                        count={count}
                        icon={option.icon}
                        onClick={() => setFilter(option.key)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Results Summary */}
              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                <div className="text-sm text-gray-400">
                  Showing <span className="font-semibold text-white">{filteredItems.length}</span> of{" "}
                  <span className="font-semibold text-white">{items.length}</span> items
                  {filter !== "all" && (
                    <span className="ml-2">
                      • Filtered by: <span className="font-semibold text-amber-300">{filterOptions.find(o => o.key === filter)?.label}</span>
                    </span>
                  )}
                  {query && (
                    <span className="ml-2">
                      • Searching for: <span className="font-semibold text-amber-300">"{query}"</span>
                    </span>
                  )}
                </div>
                
                <Link
                  href="/context"
                  className="flex items-center gap-2 text-sm font-medium text-gray-400 transition-colors hover:text-amber-300"
                >
                  How the library is organized
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Content Grid */}
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/50 p-16 text-center backdrop-blur-sm">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mb-4 font-serif text-2xl font-bold text-white">No results found</h3>
                <p className="mx-auto mb-8 max-w-md text-gray-400">
                  {query
                    ? `We couldn't find anything matching "${query}". Try a different search term or browse all categories.`
                    : "There's no content in this category yet. Check back soon or browse other categories."}
                </p>
                {(query || filter !== "all") && (
                  <button
                    onClick={() => {
                      setFilter("all");
                      setQuery("");
                    }}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-medium text-white transition-all hover:shadow-lg hover:shadow-amber-500/25"
                  >
                    Reset filters & show all
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <EnhancedLibraryCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Load More / Stats Footer */}
            {filteredItems.length > 0 && (
              <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                  <div>
                    <h3 className="mb-2 font-serif text-xl font-bold text-white">Need something specific?</h3>
                    <p className="text-gray-400">
                      If you're looking for content on a specific topic or need customized resources, let's discuss.
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25"
                  >
                    Request custom resources
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA LOADING                                                               */
/* -------------------------------------------------------------------------- */

const sanitizeForSerialization = <T,>(data: T): T => {
  if (data === undefined || data === null) {
    return null as T;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForSerialization) as T;
  }

  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForSerialization(value);
    }
    return sanitized as T;
  }

  return data;
};

export const getStaticProps: GetStaticProps<LibraryProps> = async () => {
  try {
    const items = await getAllUnifiedContent();

    const safeItems = Array.isArray(items) ? items : [];
    const sanitizedItems = sanitizeForSerialization(safeItems);

    const validatedItems = (sanitizedItems as UnifiedContent[]).map((item) => ({
      ...item,
      id: item.id || `unknown-${Date.now()}-${Math.random()}`,
      title: item.title || "Untitled",
      url: item.url || "/",
      description: item.description || null,
      excerpt: item.excerpt || null,
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
      featured: item.featured || false,
    }));

    return {
      props: {
        items: validatedItems,
      },
      revalidate: 60 * 10,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /content:", error);
    return {
      props: {
        items: [],
      },
      revalidate: 60 * 10,
    };
  }
};

export default ContentLibraryPage;