// lib/posts.ts — CONTENTLAYER-FIRST (NO CACHE REQUIRED)
/* eslint-disable no-console */
import type {
  Post as PostType,
  PostMeta as PostMetaType,
  PostWithContent as PostWithContentType,
  PostForClient as PostForClientType,
  PostSummary as PostSummaryType,
} from "@/types/post";

import {
  transformPostForClient,
  toPostSummary,
  sortPostsByDate,
  paginatePosts,
  searchPosts as searchPostsUtil,
  getFeaturedPosts as getFeaturedPostsUtil,
} from "@/lib/posts-utils";

import {
  getPublishedPosts,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/contentlayer-helper";

// Re-export types for convenience
export type Post = PostType;
export type PostMeta = PostMetaType;
export type PostWithContent = PostWithContentType;
export type PostForClient = PostForClientType;
export type PostSummary = PostSummaryType;

/**
 * Legacy cache support (optional).
 * We keep this only to avoid breaking older code paths.
 * But the canonical source of truth is Contentlayer.
 */
let postsCache: PostType[] | null = null;

/**
 * Optional: initialize posts (legacy).
 * Safe no-op if you never call it.
 */
export function initializePosts(posts: PostType[] = []): void {
  postsCache = Array.isArray(posts) ? posts : [];
  console.log(`[posts] Initialized ${postsCache.length} posts (legacy cache)`);
}

/**
 * Build posts from contentlayer and map to PostType-ish shape.
 * This prevents “posts cache empty” from breaking builds.
 */
function getPostsFromContentlayer(): PostType[] {
  const docs = getPublishedPosts();

  // Map Contentlayer Post docs into your PostType shape (minimum viable).
  // If your PostType has extra fields, keep them optional at type level.
  return docs.map((d: any) => {
    const slug = normalizeSlug(d);
    const coverImage = resolveDocCoverImage(d);

    return {
      // Core identifiers
      slug,
      title: d.title ?? "Untitled",
      excerpt: d.excerpt ?? d.description ?? "",
      date: d.date ?? null,

      // Flags
      featured: Boolean(d.featured),
      published: d.draft === true ? false : true,

      // Media
      coverImage: coverImage ?? undefined,

      // Content
      content: d.body?.raw ?? "",

      // Optional author/tags
      author: d.author ?? undefined,
      tags: Array.isArray(d.tags) ? d.tags : undefined,

      // Pass through (in case downstream relies on it)
      _raw: d._raw ?? undefined,
      _id: d._id ?? undefined,
    } as unknown as PostType;
  });
}

/**
 * Unified source:
 * - Prefer legacy cache if populated
 * - Otherwise use contentlayer (always available at build time)
 */
function getSourcePosts(): PostType[] {
  if (Array.isArray(postsCache) && postsCache.length > 0) return postsCache;
  return getPostsFromContentlayer();
}

/**
 * Get all posts for client display
 */
export function getAllPosts(): PostForClientType[] {
  try {
    return getSourcePosts().map((post) => transformPostForClient(post));
  } catch (error) {
    console.error("[posts] Error in getAllPosts:", error);
    return [];
  }
}

/**
 * Get post by slug (server-side, with content)
 */
export function getPostBySlugWithContent(slug: string): PostType | null {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;

  const posts = getSourcePosts();
  return posts.find((p: any) => String(p.slug).toLowerCase() === s) ?? null;
}

/**
 * Get post by slug (for client)
 */
export function getPostBySlug(slug: string): PostForClientType | null {
  const post = getPostBySlugWithContent(slug);
  return post ? transformPostForClient(post) : null;
}

/**
 * Get public posts (published only)
 */
export function getPublicPosts(): PostForClientType[] {
  return getAllPosts().filter((p: any) => p?.published !== false);
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(): PostForClientType[] {
  try {
    // Prefer your util if it expects PostType[]:
    const featured = getFeaturedPostsUtil(getSourcePosts() as any);
    return featured.map((p: any) => transformPostForClient(p));
  } catch {
    // Fallback
    return getAllPosts().filter((p: any) => p?.featured === true);
  }
}

/**
 * Get summaries (useful for lists)
 */
export function getPostSummaries(): PostSummaryType[] {
  try {
    const sorted = sortPostsByDate(getSourcePosts() as any);
    return sorted.map((p: any) => toPostSummary(p));
  } catch (e) {
    console.error("[posts] Error building summaries:", e);
    return [];
  }
}

/**
 * Search posts
 */
export function searchPosts(query: string): PostSummaryType[] {
  try {
    const results = searchPostsUtil(getSourcePosts() as any, query);
    return results.map((p: any) => toPostSummary(p));
  } catch (e) {
    console.error("[posts] searchPosts error:", e);
    return [];
  }
}

/**
 * Paginate summaries
 */
export function getPaginatedPostSummaries(page = 1, perPage = 10) {
  const summaries = getPostSummaries();
  return paginatePosts(summaries as any, page, perPage);
}

/**
 * Main API object
 */
export const postsAPI = {
  initializePosts,

  getAllPosts,
  getPublicPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostBySlugWithContent,

  getPostSummaries,
  searchPosts,
  getPaginatedPostSummaries,
};

export default postsAPI;