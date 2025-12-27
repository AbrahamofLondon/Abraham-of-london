// lib/posts.ts - CONTENTLAYER-FIRST + STRICT TYPES (PRODUCTION SAFE)
/* eslint-disable no-console */

import type {
  Post as PostType,
  PostForClient as PostForClientType,
  PostSummary as PostSummaryType,
  PostList,
} from "@/types/post";

import { PostMetaUtils, TypeGuards, PostFactory, Validation } from "@/types/post";

import {
  transformPostForClient,
  searchPosts as searchPostsUtil,
  getFeaturedPosts as getFeaturedPostsUtil,
} from "@/lib/posts-utils";

import { getPublishedPosts as getPublishedPostDocs, normalizeSlug } from "@/lib/contentlayer-helper";

// Helper function to clean slugs/queries
function cleanLower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Optional legacy cache support (keep only for backward compatibility).
 * Canon source is Contentlayer.
 */
let postsCache: PostType[] | null = null;

export function initializePosts(posts: PostType[] = []): void {
  if (!Array.isArray(posts)) {
    postsCache = [];
    console.warn("[posts] initializePosts called with non-array input");
    return;
  }

  const validPosts: PostType[] = [];
  const invalidPosts: PostType[] = [];

  posts.forEach((post) => {
    const validation = Validation.validatePostMeta(post);
    if (validation.isValid && TypeGuards.isPost(post)) {
      validPosts.push(post);
    } else {
      invalidPosts.push(post);
      const slug = PostMetaUtils.getSlug(post);
      console.warn(
        `[posts] Skipping invalid post ${slug}:`,
        validation.isValid ? "Missing content" : validation.errors
      );
    }
  });

  postsCache = validPosts;
  console.log(
    `[posts] Initialized ${validPosts.length} valid posts (${invalidPosts.length} invalid ignored)`
  );
}

/**
 * Convert Contentlayer Post doc -> strict PostType with full validation.
 */
function mapDocToPost(doc: any): PostType | null {
  try {
    if (!doc || typeof doc !== "object") {
      console.warn("[posts] mapDocToPost received invalid doc");
      return null;
    }

    const slug = normalizeSlug(doc) || "";
    const content = String(doc?.body?.raw ?? doc?.content ?? "").trim();

    if (!slug || !content) {
      console.warn(`[posts] Skipping doc with missing slug or content: ${slug}`);
      return null;
    }

    const postData = {
      slug,
      title: String(doc?.title ?? "Untitled"),
      date: String(doc?.date ?? new Date().toISOString().split("T")[0]),
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

      // Content fields
      content,
      html: doc?.html ? String(doc.html) : undefined,
      compiledSource: doc?.compiledSource ? String(doc.compiledSource) : undefined,

      // Internal fields
      id: doc?._id || slug,
      url: doc?.url || `/blog/${slug}`,
      draft: Boolean(doc?.draft),
    };

    const post = PostFactory.createPost(postData);

    const validation = Validation.validatePostMeta(post);
    if (!validation.isValid) {
      console.warn(`[posts] Post validation failed for ${slug}:`, validation.errors);
      return null;
    }

    return post;
  } catch (error) {
    console.error("[posts] Error in mapDocToPost:", error);
    return null;
  }
}

function getPostsFromContentlayer(): PostType[] {
  try {
    const docs = getPublishedPostDocs();
    const mapped = docs.map(mapDocToPost).filter((p): p is PostType => p !== null);

    console.log(
      `[posts] Loaded ${mapped.length} valid posts from Contentlayer (${docs.length - mapped.length} filtered out)`
    );
    return mapped;
  } catch (error) {
    console.error("[posts] Contentlayer loading failed:", error);
    return [];
  }
}

function getSourcePosts(): PostType[] {
  if (Array.isArray(postsCache) && postsCache.length > 0 && postsCache.every(TypeGuards.isPost)) {
    console.log(`[posts] Using ${postsCache.length} cached posts`);
    return postsCache;
  }

  const contentlayerPosts = getPostsFromContentlayer();
  postsCache = contentlayerPosts;
  return contentlayerPosts;
}

function validateAndFilterPosts(posts: PostType[]): PostType[] {
  return posts.filter((post) => {
    const validation = Validation.validatePostMeta(post);
    if (!validation.isValid) {
      const slug = PostMetaUtils.getSlug(post);
      console.warn(`[posts] Skipping invalid post ${slug}:`, validation.errors);
      return false;
    }
    return true;
  });
}

export function getAllPosts(): PostForClientType[] {
  try {
    const source = getSourcePosts();
    const valid = validateAndFilterPosts(source);

    return valid
      .map((post) => {
        try {
          return PostFactory.createForClient(post);
        } catch (error) {
          const slug = PostMetaUtils.getSlug(post);
          console.error(`[posts] Error transforming post ${slug}:`, error);
          return null;
        }
      })
      .filter((p): p is PostForClientType => p !== null);
  } catch (error) {
    console.error("[posts] Error in getAllPosts:", error);
    return [];
  }
}

export function getPostBySlugWithContent(slug: string): PostType | null {
  const cleanedSlug = cleanLower(slug);
  if (!cleanedSlug) {
    console.warn("[posts] getPostBySlugWithContent called with empty slug");
    return null;
  }

  const source = getSourcePosts();
  const post = source.find((p) => cleanLower(PostMetaUtils.getSlug(p)) === cleanedSlug);

  if (!post) {
    console.log(`[posts] Post not found: ${cleanedSlug}`);
    return null;
  }

  const validation = Validation.validatePostMeta(post);
  if (!validation.isValid) {
    console.warn(`[posts] Found post ${cleanedSlug} but validation failed:`, validation.errors);
    return null;
  }

  return post;
}

export function getPostBySlug(slug: string): PostForClientType | null {
  try {
    const post = getPostBySlugWithContent(slug);
    if (!post) return null;
    return PostFactory.createForClient(post);
  } catch (error) {
    console.error(`[posts] Error getting post by slug "${cleanLower(slug)}":`, error);
    return null;
  }
}

export function getPublicPosts(): PostForClientType[] {
  try {
    return getAllPosts().filter((p) => p.published !== false);
  } catch (error) {
    console.error("[posts] Error in getPublicPosts:", error);
    return [];
  }
}

export function getFeaturedPosts(): PostForClientType[] {
  try {
    const source = getSourcePosts();
    const valid = validateAndFilterPosts(source);

    const featured = getFeaturedPostsUtil(valid);
    return featured.map(PostFactory.createForClient);
  } catch (error) {
    console.error("[posts] Error in getFeaturedPosts:", error);
    return getPublicPosts().filter((p) => p.featured === true);
  }
}

export function getPostSummaries(): PostSummaryType[] {
  try {
    const source = getSourcePosts();
    const valid = validateAndFilterPosts(source);
    const sorted = PostMetaUtils.sortByDate(valid, "desc");

    return sorted
      .map((post) => {
        try {
          return PostFactory.createSummary(post);
        } catch (error) {
          const slug = PostMetaUtils.getSlug(post);
          console.error(`[posts] Error creating summary for ${slug}:`, error);
          return null;
        }
      })
      .filter((s): s is PostSummaryType => s !== null);
  } catch (error) {
    console.error("[posts] Error in getPostSummaries:", error);
    return [];
  }
}

export function searchPosts(query: string): PostSummaryType[] {
  const q = cleanLower(query);
  if (!q) return [];

  try {
    const source = getSourcePosts();
    const valid = validateAndFilterPosts(source);

    const results = searchPostsUtil(valid, q);
    return results.map(PostFactory.createSummary);
  } catch (error) {
    console.error(`[posts] Error searching for "${q}":`, error);
    return [];
  }
}

export function getPaginatedPostSummaries(page = 1, perPage = 10): PostList {
  try {
    const summaries = getPostSummaries();
    const total = summaries.length;

    const safePage = Math.max(1, Math.floor(page));
    const safePerPage = Math.max(1, Math.min(100, Math.floor(perPage)));
    const totalPages = Math.max(1, Math.ceil(total / safePerPage));
    const currentPage = Math.min(safePage, totalPages);

    const start = (currentPage - 1) * safePerPage;
    const end = Math.min(start + safePerPage, total);

    return {
      posts: summaries.slice(start, end),
      total,
      page: currentPage,
      perPage: safePerPage,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  } catch (error) {
    console.error("[posts] Error in getPaginatedPostSummaries:", error);
    return {
      posts: [],
      total: 0,
      page: 1,
      perPage: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

export function clearPostsCache(): void {
  postsCache = null;
  console.log("[posts] Cache cleared");
}

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
  clearPostsCache,

  PostMetaUtils,
  TypeGuards,
  PostFactory,
  Validation,
};

export default postsAPI;