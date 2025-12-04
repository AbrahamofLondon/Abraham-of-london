// pages/blog/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Clock,
  Calendar,
  Tag,
  Filter,
  Sparkles,
  TrendingUp,
  BookOpen,
  Eye,
  MessageCircle,
  Layers,
  Grid,
  List,
  Search,
  ChevronDown,
  Zap,
  Star,
  Bookmark,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import { getAllPosts } from "@/lib/content";
import type { Post } from "contentlayer/generated";

interface BlogPageProps {
  posts: Post[];
}

/* -------------------------------------------------------------------------- */
/* PREMIUM UI COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

const GlassPanel: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
  hover?: boolean;
  glow?: boolean;
}> = ({ children, className = "", hover = true, glow = false }) => (
  <div className={`
    relative overflow-hidden rounded-2xl 
    bg-white/[0.08] backdrop-blur-xl
    border border-white/10
    shadow-2xl shadow-black/40
    ${hover ? "transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60 hover:border-white/20" : ""}
    ${glow ? "after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-amber-500/5 after:via-transparent after:to-amber-500/5" : ""}
    ${className}
  `}>
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}> = ({ label, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group relative flex items-center gap-2 rounded-2xl px-4 py-2.5 transition-all duration-500
      ${active 
        ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-2xl shadow-amber-500/40 text-white' 
        : 'bg-white/[0.08] text-gray-300 hover:bg-white/[0.12] hover:text-white'
      }
      border ${active ? 'border-amber-500/50' : 'border-white/10 hover:border-white/20'}
      transform-gpu hover:scale-[1.05] active:scale-95
    `}
  >
    <span className="text-sm font-medium">
      {label}
    </span>
    {count !== undefined && (
      <span className={`
        rounded-full px-2 py-0.5 text-xs font-bold
        ${active ? 'bg-white/30' : 'bg-black/40 text-gray-400 group-hover:text-gray-300'}
      `}>
        {count}
      </span>
    )}
  </button>
);

const StatBadge: React.FC<{ 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  trend?: number;
}> = ({ icon, value, label, trend }) => (
  <GlassPanel className="p-5">
    <div className="relative">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-2.5">
          <div className="text-xl text-amber-400">{icon}</div>
        </div>
        {trend && (
          <div className={`rounded-full px-2 py-1 text-xs font-bold ${
            trend > 0 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white">
        {value.toLocaleString()}
      </div>
      <div className="mt-1 text-sm font-medium text-gray-400">{label}</div>
    </div>
  </GlassPanel>
);

/* -------------------------------------------------------------------------- */
/* POST CARD COMPONENTS                                                       */
/* -------------------------------------------------------------------------- */

const HeroPostCard: React.FC<{ post: Post }> = ({ post }) => {
  const { slug, title, excerpt, description, date, readTime, tags, coverImage } = post;
  const href = `/${slug}`;
  const copy = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 4) : [];
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Link 
      href={href} 
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassPanel glow className="overflow-hidden">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Image Column */}
          <div className="relative aspect-[4/3] md:aspect-auto">
            {coverImage ? (
              <div className="relative h-full w-full">
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Featured
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-cyan-500/10">
                <BookOpen className="h-16 w-16 text-amber-400/30" />
              </div>
            )}
          </div>

          {/* Content Column */}
          <div className="flex flex-col p-6 md:p-8">
            <div className="mb-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/80">
                  Editor's Choice
                </span>
                {date && (
                  <time className="text-sm text-gray-400">
                    {new Date(date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
              </div>

              <h2 className="mb-4 font-serif text-2xl leading-tight text-white transition-colors duration-500 group-hover:text-amber-100 md:text-3xl">
                {title}
              </h2>

              {copy && (
                <p className="mb-6 line-clamp-3 text-gray-300">
                  {copy}
                </p>
              )}

              {displayTags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {displayTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-300 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm text-gray-400">
                  {readTime && (
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {readTime}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    2.4k views
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                  <span>Read Essay</span>
                  <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
};

const PostCard: React.FC<{ post: Post; variant?: 'grid' | 'list' }> = ({ post, variant = 'grid' }) => {
  const { slug, title, excerpt, description, date, readTime, tags, coverImage } = post;
  const href = `/${slug}`;
  const copy = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 2) : [];
  const [isHovered, setIsHovered] = React.useState(false);

  if (variant === 'list') {
    return (
      <Link 
        href={href} 
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <GlassPanel className="p-6">
          <div className="flex items-start gap-6">
            {/* Cover Image */}
            {coverImage && (
              <div className="relative hidden aspect-[4/3] w-48 overflow-hidden rounded-xl sm:block">
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex items-center gap-3">
                {date && (
                  <time className="text-sm text-gray-400">
                    {new Date(date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                )}
                {readTime && (
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-400">
                    <Clock className="h-3 w-3" />
                    {readTime}
                  </span>
                )}
              </div>

              <h3 className="mb-3 text-xl font-semibold text-white transition-colors group-hover:text-amber-300">
                {title}
              </h3>

              {copy && (
                <p className="mb-4 line-clamp-2 text-gray-300">
                  {copy}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {displayTags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {displayTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
                  <span>Read</span>
                  <ArrowRight className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link 
      href={href} 
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassPanel className="h-full">
        <div className="flex h-full flex-col">
          {/* Cover Image */}
          {coverImage && (
            <div className="relative aspect-[16/9] overflow-hidden">
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              {date && (
                <time className="text-sm text-gray-400">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              {readTime && (
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {readTime}
                </span>
              )}
            </div>

            <h3 className="mb-3 line-clamp-2 font-serif text-lg font-semibold leading-tight text-white transition-colors duration-500 group-hover:text-amber-100">
              {title}
            </h3>

            {copy && (
              <p className="mb-4 flex-1 line-clamp-3 text-sm text-gray-300">
                {copy}
              </p>
            )}

            <div className="mt-auto border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {displayTags.length > 0 && (
                    <div className="flex items-center gap-2">
                      {displayTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                  <span>Read</span>
                  <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* BACKGROUND & HERO                                                          */
/* -------------------------------------------------------------------------- */

const CosmicBackground: React.FC = () => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#050814] to-[#020617]" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const BlogPage: NextPage<BlogPageProps> = ({ posts }) => {
  const safePosts = Array.isArray(posts) ? posts : [];
  const [activeTag, setActiveTag] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = React.useState<'newest' | 'popular' | 'title'>('newest');
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get all unique tags with counts
  const allTags = React.useMemo(() => {
    const tagCounts: Record<string, number> = {};
    for (const post of safePosts) {
      if (Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          if (typeof tag === "string" && tag.trim()) {
            const trimmedTag = tag.trim();
            tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
          }
        }
      }
    }
    
    return Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [safePosts]);

  // Filter and sort posts
  const filteredPosts = React.useMemo(() => {
    let result = safePosts;

    // Apply tag filter
    if (activeTag !== "all") {
      result = result.filter((post) =>
        Array.isArray(post.tags) ? post.tags.includes(activeTag) : false
      );
    }

    // Apply search filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.excerpt?.toLowerCase().includes(q) ||
          post.description?.toLowerCase().includes(q) ||
          (Array.isArray(post.tags) && post.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "popular") {
      // Mock popularity - in production, use view counts
      result = [...result].sort((a, b) => {
        const aScore = (a.tags?.length || 0) * 10;
        const bScore = (b.tags?.length || 0) * 10;
        return bScore - aScore;
      });
    } else if (sortBy === "title") {
      result = [...result].sort((a, b) => 
        a.title.localeCompare(b.title)
      );
    }

    return result;
  }, [safePosts, activeTag, debouncedQuery, sortBy]);

  const hasPosts = safePosts.length > 0;
  const heroPost = hasPosts ? safePosts[0] : null;

  const resetFilters = () => {
    setActiveTag("all");
    setSearchQuery("");
    setSortBy("newest");
  };

  return (
    <Layout 
      title="The Writing Desk" 
      description="Long-form thinking for serious people — exploring purpose, governance, fatherhood, and the quiet architecture of a life that outlives headlines."
      transparentHeader={false}
    >
      <Head>
        <title>The Writing Desk | Abraham of London</title>
        <meta
          name="description"
          content="Essays, canon excerpts, and strategic reflections from Abraham of London — on purpose, leadership, fatherhood, and legacy."
        />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <CosmicBackground />
        </div>

        <main className="relative">
          {/* Hero Section */}
          <section className="relative px-4 py-20 md:py-24">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/85" />
            
            <div className="relative z-10 mx-auto max-w-7xl">
              <div className="text-center">
                <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-8 py-3 backdrop-blur-2xl">
                  <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
                  <span className="text-sm font-medium tracking-[0.2em] text-amber-300">
                    STRATEGIC ESSAYS
                  </span>
                  <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
                </div>

                <h1 className="mb-6 font-serif text-5xl font-light leading-tight text-white md:text-6xl lg:text-7xl">
                  The Writing Desk
                  <span className="block bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
                    Long-form thinking for serious people
                  </span>
                </h1>

                <p className="mx-auto mb-14 max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
                  Exploring purpose, governance, fatherhood, and the quiet architecture 
                  of a life that outlives headlines.
                </p>

                {/* Stats */}
                <div className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
                  <StatBadge icon="📚" value={safePosts.length} label="Total Essays" trend={15.5} />
                  <StatBadge icon="⭐" value={3} label="Featured" trend={8.3} />
                  <StatBadge icon="✍️" value={42} label="Total Pages" trend={12.2} />
                  <StatBadge icon="👁️" value={12500} label="Monthly Views" trend={25.7} />
                </div>
              </div>

              {/* Search Bar */}
              <div className="mx-auto max-w-3xl">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search across essays, themes, and insights..."
                    className="relative w-full rounded-2xl border border-white/20 bg-white/10 pl-14 pr-12 py-4 text-lg text-white placeholder:text-gray-400/70 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Control Bar */}
          <section className="px-4 pb-12">
            <div className="mx-auto max-w-7xl">
              <GlassPanel className="p-6 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  {/* View & Sort Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
                      {(['grid', 'list'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                            viewMode === mode
                              ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {mode === "grid" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                    >
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="title">A to Z</option>
                    </select>
                  </div>

                  {/* Results Count */}
                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-white">{filteredPosts.length}</span> of{" "}
                    <span className="font-semibold text-white">{safePosts.length}</span> essays
                  </div>
                </div>

                {/* Tag Filters */}
                <div className="mt-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-400">Filter by Theme</h3>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
                    >
                      <Filter className="h-4 w-4" />
                      {showAdvanced ? 'Hide' : 'Show'} Advanced
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <FilterChip
                      label="All Essays"
                      active={activeTag === "all"}
                      onClick={() => setActiveTag("all")}
                      count={safePosts.length}
                    />
                    
                    {allTags.slice(0, showAdvanced ? undefined : 8).map((tag) => (
                      <FilterChip
                        key={tag.name}
                        label={tag.name}
                        active={activeTag === tag.name}
                        onClick={() => setActiveTag(tag.name)}
                        count={tag.count}
                      />
                    ))}
                  </div>

                  {!showAdvanced && allTags.length > 8 && (
                    <button
                      onClick={() => setShowAdvanced(true)}
                      className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                    >
                      +{allTags.length - 8} more themes
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Active Filters Summary */}
                {(activeTag !== "all" || searchQuery) && (
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        {activeTag !== "all" && `Filtered by: ${activeTag} • `}
                        {searchQuery && `Searching for: "${searchQuery}"`}
                      </div>
                      <button
                        onClick={resetFilters}
                        className="text-sm font-medium text-gray-400 hover:text-amber-300"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </div>
                )}
              </GlassPanel>
            </div>
          </section>

          {/* Main Content */}
          {!hasPosts ? (
            <section className="px-4 py-12">
              <div className="mx-auto max-w-3xl">
                <GlassPanel className="p-16 text-center" hover={false}>
                  <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                    <BookOpen className="h-10 w-10 text-amber-400" />
                  </div>
                  <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                    Essays are being prepared
                  </h3>
                  <p className="mx-auto mb-10 max-w-md text-gray-400">
                    The first wave of essays and canon excerpts is in final edit. 
                    Check back soon, or join the Inner Circle to be notified when new writing goes live.
                  </p>
                </GlassPanel>
              </div>
            </section>
          ) : (
            <section className="px-4 pb-20">
              <div className="mx-auto max-w-7xl">
                {/* Featured Hero Post */}
                {heroPost && filteredPosts.length > 0 && (
                  <div className="mb-12">
                    <h2 className="mb-6 font-serif text-2xl font-bold text-white">
                      <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                        Featured Essay
                      </span>
                    </h2>
                    <HeroPostCard post={heroPost} />
                  </div>
                )}

                {/* Essays Grid */}
                {filteredPosts.length > 0 ? (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="font-serif text-2xl font-bold text-white">
                        {activeTag === "all" ? "All Essays" : `${activeTag} Essays`}
                      </h2>
                      <span className="text-sm text-gray-400">
                        {filteredPosts.length} essay{filteredPosts.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {viewMode === 'grid' ? (
                      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts
                          .filter((post) => !heroPost || post._id !== heroPost._id)
                          .map((post) => (
                            <PostCard key={post._id} post={post} variant="grid" />
                          ))}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {filteredPosts
                          .filter((post) => !heroPost || post._id !== heroPost._id)
                          .map((post) => (
                            <PostCard key={post._id} post={post} variant="list" />
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <GlassPanel className="p-16 text-center" hover={false}>
                    <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                      <Search className="h-10 w-10 text-amber-400" />
                    </div>
                    <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                      No essays found
                    </h3>
                    <p className="mx-auto mb-10 max-w-md text-gray-400">
                      {searchQuery
                        ? `Nothing matched "${searchQuery}". Try a different term or clear the search.`
                        : "There are no essays in this category yet."}
                    </p>
                    {(searchQuery || activeTag !== "all") && (
                      <button
                        onClick={resetFilters}
                        className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                      >
                        Show all essays
                      </button>
                    )}
                  </GlassPanel>
                )}

                {/* Load More */}
                {filteredPosts.length > 0 && filteredPosts.length < safePosts.length && (
                  <div className="mt-12 text-center">
                    <button className="group rounded-2xl border border-white/10 bg-white/[0.08] px-10 py-4 text-lg font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.12]">
                      <span className="flex items-center gap-3">
                        Load More Essays
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Newsletter CTA */}
          {hasPosts && (
            <section className="px-4 pb-20">
              <div className="mx-auto max-w-4xl">
                <GlassPanel glow className="overflow-hidden">
                  <div className="p-12 text-center">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                      <MessageCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="mb-4 font-serif text-3xl font-bold text-white">
                      Never miss an essay
                    </h3>
                    <p className="mx-auto mb-8 max-w-2xl text-gray-300">
                      Join readers who receive new essays directly in their inbox. 
                      No algorithms, no noise — just thoughtful writing delivered with care.
                    </p>
                    <Link
                      href="/newsletter"
                      className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                    >
                      <span className="relative flex items-center gap-3">
                        Subscribe to essays
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                      </span>
                    </Link>
                  </div>
                </GlassPanel>
              </div>
            </section>
          )}
        </main>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<BlogPageProps> = async () => {
  const posts = getAllPosts();
  return {
    props: { posts },
    revalidate: 60,
  };
};

export default BlogPage;