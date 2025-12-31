// lib/posts.ts
/* eslint-disable no-console */

import type { Post as PostType, PostForClient as PostForClientType, PostSummary as PostSummaryType, PostList } from "@/types/post";
import { PostFactory, PostMetaUtils, TypeGuards, Validation } from "@/types/post";
import { getPublishedPosts as getPublishedPostDocs, normalizeSlug } from "@/lib/contentlayer-helper";

// -----------------------------
// Local helpers (NO posts-utils)
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

function toSummary(post: PostType): PostSummaryType {
  return PostFactory.createSummary(post);
}

function searchLocal(posts: PostType[], query: string): PostType[] {
  const q = clean(query);
  if (!q) return [];

  return posts.filter((p) => {
    const hay = [
      PostMetaUtils.getTitle(p),
      PostMetaUtils.getExcerpt(p),
      PostMetaUtils.getCategory(p),
      PostMetaUtils.getAuthor(p),
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

function featuredLocal(posts: PostType[]): PostType[] {
  return posts.filter((p) => p.featured === true);
}

function paginateSummaries(summaries: PostSummaryType[], page = 1, perPage = 10): PostList {
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

let postsCache: PostType[] | null = null;

// -----------------------------
// Contentlayer mapping
// -----------------------------

function mapDocToPost(doc: any): PostType | null {
  try {
    if (!doc || typeof doc !== "object") return null;

    const slug = normalizeSlug(doc) || "";
    const content = String(doc?.body?.raw ?? doc?.content ?? "").trim();
    if (!slug || !content) return null;

    const postData: Partial<PostType> = {
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

    const post = PostFactory.createPost(postData);

    const validation = Validation.validatePostMeta(post);
    if (!validation.isValid) {
      console.warn(`[posts] invalid post "${slug}":`, validation.errors);
      return null;
    }

    if (!TypeGuards.isPost(post)) return null;

    return post;
  } catch (e) {
    console.error("[posts] mapDocToPost error:", e);
    return null;
  }
}

function loadFromContentlayer(): PostType[] {
  try {
    const docs = getPublishedPostDocs();
    const posts = docs.map(mapDocToPost).filter((p): p is PostType => p !== null);

    postsCache = posts;
    return posts;
  } catch (e) {
    console.error("[posts] loadFromContentlayer failed:", e);
    return [];
  }
}

function getSourcePosts(): PostType[] {
  if (Array.isArray(postsCache) && postsCache.length && postsCache.every(TypeGuards.isPost)) {
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

export function getPostBySlugWithContent(slug: string): PostType | null {
  const target = clean(slug);
  if (!target) return null;

  const posts = getSourcePosts();
  const found = posts.find((p) => clean(PostMetaUtils.getSlug(p)) === target);
  return found ?? null;
}

export function getPostBySlug(slug: string): PostForClientType | null {
  const post = getPostBySlugWithContent(slug);
  if (!post) return null;
  return PostFactory.createForClient(post);
}

export function getAllPosts(): PostForClientType[] {
  const posts = getSourcePosts();
  return posts.map((p) => PostFactory.createForClient(p));
}

export function getPublicPosts(): PostForClientType[] {
  return getAllPosts().filter((p) => p.published !== false);
}

export function getFeaturedPosts(): PostForClientType[] {
  const posts = featuredLocal(getSourcePosts());
  return posts.map((p) => PostFactory.createForClient(p));
}

export function getPostSummaries(): PostSummaryType[] {
  const posts = getSourcePosts();
  const sorted = [...posts].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return db - da;
  });

  return sorted.map(toSummary);
}

export function searchPosts(query: string): PostSummaryType[] {
  const results = searchLocal(getSourcePosts(), query);
  return results.map(toSummary);
}

export function getPaginatedPostSummaries(page = 1, perPage = 10): PostList {
  return paginateSummaries(getPostSummaries(), page, perPage);
}

export function getPostsByCategory(category: string): PostForClientType[] {
  const c = clean(category);
  return getAllPosts().filter((p) => clean(PostMetaUtils.getCategory(p)) === c);
}

export function getPostsByTag(tag: string): PostForClientType[] {
  const t = clean(tag);
  return getAllPosts().filter((p) => PostMetaUtils.getTags(p).some((x) => clean(x) === t));
}

export function getRecentPosts(limit = 5): PostForClientType[] {
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
