// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";
import { Search, Filter, Calendar, Clock, ArrowRight, BookOpen, FileText, Download, Users, Star, Zap, Globe, Layers, BookMarked } from "lucide-react";

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

// Safe fallback for CONTENT_CATEGORIES
const getContentCategory = (category: string) => {
  if (!CONTENT_CATEGORIES || typeof CONTENT_CATEGORIES !== 'object') {
    return {
      color: "#6B7280",
      label: category || "Content",
      bg: "from-gray-500/10 to-gray-600/10"
    };
  }
  
  const categoryMap: Record<string, any> = {
    'CANON': CONTENT_CATEGORIES.CANON,
    'POSTS': CONTENT_CATEGORIES.POSTS,
    'BOOKS': CONTENT_CATEGORIES.BOOKS,
    'RESOURCES': CONTENT_CATEGORIES.RESOURCES,
    'EVENTS': CONTENT_CATEGORIES.EVENTS,
    'PRINTS': CONTENT_CATEGORIES.PRINTS
  };
  
  const cat = categoryMap[category] || CONTENT_CATEGORIES.RESOURCES;
  return {
    color: cat?.color || "#6B7280",
    label: cat?.label || category,
    bg: cat?.bg || "from-gray-500/10 to-gray-600/10"
  };
};

const StatBadge: React.FC<{ icon: React.ReactNode; value: number; label: string }> = ({ icon, value, label }) => (
  <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/10 p-4 backdrop-blur-sm transition-all duration-500 hover:from-white/10 hover:to-white/20">
    <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    <div className="relative flex items-center gap-3">
      <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-2.5">
        <div className="text-lg text-amber-400">{icon}</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs font-medium text-gray-400">{label}</div>
      </div>
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
        group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-500
        ${active 
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-2xl shadow-amber-500/30' 
          : 'bg-gradient-to-br from-white/5 to-white/10 hover:from-white/10 hover:to-white/20 border border-white/10 hover:border-white/20'}
        ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02] hover:shadow-xl'}
        transform-gpu
      `}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
      
      <div className="relative flex items-center gap-2.5">
        {icon && (
          <div className={`transition-transform duration-300 ${active ? 'text-white scale-110' : 'text-amber-400/80'}`}>
            {icon}
          </div>
        )}
        <span className={`text-sm font-semibold transition-all duration-300 ${active ? 'text-white' : 'text-gray-200'}`}>
          {label}
        </span>
      </div>
      <div className={`
        relative rounded-full px-2.5 py-1 text-xs font-bold min-w-[32px] text-center transition-all duration-300
        ${active ? 'bg-white/30 text-white' : 'bg-black/40 text-gray-400'}
        ${!isDisabled ? 'group-hover:bg-white/20' : ''}
      `}>
        {count}
      </div>
      
      {active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};

const ContentTypeBadge: React.FC<{ 
  type: UnifiedContent["type"]; 
  variant?: "card" | "pill" 
}> = ({ type, variant = "card" }) => {
  const configMap: Record<string, { label: string; color: string; icon: string; bg: string }> = {
    page: { 
      label: "Page", 
      color: getContentCategory('CANON').color, 
      icon: "📜", 
      bg: "from-blue-500/20 to-blue-600/20" 
    },
    post: { 
      label: "Essay", 
      color: getContentCategory('POSTS').color, 
      icon: "✒", 
      bg: "from-emerald-500/20 to-emerald-600/20" 
    },
    book: { 
      label: "Book", 
      color: getContentCategory('BOOKS').color, 
      icon: "📚", 
      bg: "from-amber-500/20 to-amber-600/20" 
    },
    download: { 
      label: "Tool", 
      color: getContentCategory('RESOURCES').color, 
      icon: "⬇", 
      bg: "from-violet-500/20 to-violet-600/20" 
    },
    event: { 
      label: "Event", 
      color: getContentCategory('EVENTS').color, 
      icon: "🕯", 
      bg: "from-rose-500/20 to-rose-600/20" 
    },
    print: { 
      label: "Print", 
      color: getContentCategory('PRINTS').color, 
      icon: "🖼", 
      bg: "from-cyan-500/20 to-cyan-600/20" 
    },
    resource: { 
      label: "Resource", 
      color: getContentCategory('RESOURCES').color, 
      icon: "⚙", 
      bg: "from-indigo-500/20 to-indigo-600/20" 
    },
  };

  const config = configMap[type] || { 
    label: type, 
    color: "#6B7280", 
    icon: "❓", 
    bg: "from-gray-500/20 to-gray-600/20" 
  };

  if (variant === "pill") {
    return (
      <div className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-white/10 to-white/20 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:from-white/20 hover:to-white/30">
        <span className="text-sm transition-transform group-hover:scale-110">{config.icon}</span>
        <span className="text-xs font-semibold text-white">{config.label}</span>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10">
      <div className={`rounded-xl bg-gradient-to-br ${config.bg} p-2.5 backdrop-blur-lg shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-xl`}>
        <span className="text-xl" style={{ color: config.color }}>{config.icon}</span>
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
        relative h-full overflow-hidden rounded-3xl border transition-all duration-700
        ${featured 
          ? 'border-amber-400/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent' 
          : 'border-white/15 bg-gradient-to-br from-white/10 via-gray-900/30 to-black/50'
        }
        group-hover:border-white/40 group-hover:shadow-2xl group-hover:shadow-black/70
        transform-gpu ${isHovered ? '-translate-y-3 scale-[1.02]' : ''}
      `}>
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60" />
        <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`} />
        
        {/* Featured badge with animation */}
        {featured && (
          <div className="absolute right-4 top-4 z-10">
            <div className="flex items-center gap-1.5 animate-pulse rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 shadow-lg">
              <Star className="h-3.5 w-3.5 text-white" fill="currentColor" />
              <span className="text-xs font-bold text-white">Featured</span>
            </div>
          </div>
        )}

        {/* Type badge */}
        <ContentTypeBadge type={item.type} />

        {/* Content */}
        <div className="relative p-6">
          <h3 className={`
            mb-4 font-serif text-2xl font-bold leading-tight transition-all duration-500
            ${featured ? 'text-white' : 'text-gray-100'}
            ${isHovered ? 'text-amber-50' : ''}
            bg-gradient-to-r from-white via-white to-amber-100 bg-clip-text
          `}>
            {item.title || "Untitled"}
          </h3>
          
          {(item.description || item.excerpt) && (
            <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300">
              {item.description || item.excerpt}
            </p>
          )}
        </div>

        {/* Footer with enhanced styling */}
        <div className="relative mt-4 border-t border-white/15 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {item.date && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(item.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric' 
                  })}
                </div>
              )}
              
              <div className="flex gap-1.5">
                {(item.tags || []).slice(0, 2).map((tag) => (
                  <span 
                    key={tag}
                    className="rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-semibold text-gray-300 backdrop-blur-sm transition-colors duration-300 hover:bg-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={`
              flex items-center gap-1.5 text-sm font-semibold transition-all duration-500
              ${featured ? 'text-amber-300' : 'text-gray-400'}
              group-hover:text-amber-400
            `}>
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">Explore</span>
              <ArrowRight className={`h-4 w-4 transition-all duration-500 ${isHovered ? 'translate-x-1.5 scale-110' : ''}`} />
            </div>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className={`
          absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/20
          opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100
        `} />
      </article>
    </Link>
  );
};

const FeaturedSpotlight: React.FC<{ items: UnifiedContent[] }> = ({ items }) => {
  const featuredItems = items.filter(item => item.featured).slice(0, 3);
  
  if (featuredItems.length === 0) return null;

  return (
    <section className="mb-20">
      <div className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 p-1">
        <div className="rounded-2xl bg-gradient-to-br from-black/80 via-black/90 to-black">
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-3">
                  <Star className="h-6 w-6 text-amber-400" fill="currentColor" />
                </div>
                <div>
                  <h2 className="font-serif text-3xl font-bold text-white">Featured Highlights</h2>
                  <p className="text-sm text-amber-200/80">Curated selections worth starting with</p>
                </div>
              </div>
              <div className="hidden h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent lg:block" />
              <div className="rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 px-4 py-2">
                <span className="text-sm font-semibold text-amber-300">{featuredItems.length} featured items</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className="transform transition-all duration-700 hover:-translate-y-3"
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    animation: `fadeInUp 0.6s ease-out ${index * 150}ms both`
                  }}
                >
                  <EnhancedLibraryCard item={item} featured />
                </div>
              ))}
            </div>
          </div>
        </div>
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
  const [sortBy, setSortBy] = React.useState<"newest" | "title" | "popular">("newest");
  const [showFilters, setShowFilters] = React.useState(false);

  // Calculate statistics with safe defaults
  const stats = React.useMemo(() => {
    const total = Array.isArray(items) ? items.length : 0;
    
    const counts = {
      all: total,
      page: 0,
      post: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
      featured: 0,
    };

    if (Array.isArray(items)) {
      items.forEach(item => {
        if (item.featured) counts.featured++;
        if (item.type in counts) {
          counts[item.type as keyof typeof counts]++;
        }
      });
    }

    return {
      total,
      categories: Object.keys(counts).filter(k => k !== 'all').length,
      featured: counts.featured,
      newest: Array.isArray(items) ? items.filter(item => {
        const date = new Date(item.date || 0);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date > thirtyDaysAgo;
      }).length : 0,
    };
  }, [items]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];

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
          (Array.isArray(item.tags) ? item.tags.some((t) => t?.toLowerCase().includes(q)) : false)
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "title") {
      result = [...result].sort((a, b) => 
        (a.title || "").localeCompare(b.title || "")
      );
    } else if (sortBy === "popular") {
      // Add popularity sorting logic here if you have view counts or similar
      result = [...result].sort((a, b) => 
        (b.title || "").localeCompare(a.title || "")
      );
    }

    return result;
  }, [items, filter, query, sortBy]);

  // Filter options with icons
  const filterOptions: Array<{ key: FilterKey; label: string; icon: React.ReactNode }> = [
    { key: "all", label: "All Content", icon: <Layers className="h-4 w-4" /> },
    { key: "featured", label: "Featured", icon: <Star className="h-4 w-4" /> },
    { key: "post", label: "Essays", icon: <FileText className="h-4 w-4" /> },
    { key: "book", label: "Books", icon: <BookOpen className="h-4 w-4" /> },
    { key: "download", label: "Tools", icon: <Download className="h-4 w-4" /> },
    { key: "event", label: "Events", icon: <Users className="h-4 w-4" /> },
    { key: "page", label: "Pages", icon: <Globe className="h-4 w-4" /> },
    { key: "print", label: "Prints", icon: "🖼" },
    { key: "resource", label: "Resources", icon: <Zap className="h-4 w-4" /> },
  ];

  return (
    <Layout
      title="Content Library"
      description="A comprehensive library of essays, books, tools, and resources for builders of legacy."
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Abraham of London — Content Library",
        description: "Curated collection of writings, tools, and resources for builders of legacy",
        numberOfItems: stats.total,
      }}
    >
      {/* Enhanced Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
        <div className="absolute top-1/4 -right-48 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent blur-3xl" />
        <div className="absolute -bottom-1/4 -left-48 h-[500px] w-[500px] animate-pulse delay-1000 rounded-full bg-gradient-to-r from-blue-500/20 via-blue-500/10 to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse delay-500 rounded-full bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/80 to-black" />
        
        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_70%)]" />
      </div>

      <div className="relative min-h-screen">
        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mb-12 max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-2 animate-fadeIn rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-amber-600/10 px-5 py-2.5 backdrop-blur-lg">
                <Star className="h-3.5 w-3.5 text-amber-300" />
                <span className="text-xs font-semibold uppercase tracking-widest text-amber-300">
                  Complete Archive • {stats.total} Items
                </span>
              </div>
              
              <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
                  The Content Library
                </span>
                <span className="mt-4 block bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-3xl font-normal text-transparent sm:text-4xl">
                  Every resource, essay, and tool in one place
                </span>
              </h1>
              
              <p className="mb-10 text-xl leading-relaxed text-gray-300">
                A meticulously organized collection of writings, tools, and resources designed to help 
                fathers, founders, and builders think clearly, act decisively, and build work that endures.
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatBadge icon="📚" value={stats.total} label="Total Items" />
                <StatBadge icon="⭐" value={stats.featured} label="Featured" />
                <StatBadge icon="🆕" value={stats.newest} label="Last 30 Days" />
                <StatBadge icon="📁" value={stats.categories} label="Categories" />
              </div>
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <FeaturedSpotlight items={Array.isArray(items) ? items : []} />

        {/* Main Content Area */}
        <section className="relative pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Enhanced Controls Bar */}
            <div className="sticky top-4 z-30 mb-10 animate-slideDown rounded-3xl border border-white/20 bg-gradient-to-br from-black/90 via-black/95 to-black p-8 backdrop-blur-xl shadow-2xl">
              <div className="mb-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
                  <Search className="absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search essays, tools, books, resources..."
                    className="relative w-full rounded-2xl border border-white/20 bg-white/10 pl-14 pr-12 py-4 text-lg text-white placeholder:text-gray-400/70 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filters and Sort */}
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="group flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 px-6 py-3.5 text-base font-medium text-white transition-all hover:from-white/15 hover:to-white/10"
                    >
                      <Filter className="h-5 w-5 transition-transform group-hover:rotate-90" />
                      Filters & Sort
                      <span className="rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 px-3 py-1 text-sm font-semibold text-amber-300">
                        {filter !== 'all' ? 'Active' : 'All'}
                      </span>
                    </button>

                    {showFilters && (
                      <div className="absolute left-0 top-full z-40 mt-3 w-72 rounded-2xl border border-white/20 bg-gradient-to-b from-black/95 to-black/90 p-4 backdrop-blur-xl shadow-2xl">
                        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Sort By</div>
                        <div className="space-y-2">
                          {[
                            { value: "newest", label: "Newest First" },
                            { value: "title", label: "Alphabetical" },
                            { value: "popular", label: "Most Popular" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortBy(option.value as any);
                                setShowFilters(false);
                              }}
                              className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all ${
                                sortBy === option.value
                                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/30 text-amber-300'
                                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
                      setSortBy("newest");
                    }}
                    className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/5 to-transparent px-6 py-3.5 text-base font-medium text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>

                {/* Results Summary */}
                <div className="text-sm text-gray-400">
                  <span className="font-semibold text-white">{filteredItems.length}</span> of{" "}
                  <span className="font-semibold text-white">{stats.total}</span> items
                  {filter !== "all" && (
                    <span className="ml-3">
                      • Filtered by: <span className="font-semibold text-amber-300">{filterOptions.find(o => o.key === filter)?.label}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Filter Pills */}
              <div>
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Browse by Category</div>
                <div className="flex flex-wrap gap-3">
                  {filterOptions.map((option) => {
                    const count = option.key === 'featured' 
                      ? stats.featured 
                      : Array.isArray(items) 
                        ? items.filter(item => item.type === option.key).length 
                        : 0;
                    
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
            </div>

            {/* Content Grid */}
            {filteredItems.length === 0 ? (
              <div className="rounded-3xl border border-white/20 bg-gradient-to-br from-black/50 via-black/70 to-black/50 p-20 text-center backdrop-blur-sm">
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                  <Search className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="mb-4 font-serif text-3xl font-bold text-white">No results found</h3>
                <p className="mx-auto mb-10 max-w-md text-lg text-gray-400">
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
                    className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                  >
                    Reset filters & show all
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <EnhancedLibraryCard key={item.id} item={item} />
                ))}
              </div>
            )}

            {/* Footer CTA */}
            {filteredItems.length > 0 && (
              <div className="mt-20">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-1">
                  <div className="rounded-2xl bg-gradient-to-br from-black/90 via-black/95 to-black p-12">
                    <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                      <div className="max-w-2xl">
                        <h3 className="mb-4 font-serif text-3xl font-bold text-white">
                          Looking for something specific?
                        </h3>
                        <p className="text-lg text-gray-400">
                          If you're looking for content on a particular topic or need customized resources 
                          for your team or project, let's discuss how we can help.
                        </p>
                      </div>
                      <Link
                        href="/contact"
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                        <span className="relative flex items-center gap-3">
                          Request custom resources
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add CSS animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
      `}</style>
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
      type: item.type || "resource",
      date: item.date || new Date().toISOString(),
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