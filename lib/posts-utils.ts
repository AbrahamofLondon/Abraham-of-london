// lib/posts-utils.ts - UTILITY FUNCTIONS ONLY (STRICT + FIXED)
/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  Post,
  PostMeta,
  PostWithContent,
  PostForClient,
  PostSummary,
  ImageType,
  PostList,
  PostNavigation,
  FrontmatterValidation,
} from "@/types/post";

/**
 * Image inputs in your system are effectively: string | ImageType | null | undefined
 */
export type ImageInput = string | ImageType | null | undefined;

/**
 * Normalize image to string | null
 */
export function normalizeImage(image: ImageInput): string | null {
  if (!image) return null;
  if (typeof image === "string") return image.trim() ? image : null;
  if (typeof image === "object" && typeof image.src === "string" && image.src.trim()) return image.src;
  return null;
}

/**
 * Normalize image to string | undefined (no null)
 */
export function normalizeImageToUndefined(image: ImageInput): string | undefined {
  const result = normalizeImage(image);
  return result ?? undefined;
}

/**
 * Normalize image to string with fallback
 */
export function normalizeImageToString(image: ImageInput, fallback = ""): string {
  return normalizeImage(image) ?? fallback;
}

/**
 * Transform Post -> PostWithContent (ensures html + compiledSource exist)
 */
export function transformPostToWithContent(post: Post): PostWithContent {
  return {
    ...post,
    coverImage: normalizeImage(post.coverImage),
    ogImage: normalizeImage(post.ogImage),
    published: post.published ?? true,
    featured: post.featured ?? false,
    category: post.category || "",
    author: post.author || "",
    readTime: post.readTime || "",
    content: post.content || "",
    html: post.html || "",
    compiledSource: post.compiledSource || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
  };
}

/**
 * Transform Post -> PostForClient (no null images; optional fields allowed)
 */
export function transformPostForClient(post: Post): PostForClient {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,

    description: post.description,
    subtitle: post.subtitle,

    coverImage: normalizeImageToUndefined(post.coverImage),
    ogImage: normalizeImageToUndefined(post.ogImage),

    published: post.published ?? true,
    featured: post.featured ?? false,

    category: post.category || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    author: post.author || "",
    readTime: post.readTime || "",

    content: post.content || "",
    html: post.html || "",
    // NOTE: PostForClient does not define compiledSource, so we intentionally don't include it

    series: post.series,
    seriesOrder: post.seriesOrder,
    coverAspect: post.coverAspect,
    coverFit: post.coverFit,
    coverPosition: post.coverPosition,
    authors: post.authors,
    wordCount: post.wordCount,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
    lastModified: post.lastModified,
  };
}

/**
 * Convert PostMeta/Post -> PostSummary
 */
export function toPostSummary(postMeta: PostMeta | Post): PostSummary {
  const summary: any = {
    slug: postMeta.slug,
    title: postMeta.title,
    excerpt: postMeta.excerpt,
    date: postMeta.date,

    // Removed description since PostSummary doesn't have it
    // description: postMeta.description,
    subtitle: postMeta.subtitle,

    coverImage: normalizeImage(postMeta.coverImage),
    ogImage: normalizeImage(postMeta.ogImage),

    published: postMeta.published ?? true,
    featured: postMeta.featured ?? false,

    // These are optional in PostSummary but we'll include them if they exist
    ...(postMeta.category && { category: postMeta.category }),
    ...(postMeta.author && { author: postMeta.author }),
    ...(postMeta.readTime && { readTime: postMeta.readTime }),

    tags: Array.isArray(postMeta.tags) ? postMeta.tags : [],

    series: postMeta.series,
    seriesOrder: postMeta.seriesOrder,
    coverAspect: postMeta.coverAspect,
    coverFit: postMeta.coverFit,
    coverPosition: postMeta.coverPosition,
    authors: postMeta.authors,
    wordCount: postMeta.wordCount,
    canonicalUrl: postMeta.canonicalUrl,
    noindex: postMeta.noindex,
    lastModified: postMeta.lastModified,
  };

  return summary as PostSummary;
}

/**
 * Validate required post fields
 */
export function validatePostMeta(postMeta: Partial<PostMeta>): postMeta is PostMeta {
  return Boolean(postMeta.slug && postMeta.title && postMeta.date);
}

/**
 * Extract excerpt from content
 */
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

  const truncated = plain.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  const lastQuestion = truncated.lastIndexOf("?");
  const lastExclamation = truncated.lastIndexOf("!");
  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);

  if (lastSentence > 0) return plain.substring(0, lastSentence + 1);

  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? plain.substring(0, lastSpace) + "..." : truncated + "...";
}

/**
 * Reading time
 */
export function calculateReadingTime(content: string, wordsPerMinute = 200): string {
  const words = String(content || "").trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return `${minutes} min read`;
}

/**
 * Word count
 */
export function getWordCount(content: string): number {
  return String(content || "").trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sort by date
 */
export function sortPostsByDate<T extends { date?: string }>(posts: T[], order: "desc" | "asc" = "desc"): T[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Filters
 */
export function filterByCategory(posts: PostMeta[], category: string): PostMeta[] {
  return posts.filter((post) => post.category === category);
}

export function filterByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter((post) => post.tags?.includes(tag));
}

/**
 * Unique categories/tags
 */
export function getCategories(posts: PostMeta[]): string[] {
  const categories = new Set<string>();
  posts.forEach((post) => post.category && categories.add(post.category));
  return Array.from(categories).sort();
}

export function getTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  posts.forEach((post) => post.tags?.forEach((t) => tags.add(t)));
  return Array.from(tags).sort();
}

/**
 * Series
 */
export function getSeriesPosts(posts: PostMeta[], seriesName: string): PostMeta[] {
  return posts
    .filter((post) => post.series === seriesName)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}

/**
 * Paginate (FIXED: returns full PostList)
 */
export function paginatePosts(
  posts: PostMeta[] | PostSummary[],
  page = 1,
  perPage = 10
): PostList {
  const safePage = Math.max(1, Number.isFinite(page) ? page : 1);
  const safePer = Math.max(1, Number.isFinite(perPage) ? perPage : 10);

  const total = posts.length;
  const totalPages = Math.max(1, Math.ceil(total / safePer));

  const clampedPage = Math.min(safePage, totalPages);

  const start = (clampedPage - 1) * safePer;
  const end = start + safePer;

  const slice = posts.slice(start, end);

  return {
    posts: slice.map((p) => ("slug" in p && "title" in p ? toPostSummary(p as any) : (p as PostSummary))),
    total,
    page: clampedPage,
    totalPages,
    hasNext: clampedPage < totalPages,
    hasPrevious: clampedPage > 1,
  };
}

/**
 * Navigation
 */
export function getPostNavigation(posts: PostMeta[], currentSlug: string): PostNavigation {
  const sorted = sortPostsByDate(posts);
  const currentIndex = sorted.findIndex((p) => p.slug === currentSlug);

  if (currentIndex === -1) return {};

  return {
    prev: currentIndex > 0 ? toPostSummary(sorted[currentIndex - 1]) : null,
    next: currentIndex < sorted.length - 1 ? toPostSummary(sorted[currentIndex + 1]) : null,
  };
}

/**
 * Search
 */
export function searchPosts(posts: PostMeta[], query: string): PostMeta[] {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return posts;

  return posts.filter((post) => {
    const title = String(post.title || "").toLowerCase();
    const excerpt = String(post.excerpt || "").toLowerCase();
    const desc = String(post.description || "").toLowerCase();
    return title.includes(q) || excerpt.includes(q) || desc.includes(q);
  });
}

/**
 * Featured + recent
 */
export function getFeaturedPosts(posts: PostMeta[]): PostMeta[] {
  return posts.filter((post) => post.featured === true);
}

export function getRecentPosts(posts: PostMeta[], limit = 5): PostMeta[] {
  return sortPostsByDate(posts).slice(0, Math.max(1, limit));
}

/**
 * Create PostMeta from partial data
 */
export function createPostMeta(data: Partial<PostMeta>): PostMeta {
  return {
    slug: data.slug || "",
    title: data.title || "",
    date: data.date || new Date().toISOString().split("T")[0],
    excerpt: data.excerpt || "",

    published: data.published ?? true,
    featured: data.featured ?? false,

    category: data.category || "",
    tags: data.tags || [],
    author: data.author || "",
    readTime: data.readTime || "",

    subtitle: data.subtitle,
    description: data.description,
    coverImage: data.coverImage ?? null,
    ogImage: data.ogImage ?? null,

    series: data.series,
    seriesOrder: data.seriesOrder,

    coverAspect: data.coverAspect,
    coverFit: data.coverFit,
    coverPosition: data.coverPosition,

    authors: data.authors,
    wordCount: data.wordCount,
    canonicalUrl: data.canonicalUrl,
    noindex: data.noindex,
    lastModified: data.lastModified,
  };
}

/**
 * Validate frontmatter
 */
export function validateFrontmatter(
  data: Record<string, unknown>,
  schema: FrontmatterValidation
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  (schema.required || []).forEach((field) => {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  Object.entries(schema.types || {}).forEach(([field, expectedType]) => {
    if (field in data && data[field] !== null && data[field] !== undefined) {
      const actualType = Array.isArray(data[field]) ? "array" : typeof data[field];
      if (actualType !== expectedType) {
        errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

// Export utilities as namespace
export const PostUtils = {
  normalizeImage,
  normalizeImageToUndefined,
  normalizeImageToString,
  transformPostToWithContent,
  transformPostForClient,
  toPostSummary,
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
  createPostMeta,
  validateFrontmatter,
};

export default PostUtils;