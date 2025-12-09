// lib/content.ts - CORRECTED VERSION (console removed)
// Centralized content exports for Abraham of London

// ============================================
// POSTS MODULE EXPORTS
// ============================================

import postsModule from './posts';

export const {
  getAllPosts,
  getPostBySlug,
  getPublicPosts,
  getFeaturedPosts,
  getPostSummaries,
  getSortedPosts,
  getPaginatedPosts,
  getRecentPosts,
  searchPosts,
  getPostsByCategory,
  getPostsByTag,
  initializePosts,
  createPost,
  postsAPI
} = postsModule;

export type {
  Post,
  PostMeta,
  PostWithContent,
  PostForClient,
  PostSummary
} from './posts';

// ============================================
// CONTENT CATEGORIES CONSTANT (ADDED)
// ============================================

export const CONTENT_CATEGORIES = [
  { id: 'essays', label: 'Structural Essays', slug: '/content', description: 'In-depth analysis of institutional architecture' },
  { id: 'canon', label: 'Canon', slug: '/canon', description: 'Foundational texts and frameworks' },
  { id: 'books', label: 'Books', slug: '/books', description: 'Published works and manuscripts' },
  { id: 'strategies', label: 'Strategies', slug: '/strategies', description: 'Practical frameworks and tools' },
  { id: 'resources', label: 'Resources', slug: '/resources', description: 'Downloads, templates, and guides' },
  { id: 'events', label: 'Events', slug: '/events', description: 'Workshops, talks, and gatherings' },
  { id: 'prints', label: 'Prints', slug: '/prints', description: 'Physical artifacts and collectibles' },
] as const;

// ============================================
// DOCUMENT UTILITIES
// ============================================

import * as docsUtils from './utils/docs';

export const {
  indexBySlug,
  sortByDate,
  filterPublished,
  getAuthorName,
  filterByTag,
  groupByYear,
  searchDocuments,
  paginateDocuments
} = docsUtils;

export type {
  BasicDoc,
  ContentItem
} from './utils/docs';

// ============================================
// OTHER CONTENT MODULES - CORRECTED IMPORTS
// ============================================

// Books module
import { getAllBooks, getBookBySlug } from './books';
import type { Book } from './books';
export { getAllBooks, getBookBySlug };
export type { Book };

// Canon module
import { getAllCanon, getCanonBySlug } from './canon';
import type { Canon } from './canon';
export { getAllCanon, getCanonBySlug };
export type { Canon };

// Downloads module
import { getAllDownloads, getDownloadBySlug } from './downloads';
import type { Download } from './downloads';
export { getAllDownloads, getDownloadBySlug };
export type { Download };

// Events module
import { getAllEvents, getEventBySlug } from './events';
import type { Event } from './events';
export { getAllEvents, getEventBySlug };
export type { Event };

// Prints module
import { getAllPrints, getPrintBySlug } from './prints';
import type { Print } from './prints';
export { getAllPrints, getPrintBySlug };
export type { Print };

// Resources module
import { getAllResources, getResourceBySlug } from './resources';
import type { Resource } from './resources';
export { getAllResources, getResourceBySlug };
export type { Resource };

// Strategies module
import { getAllStrategies, getStrategyBySlug } from './strategies';
import type { Strategy } from './strategies';
export { getAllStrategies, getStrategyBySlug };
export type { Strategy };

// ============================================
// CONTENT LOADER UTILITIES
// ============================================

import { 
  loadPostsFromSource, 
  initializeAllContent as initAllContent,
  createContentLoader
} from './content-loader';

export {
  loadPostsFromSource,
  initAllContent,
  createContentLoader
};

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Initialize all content modules
 */
export async function initializeAllContent(): Promise<void> {
  // FIXED: Removed console.log for production
  // Initialize your content data here
}

/**
 * Get all content (posts, books, etc.)
 */
export function getAllContent() {
  return {
    posts: getAllPosts(),
    books: getAllBooks(),
    canon: getAllCanon(),
    downloads: getAllDownloads(),
    events: getAllEvents(),
    prints: getAllPrints(),
    resources: getAllResources(),
    strategies: getAllStrategies(),
  };
}

/**
 * Search across all content types
 */
export function searchAllContent(query: string) {
  return {
    posts: searchPosts(query),
    books: [], // Add book search if available
    canon: [], // Add canon search if available
    downloads: [], // Add downloads search if available
    events: [], // Add events search if available
    prints: [], // Add prints search if available
    resources: [], // Add resources search if available
    strategies: [], // Add strategies search if available
  };
}

/**
 * Convenience function to load and initialize content
 */
export async function loadAndInitializeContent() {
  const content = await initAllContent();
  if (content.posts) {
    initializePosts(content.posts);
  }
  return content;
}

// ============================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================

// For components that expect these exports
export const posts = getAllPosts;
export const books = getAllBooks;
export const canons = getAllCanon;
export const events = getAllEvents;
export const prints = getAllPrints;
export const strategies = getAllStrategies;
export const resources = getAllResources;
export const downloads = getAllDownloads;