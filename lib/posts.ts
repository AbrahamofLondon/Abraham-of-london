// lib/posts.ts
// Robust posts data facade with post-specific utilities

import { getAllPostsMeta, getPostBySlug as getPostBySlugServer } from "@/lib/server/posts-data";

// Type definitions
export type Post = any;
export type PostMeta = Post;
export type PostFieldKey = keyof PostMeta;

/**
 * Get all posts
 */
export function getAllPosts(): PostMeta[] {
  try {
    const posts = getAllPostsMeta();
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

/**
 * Get post by slug
 */
export function getPostBySlug(slug: string): Post | null {
  try {
    return getPostBySlugServer(slug);
  } catch {
    return null;
  }
}

/**
 * Get post slugs
 */
export function getPostSlugs(): string[] {
  const posts = getAllPosts();
  return posts.map(p => p.slug).filter(Boolean);
}

/**
 * Get public posts
 */
export function getPublicPosts(): PostMeta[] {
  const posts = getAllPosts();
  return posts.filter(post => {
    const isDraft = post.draft === true;
    const isNotPublished = post.published === false;
    const isStatusDraft = post.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(limit?: number): PostMeta[] {
  const posts = getPublicPosts();
  const featured = posts.filter(p => p.featured === true);
  return limit ? featured.slice(0, limit) : featured;
}
