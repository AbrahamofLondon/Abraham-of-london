// pages/blog/index.tsx - BLOG INDEX PAGE
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { 
  getContentlayerData, 
  normalizeSlug, 
  getDocHref,
  isDraftContent,
  getPublishedDocuments
} from "@/lib/contentlayer-compat";
import { 
  Calendar,
  Clock,
  Search,
  Tag,
  ArrowRight,
  Filter,
  ChevronRight,
  BookOpen,
  TrendingUp,
  Sparkles
} from "lucide-react";

type CoverAspect = "wide" | "square" | "book";
type CoverFit = "cover" | "contain";
type CoverPosition = "center" | "top" | "bottom" | "left" | "right";

type Item = {
  slug: string;
  url: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  readTime?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;
  category?: string | null;
  author?: string | null;
};

type Props = { 
  items: Item[];
  featuredItems?: Item[];
  popularTags?: string[];
};

function aspectClass(aspect?: CoverAspect | null) {
  switch (aspect) {
    case "book":
      return "aspect-[3/4]";
    case "square":
      return "aspect-square";
    case "wide":
    default:
      return "aspect-[16/9]";
  }
}

function fitClass(fit?: CoverFit | null) {
  if (fit === "contain") return "object-contain";
  return "object-cover";
}

function positionClass(pos?: CoverPosition | null) {
  switch ((pos || "center").toLowerCase()) {
    case "top":
      return "object-top";
    case "bottom":
      return "object-bottom";
    case "left":
      return "object-left";
    case "right":
      return "object-right";
    default:
      return "object-center";
  }
}

function normalizeUrl(input: unknown): string {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return "";

  let u = raw;
  u = u.replace(/^https?:\/\/[^/]+/i, "");
  if (!u.startsWith("/")) u = `/${u}`;
  if (u.length > 1) u = u.replace(/\/+$/, "");

  return u;
}

const BlogIndex: NextPage<Props> = ({ items, featuredItems = [], popularTags = [] }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [visibleItems, setVisibleItems] = React.useState(items);
  const [showFilters, setShowFilters] = React.useState(false);

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    items.forEach(item => {
      item.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [items]);

  // Filter items based on search and tag
  React.useEffect(() => {
    let filtered = items;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.excerpt?.toLowerCase().includes(term) ||
        item.tags?.some(tag => tag.toLowerCase().includes(term)) ||
        item.author?.toLowerCase().includes(term)
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(item => 
        item.tags?.includes(selectedTag)
      );
    }
    
    setVisibleItems(filtered);
  }, [items, searchTerm, selectedTag]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTag(null);
  };

  // Get featured items (first 2 items or specially marked)
  const displayFeaturedItems = featuredItems.length > 0 
    ? featuredItems 
    : items.slice(0, Math.min(2, items.length));

  return (
    <Layout title="Essays | Abraham of London">
      <Head>
        <title>Essays | Abraham of London</title>
        <meta name="description" content="Field notes, convictions, and strategic clarity - written for builders who refuse drift." />
        <meta property="og:title" content="Essays | Abraham of London" />
        <meta property="og:description" content="Field notes, convictions, and strategic clarity - written for builders who refuse drift." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com/blog" />
        <meta property="og:image" content="/assets/images/blog-og.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://abrahamoflondon.com/blog" />
      </Head>

      {/* Hero Section */}
      <section className="relative py-12 md:py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 mb-4">
              <ChevronRight className="w-4 h-4" />
              <span>Abraham of London</span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Essays
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              Field notes, convictions, and strategic clarity — written for builders who refuse drift.
            </p>
          </header>

          {/* Featured Posts */}
          {displayFeaturedItems.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-8">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Featured Essays</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {displayFeaturedItems.map((item) => (
                  <Link
                    key={item.url}
                    href={item.url}
                    className="group block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-[16/9] relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
                      <Image
                        src={item.coverImage || "/assets/images/writing-desk.webp"}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <BookOpen className="w-4 h-4" />
                          Featured
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.excerpt && (
                        <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                          {item.excerpt}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {item.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(item.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </div>
                          )}
                          {item.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {item.readTime}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search essays..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="w-5 h-5" />
                Filters
              </button>
            </div>

            {/* Quick Tags - Popular tags always visible */}
            {popularTags.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Popular Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.slice(0, 8).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full Tags Filter */}
            {showFilters && (
              <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">All Topics</h3>
                  {(searchTerm || selectedTag) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters */}
            {(searchTerm || selectedTag) && (
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                  <span>Showing {visibleItems.length} of {items.length} essays</span>
                  {searchTerm && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {selectedTag && (
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {selectedTag}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Essays Grid */}
          {visibleItems.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
                {selectedTag ? `Essays on "${selectedTag}"` : 'All Essays'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleItems.map((p) => {
                  const imgSrc = p.coverImage || "/assets/images/writing-desk.webp";
                  const aClass = aspectClass(p.coverAspect);
                  const oFit = fitClass(p.coverFit);
                  const oPos = positionClass(p.coverPosition);

                  return (
                    <Link
                      key={p.url || p.slug}
                      href={p.url}
                      className="group block overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`relative ${aClass} bg-gray-100 dark:bg-gray-900 overflow-hidden`}>
                        <Image
                          src={imgSrc}
                          alt={p.title}
                          fill
                          className={`${oFit} ${oPos} transition-transform duration-500 group-hover:scale-105`}
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        />
                        
                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>

                      <div className="p-6">
                        {/* Tags */}
                        {p.tags && p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {p.tags.slice(0, 2).map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {p.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                                +{p.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <h2 className="font-serif text-xl font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                          {p.title}
                        </h2>

                        {p.excerpt && (
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                            {p.excerpt}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            {p.date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(p.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                            {p.readTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{p.readTime}</span>
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No essays found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                {searchTerm 
                  ? `No essays match "${searchTerm}". Try a different search term.`
                  : "No essays available in this category."
                }
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{items.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Essays</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{allTags.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {new Date(Math.max(...items.map(i => i.date ? new Date(i.date).getTime() : 0))).getFullYear()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Latest Update</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {Math.round(items.reduce((acc, item) => acc + parseInt(item.readTime?.split(' ')[0] || '0'), 0) / 60)}h
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Reading</div>
              </div>
            </div>
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Get new essays delivered
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Join readers who receive weekly insights and field notes.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    await getContentlayerData();
    const allDocs = getPublishedDocuments();
    
    // Filter blog posts only (assuming they have 'post' or 'blog' in their kind/type)
    const blogPosts = allDocs.filter((d: any) => {
      const kind = String(d._raw?.sourceFileDir || d.kind || "").toLowerCase();
      const tags = Array.isArray(d.tags) ? d.tags.map((t: string) => t.toLowerCase()) : [];
      
      return (
        kind.includes('blog') || 
        kind.includes('post') || 
        tags.includes('blog') ||
        tags.includes('essay') ||
        (d.category && d.category.toLowerCase().includes('blog')) ||
        (d.url && d.url.includes('/blog/'))
      );
    });

    // Filter out draft posts
    const published = blogPosts.filter((d: any) => !isDraftContent(d));

    const items: Item[] = published
      .map((p: any) => {
        const slug = normalizeSlug(p.slugComputed || p.slug || p._raw?.flattenedPath || "");
        const url = normalizeUrl(p?.url) || `/blog/${slug}`;

        return {
          slug,
          url,
          title: p.title ?? "Untitled",
          excerpt: p.excerpt ?? p.description ?? null,
          date: p.date ?? p.publishedAt ?? null,
          readTime: p.readTime ?? null,
          coverImage: p.coverImage ?? p.image ?? null,
          tags: Array.isArray(p.tags) ? p.tags : null,
          coverAspect: (p.coverAspect ?? null) as Item["coverAspect"],
          coverFit: (p.coverFit ?? null) as Item["coverFit"],
          coverPosition: (p.coverPosition ?? null) as Item["coverPosition"],
          category: p.category,
          author: p.author,
        };
      })
      .sort((a, b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return db - da; // Newest first
      });

    // Get popular tags (tags that appear in at least 2 posts)
    const tagCounts: Record<string, number> = {};
    items.forEach(item => {
      item.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag)
      .slice(0, 10); // Top 10 tags

    // Get featured items (marked as featured or first 2)
    const featuredItems = items
      .filter(item => 
        item.tags?.includes('featured') || 
        item.category?.toLowerCase() === 'featured'
      )
      .slice(0, 2);

    console.log(`📝 Blog index: Loaded ${items.length} blog posts, ${featuredItems.length} featured`);

    return { 
      props: { 
        items, 
        featuredItems,
        popularTags 
      }, 
      revalidate: 3600 
    };
  } catch (error) {
    console.error('Error generating blog index:', error);
    return {
      props: { 
        items: [],
        featuredItems: [],
        popularTags: []
      },
      revalidate: 3600
    };
  }
};

export default BlogIndex;