// lib/posts-utils.ts
// Production-safe utilities with guaranteed named exports.

import type { PostMeta, Post, PostForClient, PostSummary, PostList } from "@/types/post";

// ---------------------------
// Image normalization
// ---------------------------

type ImageLike = string | { src?: string | null } | null | undefined;

function normalizeImage(image: ImageLike): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && typeof image.src === "string") return image.src;
  return null;
}

function normalizeImageToUndefined(image: ImageLike): string | undefined {
  const n = normalizeImage(image);
  return n === null ? undefined : n;
}

// ---------------------------
// Transformations
// ---------------------------

export function transformPostForClient(post: Post | PostMeta): PostForClient {
  // Ensure the client always gets the core content fields (safe defaults).
  const content = typeof (post as any).content === "string" ? (post as any).content : "";
  const html = typeof (post as any).html === "string" ? (post as any).html : "";
  const compiledSource =
    typeof (post as any).compiledSource === "string" ? (post as any).compiledSource : "";

  return {
    ...(post as any),
    coverImage: normalizeImageToUndefined((post as any).coverImage),
    ogImage: normalizeImageToUndefined((post as any).ogImage),
    content,
    html,
    compiledSource,
  } as PostForClient;
}

export function toPostSummary(post: PostMeta | Post): PostSummary {
  return {
    slug: post.slug,
    title: post.title,
    excerpt: (post.excerpt ?? "").toString(),
    date: post.date,
    category: (post.category ?? "").toString(),
    readTime: (post.readTime ?? "").toString(),
    coverImage: normalizeImage((post as any).coverImage),
    tags: Array.isArray(post.tags) ? post.tags : [],
    author: (post.author ?? "").toString(),
    featured: Boolean(post.featured),
  };
}

// ---------------------------
// Sorting / filtering
// ---------------------------

export function sortPostsByDate<T extends PostMeta>(posts: T[], order: "desc" | "asc" = "desc"): T[] {
  return [...posts].sort((a, b) => {
    const da = new Date(a.date || 0).getTime();
    const db = new Date(b.date || 0).getTime();
    return order === "desc" ? db - da : da - db;
  });
}

export function getFeaturedPosts<T extends PostMeta>(posts: T[]): T[] {
  return posts.filter((p) => p.featured === true);
}

// ---------------------------
// Search
// ---------------------------

export function searchPosts<T extends PostMeta>(posts: T[], query: string): T[] {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  return posts.filter((post) => {
    const haystack = [
      post.title,
      post.excerpt,
      post.description,
      post.subtitle,
      post.category,
      post.author,
      ...(Array.isArray(post.tags) ? post.tags : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

// ---------------------------
// Pagination
// ---------------------------

export function paginatePosts(
  posts: PostMeta[],
  page = 1,
  perPage = 10
): PostList {
  const safePerPage = Math.max(1, Math.min(100, Math.floor(perPage)));
  const total = posts.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const safePage = Math.max(1, Math.min(totalPages, Math.floor(page)));

  const start = (safePage - 1) * safePerPage;
  const end = Math.min(start + safePerPage, total);

  const pageItems = posts.slice(start, end).map(toPostSummary);

  return {
    posts: pageItems,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrevious: safePage > 1,
  };
}

// Default export (optional convenience)
const PostUtils = {
  transformPostForClient,
  toPostSummary,
  sortPostsByDate,
  getFeaturedPosts,
  searchPosts,
  paginatePosts,
};

export default PostUtils;
