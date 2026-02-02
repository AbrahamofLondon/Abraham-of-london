/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SERVER-ONLY CONTENT ACCESS (HARDENED)
 * Consolidated to prevent circular dependencies and resolve Netlify TypeErrors.
 * Directly maps to the Sovereign Contentlayer Helper.
 */

import * as Helper from "@/lib/contentlayer-helper";

// --- RE-EXPORT GOVERNANCE & UTILS ---
export {
  normalizeSlug,
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  sanitizeData,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl
} from "@/lib/contentlayer-helper";

// --- CORE DATA ACCESS ---

export function isContentlayerLoaded(): boolean {
  const docs = Helper.getAllContentlayerDocs();
  return Array.isArray(docs) && docs.length > 0;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) throw new Error("Build aborted: Contentlayer data is empty.");
}

export function getContentlayerData() {
  return {
    allDocuments: Helper.getAllContentlayerDocs(),
    allBooks: Helper.getAllBooks(),
    allCanons: Helper.getAllCanons(),
    allDownloads: Helper.getAllDownloads(),
    allPosts: Helper.getAllPosts(),
    allEvents: Helper.getAllEvents(),
    allPrints: Helper.getAllPrints(),
    allResources: Helper.getAllResources(),
    allStrategies: Helper.getAllStrategies(),
    allShorts: Helper.getAllShorts(),
  };
}

// --- RESILIENT LOOKUPS ---

export const getDocBySlug = (slug: string) => Helper.getDocBySlug(slug);
export const getDocumentBySlug = (slug: string) => Helper.getDocBySlug(slug);
export const getAllContentlayerDocs = () => Helper.getAllContentlayerDocs();

// --- COLLECTION MAPPING ---

export const getShorts = () => Helper.getAllShorts().filter(Helper.isPublished);
export const getAllShorts = () => getShorts();
export const getServerAllShorts = () => getShorts();

export const getCanons = () => Helper.getAllCanons().filter(Helper.isPublished);
export const getAllCanons = () => getCanons();
export const getServerAllCanons = () => getCanons();

export const getBooks = () => Helper.getAllBooks().filter(Helper.isPublished);
export const getAllBooks = () => getBooks();
export const getServerAllBooks = () => getBooks();

export const getPublishedPosts = () => Helper.getAllPosts().filter(Helper.isPublished);
export const getAllPosts = () => getPublishedPosts();
export const getPosts = () => getPublishedPosts();

// --- TYPED SLUG LOOKUPS ---

export const getServerShortBySlug = (slug: string) => 
  getShorts().find(s => Helper.normalizeSlug(s.slug || s._raw.flattenedPath).includes(Helper.normalizeSlug(slug)));

export const getServerBookBySlug = (slug: string) => Helper.getServerBookBySlug(slug);
export const getServerCanonBySlug = (slug: string) => Helper.getServerCanonBySlug(slug);

export function getPostBySlug(slug: string): any | null {
  const target = Helper.normalizeSlug(slug);
  return getPublishedPosts().find((p) => {
    const pSlug = Helper.normalizeSlug(p.slug || p._raw?.flattenedPath || "");
    return pSlug === target || pSlug.endsWith(`/${target}`);
  }) || null;
}

// --- AGGREGATORS ---

export function getAllCombinedDocs(): any[] {
  const d = getContentlayerData();
  const combined = [
    ...d.allDocuments,
    ...d.allBooks,
    ...d.allCanons,
    ...d.allDownloads,
    ...d.allPosts,
    ...d.allEvents,
    ...d.allPrints,
    ...d.allResources,
    ...d.allStrategies,
    ...d.allShorts,
  ].filter(Helper.isPublished);
  
  return Helper.sanitizeData(combined);
}