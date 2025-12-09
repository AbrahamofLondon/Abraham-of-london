// lib/client-content.ts
import { Post } from '@/types/post';

let postsCache: Post[] = [];
let isInitialized = false;

export function getClientPosts(): Post[] {
  if (!isInitialized) {
    console.warn('Posts not initialized. Call initializeClientPosts() first.');
    return [];
  }
  return postsCache;
}

export async function initializeClientPosts(): Promise<void> {
  if (isInitialized) return;
  
  try {
    const response = await fetch('/api/content/initialize');
    const data = await response.json();
    
    if (data.success && data.posts) {
      postsCache = data.posts;
      isInitialized = true;
      console.log(`Initialized ${data.posts.length} posts`);
    }
  } catch (error) {
    console.error('Failed to initialize posts:', error);
  }
}

export function getPostBySlug(slug: string): Post | null {
  return postsCache.find(post => post.slug === slug) || null;
}