// lib/posts.ts - Simplified version
/* eslint-disable no-console */

// Define types locally to avoid import issues
interface ImageType {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
}

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  published?: boolean;
  featured?: boolean;
  category?: string;
  tags?: string[];
  author?: string;
  readTime?: string;
  subtitle?: string;
  description?: string;
  coverImage?: string | ImageType | null;
  ogImage?: string | ImageType | null;
  series?: string;
  seriesOrder?: number;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  authors?: string[];
  wordCount?: number;
  canonicalUrl?: string;
  noindex?: boolean;
  lastModified?: string;
  id?: string;
  url?: string;
  draft?: boolean;
}

interface Post extends PostMeta {
  content?: string;
  html?: string;
  compiledSource?: string;
  body?: any;
}

interface PostForClient extends Post {
  content: string;
  html: string;
  compiledSource: string;
  coverImage?: string;
  ogImage?: string;
}

interface PostSummary {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  coverImage?: string;
}

interface PostList {
  posts: PostSummary[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

import { getPublishedPosts as getPublishedPostDocs, normalizeSlug } from "@/lib/contentlayer";

// -----------------------------
// Local helpers
// -----------------------------

function clean(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

function safeIsoDate(input: unknown): string {
  const s = typeof input === "string" ? input : "";
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return s;
  return new Date().toISOString().split("T")[0]!;
}

function normalizeImage(image: string | ImageType | null | undefined): string | undefined {
  if (!image) return undefined;
  if (typeof image === "string") return image;
  if (typeof image === "object" && (image as ImageType).src) return (image as ImageType).src;
  return undefined;
}

function toSummary(post: Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    readTime: post.readTime,
    category: post.category,
    tags: post.tags,
    featured: post.featured,
    coverImage: normalizeImage(post.coverImage),
  };
}

function toPostForClient(post: Post): PostForClient {
  return {
    ...post,
    coverImage: normalizeImage(post.coverImage),
    ogImage: normalizeImage(post.ogImage),
    content: post.content || "",
    html: post.html || "",
    compiledSource: post.compiledSource || "",
  };
}

function searchLocal(posts: Post[], query: string): Post[] {
  const q = clean(query);
  if (!q) return [];

  return posts.filter((p) => {
    const hay = [
      p.title || "",
      p.excerpt || "",
      p.category || "",
      p.author || "",
      ...(Array.isArray(p.tags) ? p.tags : []),
      p.subtitle ?? "",
      p.description ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

function featuredLocal(posts: Post[]): Post[] {
  return posts.filter((p) => p.featured === true);
}

function paginateSummaries(summaries: PostSummary[], page = 1, perPage = 10): PostList {
  const safePerPage = Math.max(1, Math.min(100, Math.floor(perPage)));
  const total = summaries.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const safePage = Math.max(1, Math.min(totalPages, Math.floor(page)));

  const start = (safePage - 1) * safePerPage;
  const end = Math.min(start + safePerPage, total);

  const slice = summaries.slice(start, end);

  return {
    posts: slice,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrevious: safePage > 1,
  };
}

// -----------------------------
// Cache
// -----------------------------

let postsCache: Post[] | null = null;

// -----------------------------
// Contentlayer mapping
// -----------------------------

function mapDocToPost(doc: any): Post | null {
  try {
    if (!doc || typeof doc !== "object") return null;

    const slug = normalizeSlug(doc) || "";
    const content = String(doc?.body?.raw ?? doc?.content ?? "").trim();
    if (!slug || !content) return null;

    const postData: Post = {
      slug,
      title: String(doc?.title ?? "Untitled"),
      date: safeIsoDate(doc?.date),
      excerpt: String(doc?.excerpt ?? doc?.description ?? "").trim(),

      published: doc?.draft !== true,
      featured: Boolean(doc?.featured),

      category: doc?.category ? String(doc.category) : undefined,
      tags: Array.isArray(doc?.tags) ? doc.tags.map(String).filter(Boolean) : undefined,
      author: doc?.author ? String(doc.author) : undefined,
      readTime: doc?.readTime ? String(doc.readTime) : undefined,

      subtitle: doc?.subtitle ? String(doc.subtitle) : undefined,
      description: doc?.description ? String(doc.description) : undefined,

      coverImage: doc?.coverImage ?? undefined,
      ogImage: doc?.ogImage ?? undefined,

      series: doc?.series ? String(doc.series) : undefined,
      seriesOrder: typeof doc?.seriesOrder === "number" ? doc.seriesOrder : undefined,

      coverAspect: doc?.coverAspect ? String(doc.coverAspect) : undefined,
      coverFit: doc?.coverFit ? String(doc.coverFit) : undefined,
      coverPosition: doc?.coverPosition ? String(doc.coverPosition) : undefined,

      authors: Array.isArray(doc?.authors) ? doc.authors.map(String).filter(Boolean) : undefined,
      wordCount: typeof doc?.wordCount === "number" ? doc.wordCount : undefined,
      canonicalUrl: doc?.canonicalUrl ? String(doc.canonicalUrl) : undefined,
      noindex: typeof doc?.noindex === "boolean" ? doc.noindex : undefined,
      lastModified: doc?.lastModified ? String(doc.lastModified) : undefined,

      // content fields
      content,
      html: typeof doc?.html === "string" ? doc.html : "",
      compiledSource: typeof doc?.compiledSource === "string" ? doc.compiledSource : "",

      id: doc?._id || slug,
      url: doc?.url || `/blog/${slug}`,
      draft: Boolean(doc?.draft),
    };

    // Basic validation
    const errors: string[] = [];
    if (!postData.slug) errors.push("Slug is required");
    if (!postData.title) errors.push("Title is required");
    if (!postData.date) errors.push("Date is required");
    
    if (errors.length > 0) {
      console.warn(`[posts] invalid post "${slug}":`, errors);
      return null;
    }

    return postData;
  } catch (e) {
    console.error("[posts] mapDocToPost error:", e);
    return null;
  }
}

function loadFromContentlayer(): Post[] {
  try {
    const docs = getPublishedPostDocs();
    const posts = docs.map(mapDocToPost).filter((p): p is Post => p !== null);

    postsCache = posts;
    return posts;
  } catch (e) {
    console.error("[posts] loadFromContentlayer failed:", e);
    return [];
  }
}

function getSourcePosts(): Post[] {
  if (Array.isArray(postsCache) && postsCache.length > 0) {
    return postsCache;
  }
  return loadFromContentlayer();
}

// -----------------------------
// Public API
// -----------------------------

export function clearPostsCache(): void {
  postsCache = null;
}

export function getPostBySlugWithContent(slug: string): Post | null {
  const target = clean(slug);
  if (!target) return null;

  const posts = getSourcePosts();
  const found = posts.find((p) => clean(p.slug) === target);
  return found ?? null;
}

export function getPostBySlug(slug: string): PostForClient | null {
  const post = getPostBySlugWithContent(slug);
  if (!post) return null;
  return toPostForClient(post);
}

export function getAllPosts(): PostForClient[] {
  const posts = getSourcePosts();
  return posts.map(toPostForClient);
}

export function getPublicPosts(): PostForClient[] {
  return getAllPosts().filter((p) => p.published !== false);
}

export function getFeaturedPosts(): PostForClient[] {
  const posts = featuredLocal(getSourcePosts());
  return posts.map(toPostForClient);
}

export function getPostSummaries(): PostSummary[] {
  const posts = getSourcePosts();
  const sorted = [...posts].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return db - da;
  });

  return sorted.map(toSummary);
}

export function searchPosts(query: string): PostSummary[] {
  const results = searchLocal(getSourcePosts(), query);
  return results.map(toSummary);
}

export function getPaginatedPostSummaries(page = 1, perPage = 10): PostList {
  return paginateSummaries(getPostSummaries(), page, perPage);
}

export function getPostsByCategory(category: string): PostForClient[] {
  const c = clean(category);
  return getAllPosts().filter((p) => clean(p.category || "") === c);
}

export function getPostsByTag(tag: string): PostForClient[] {
  const t = clean(tag);
  return getAllPosts().filter((p) => (p.tags || []).some((x) => clean(x) === t));
}

export function getRecentPosts(limit = 5): PostForClient[] {
  const all = getAllPosts();
  const sorted = [...all].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return sorted.slice(0, Math.max(0, limit));
}

const postsAPI = {
  clearPostsCache,
  getPostBySlugWithContent,
  getPostBySlug,
  getAllPosts,
  getPublicPosts,
  getFeaturedPosts,
  getPostSummaries,
  searchPosts,
  getPaginatedPostSummaries,
  getPostsByCategory,
  getPostsByTag,
  getRecentPosts,
};

export default postsAPI;


