/* pages/blog/index.tsx — PRODUCTION-READY VERSION */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import Layout from "@/components/Layout";
import { 
  Calendar, 
  Clock, 
  Search, 
  ArrowRight, 
  Tag, 
  TrendingUp 
} from "lucide-react";

// server-only functions for getStaticProps
import { getPublishedPosts } from "@/lib/content/server";

// client-safe utilities
import { sanitizeData, normalizeSlug, resolveDocCoverImage } from "@/lib/content/shared";
import { safeSlice, safeArraySlice } from "@/lib/utils/safe";


// ============= TYPE DEFINITIONS =============
type BlogPost = {
  slug: string;
  url: string;
  title: string;
  excerpt: string | null;
  date: string | null;        // Display date (formatted)
  dateIso: string | null;     // Canonical ISO date for sorting
  readTime: string | null;
  coverImage: string | null;
  tags: string[];
  author: string | null;
  featured?: boolean;
};

type BlogIndexProps = {
  items: BlogPost[];
  featuredItems: BlogPost[];
  popularTags: string[];
  totalPosts: number;
  lastUpdated: string;
};

// ============= UTILITY FUNCTIONS (CLIENT-SAFE) =============
const formatDateString = (dateInput: string | Date | null | undefined): string | null => {
  if (!dateInput) return null;
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return null;
  }
};

// ============= BLOG INDEX COMPONENT =============
const BlogIndex: NextPage<BlogIndexProps> = ({ 
  items, 
  featuredItems, 
  popularTags,
  totalPosts,
  lastUpdated 
}) => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);

  // ✅ Use useMemo for filtering (pure computation)
  const filteredPosts = React.useMemo(() => {
    let filtered = items;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags.includes(selectedTag)
      );
    }

    return filtered;
  }, [items, searchQuery, selectedTag]);

  // Generate safe popular tags (ensure they exist)
  const safePopularTags = Array.isArray(popularTags) 
    ? popularTags.filter(tag => tag && typeof tag === 'string')
    : [];

  return (
    <Layout>
      <Head>
        <title>Essays | Abraham of London</title>
        <meta name="description" content="Thoughtful essays on technology, design, and the human experience." />
        <meta property="og:title" content="Essays | Abraham of London" />
        <meta property="og:description" content="Thoughtful essays on technology, design, and the human experience." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Essays & Insights
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Explorations in technology, design, philosophy, and the craft of building meaningful things.
            </p>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {totalPosts} {totalPosts === 1 ? 'essay' : 'essays'} published
              </span>
              {safePopularTags.length > 0 && (
                <span className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  {safePopularTags.length} {safePopularTags.length === 1 ? 'topic' : 'topics'}
                </span>
              )}
            </div>
            {lastUpdated && (
              <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                Last updated: {new Date(lastUpdated).toLocaleDateString('en-GB')}
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search essays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                aria-label="Search essays"
              />
            </div>
          </div>

          {/* Popular Tags */}
          {safePopularTags.length > 0 && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedTag === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                  aria-label="Show all essays"
                >
                  All
                </button>
                {safePopularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTag === tag
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                    aria-label={`Filter by ${tag}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Featured Posts */}
        {featuredItems.length > 0 && !searchQuery && !selectedTag && (
          <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Featured Essays
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map(post => (
                <FeaturedPostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {searchQuery || selectedTag ? 'Search Results' : 'All Essays'}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'essay' : 'essays'}
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-500 dark:text-gray-400">
                No essays found matching your criteria.
              </p>
              {(searchQuery || selectedTag) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedTag(null);
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-8">
              {filteredPosts.map(post => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

// ============= FEATURED POST CARD =============
const FeaturedPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <Link href={post.url} className="group block">
      <article className="h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
        {post.coverImage && (
          <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={true}
            />
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            {post.date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {post.date}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.safeSlice(tags, 0, 3).map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

// ============= BLOG POST CARD =============
const BlogPostCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <Link href={post.url} className="group block">
      <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
        <div className="flex gap-6">
          {post.coverImage && (
            <div className="relative w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hidden sm:block">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="192px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
              {post.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </span>
              )}
              {post.readTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readTime}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                {post.excerpt}
              </p>
            )}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.safeSlice(tags, 0, 4).map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                Read more
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

// ============= SERVER-SIDE DATA FETCHING =============
export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  try {
    // ✅ Use imported server-only function
    const allPosts = getPublishedPosts();
    
    // Validate response
    if (!Array.isArray(allPosts)) {
      console.warn("[Blog] getPublishedPosts did not return array");
      throw new Error("Invalid posts data");
    }

    // Transform to blog post format (PURE operations only)
    const items: BlogPost[] = allPosts
      .map((doc: any) => {
        try {
          if (!doc) return null;
          
          // Use imported normalizeSlug
          const slug = normalizeSlug(doc.slug || "");
          if (!slug) return null;
          
          const title = doc.title || "Untitled Essay";
          const excerpt = doc.excerpt || doc.description || null;
          
          // Handle date parsing safely
          let dateIso: string | null = null;
          let dateStr: string | null = null;
          
          if (doc.date) {
            try {
              const date = new Date(doc.date);
              if (!isNaN(date.getTime())) {
                dateIso = date.toISOString();
                dateStr = formatDateString(date);
              }
            } catch (e) {
              console.warn(`[Blog] Invalid date for post "${title}":`, doc.date);
            }
          }
          
          const readTime = doc.readTime || "5 min read";
          
          // Use imported resolveDocCoverImage
          const coverImage = resolveDocCoverImage(doc);
          
          // Ensure tags is an array
          const tags = Array.isArray(doc.tags) 
            ? doc.tags.filter((t: any) => t && typeof t === 'string')
            : [];
          
          const author = doc.author || "Abraham of London";
          const url = `/blog/${slug}`;
          
          // Check if featured
          const featured = Boolean(
            doc.featured || 
            tags.includes('featured') || 
            tags.includes('essentials')
          );
          
          return { 
            slug, 
            url, 
            title, 
            excerpt, 
            date: dateStr,
            dateIso,
            readTime, 
            coverImage, 
            tags, 
            author, 
            featured 
          };
        } catch (error) {
          console.warn(`[Blog] Failed to transform post:`, error);
          return null;
        }
      })
      .filter((item: BlogPost | null): item is BlogPost => {
        return item !== null && Boolean(item.slug) && Boolean(item.title);
      })
      .sort((a: BlogPost, b: BlogPost) => {
        // Sort by ISO date, newest first
        const aTime = a.dateIso ? Date.parse(a.dateIso) : 0;
        const bTime = b.dateIso ? Date.parse(b.dateIso) : 0;
        return bTime - aTime;
      });

    // Extract featured posts
    const featuredItems = items
      .filter(post => post.featured)
      safeArraySlice(..., 0, 3);

    // Calculate popular tags with counts
    const tagCounts: Record<string, number> = {};
    items.forEach(item => {
      item.tags.forEach(tag => {
        if (tag && typeof tag === 'string') {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      safeSlice(..., 0, 10)
      .map(([tag]) => tag);

    // ✅ Use imported sanitizeData
    const props: BlogIndexProps = sanitizeData({
      items,
      featuredItems,
      popularTags,
      totalPosts: items.length,
      lastUpdated: new Date().toISOString()
    });

    return {
      props,
      revalidate: 3600, // Revalidate every hour
    };
    
  } catch (error) {
    console.error("[Blog Index] Fatal error in getStaticProps:", error);
    
    // ✅ Graceful fallback with detailed error logging
    return {
      props: {
        items: [],
        featuredItems: [],
        popularTags: [],
        totalPosts: 0,
        lastUpdated: new Date().toISOString()
      },
      revalidate: 60, // Try again in 1 minute
    };
  }
};

export default BlogIndex;