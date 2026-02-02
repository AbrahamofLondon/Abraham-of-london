/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SOVEREIGN CONTENTLAYER HELPER
 * Strictly aligned to satisfy Turbopack/Next.js production build requirements.
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

export const normalizeSlug = (slug: string | string[]): string => {
  if (Array.isArray(slug)) return slug.join('/');
  return slug;
};

export const sanitizeData = (data: any) => {
  if (!data) return null;
  return JSON.parse(JSON.stringify(data));
};

// --- DOCUMENT SELECTORS ---

export const getAllContentlayerDocs = () => allDocuments;
export const getAllBooks = () => allBooks;
export const getAllCanons = () => allCanons;
export const getAllShorts = () => allShorts;
export const getAllPosts = () => allPosts;

// --- SINGLETON FETCHERS ---

export const getDocBySlug = (slug: string | string[]) => {
  const normalized = normalizeSlug(slug);
  return allDocuments.find((doc) => doc.slug === normalized || doc._id.includes(normalized));
};

export const getServerBookBySlug = (slug: string) => {
  const normalized = normalizeSlug(slug);
  return allBooks.find((b) => b.slug === normalized || b._id.includes(normalized));
};

// --- LEGACY & METADATA ---

export const allDocs = allDocuments;
export { allDocuments };

export const getDocKind = (doc: any): string => doc.type || doc._type || "Unknown";

// --- RE-EXPORTING SERVER LOGIC ---
// This ensures that when we import this helper, we get the full server-side suite
export * from "@/lib/content/server";