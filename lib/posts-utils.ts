// lib/posts-utils.ts - UTILITY FUNCTIONS ONLY (NO TYPES)
import { 
  Post, 
  PostMeta, 
  PostWithContent, 
  PostForClient,
  PostSummary,
  ImageType,
  PostList,
  PostNavigation,
  FrontmatterValidation
} from '@/types/post';

/**
 * Normalize image to string | null
 */
export function normalizeImage(image: ImageType): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.src) return image.src;
  return null;
}

/**
 * Normalize image to string | undefined (no null)
 */
export function normalizeImageToUndefined(image: ImageType): string | undefined {
  const result = normalizeImage(image);
  return result === null ? undefined : result;
}

/**
 * Normalize image to string with fallback
 */
export function normalizeImageToString(image: ImageType, fallback: string = ''): string {
  const result = normalizeImage(image);
  return result === null ? fallback : result;
}

/**
 * Transform Post to PostWithContent (allows null)
 */
export function transformPostToWithContent(post: Post): PostWithContent {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    description: post.description,
    coverImage: normalizeImage(post.coverImage as any),
    ogImage: normalizeImage(post.ogImage as any),
        published: post.published ?? true,
        featured: post.featured ?? false,
        category: post.category || '',
    tags: post.tags,
        author: post.author || '',
        readTime: post.readTime || '',
    content: post.content || '',
        html: post.html || '',
        compiledSource: post.compiledSource || '',
    subtitle: post.subtitle,
    lastModified: post.lastModified,
    series: post.series,
    seriesOrder: post.seriesOrder,
    coverAspect: post.coverAspect,
    coverFit: post.coverFit,
    coverPosition: post.coverPosition,
    authors: post.authors,
    wordCount: post.wordCount,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
  };
}

/**
 * Transform Post to PostForClient (no null)
 */
export function transformPostForClient(post: Post): PostForClient {
  return {
    slug: post.slug,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    description: post.description,
    coverImage: normalizeImageToUndefined(post.coverImage as any),
    ogImage: normalizeImageToUndefined(post.ogImage as any),
        published: post.published ?? true,
        featured: post.featured ?? false,
        category: post.category || '',
    tags: post.tags,
        author: post.author || '',
        readTime: post.readTime || '',
    content: post.content || '',
        html: post.html || '',
        compiledSource: post.compiledSource || '',
    subtitle: post.subtitle,
    lastModified: post.lastModified,
    series: post.series,
    seriesOrder: post.seriesOrder,
    coverAspect: post.coverAspect,
    coverFit: post.coverFit,
    coverPosition: post.coverPosition,
    authors: post.authors,
    wordCount: post.wordCount,
    canonicalUrl: post.canonicalUrl,
    noindex: post.noindex,
  };
}

/**
 * Convert PostMeta to PostSummary
 */
export function toPostSummary(postMeta: PostMeta | Post): PostSummary {
  return {
    slug: postMeta.slug,
    title: postMeta.title,
    excerpt: postMeta.excerpt,
    date: postMeta.date,
        category: postMeta.category || '',
        readTime: postMeta.readTime || '',
    coverImage: normalizeImage(postMeta.coverImage as any),
    tags: postMeta.tags,
        author: postMeta.author || '',
    featured: postMeta.featured || false,
  };
}

/**
 * Validate required post fields
 */
export function validatePostMeta(postMeta: Partial<PostMeta>): postMeta is PostMeta {
  return !!(postMeta.slug && postMeta.title && postMeta.date);
}

/**
 * Extract excerpt from content
 */
export function extractExcerpt(content: string, maxLength: number = 160): string {
  const plain = content
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
  
  if (plain.length <= maxLength) return plain;
  
  const truncated = plain.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclamation);
  
  if (lastSentence > 0) return plain.substring(0, lastSentence + 1);
  
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? plain.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

/**
 * Get word count
 */
export function getWordCount(content: string): number {
  return content.trim().split(/\s+/).length;
}

/**
 * Sort posts by date
 */
export function sortPostsByDate<T extends { date?: string }>(
  posts: T[], 
  order: 'desc' | 'asc' = 'desc'
): T[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Filter posts by category
 */
export function filterByCategory(posts: PostMeta[], category: string): PostMeta[] {
  return posts.filter(post => post.category === category);
}

/**
 * Filter posts by tag
 */
export function filterByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter(post => post.tags?.includes(tag));
}

/**
 * Get unique categories
 */
export function getCategories(posts: PostMeta[]): string[] {
  const categories = new Set<string>();
  posts.forEach(post => post.category && categories.add(post.category));
  return Array.from(categories).sort();
}

/**
 * Get unique tags
 */
export function getTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

/**
 * Get posts in a series
 */
export function getSeriesPosts(posts: PostMeta[], seriesName: string): PostMeta[] {
  return posts
    .filter(post => post.series === seriesName)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}

/**
 * Paginate posts
 */
export function paginatePosts(
  posts: PostMeta[],
  page: number = 1,
  perPage: number = 10
): PostList {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginated = posts.slice(start, end);
  
  return {
    posts: paginated.map(toPostSummary),
    
  };
}

/**
 * Get post navigation
 */
export function getPostNavigation(
  posts: PostMeta[],
  currentSlug: string
): PostNavigation {
  const sortedPosts = sortPostsByDate(posts);
  const currentIndex = sortedPosts.findIndex(p => p.slug === currentSlug);
  
  if (currentIndex === -1) return {};
  
  return {
    prev: currentIndex > 0 ? toPostSummary(sortedPosts[currentIndex - 1]) : undefined,
    next: currentIndex < sortedPosts.length - 1 ? toPostSummary(sortedPosts[currentIndex + 1]) : undefined,
  };
}

/**
 * Search posts
 */
export function searchPosts(posts: PostMeta[], query: string): PostMeta[] {
  const lowerQuery = query.toLowerCase();
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt?.toLowerCase().includes(lowerQuery) ||
    post.description?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(posts: PostMeta[]): PostMeta[] {
  return posts.filter(post => post.featured);
}

/**
 * Get recent posts
 */
export function getRecentPosts(posts: PostMeta[], limit: number = 5): PostMeta[] {
  return sortPostsByDate(posts).slice(0, limit);
}

/**
 * Create PostMeta from partial data
 */
export function createPostMeta(data: Partial<PostMeta>): PostMeta {
  return {
    slug: data.slug || '',
    title: data.title || '',
    date: data.date || new Date().toISOString().split('T')[0],
        excerpt: data.excerpt || '',
    description: data.description,
    coverImage: data.coverImage,
    ogImage: data.ogImage,
    published: data.published ?? true,
    featured: data.featured || false,
        category: data.category || '',
    tags: data.tags || [],
        author: data.author || '',
        readTime: data.readTime || '',
    subtitle: data.subtitle,
    lastModified: data.lastModified,
    series: data.series,
    seriesOrder: data.seriesOrder,
    coverAspect: data.coverAspect,
    coverFit: data.coverFit,
    coverPosition: data.coverPosition,
    authors: data.authors,
    wordCount: data.wordCount,
    canonicalUrl: data.canonicalUrl,
    noindex: data.noindex,
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
  
  (schema.required || []).forEach(field => {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  Object.entries((schema.types || {})).forEach(([field, expectedType]) => {
    if (field in data && data[field] !== null && data[field] !== undefined) {
      const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
      if (actualType !== expectedType) {
        errors.push(`Field '${field}' should be ${expectedType}, got ${actualType}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
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



