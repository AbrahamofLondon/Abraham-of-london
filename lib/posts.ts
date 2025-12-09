// lib/posts.ts - COMPLETE FIXED VERSION
import { 
  Post as PostType, 
  PostMeta as PostMetaType, 
  PostWithContent as PostWithContentType,
  PostForClient as PostForClientType,
  PostSummary as PostSummaryType 
} from '@/types/post';

import { 
  transformPostForClient,
  transformPostToWithContent,
  toPostSummary,
  sortPostsByDate,
  paginatePosts,
  searchPosts as searchPostsUtil,
  getFeaturedPosts as getFeaturedPostsUtil,
  createPostMeta,
  normalizeImageToUndefined
} from '@/lib/posts-utils';

// Re-export types for convenience
export type Post = PostType;
export type PostMeta = PostMetaType;
export type PostWithContent = PostWithContentType;
export type PostForClient = PostForClientType;
export type PostSummary = PostSummaryType;

// Store for posts data
let postsCache: PostType[] = [];

/**
 * Initialize posts data
 */
export function initializePosts(posts: PostType[]): void {
  postsCache = posts;
  console.log(`[posts] Initialized ${posts.length} posts`);
}

/**
 * Get all posts for client display
 */
export function getAllPosts(): PostForClientType[] {
  if (!postsCache.length) {
    console.warn('[posts] Posts cache is empty. Call initializePosts() first.');
    return [];
  }
  
  try {
    return postsCache.map(post => transformPostForClient(post));
  } catch (error) {
    console.error('[posts] Error in getAllPosts:', error);
    return [];
  }
}

/**
 * Get post by slug (with content for server-side)
 */
export function getPostBySlugWithContent(slug: string): PostType | null {
  if (!postsCache.length) {
    console.warn('[posts] Posts cache is empty. Call initializePosts() first.');
    return null;
  }
  
  return postsCache.find(post => post.slug === slug) || null;
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
  const allPosts = getAllPosts();
  return allPosts.filter(post => post.published !== false);
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(): PostForClientType[] {
  const allPosts = getAllPosts();
  return allPosts.filter(post => post.featured === true);
}

// ... rest of your functions (getPostSummaries, getSortedPosts, etc.)

// Main API object
export const postsAPI = {
  // Data initialization
  initializePosts,
  
  // Getter functions
  getAllPosts,
  getPublicPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostBySlugWithContent,
  // ... other functions
};

// Default export
export default postsAPI;