// lib/contentlayer-helper.ts
// COMPLETE CONTENTLAYER HELPER - Production Ready
/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  allDocuments,
  allBooks,
  allCanons,
  allPosts,
  allShorts,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
} from "contentlayer/generated";

// Import from shared utilities
import { 
  getDocKind, 
  isPublished as sharedIsPublished, 
  getAccessLevel as sharedGetAccessLevel,
  toUiDoc as sharedToUiDoc 
} from '@/lib/content/shared';

if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  // This file must NEVER be imported directly by Pages / API / build code
}

// ============================================================================
// CORE UTILITIES
// ============================================================================

export const normalizeSlug = (slug: string | string[]): string =>
  Array.isArray(slug) ? slug.join("/") : slug;

export const sanitizeData = <T>(data: T): T | null =>
  data ? JSON.parse(JSON.stringify(data)) : null;

// ============================================================================
// COLLECTION GETTERS
// ============================================================================

export const getAllContentlayerDocs = () => allDocuments;
export const getAllBooks = () => allBooks;
export const getAllCanons = () => allCanons;
export const getAllShorts = () => allShorts;
export const getAllPosts = () => allPosts;
export const getAllDownloads = () => allDownloads;
export const getAllEvents = () => allEvents;
export const getAllPrints = () => allPrints;
export const getAllResources = () => allResources;
export const getAllStrategies = () => allStrategies;

// ============================================================================
// SINGLE DOCUMENT LOOKUPS BY SLUG
// ============================================================================

export const getDocBySlug = (slug: string | string[]) => {
  const normalized = normalizeSlug(slug);
  return allDocuments.find(
    (doc) => doc.slug === normalized || 
             doc.slugSafe === normalized ||
             doc._id.includes(normalized)
  );
};

export const getPostBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allPosts.find(
    (p) => p.slug === normalized || 
           p.slugSafe === normalized ||
           p._id.includes(normalized) ||
           p._raw?.flattenedPath === `blog/${normalized}` ||
           p._raw?.flattenedPath === normalized
  );
};

export const getBookBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allBooks.find(
    (b) => b.slug === normalized || 
           b.slugSafe === normalized ||
           b._id.includes(normalized) ||
           b._raw?.flattenedPath === `books/${normalized}` ||
           b._raw?.flattenedPath === normalized
  );
};

export const getCanonBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allCanons.find(
    (c) => c.slug === normalized || 
           c.slugSafe === normalized ||
           c._id.includes(normalized) ||
           c._raw?.flattenedPath === `canon/${normalized}` ||
           c._raw?.flattenedPath === normalized
  );
};

export const getShortBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allShorts.find(
    (s) => s.slug === normalized || 
           s.slugSafe === normalized ||
           s._id.includes(normalized) ||
           s._raw?.flattenedPath === `shorts/${normalized}` ||
           s._raw?.flattenedPath === normalized
  );
};

export const getDownloadBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allDownloads.find(
    (d) => d.slug === normalized || 
           d.slugSafe === normalized ||
           d._id.includes(normalized) ||
           d._raw?.flattenedPath === `downloads/${normalized}` ||
           d._raw?.flattenedPath === normalized
  );
};

export const getResourceBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allResources.find(
    (r) => r.slug === normalized || 
           r.slugSafe === normalized ||
           r._id.includes(normalized) ||
           r._raw?.flattenedPath === `resources/${normalized}` ||
           r._raw?.flattenedPath === normalized
  );
};

export const getEventBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allEvents.find(
    (e) => e.slug === normalized || 
           e.slugSafe === normalized ||
           e._id.includes(normalized) ||
           e._raw?.flattenedPath === `events/${normalized}` ||
           e._raw?.flattenedPath === normalized
  );
};

export const getPrintBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allPrints.find(
    (p) => p.slug === normalized || 
           p.slugSafe === normalized ||
           p._id.includes(normalized) ||
           p._raw?.flattenedPath === `prints/${normalized}` ||
           p._raw?.flattenedPath === normalized
  );
};

export const getStrategyBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allStrategies.find(
    (s) => s.slug === normalized || 
           s.slugSafe === normalized ||
           s._id.includes(normalized) ||
           s._raw?.flattenedPath === `strategy/${normalized}` ||
           s._raw?.flattenedPath === normalized
  );
};

// Legacy server-side aliases
export const getServerBookBySlug = getBookBySlug;
export const getServerCanonBySlug = getCanonBySlug;

// ============================================================================
// SHARED UTILITIES RE-EXPORTS
// ============================================================================

export { getDocKind };
export const isPublished = sharedIsPublished;
export const getAccessLevel = sharedGetAccessLevel;
export const toUiDoc = sharedToUiDoc;

// Document kinds constant
export const documentKinds = [
  "blog",
  "book", 
  "canon",
  "download",
  "event",
  "print",
  "resource",
  "short",
  "strategy"
] as const;

// ============================================================================
// CARD PROPS HELPER
// ============================================================================

/**
 * Get card properties for a document
 */
export function getCardProps(doc: any) {
  return {
    title: doc?.title || 'Untitled',
    description: doc?.description || doc?.excerpt || '',
    href: doc?.href || `/${doc?.slug || ''}`,
    image: doc?.coverImage || doc?.image || null,
    kind: getDocKind(doc),
    tier: getAccessLevel(doc),
    published: isPublished(doc),
    date: doc?.publishedAt || doc?.date || null,
    tags: doc?.tags || []
  };
}

// ============================================================================
// LEGACY EXPORTS
// ============================================================================

export const allDocs = allDocuments;
export { allDocuments };