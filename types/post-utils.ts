// lib/posts-utils.ts - Production utilities (safe exports, stable typing)

import type {
  ImageType,
  Post,
  PostForClient,
  PostList,
  PostMeta,
  PostNavigation,
  PostSummary,
  PostWithContent,
} from "@/types/post";

// ============================================================================
// IMAGE NORMALIZATION
// ============================================================================

export function normalizeImage(image: ImageType | string | null | undefined): string | null {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (typeof image === "object" && typeof image.src === "string") return image.src;
  return null;
}

export function normalizeImageToUndefined(
  image: ImageType | string | null | undefined
): string | undefined {
  const result = normalizeImage(image);
  return result === null ? undefined : result;
}

export function normalizeImageToString(
  image: ImageType | string | null | undefined,
  fallback = ""
): string {
  const result = normalizeImage(image);
  return result === null ? fallback : result;
}

// ============================================================================
// TRANSFORMATIONS
// ============================================================================

export function transformPostToWithContent(post: Post): PostWithContent {
  return {
    ...post,
    coverImage: normalizeImage(post.coverImage),
    ogImage: normalizeImage(post.ogImage),
    content: post.content || "",
    html: post.html || "",
    compiledSource: post.compiledSource || "",
  };
}

export function transformPostForClient(post: Post): PostForClient {
  return {
    ...post,
    coverImage: normalizeImageToUndefined(post.coverImage),
    ogImage: normalizeImageToUndefined(post.ogImage),
    content: post.content || "",
    html: post.html || "",
    compiledSource: post.compiledSource || "",
  };
}

export function toPostSummary(postMeta: PostMeta): PostSummary {
  return {
    slug: postMeta.slug,
    title: postMeta.title,
    excerpt: postMeta.excerpt || "",
    date: postMeta.date,
    category: postMeta.category || "",
    readTime: postMeta.readTime || "",
    coverImage: normalizeImage(postMeta.coverImage),
    tags: postMeta.tags || [],
    author: postMeta.author || "",
    featured: postMeta.featured || false,
  };
}

// ============================================================================
// COLLECTION HELPERS
// ============================================================================

export function getAllPostsForClient(posts: Post[]): PostForClient[] {
  if (!Array.isArray(posts)) return [];
  return posts.map(transformPostForClient);
}

export function getAllPostsWithContent(posts: Post[]): PostWithContent[] {
  if (!Array.isArray(posts)) return [];
  return posts.map(transformPostToWithContent);
}

// ============================================================================
// VALIDATION
// ============================================================================

export function validatePostMeta(postMeta: Partial<PostMeta>): postMeta is PostMeta {
  return !!(postMeta.slug && postMeta.title && postMeta.date);
}

// ============================================================================
// CONTENT UTILITIES
// ============================================================================

export function extractExcerpt(content: string, maxLength = 160): string {
  const plain = String(content || "")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim();

  if (plain.length <= maxLength) return plain;

  const truncated = plain.slice(0, maxLength);
  const lastSentence = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("?"),
    truncated.lastIndexOf("!")
  );

  if (lastSentence > 0) return plain.slice(0, lastSentence + 1);

  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? plain.slice(0, lastSpace) + "..." : truncated + "...";
}

export function calculateReadingTime(content: string, wordsPerMinute = 200): string {
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

export function getWordCount(content: string): number {
  return String(content || "").trim().split(/\s+/).filter(Boolean).length;
}

// ============================================================================
// SORTING + FILTERING
// ============================================================================

export function sortPostsByDate(posts: PostMeta[], order: "desc" | "asc" = "desc"): PostMeta[] {
  return [...(posts || [])].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

export function filterByCategory(posts: PostMeta[], category: string): PostMeta[] {
  return (posts || []).filter((post) => post.category === category);
}

export function filterByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return (posts || []).filter((post) => Array.isArray(post.tags) && post.tags.includes(tag));
}

export function getCategories(posts: PostMeta[]): string[] {
  const categories = new Set<string>();
  (posts || []).forEach((post) => {
    if (post.category) categories.add(post.category);
  });
  return Array.from(categories).sort();
}

export function getTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  (posts || []).forEach((post) => {
    (post.tags || []).forEach((tag) => tags.add(tag));
  });
  return Array.from(tags).sort();
}

export function getSeriesPosts(posts: PostMeta[], seriesName: string): PostMeta[] {
  return (posts || [])
    .filter((post) => post.series === seriesName)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}

// ============================================================================
// PAGINATION  ✅ THIS MUST BE A NAMED EXPORT
// ============================================================================

export function paginatePosts(posts: PostMeta[], page = 1, perPage = 10): PostList {
  const safePosts = Array.isArray(posts) ? posts : [];
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePerPage = Number.isFinite(perPage) && perPage > 0 ? perPage : 10;

  const start = (safePage - 1) * safePerPage;
  const end = start + safePerPage;

  const total = safePosts.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const currentPage = Math.min(safePage, totalPages);

  const sliceStart = (currentPage - 1) * safePerPage;
  const sliceEnd = sliceStart + safePerPage;

  const paginated = safePosts.slice(sliceStart, sliceEnd);

  return {
    posts: paginated.map(toPostSummary),
    total,
    page: currentPage,
    perPage: safePerPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
}

export function getPostNavigation(posts: PostMeta[], currentSlug: string): PostNavigation {
  const sorted = sortPostsByDate(posts, "desc");
  const idx = sorted.findIndex((p) => p.slug === currentSlug);
  if (idx === -1) return {};

  return {
    prev: idx > 0 ? toPostSummary(sorted[idx - 1]) : undefined,
    next: idx < sorted.length - 1 ? toPostSummary(sorted[idx + 1]) : undefined,
  };
}

// ============================================================================
// SEARCH
// ============================================================================

export function searchPosts(posts: PostMeta[], query: string): PostMeta[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return posts || [];

  return (posts || []).filter((post) => {
    const hay = [
      post.title,
      post.excerpt,
      post.description,
      post.subtitle,
      post.category,
      post.author,
      ...(post.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return hay.includes(q);
  });
}

export function getFeaturedPosts(posts: PostMeta[]): PostMeta[] {
  return (posts || []).filter((post) => post.featured === true);
}

export function getRecentPosts(posts: PostMeta[], limit = 5): PostMeta[] {
  return sortPostsByDate(posts, "desc").slice(0, Math.max(0, limit));
}

// ============================================================================
// DEFAULT + NAMESPACE (OPTIONAL)
// ============================================================================

export const PostUtils = {
  normalizeImage,
  normalizeImageToUndefined,
  normalizeImageToString,
  transformPostToWithContent,
  transformPostForClient,
  toPostSummary,
  getAllPostsForClient,
  getAllPostsWithContent,
  validatePostMeta,
  extractExcerpt,
  calculateReadingTime,
  getWordCount,
  sortPostsByDate,
  filterByCategory,
  filterByTag,
  getCategories,
  getTags,
  getSeriesPosts,
  paginatePosts,
  getPostNavigation,
  searchPosts,
  getFeaturedPosts,
  getRecentPosts,
} as const;

export default PostUtils;