// lib/posts.ts - CONTENTLAYER-FIRST + STRICT TYPES (FIXED)
/* eslint-disable no-console */
import type {
  Post as PostType,
  PostForClient as PostForClientType,
  PostSummary as PostSummaryType,
  PostList,
} from "@/types/post";

import {
  PostMetaUtils,
  TypeGuards,
  PostFactory,
  Validation,
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

// Helper function to clean slugs
function cleanSlugString(slug: string): string {
  return typeof slug === 'string' ? slug.trim().toLowerCase() : '';
}

/**
 * Optional legacy cache support (keep only for backward compatibility).
 * Canon source is Contentlayer.
 */
let postsCache: PostType[] | null = null;

export function initializePosts(posts: PostType[] = []): void {
  if (Array.isArray(posts)) {
    // Validate each post before caching
    const validPosts: PostType[] = [];
    const invalidPosts: PostType[] = [];
    
    posts.forEach(post => {
      // Validate the post
      const validation = Validation.validatePostMeta(post);
      if (validation.isValid && TypeGuards.isPost(post)) {
        validPosts.push(post);
      } else {
        invalidPosts.push(post);
        const slug = PostMetaUtils.getSlug(post);
        console.warn(`[posts] Skipping invalid post ${slug}:`, 
          validation.isValid ? 'Missing content' : validation.errors);
      }
    });
    
    postsCache = validPosts;
    console.log(`[posts] Initialized ${validPosts.length} valid posts (${invalidPosts.length} invalid ignored)`);
  } else {
    postsCache = [];
    console.warn('[posts] initializePosts called with non-array input');
  }
}

/**
 * Convert Contentlayer Post doc -> strict PostType with full validation.
 */
function mapDocToPost(doc: any): PostType | null {
  try {
    if (!doc || typeof doc !== 'object') {
      console.warn('[posts] mapDocToPost received invalid doc');
      return null;
    }

    const slug = normalizeSlug(doc) || '';
    const content = String(doc?.body?.raw ?? doc?.content ?? "").trim();
    
    if (!slug || !content) {
      console.warn(`[posts] Skipping doc with missing slug or content: ${slug}`);
      return null;
    }

    // Build complete post data with safe defaults
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
      seriesOrder: typeof doc?.seriesOrder === 'number' ? doc.seriesOrder : undefined,
      
      coverAspect: doc?.coverAspect ? String(doc.coverAspect) : undefined,
      coverFit: doc?.coverFit ? String(doc.coverFit) : undefined,
      coverPosition: doc?.coverPosition ? String(doc.coverPosition) : undefined,
      
      authors: Array.isArray(doc?.authors) ? doc.authors.map(String).filter(Boolean) : undefined,
      wordCount: typeof doc?.wordCount === 'number' ? doc.wordCount : undefined,
      canonicalUrl: doc?.canonicalUrl ? String(doc.canonicalUrl) : undefined,
      noindex: typeof doc?.noindex === 'boolean' ? doc.noindex : undefined,
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

    // Create validated post
    const post = PostFactory.createPost(postData);
    
    // Validate the post
    const validation = Validation.validatePostMeta(post);
    if (!validation.isValid) {
      console.warn(`[posts] Post validation failed for ${slug}:`, validation.errors);
      return null;
    }

    return post;
  } catch (error) {
    console.error('[posts] Error in mapDocToPost:', error);
    return null;
  }
}

function getPostsFromContentlayer(): PostType[] {
  try {
    const docs = getPublishedPostDocs();
    const mappedPosts = docs.map(mapDocToPost).filter((post): post is PostType => post !== null);
    
    console.log(`[posts] Loaded ${mappedPosts.length} valid posts from Contentlayer (${docs.length - mappedPosts.length} filtered out)`);
    return mappedPosts;
  } catch (error) {
    console.error('[posts] Contentlayer loading failed:', error);
    return [];
  }
}

function getSourcePosts(): PostType[] {
  // Use cache if available and valid
  if (Array.isArray(postsCache) && postsCache.length > 0 && postsCache.every(TypeGuards.isPost)) {
    console.log(`[posts] Using ${postsCache.length} cached posts`);
    return postsCache;
  }
  
  const contentlayerPosts = getPostsFromContentlayer();
  
  // Update cache
  postsCache = contentlayerPosts;
  
  return contentlayerPosts;
}

function validateAndFilterPosts(posts: PostType[]): PostType[] {
  return posts.filter(post => {
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
    const sourcePosts = getSourcePosts();
    const validPosts = validateAndFilterPosts(sourcePosts);
    
    return validPosts.map(post => {
      try {
        return PostFactory.createForClient(post);
      } catch (error) {
        const slug = PostMetaUtils.getSlug(post);
        console.error(`[posts] Error transforming post ${slug}:`, error);
        return null;
      }
    }).filter((post): post is PostForClientType => post !== null);
  } catch (error) {
    console.error('[posts] Error in getAllPosts:', error);
    return [];
  }
}

// ADD MISSING FUNCTION: getPostBySlugWithContent
export function getPostBySlugWithContent(slug: string): PostType | null {
  const cleanedSlug = cleanSlugString(slug);
  if (!cleanedSlug) {
    console.warn('[posts] getPostBySlugWithContent called with empty slug');
    return null;
  }

  const sourcePosts = getSourcePosts();
  const post = sourcePosts.find(p => {
    const postSlug = PostMetaUtils.getSlug(p);
    return cleanSlugString(postSlug) === cleanedSlug;
  });
  
  if (!post) {
    console.log(`[posts] Post not found: ${cleanedSlug}`);
    return null;
  }

  // Validate the found post
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
    const cleanedSlug = cleanSlugString(slug);
    console.error(`[posts] Error getting post by slug "${cleanedSlug}":`, error);
    return null;
  }
}

export function getPublicPosts(): PostForClientType[] {
  try {
    const allPosts = getAllPosts();
    return allPosts.filter(post => post.published !== false);
  } catch (error) {
    console.error('[posts] Error in getPublicPosts:', error);
    return [];
  }
}

export function getFeaturedPosts(): PostForClientType[] {
  try {
    const sourcePosts = getSourcePosts();
    const validPosts = validateAndFilterPosts(sourcePosts);
    
    // Use utility function if available, otherwise filter
    const featuredPosts = getFeaturedPostsUtil 
      ? getFeaturedPostsUtil(validPosts)
      : PostMetaUtils.filterFeatured(PostMetaUtils.filterPublished(validPosts));
    
    return featuredPosts.map(PostFactory.createForClient);
  } catch (error) {
    console.error('[posts] Error in getFeaturedPosts:', error);
    
    // Fallback: get all published posts and filter for featured
    try {
      const allPosts = getPublicPosts();
      return allPosts.filter(post => post.featured === true);
    } catch {
      return [];
    }
  }
}

export function getPostSummaries(): PostSummaryType[] {
  try {
    const sourcePosts = getSourcePosts();
    const validPosts = validateAndFilterPosts(sourcePosts);
    const sortedPosts = PostMetaUtils.sortByDate(validPosts, 'desc');
    
    return sortedPosts.map(post => {
      try {
        return PostFactory.createSummary(post);
      } catch (error) {
        const slug = PostMetaUtils.getSlug(post);
        console.error(`[posts] Error creating summary for ${slug}:`, error);
        return null;
      }
    }).filter((summary): summary is PostSummaryType => summary !== null);
  } catch (error) {
    console.error('[posts] Error in getPostSummaries:', error);
    return [];
  }
}

export function searchPosts(query: string): PostSummaryType[] {
  const cleanedQuery = cleanSlugString(query);
  
  if (!cleanedQuery) {
    console.warn('[posts] searchPosts called with empty query');
    return [];
  }
  
  try {
    const sourcePosts = getSourcePosts();
    const validPosts = validateAndFilterPosts(sourcePosts);
    
    // Use utility function if available, otherwise implement basic search
    const results = searchPostsUtil
      ? searchPostsUtil(validPosts, cleanedQuery)
      : validPosts.filter(post => {
          const searchable = [
            PostMetaUtils.getTitle(post),
            PostMetaUtils.getExcerpt(post),
            PostMetaUtils.getCategory(post),
            PostMetaUtils.getAuthor(post),
            PostMetaUtils.getTags(post).join(' '),
            post.subtitle || '',
            post.description || '',
          ].join(' ').toLowerCase();
          
          return searchable.includes(cleanedQuery);
        });
    
    return results.map(PostFactory.createSummary);
  } catch (error) {
    console.error(`[posts] Error searching for "${cleanedQuery}":`, error);
    return [];
  }
}

export function getPaginatedPostSummaries(page = 1, perPage = 10): PostList {
  try {
    const summaries = getPostSummaries();
    const total = summaries.length;
    
    // Validate pagination parameters
    const safePage = Math.max(1, Math.floor(page));
    const safePerPage = Math.max(1, Math.min(100, Math.floor(perPage)));
    const totalPages = Math.ceil(total / safePerPage);
    const currentPage = Math.min(safePage, totalPages || 1);
    
    // Calculate pagination slice
    const startIndex = (currentPage - 1) * safePerPage;
    const endIndex = Math.min(startIndex + safePerPage, total);
    const paginatedPosts = summaries.slice(startIndex, endIndex);
    
    return {
      posts: paginatedPosts,
      total,
      page: currentPage,
      totalPages: totalPages || 1,
      hasNext: currentPage < totalPages,
      hasPrevious: currentPage > 1,
    };
  } catch (error) {
    console.error('[posts] Error in getPaginatedPostSummaries:', error);
    return {
      posts: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    };
  }
}

// Additional utility functions
export function getPostsByCategory(category: string): PostForClientType[] {
  try {
    const allPosts = getAllPosts();
    const cleanCategory = category.trim().toLowerCase();
    
    return allPosts.filter(post => 
      PostMetaUtils.getCategory(post).toLowerCase() === cleanCategory
    );
  } catch (error) {
    console.error(`[posts] Error getting posts by category "${category}":`, error);
    return [];
  }
}

export function getPostsByTag(tag: string): PostForClientType[] {
  try {
    const allPosts = getAllPosts();
    const cleanTag = tag.trim().toLowerCase();
    
    return allPosts.filter(post => 
      PostMetaUtils.getTags(post).some(t => t.toLowerCase() === cleanTag)
    );
  } catch (error) {
    console.error(`[posts] Error getting posts by tag "${tag}":`, error);
    return [];
  }
}

export function getRecentPosts(limit = 5): PostForClientType[] {
  try {
    const allPosts = getAllPosts();
    const sorted = [...allPosts].sort((a, b) => {
      const dateA = new Date(a.date || '').getTime();
      const dateB = new Date(b.date || '').getTime();
      return dateB - dateA;
    });
    
    return sorted.slice(0, Math.max(0, limit));
  } catch (error) {
    console.error(`[posts] Error getting recent posts:`, error);
    return [];
  }
}

export function clearPostsCache(): void {
  postsCache = null;
  console.log('[posts] Cache cleared');
}

export const postsAPI = {
  // Core functions
  initializePosts,
  getAllPosts,
  getPublicPosts,
  getFeaturedPosts,
  getPostBySlug,
  getPostBySlugWithContent,
  getPostSummaries,
  searchPosts,
  getPaginatedPostSummaries,
  
  // Utility functions
  getPostsByCategory,
  getPostsByTag,
  getRecentPosts,
  clearPostsCache,
  
  // Export utilities for convenience
  PostMetaUtils,
  TypeGuards,
  PostFactory,
  Validation,
};

export default postsAPI;