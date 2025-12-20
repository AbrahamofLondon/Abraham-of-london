// lib/posts.ts — CONTENTLAYER-FIRST + STRICT TYPES
/* eslint-disable no-console */
import type {
  Post as PostType,
  PostForClient as PostForClientType,
  PostSummary as PostSummaryType,
  PostList,
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
  getPublishedPosts as getPublishedPostDocs,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

/**
 * Optional legacy cache support (keep only for backward compatibility).
 * Canon source is Contentlayer.
 */
let postsCache: PostType[] | null = null;

export function initializePosts(posts: PostType[] = []): void {
  postsCache = Array.isArray(posts) ? posts : [];
  console.log(`[posts] Initialized ${postsCache.length} posts (legacy cache)`);
}

/**
 * Convert Contentlayer Post doc -> strict PostType.
 * This must satisfy ALL required fields in PostMeta + content.
 */
function mapDocToPost(doc: any): PostType {
  const slug = normalizeSlug(doc);

  // Contentlayer usually uses `draft`; your model uses `published`
  const published = doc?.draft === true ? false : true;

  const content = String(doc?.body?.raw ?? doc?.content ?? "");

  // Required fields in PostMeta
  const title = String(doc?.title ?? "Untitled");
  const date = String(doc?.date ?? new Date().toISOString().split("T")[0]);
  const excerpt = String(doc?.excerpt ?? doc?.description ?? "").trim();

  const category = String(doc?.category ?? "");
  const tags = Array.isArray(doc?.tags) ? doc.tags.map(String) : [];
  const author = String(doc?.author ?? "");
  const readTime = String(doc?.readTime ?? "");

  return {
    slug,
    title,
    date,
    excerpt,

    published,
    featured: Boolean(doc?.featured),

    category,
    tags,
    author,
    readTime,

    subtitle: doc?.subtitle ? String(doc.subtitle) : undefined,
    description: doc?.description ? String(doc.description) : undefined,

    coverImage: doc?.coverImage ?? null,
    ogImage: doc?.ogImage ?? null,

    series: doc?.series ? String(doc.series) : undefined,
    seriesOrder: typeof doc?.seriesOrder === "number" ? doc.seriesOrder : undefined,

    coverAspect: doc?.coverAspect ? String(doc.coverAspect) : undefined,
    coverFit: doc?.coverFit ? String(doc.coverFit) : undefined,
    coverPosition: doc?.coverPosition ? String(doc.coverPosition) : undefined,

    authors: Array.isArray(doc?.authors) ? doc.authors.map(String) : undefined,
    wordCount: typeof doc?.wordCount === "number" ? doc.wordCount : undefined,
    canonicalUrl: doc?.canonicalUrl ? String(doc.canonicalUrl) : undefined,
    noindex: typeof doc?.noindex === "boolean" ? doc.noindex : undefined,
    lastModified: doc?.lastModified ? String(doc.lastModified) : undefined,

    content,
    html: doc?.html ? String(doc.html) : undefined,
    compiledSource: doc?.compiledSource ? String(doc.compiledSource) : undefined,
  };
}

function getPostsFromContentlayer(): PostType[] {
  try {
    const docs = getPublishedPostDocs();
    return docs.map(mapDocToPost);
  } catch (e) {
    console.error("[posts] contentlayer mapping failed:", e);
    return [];
  }
}

function getSourcePosts(): PostType[] {
  if (Array.isArray(postsCache) && postsCache.length > 0) return postsCache;
  return getPostsFromContentlayer();
}

export function getAllPosts(): PostForClientType[] {
  try {
    return getSourcePosts().map(transformPostForClient);
  } catch (error) {
    console.error("[posts] Error in getAllPosts:", error);
    return [];
  }
}

export function getPostBySlugWithContent(slug: string): PostType | null {
  const s = String(slug || "").trim().toLowerCase();
  if (!s) return null;

  return getSourcePosts().find((p) => p.slug.toLowerCase() === s) ?? null;
}

export function getPostBySlug(slug: string): PostForClientType | null {
  const post = getPostBySlugWithContent(slug);
  return post ? transformPostForClient(post) : null;
}

export function getPublicPosts(): PostForClientType[] {
  return getAllPosts().filter((p) => p.published !== false);
}

export function getFeaturedPosts(): PostForClientType[] {
  try {
    const featured = getFeaturedPostsUtil(getSourcePosts());
    return featured.map(transformPostForClient);
  } catch {
    return getAllPosts().filter((p) => p.featured === true);
  }
}

export function getPostSummaries(): PostSummaryType[] {
  try {
    const sorted = sortPostsByDate(getSourcePosts(), "desc");
    return sorted.map(toPostSummary);
  } catch (e) {
    console.error("[posts] Error building summaries:", e);
    return [];
  }
}

export function searchPosts(query: string): PostSummaryType[] {
  try {
    const results = searchPostsUtil(getSourcePosts(), query);
    return results.map(toPostSummary);
  } catch (e) {
    console.error("[posts] searchPosts error:", e);
    return [];
  }
}

export function getPaginatedPostSummaries(page = 1, perPage = 10): PostList {
  const summaries = getPostSummaries();
  return paginatePosts(summaries, page, perPage);
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
};

export default postsAPI;