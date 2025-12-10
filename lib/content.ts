// lib/content.ts
// Centralized content exports for Abraham of London

// ============================================
// POSTS MODULE EXPORTS
// ============================================
import postsModule from "./posts";

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
  postsAPI,
} = postsModule;

export type {
  Post,
  PostMeta,
  PostWithContent,
  PostForClient,
  PostSummary,
} from "./posts";

// ============================================
// CONTENT CATEGORIES CONSTANT
// (used by Content Library UI)
// ============================================

export const CONTENT_CATEGORIES = [
  {
    id: "essays",
    label: "Structural Essays",
    slug: "/content",
    description: "In-depth analysis of institutional architecture",
  },
  {
    id: "canon",
    label: "Canon",
    slug: "/canon",
    description: "Foundational texts and frameworks",
  },
  {
    id: "books",
    label: "Books",
    slug: "/books",
    description: "Published works and manuscripts",
  },
  {
    id: "strategies",
    label: "Strategies",
    slug: "/strategy",
    description: "Practical frameworks and operating models",
  },
  {
    id: "resources",
    label: "Resources",
    slug: "/resources",
    description: "Downloadable tools, templates, and guides",
  },
  {
    id: "downloads",
    label: "Downloads",
    slug: "/downloads",
    description: "Packs, cards, and tactical artefacts",
  },
  {
    id: "events",
    label: "Events",
    slug: "/events",
    description: "Workshops, talks, and gatherings",
  },
  {
    id: "prints",
    label: "Prints",
    slug: "/prints",
    description: "Physical artefacts and collectibles",
  },
] as const;

// ============================================
// DOCUMENT UTILITIES
// ============================================

import * as docsUtils from "./utils/docs";

export const {
  indexBySlug,
  sortByDate,
  filterPublished,
  getAuthorName,
  filterByTag,
  groupByYear,
  searchDocuments,
  paginateDocuments,
} = docsUtils;

export type { BasicDoc, ContentItem } from "./utils/docs";

// ============================================
// OTHER CONTENT MODULES
// ============================================

// Books
import { getAllBooks, getBookBySlug } from "./books";
import type { Book } from "./books";
export { getAllBooks, getBookBySlug };
export type { Book };

// Canon
import { getAllCanon, getCanonBySlug } from "./canon";
import type { Canon } from "./canon";
export { getAllCanon, getCanonBySlug };
export type { Canon };

// Downloads
import { getAllDownloads, getDownloadBySlug } from "./downloads";
import type { Download } from "./downloads";
export { getAllDownloads, getDownloadBySlug };
export type { Download };

// Events
import { getAllEvents, getEventBySlug } from "./events";
import type { Event } from "./events";
export { getAllEvents, getEventBySlug };
export type { Event };

// Prints
import { getAllPrints, getPrintBySlug } from "./prints";
import type { Print } from "./prints";
export { getAllPrints, getPrintBySlug };
export type { Print };

// Resources
import { getAllResources, getResourceBySlug } from "./resources";
import type { Resource } from "./resources";
export { getAllResources, getResourceBySlug };
export type { Resource };

// Strategies / Frameworks
import { getAllStrategies, getStrategyBySlug } from "./strategies";
import type { Strategy } from "./strategies";
export { getAllStrategies, getStrategyBySlug };
export type { Strategy };

// ============================================
// CONTENT LOADER UTILITIES
// ============================================

import {
  loadPostsFromSource,
  initializeAllContent as initAllContent,
  createContentLoader,
} from "./content-loader";

export { loadPostsFromSource, initAllContent, createContentLoader };

// ============================================
// AGGREGATED HELPERS
// ============================================

/**
 * Initialize all content modules
 * (currently a no-op hook – keep it light for production)
 */
export async function initializeAllContent(): Promise<void> {
  // If you later need to hydrate caches, do it here.
}

/**
 * Get all content grouped by type.
 * Used by the Content Library for counts & filters.
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
 * Flat list helper (if you ever need one list of everything).
 */
export function getAllContentFlat(): Array<ContentItem | BasicDoc | any> {
  const {
    posts,
    books,
    canon,
    downloads,
    events,
    prints,
    resources,
    strategies,
  } = getAllContent();

  return [
    ...posts,
    ...books,
    ...canon,
    ...downloads,
    ...events,
    ...prints,
    ...resources,
    ...strategies,
  ];
}

/**
 * Search across all content types.
 * (Extend per-type search later if needed.)
 */
export function searchAllContent(query: string) {
  return {
    posts: searchPosts(query),
    books: [], // TODO: implement book search
    canon: [],
    downloads: [],
    events: [],
    prints: [],
    resources: [],
    strategies: [],
  };
}

/**
 * Convenience function to load and initialize content.
 */
export async function loadAndInitializeContent() {
  const content = await initAllContent();
  if (content.posts) {
    initializePosts(content.posts);
  }
  return content;
}

// ============================================
// BACKWARD-COMPATIBILITY EXPORTS
// (arrays – safe for .length, .map, etc.)
// ============================================

// NOTE: these are **arrays**, not functions.
export const posts = getAllPosts();
export const books = getAllBooks();
export const canons = getAllCanon();
export const events = getAllEvents();
export const prints = getAllPrints();
export const strategies = getAllStrategies();
export const resources = getAllResources();
export const downloads = getAllDownloads();