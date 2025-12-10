// lib/content.ts
// Centralised content exports for Abraham of London

// ============================================
// POSTS MODULE EXPORTS (legacy posts module)
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
// CONTENT CATEGORIES (used by navigation / UI)
// ============================================

export const CONTENT_CATEGORIES = [
  {
    id: "essays",
    label: "Structural Essays",
    slug: "/content",
    description: "Long-form thinking on purpose, power, and institutions.",
  },
  {
    id: "canon",
    label: "Canon",
    slug: "/canon",
    description: "Foundational volumes shaping the Builders’ Canon.",
  },
  {
    id: "books",
    label: "Books",
    slug: "/books",
    description: "Published works, pre-releases, and manuscripts.",
  },
  {
    id: "strategies",
    label: "Strategies",
    slug: "/strategy",
    description: "Practical operating playbooks and strategic frameworks.",
  },
  {
    id: "resources",
    label: "Resources",
    slug: "/resources",
    description: "Frameworks, templates, and council-ready artefacts.",
  },
  {
    id: "downloads",
    label: "Downloads",
    slug: "/downloads",
    description: "Toolkits, cue cards, and execution-ready packs.",
  },
  {
    id: "events",
    label: "Events",
    slug: "/events",
    description: "Workshops, salons, and live teaching sessions.",
  },
  {
    id: "prints",
    label: "Prints",
    slug: "/prints",
    description: "Physical editions, cards, and wall-ready assets.",
  },
  {
    id: "shorts",
    label: "Shorts",
    slug: "/shorts",
    description: "Bite-sized provocations for builders on the move.",
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
// OTHER CONTENT MODULES (legacy FS/MDX loaders)
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
// CONTENTLAYER-BACKED SHORTS (new stack)
// ============================================

import {
  getPublishedShorts,
} from "./contentlayer-helper";
import type { Short } from "./contentlayer-helper";

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
 * Initialize all content modules.
 * Currently a light hook – keep side effects minimal in production.
 */
export async function initializeAllContent(): Promise<void> {
  // If you later need to hydrate caches, do it here.
}

/**
 * Get all content grouped by type.
 * Used by dashboards / overview views.
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
    shorts: getPublishedShorts(),
  };
}

/**
 * Flat list helper (one big array when needed).
 */
export function getAllContentFlat(): Array<
  ContentItem | BasicDoc | Short | any
> {
  const {
    posts,
    books,
    canon,
    downloads,
    events,
    prints,
    resources,
    strategies,
    shorts,
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
    ...shorts,
  ];
}

/**
 * Search across all content types.
 * Currently:
 *  - Uses dedicated searchPosts() for essays/posts
 *  - Adds a simple title/excerpt/tags scan for Shorts
 *  - Leaves other types as TODO until you need them
 */
export function searchAllContent(query: string) {
  const q = query.trim().toLowerCase();

  const shorts = getPublishedShorts().filter((short) => {
    const haystack = [
      short.title ?? "",
      short.excerpt ?? "",
      ...(short.tags ?? []),
      (short as any).theme ?? "",
      (short as any).audience ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return q.length > 0 && haystack.includes(q);
  });

  return {
    posts: searchPosts(query),
    books: [],      // intentional: wire up when needed
    canon: [],
    downloads: [],
    events: [],
    prints: [],
    resources: [],
    strategies: [],
    shorts,
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
// Arrays – safe for .length, .map, etc.
// ============================================

export const posts = getAllPosts();
export const books = getAllBooks();
export const canons = getAllCanon();
export const events = getAllEvents();
export const prints = getAllPrints();
export const strategies = getAllStrategies();
export const resources = getAllResources();
export const downloads = getAllDownloads();
export const shorts = getPublishedShorts();