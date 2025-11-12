<<<<<<< HEAD
=======
// lib/posts.ts - PRODUCTION SAFE VERSION
import { allPosts } from "contentlayer/generated";

// Type-safe fallback for Post type
interface SafePost {
  _id: string;
  title: string;
  slug: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  url: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  [key: string]: any;
}

/**
 * Safely get all posts with comprehensive error handling
 */
export function getAllPosts(): SafePost[] {
  try {
    if (typeof allPosts === 'undefined') {
      console.warn('⚠️ ContentLayer posts data is undefined - returning empty array');
      return [];
    }

    if (!Array.isArray(allPosts)) {
      console.error('❌ ContentLayer posts is not an array:', typeof allPosts);
      return [];
    }

    const safePosts = allPosts.filter((post): post is SafePost => {
      const isValid = post && 
                     typeof post === 'object' &&
                     typeof post._id === 'string' &&
                     typeof post.title === 'string' &&
                     typeof post.slug === 'string' &&
                     typeof post.date === 'string' &&
                     typeof post.author === 'string' &&
                     typeof post.readTime === 'string' &&
                     typeof post.category === 'string' &&
                     typeof post.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid post:', post);
      }

      return isValid;
    });

    if (safePosts.length !== allPosts.length) {
      console.warn(`🔄 Filtered ${allPosts.length - safePosts.length} invalid posts`);
    }

    return safePosts;

  } catch (error) {
    console.error('💥 Critical error in getAllPosts:', error);
    return [];
  }
}

/**
 * Safely get a post by slug with fallbacks
 */
export function getPostBySlug(slug: string): SafePost | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getPostBySlug:', slug);
      return null;
    }

    const posts = getAllPosts();
    const post = posts.find(post => post.slug === slug);

    if (!post) {
      console.warn(`🔍 Post not found for slug: "${slug}"`);
      return null;
    }

    return post;

  } catch (error) {
    console.error(`💥 Error finding post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get posts by category with validation
 */
export function getPostsByCategory(category: string): SafePost[] {
  try {
    if (!category || typeof category !== 'string') {
      console.warn('⚠️ Invalid category provided to getPostsByCategory:', category);
      return [];
    }

    return getAllPosts().filter(post => 
      post.category?.toLowerCase() === category.toLowerCase()
    );

  } catch (error) {
    console.error(`💥 Error getting posts by category "${category}":`, error);
    return [];
  }
}

/**
 * Get latest posts with limit
 */
export function getLatestPosts(limit: number = 10): SafePost[] {
  try {
    if (typeof limit !== 'number' || limit < 1) {
      console.warn('⚠️ Invalid limit provided to getLatestPosts:', limit);
      return [];
    }

    return getAllPosts()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);

  } catch (error) {
    console.error(`💥 Error getting latest posts with limit ${limit}:`, error);
    return [];
  }
}

// Export types for use in other files
export type { SafePost as Post };
>>>>>>> test-netlify-fix
