// lib/contentlayer-helper.ts
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

// ---------------- CORE ----------------

export const normalizeSlug = (slug: string | string[]): string =>
  Array.isArray(slug) ? slug.join("/") : slug;

export const sanitizeData = <T>(data: T): T | null =>
  data ? JSON.parse(JSON.stringify(data)) : null;

// ---------------- COLLECTIONS ----------------

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

// ---------------- LOOKUPS ----------------

export const getDocBySlug = (slug: string | string[]) => {
  const normalized = normalizeSlug(slug);
  return allDocuments.find(
    (doc) => doc.slug === normalized || doc._id.includes(normalized)
  );
};

export const getServerBookBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allBooks.find(
    (b) => b.slug === normalized || b._id.includes(normalized)
  );
};

export const getServerCanonBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allCanons.find(
    (c) => c.slug === normalized || c._id.includes(normalized)
  );
};

// ---------------- SHARED UTILITIES RE-EXPORTS ----------------

// Re-export shared utilities
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

// ---------------- LEGACY ----------------

export const allDocs = allDocuments;
export { allDocuments };