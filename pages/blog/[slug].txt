import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Tag, Filter, Search, X, Grid, List, ChevronDown } from "lucide-react";

import Layout from "@/components/Layout";
import { getAllPosts } from "@/lib/content";
import type { Post } from "contentlayer/generated";

interface BlogPageProps {
  posts: Post[];
}

/* -------------------------------------------------------------------------- */
/* CLEANER, COMPACT COMPONENTS                                                */
/* -------------------------------------------------------------------------- */

const CompactGlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string; 
}> = ({ children, className = "" }) => (
  <div className={`
    relative overflow-hidden rounded-xl
    bg-gradient-to-b from-charcoal/80 to-charcoal
    border border-softGold/5
    backdrop-blur-sm
    transition-all duration-300 hover:border-softGold/20 hover:shadow-lg hover:shadow-black/20
    ${className}
  `}>
    {children}
  </div>
);

const FilterBadge: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}> = ({ label, active, onClick, count }) => (
  <button
    type="button"
    onClick={onClick}
    className={`
      group relative flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-200
      ${active 
        ? 'bg-gradient-to-r from-softGold/20 to-darkGold/20 text-ivory border border-softGold/30' 
        : 'bg-charcoal/60 text-ivory/60 border border-softGold/5 hover:border-softGold/20 hover:text-ivory'
      }
      text-sm
    `}
  >
    <span className="font-medium">
      {label}
    </span>
    {count !== undefined && (
      <span className={`
        rounded-full px-1.5 py-0.5 text-xs min-w-6 text-center
        ${active ? 'bg-softGold/20 text-ivory' : 'bg-charcoal text-ivory/40 group-hover:text-ivory/60'}
      `}>
        {count}
      </span>
    )}
  </button>
);

/* -------------------------------------------------------------------------- */
/* INTELLIGENT POST CARD WITH BETTER IMAGE HANDLING                           */
/* -------------------------------------------------------------------------- */

const PostCard: React.FC<{ 
  post: Post; 
  variant?: 'compact' | 'featured' 
}> = ({ post, variant = 'compact' }) => {
  const { slug, title, excerpt, description, date, readTime, tags = [], coverImage } = post;
  const displayExcerpt = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 2) : [];

  if (variant === 'featured') {
    return (
      <Link href={`/${slug}`} className="group block">
        <CompactGlassCard className="overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Intelligent Image Container - Maintains aspect ratio */}
            <div className="relative aspect-[16/9] md:aspect-[4/3] md:w-2/5 overflow-hidden">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-charcoal to-softBlack">
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/10">
                      <span className="text-2xl text-softGold/50">✍️</span>
                    </div>
                    <p className="text-xs text-ivory/30">No image</p>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Content - More compact */}
            <div className="flex-1 p-6">
              <div className="mb-3 flex items-center gap-3">
                {date && (
                  <time className="flex items-center gap-1.5 text-xs text-ivory/50">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(date).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                )}
                {readTime && (
                  <span className="flex items-center gap-1.5 text-xs text-ivory/50">
                    <Clock className="h-3.5 w-3.5" />
                    {readTime}
                  </span>
                )}
              </div>

              <h3 className="mb-3 font-serif text-xl font-light leading-tight text-ivory group-hover:text-softGold transition-colors">
                {title}
              </h3>

              {displayExcerpt && (
                <p className="mb-4 line-clamp-2 text-sm text-ivory/60">
                  {displayExcerpt}
                </p>
              )}

              {displayTags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {displayTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full border border-softGold/5 bg-softGold/5 px-2 py-0.5 text-xs text-ivory/50"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-softGold">
                  Read essay
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </div>
          </div>
        </CompactGlassCard>
      </Link>
    );
  }

  // Compact variant (default)
  return (
    <Link href={`/${slug}`} className="group block h-full">
      <CompactGlassCard className="h-full">
        <div className="flex h-full flex-col">
          {/* Intelligent Image Container - Fixed aspect, covers any image */}
          <div className="relative aspect-[16/9] overflow-hidden">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-charcoal to-softBlack">
                <div className="text-center">
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10">
                    <span className="text-lg text-softGold/50">✍️</span>
                  </div>
                  <p className="text-[10px] text-ivory/30">No image</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>

          {/* Compact Content */}
          <div className="flex-1 p-4">
            <div className="mb-2 flex items-center justify-between">
              {date && (
                <time className="text-xs text-ivory/50">
                  {new Date(date).toLocaleDateString("en-GB", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              )}
              {readTime && (
                <span className="flex items-center gap-1 text-xs text-ivory/50">
                  <Clock className="h-3 w-3" />
                  {readTime}
                </span>
              )}
            </div>

            <h3 className="mb-2 line-clamp-2 font-serif text-sm font-light leading-tight text-ivory group-hover:text-softGold transition-colors">
              {title}
            </h3>

            {displayExcerpt && (
              <p className="mb-3 line-clamp-2 text-xs text-ivory/50">
                {displayExcerpt}
              </p>
            )}

            <div className="mt-auto border-t border-softGold/5 pt-3">
              <div className="flex items-center justify-between">
                {displayTags.length > 0 && (
                  <div className="flex items-center gap-1">
                    {displayTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] text-ivory/40 truncate max-w-16"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className="text-xs text-softGold/60 group-hover:text-softGold transition-colors">
                  Read →
                </span>
              </div>
            </div>
          </div>
        </div>
      </CompactGlassCard>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE - SIMPLIFIED, MORE COMPACT                                       */
/* -------------------------------------------------------------------------- */

const BlogPage: NextPage<BlogPageProps> = ({ posts }) => {
  const safePosts = Array.isArray(posts) ? posts : [];
  const [activeTag, setActiveTag] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [showAllTags, setShowAllTags] = React.useState(false);

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

  // Filter posts
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

    // Sort by newest first
    return [...result].sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [safePosts, activeTag, debouncedQuery]);

  const hasPosts = safePosts.length > 0;
  const featuredPost = hasPosts ? safePosts[0] : null;
  const regularPosts = hasPosts ? safePosts.slice(1) : [];

  const resetFilters = () => {
    setActiveTag("all");
    setSearchQuery("");
  };

  const displayedTags = showAllTags ? allTags : allTags.slice(0, 8);

  return (
    <Layout 
      title="Essays" 
      description="Thoughtful writing on purpose, leadership, fatherhood, and legacy."
    >
      <Head>
        <title>Essays | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-charcoal via-softBlack to-charcoal">
        {/* Hero Section - Simplified */}
        <section className="border-b border-softGold/5 py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 text-center">
                <h1 className="mb-3 font-serif text-2xl font-light text-ivory md:text-3xl">
                  Essays & Reflections
                </h1>
                <p className="mx-auto max-w-2xl text-sm text-ivory/60 md:text-base">
                  Long-form thinking on purpose, leadership, fatherhood, and the architecture of legacy.
                </p>
              </div>

              {/* Compact Search */}
              <div className="mx-auto mb-6 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search essays..."
                    className="w-full rounded-lg border border-softGold/5 bg-charcoal/80 pl-10 pr-10 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:border-softGold/20 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-4 w-4 text-ivory/40 hover:text-ivory" />
                    </button>
                  )}
                </div>
              </div>

              {/* Compact Filter Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ivory/40">View:</span>
                  <div className="flex gap-1 rounded-lg border border-softGold/5 bg-charcoal/60 p-1">
                    {(['grid', 'list'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`rounded px-2 py-1 text-xs ${
                          viewMode === mode
                            ? 'bg-softGold/10 text-softGold'
                            : 'text-ivory/60 hover:text-ivory'
                        }`}
                      >
                        {mode === "grid" ? <Grid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-ivory/50">
                  <span className="font-medium text-ivory">{filteredPosts.length}</span> of{" "}
                  <span className="font-medium text-ivory">{safePosts.length}</span> essays
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tag Filters - More Compact */}
        <section className="border-b border-softGold/5 py-4">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ivory/40">Filter by theme</h3>
                {(activeTag !== "all" || searchQuery) && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-softGold hover:text-softGold/80"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <FilterBadge
                  label="All"
                  active={activeTag === "all"}
                  onClick={() => setActiveTag("all")}
                  count={safePosts.length}
                />
                
                {displayedTags.map((tag) => (
                  <FilterBadge
                    key={tag.name}
                    label={tag.name}
                    active={activeTag === tag.name}
                    onClick={() => setActiveTag(tag.name)}
                    count={tag.count}
                  />
                ))}

                {allTags.length > 8 && !showAllTags && (
                  <button
                    onClick={() => setShowAllTags(true)}
                    className="flex items-center gap-1 rounded-full border border-softGold/5 bg-charcoal/60 px-3 py-1.5 text-sm text-ivory/60 hover:text-ivory"
                  >
                    +{allTags.length - 8} more
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Active filter indicator */}
              {(activeTag !== "all" || searchQuery) && (
                <div className="mt-3 border-t border-softGold/5 pt-3">
                  <p className="text-xs text-ivory/50">
                    {activeTag !== "all" && `Showing: ${activeTag} `}
                    {searchQuery && `• Searching: "${searchQuery}"`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-6xl">
              {!hasPosts ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/10">
                    <span className="text-xl text-softGold/50">✍️</span>
                  </div>
                  <h3 className="mb-2 font-serif text-lg text-ivory">
                    Essays are being prepared
                  </h3>
                  <p className="text-sm text-ivory/50">
                    New writing is in progress. Check back soon.
                  </p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-softGold/10">
                    <Search className="h-5 w-5 text-softGold/50" />
                  </div>
                  <h3 className="mb-2 font-serif text-lg text-ivory">
                    No essays found
                  </h3>
                  <p className="mb-4 text-sm text-ivory/50">
                    {searchQuery
                      ? `No results for "${searchQuery}". Try a different term.`
                      : "No essays in this category."}
                  </p>
                  {(searchQuery || activeTag !== "all") && (
                    <button
                      onClick={resetFilters}
                      className="rounded-lg border border-softGold/20 bg-softGold/10 px-4 py-2 text-sm text-softGold hover:bg-softGold/20"
                    >
                      Show all essays
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Featured post - only if it matches filters */}
                  {featuredPost && activeTag === "all" && !searchQuery && (
                    <div className="mb-8">
                      <h2 className="mb-4 font-serif text-lg font-light text-ivory">
                        Featured
                      </h2>
                      <PostCard post={featuredPost} variant="featured" />
                    </div>
                  )}

                  {/* Posts grid/list */}
                  <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
                    {(activeTag === "all" && !searchQuery ? regularPosts : filteredPosts)
                      .map((post) => (
                        <PostCard 
                          key={post._id} 
                          post={post} 
                          variant={viewMode === 'list' ? 'featured' : 'compact'}
                        />
                      ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
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