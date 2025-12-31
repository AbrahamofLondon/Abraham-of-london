// lib/server/posts-data.ts
// Posts under content/posts/* - COMPLETE ROBUST VERSION

import {
  getMdxCollectionMeta,
  getMdxDocumentBySlug,
  type MdxMeta,
  type MdxDocument,
} from "@/lib/server/mdx-collections";
import type { Post, ContentEntry, ContentMeta } from "@/types/index";

export type PostWithContent = Post & {
  content: string;
};

// Extended MDX meta with post-specific fields
type PostishMdxMeta = MdxMeta & Partial<Post> & {
  publishDate?: string;
  releaseDate?: string;
  [key: string]: any;
};

type PostishMdxDocument = MdxDocument & {
  content: string;
} & Partial<Post>;

// ---------------------------------------------------------------------------
// SAFE TYPE CONVERTERS
// ---------------------------------------------------------------------------

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function safeNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function safeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    if (lower === "true") return true;
    if (lower === "false") return false;
    if (lower === "yes") return true;
    if (lower === "no") return false;
    if (lower === "1") return true;
    if (lower === "0") return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  return undefined;
}

function safeArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const filtered = value.filter((item) => typeof item === "string") as string[];
  return filtered.length > 0 ? filtered : undefined;
}

function safeStatus(
  value: unknown
): "draft" | "published" | "scheduled" | "archived" | undefined {
  if (value === "draft" || value === "published" || value === "scheduled" || value === "archived") {
    return value;
  }
  return undefined;
}

function safeAccessLevel(
  value: unknown
): "public" | "premium" | "private" | undefined {
  if (value === "public" || value === "premium" || value === "private") {
    return value;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// MAIN CONVERSION FUNCTIONS
// ---------------------------------------------------------------------------

function fromMdxMeta(meta: MdxMeta): Post {
  const m = meta as PostishMdxMeta;

  // Handle different date fields
  const date = safeString(m.date) || safeString(m.publishDate) || safeString(m.releaseDate);
  
  // Ensure required fields have defaults
  const slug = safeString(m.slug) || "";
  const title = safeString(m.title) || "Untitled Post";
  
  if (!slug || !title) {
    console.warn(`Post metadata missing slug or title: ${slug} - ${title}`);
  }

  return {
    // Core identifiers
    slug,
    title,

    // Content fields
    description: safeString(m.description),
    excerpt: safeString(m.excerpt),
    subtitle: safeString(m.subtitle),

    // Metadata
    date,
    author: safeString(m.author),
    category: safeString(m.category),
    tags: safeArray(m.tags),
    featured: safeBoolean(m.featured),
    readTime: safeString(m.readTime) || safeNumber(m.readTime),

    // Visual
    coverImage: safeString(m.coverImage) || safeString(m.image),

    // Post-specific fields
    postType: safeString(m.postType) || "article",
    series: safeString(m.series),
    seriesOrder: safeNumber(m.seriesOrder),
    updateDate: safeString(m.updateDate),
    canonicalUrl: safeString(m.canonicalUrl),
    metaTitle: safeString(m.metaTitle),
    metaDescription: safeString(m.metaDescription),
    keywords: safeArray(m.keywords),
    lastModified: safeString(m.lastModified),

    // State
    draft: safeBoolean(m.draft),
    published: safeBoolean(m.published),
    status: safeStatus(m.status),

    // Access
    accessLevel: safeAccessLevel(m.accessLevel) || "public",
    lockMessage: safeString(m.lockMessage),

    // System fields
    _raw: m._raw,
    _id: safeString(m._id),
    url: safeString(m.url),
    type: safeString(m.type) || "post",

    // Preserve any additional fields
    ...Object.fromEntries(
      Object.entries(m)
        .filter(([key]) => ![
          'slug', 'title', 'description', 'excerpt', 'subtitle',
          'date', 'author', 'category', 'tags', 'featured', 'readTime',
          'coverImage', 'image', 'postType', 'series', 'seriesOrder',
          'updateDate', 'canonicalUrl', 'metaTitle', 'metaDescription',
          'keywords', 'lastModified', 'draft', 'published', 'status',
          'accessLevel', 'lockMessage', '_raw', '_id', 'url', 'type',
          'publishDate', 'releaseDate'
        ].includes(key))
        .map(([key, value]) => [key, value])
    ),
  };
}

function fromMdxDocument(doc: MdxDocument): PostWithContent {
  const postDoc = doc as PostishMdxDocument;
  const { content, body, ...rest } = postDoc;
  const meta = fromMdxMeta(rest);
  
  return { 
    ...meta, 
    content: typeof content === "string" ? content : "",
    // Safely handle body which might have a specific type
    body: body || undefined,
  };
}

export function postToContentMeta(post: Post): ContentMeta {
  const { content, body, ...meta } = post;
  return meta;
}

export function postToContentEntry(post: Post): ContentEntry {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    description: post.description,
    category: post.category,
    tags: post.tags,
    featured: post.featured,
    readTime: post.readTime,
    _raw: post._raw,
    ...Object.fromEntries(
      Object.entries(post)
        .filter(([key]) => ![
          'slug', 'title', 'date', 'excerpt', 'description', 'category',
          'tags', 'featured', 'readTime', '_raw', 'content', 'body'
        ].includes(key))
    ),
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API FUNCTIONS
// ---------------------------------------------------------------------------

export function getAllPostsMeta(): Post[] {
  try {
    const metas = getMdxCollectionMeta("posts");
    if (!metas || !Array.isArray(metas)) {
      console.warn("No posts metadata found or metadata is not an array");
      return [];
    }
    
    const posts = metas.map((m) => fromMdxMeta(m));
    
    // Filter out invalid posts (missing required fields)
    const validPosts = posts.filter(post => {
      const isValid = post.slug && post.title;
      if (!isValid) {
        console.warn(`Invalid post skipped: ${post.slug || 'no-slug'} - ${post.title || 'no-title'}`);
      }
      return isValid;
    });
    
    console.log(`Found ${validPosts.length} valid posts out of ${metas.length} total`);
    return validPosts;
  } catch (error) {
    console.error("Error fetching all posts meta:", error);
    return [];
  }
}

export function getPostBySlug(slug: string): PostWithContent | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.error("getPostBySlug called with invalid slug:", slug);
      return null;
    }
    
    const doc = getMdxDocumentBySlug("posts", slug);
    if (!doc) {
      console.warn(`No post found for slug: ${slug}`);
      return null;
    }
    
    return fromMdxDocument(doc);
  } catch (error) {
    console.error(`Error fetching post by slug (${slug}):`, error);
    return null;
  }
}

export function getAllPosts(): PostWithContent[] {
  try {
    const metas = getAllPostsMeta();
    if (metas.length === 0) return [];
    
    const postsWithContent: PostWithContent[] = [];
    
    for (const meta of metas) {
      const post = getPostBySlug(meta.slug);
      if (post) {
        postsWithContent.push(post);
      } else {
        console.warn(`Could not load content for post: ${meta.slug}`);
      }
    }
    
    return postsWithContent;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return [];
  }
}

export function getPostsByCategory(category: string): Post[] {
  try {
    const posts = getAllPostsMeta();
    if (!category || typeof category !== 'string') return [];
    
    const normalizedCategory = category.toLowerCase().trim();
    
    return posts.filter(post => {
      const postCategory = post.category?.toLowerCase().trim();
      return postCategory === normalizedCategory;
    });
  } catch (error) {
    console.error(`Error fetching posts by category (${category}):`, error);
    return [];
  }
}

export function getPostsByTag(tag: string): Post[] {
  try {
    const posts = getAllPostsMeta();
    if (!tag || typeof tag !== 'string') return [];
    
    const normalizedTag = tag.toLowerCase().trim();
    
    return posts.filter(post => {
      return post.tags?.some(t => t.toLowerCase().trim() === normalizedTag);
    });
  } catch (error) {
    console.error(`Error fetching posts by tag (${tag}):`, error);
    return [];
  }
}

export function getFeaturedPosts(): Post[] {
  try {
    const posts = getAllPostsMeta();
    return posts.filter(post => post.featured === true);
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return [];
  }
}

export function getPublishedPosts(): Post[] {
  try {
    const posts = getAllPostsMeta();
    return posts.filter(post => 
      post.draft !== true && 
      post.status !== "draft" && 
      (post.published === true || post.status === "published")
    );
  } catch (error) {
    console.error("Error fetching published posts:", error);
    return [];
  }
}

export function getPostsBySeries(series: string): Post[] {
  try {
    const posts = getAllPostsMeta();
    if (!series || typeof series !== 'string') return [];
    
    const normalizedSeries = series.toLowerCase().trim();
    
    return posts
      .filter(post => post.series?.toLowerCase().trim() === normalizedSeries)
      .sort((a, b) => {
        // Sort by seriesOrder, then by date
        const orderA = a.seriesOrder || 999;
        const orderB = b.seriesOrder || 999;
        if (orderA !== orderB) return orderA - orderB;
        
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateA - dateB;
      });
  } catch (error) {
    console.error(`Error fetching posts by series (${series}):`, error);
    return [];
  }
}

export function searchPosts(query: string): Post[] {
  try {
    const posts = getPublishedPosts();
    const normalizedQuery = query.toLowerCase().trim();
    
    if (!normalizedQuery) return posts;
    
    return posts.filter(post => {
      // Search in title
      if (post.title?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in subtitle
      if (post.subtitle?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in description
      if (post.description?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in excerpt
      if (post.excerpt?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in author
      if (post.author?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in tags
      if (post.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))) return true;
      
      // Search in category
      if (post.category?.toLowerCase().includes(normalizedQuery)) return true;
      
      // Search in series
      if (post.series?.toLowerCase().includes(normalizedQuery)) return true;
      
      return false;
    });
  } catch (error) {
    console.error(`Error searching posts (${query}):`, error);
    return [];
  }
}

export function getRecentPosts(limit?: number): Post[] {
  try {
    const posts = getPublishedPosts();
    
    // Sort by date (newest first), then by title for same dates
    const sorted = posts.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (dateB !== dateA) return dateB - dateA;
      
      // Same date, sort alphabetically by title
      return (a.title || '').localeCompare(b.title || '');
    });
    
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted;
  } catch (error) {
    console.error("Error fetching recent posts:", error);
    return [];
  }
}

export function getAllPostCategories(): string[] {
  try {
    const posts = getAllPostsMeta();
    const categories = posts
      .map(post => post.category)
      .filter((category): category is string => 
        typeof category === "string" && category.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(categories)].sort();
  } catch (error) {
    console.error("Error fetching post categories:", error);
    return [];
  }
}

export function getAllPostTags(): string[] {
  try {
    const posts = getAllPostsMeta();
    const allTags = posts
      .flatMap(post => post.tags || [])
      .filter((tag): tag is string => typeof tag === "string");
    
    // Remove duplicates and sort alphabetically
    return [...new Set(allTags)].sort();
  } catch (error) {
    console.error("Error fetching post tags:", error);
    return [];
  }
}

export function getAllPostAuthors(): string[] {
  try {
    const posts = getAllPostsMeta();
    const authors = posts
      .map(post => post.author)
      .filter((author): author is string => 
        typeof author === "string" && author.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(authors)].sort();
  } catch (error) {
    console.error("Error fetching post authors:", error);
    return [];
  }
}

export function getAllPostSeries(): string[] {
  try {
    const posts = getAllPostsMeta();
    const series = posts
      .map(post => post.series)
      .filter((series): series is string => 
        typeof series === "string" && series.trim().length > 0
      );
    
    // Remove duplicates and sort alphabetically
    return [...new Set(series)].sort();
  } catch (error) {
    console.error("Error fetching post series:", error);
    return [];
  }
}

export function getAllPostSlugs(): string[] {
  try {
    const posts = getAllPostsMeta();
    return posts
      .map(post => post.slug)
      .filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  } catch (error) {
    console.error("Error fetching post slugs:", error);
    return [];
  }
}

export function getPostStats(): {
  total: number;
  published: number;
  drafts: number;
  featured: number;
  byCategory: Record<string, number>;
  byYear: Record<string, number>;
  byAuthor: Record<string, number>;
} {
  try {
    const posts = getAllPostsMeta();
    
    const stats = {
      total: posts.length,
      published: posts.filter(p => p.published === true || p.status === "published").length,
      drafts: posts.filter(p => p.draft === true || p.status === "draft").length,
      featured: posts.filter(p => p.featured === true).length,
      byCategory: {} as Record<string, number>,
      byYear: {} as Record<string, number>,
      byAuthor: {} as Record<string, number>,
    };
    
    posts.forEach(post => {
      // Count by category
      if (post.category) {
        stats.byCategory[post.category] = (stats.byCategory[post.category] || 0) + 1;
      }
      
      // Count by year
      if (post.date) {
        const year = new Date(post.date).getFullYear().toString();
        stats.byYear[year] = (stats.byYear[year] || 0) + 1;
      }
      
      // Count by author
      if (post.author) {
        stats.byAuthor[post.author] = (stats.byAuthor[post.author] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error("Error fetching post stats:", error);
    return {
      total: 0,
      published: 0,
      drafts: 0,
      featured: 0,
      byCategory: {},
      byYear: {},
      byAuthor: {},
    };
  }
}

// ---------------------------------------------------------------------------
// DEFAULT EXPORT
// ---------------------------------------------------------------------------

const postsData = {
  // Core functions
  getAllPostsMeta,
  getPostBySlug,
  getAllPosts,
  
  // Filter functions
  getPostsByCategory,
  getPostsByTag,
  getFeaturedPosts,
  getPublishedPosts,
  getPostsBySeries,
  searchPosts,
  getRecentPosts,
  
  // List functions
  getAllPostCategories,
  getAllPostTags,
  getAllPostAuthors,
  getAllPostSeries,
  getAllPostSlugs,
  
  // Stats
  getPostStats,
  
  // Utility functions
  postToContentMeta,
  postToContentEntry,
};

export default postsData;
