// lib/posts-utils.ts - COMPLETE UTILITY FUNCTIONS
import { 
  Post, 
  PostMeta, 
  PostWithContent, 
  PostForClient,
  PostSummary,
  ImageType,
  PostList,
  PostNavigation
} from '@/types/post';

// SOLUTION 3: Enhanced normalizeImage function with multiple outputs
export function normalizeImage(image: ImageType): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (typeof image === 'object' && image.src) return image.src;
  return null;
}

export function normalizeImageToUndefined(image: ImageType): string | undefined {
  const result = normalizeImage(image);
  return result === null ? undefined : result;
}

export function normalizeImageToString(image: ImageType, fallback: string = ''): string {
  const result = normalizeImage(image);
  return result === null ? fallback : result;
}

// SOLUTION 2: Transform functions for different use cases
export function transformPostToWithContent(post: Post): PostWithContent {
  return {
    ...post,
    coverImage: normalizeImage(post.coverImage as any),     // string | null
    ogImage: normalizeImage(post.ogImage as any),           // string | null
    content: post.content || '',
        html: post.html || '',
};
}

export function transformPostForClient(post: Post): PostForClient {
  return {
    ...post,
    coverImage: normalizeImageToUndefined(post.coverImage as any),  // string | undefined
    ogImage: normalizeImageToUndefined(post.ogImage as any),        // string | undefined
    content: post.content || '',
        html: post.html || '',
};
}

export function toPostSummary(postMeta: PostMeta | Post): PostSummary {
  return {
    slug: postMeta.slug,
    title: postMeta.title,
        excerpt: postMeta.excerpt || '',
    date: postMeta.date,
        category: postMeta.category || '',
        readTime: postMeta.readTime || '',
    coverImage: normalizeImage(postMeta.coverImage as any),
    tags: postMeta.tags,
        author: postMeta.author || '',
    featured: postMeta.featured || false
  };
}

// Fixed version of your problematic function
export function getAllPostsForClient(posts: Post[]): PostForClient[] {
  try {
    if (!Array.isArray(posts)) return [];
    return posts.map(post => transformPostForClient(post));
  } catch {
    return [];
  }
}

export function getAllPostsWithContent(posts: Post[]): PostWithContent[] {
  try {
    if (!Array.isArray(posts)) return [];
    return posts.map(post => transformPostToWithContent(post));
  } catch {
    return [];
  }
}

// Validation
export function validatePostMeta(postMeta: Partial<PostMeta>): postMeta is PostMeta {
  return !!(postMeta.slug && postMeta.title && postMeta.date);
}

// Content utilities
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

export function calculateReadingTime(content: string, wordsPerMinute: number = 200): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function getWordCount(content: string): number {
  return content.trim().split(/\s+/).length;
}

// Sorting and filtering
export function sortPostsByDate(posts: PostMeta[], order: 'desc' | 'asc' = 'desc'): PostMeta[] {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}

export function filterByCategory(posts: PostMeta[], category: string): PostMeta[] {
  return posts.filter(post => post.category === category);
}

export function filterByTag(posts: PostMeta[], tag: string): PostMeta[] {
  return posts.filter(post => post.tags?.includes(tag));
}

export function getCategories(posts: PostMeta[]): string[] {
  const categories = new Set<string>();
  posts.forEach(post => post.category && categories.add(post.category));
  return Array.from(categories).sort();
}

export function getTags(posts: PostMeta[]): string[] {
  const tags = new Set<string>();
  posts.forEach(post => post.tags?.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}

export function getSeriesPosts(posts: PostMeta[], seriesName: string): PostMeta[] {
  return posts
    .filter(post => post.series === seriesName)
    .sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
}

// Pagination
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

// Search
export function searchPosts(posts: PostMeta[], query: string): PostMeta[] {
  const lowerQuery = query.toLowerCase();
  return posts.filter(post => 
    post.title.toLowerCase().includes(lowerQuery) ||
    post.excerpt?.toLowerCase().includes(lowerQuery) ||
    post.description?.toLowerCase().includes(lowerQuery)
  );
}

export function getFeaturedPosts(posts: PostMeta[]): PostMeta[] {
  return posts.filter(post => post.featured);
}

export function getRecentPosts(posts: PostMeta[], limit: number = 5): PostMeta[] {
  return sortPostsByDate(posts).slice(0, limit);
}

// Factory function
export function createPostMeta(data: Partial<PostMeta>): PostMeta {
  return {
    slug: data.slug || '',
    title: data.title || '',
    date: data.date || new Date().toISOString().split('T')[0],
    subtitle: data.subtitle,
        excerpt: data.excerpt || '',
    description: data.description,
    lastModified: data.lastModified,
    published: data.published ?? true,
        category: data.category || '',
    tags: data.tags || [],
    series: data.series,
    seriesOrder: data.seriesOrder,
    coverImage: data.coverImage,
    ogImage: data.ogImage,
    coverAspect: data.coverAspect,
    coverFit: data.coverFit,
    coverPosition: data.coverPosition,
        author: data.author || '',
    authors: data.authors,
        readTime: data.readTime || '',
    wordCount: data.wordCount,
    canonicalUrl: data.canonicalUrl,
    noindex: data.noindex,
    featured: data.featured || false,
  };
}

// Namespace export
export const PostUtils = {
  // Image utilities
  normalizeImage,
  normalizeImageToUndefined,
  normalizeImageToString,
  
  // Transformation functions
  transformPostToWithContent,
  transformPostForClient,
  toPostSummary,
  getAllPostsForClient,
  getAllPostsWithContent,
  
  // Validation
  validatePostMeta,
  
  // Content utilities
  extractExcerpt,
  calculateReadingTime,
  getWordCount,
  
  // Sorting and filtering
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
  
  // Factory
  createPostMeta,
};

export default PostUtils;

