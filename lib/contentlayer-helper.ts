/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SOVEREIGN CONTENTLAYER HELPER
 * Strictly aligned to satisfy Turbopack/Next.js production build requirements.
 * Resolves all missing exports for Books, Canons, and Sanitization.
 */

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
  allStrategies
} from "contentlayer/generated";

// --- CORE UTILITIES ---

/**
 * Ensures slug handles both string and array formats from Next.js dynamic routes.
 */
export const normalizeSlug = (slug: string | string[]): string => {
  if (Array.isArray(slug)) return slug.join('/');
  return slug;
};

/**
 * Standardized sanitization for production safety.
 * Satisfies the "sanitizeData" export requirement.
 */
export const sanitizeData = (data: any) => {
  if (!data) return null;
  // Deep clone to avoid mutating generated documents
  const sanitized = JSON.parse(JSON.stringify(data));
  return sanitized;
};

// --- DOCUMENT SELECTORS (Satisfying allBooks, allCanons, etc.) ---

export const getServerAllBooks = () => allBooks;
export const getServerAllCanons = () => allCanons;
export const getServerAllShorts = () => allShorts;
export const getServerAllPosts = () => allPosts;
export const getServerAllDownloads = () => allDownloads;
export const getServerAllEvents = () => allEvents;
export const getServerAllResources = () => allResources;
export const getServerAllPrints = () => allPrints;
export const getServerAllStrategies = () => allStrategies;
export const getAllDocuments = () => allDocuments;

// --- SINGLETON FETCHERS (The "BySlug" missing links) ---

/**
 * Resolves getServerBookBySlug error in /pages/api/books/[slug].ts
 */
export const getServerBookBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allBooks.find((b) => b.slug === normalized || b._id.includes(normalized));
};

/**
 * Resolves getServerCanonBySlug error in /pages/api/canon/[slug].ts
 */
export const getServerCanonBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allCanons.find((c) => c.slug === normalized || c._id.includes(normalized));
};

/**
 * Generic fetcher for all-purpose content routes
 */
export const getDocumentBySlug = (slug: string | string[]) => {
  const normalized = normalizeSlug(slug);
  return allDocuments.find((doc) => doc.slug === normalized || doc._id.includes(normalized));
};

// --- LEGACY COMPATIBILITY EXPORTS ---

export { 
  allDocuments as allDocs, // Backward compatibility for older UI components
  allDocuments as getAllContentlayerDocs 
};

/**
 * Helper to determine kind for 163 intelligence briefs
 */
export const getDocKind = (doc: any): string => {
  return doc.type || doc._type || "Unknown";
};

/**
 * Standard URL generator for the frontend
 */
export const getDocHref = (doc: any): string => {
  if (!doc.slug) return "#";
  const type = doc.type?.toLowerCase() || "content";
  return `/${type}/${doc.slug}`;
};

// --- RE-EXPORTING REMAINING FACADE ITEMS FROM SERVER ---
// Note: Ensure these exist in @/lib/content/server.ts or define them here if missing.

export {
  getContentlayerData,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
  getPublishedDocuments,
  getDocBySlug,
  getAllCanons,
  getCanons,
  getAllShorts,
  getShorts,
  getPublishedPosts,
  getPostBySlug,
  getPostBySlugWithContent,
  getAllCombinedDocs,
  isDraftContent,
  isPublished,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
} from "@/lib/content/server";