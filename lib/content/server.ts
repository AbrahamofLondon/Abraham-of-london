/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — SERVER-ONLY CONTENT ACCESS (BACKWARD-INTEGRATED)
 * Hard rules:
 * - NO circular imports (contentlayer-helper must NOT re-export this file).
 * - This file can safely depend on contentlayer-helper + shared utils.
 */

import * as Helper from "@/lib/contentlayer-helper";
import {
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "@/lib/content/shared";

export {
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
};

// ------------------------------
// Direct static imports from contentlayer-helper
// ------------------------------
import {
  normalizeSlug as helperNormalizeSlug,
  sanitizeData as helperSanitizeData,
  getAllContentlayerDocs as helperGetAllContentlayerDocs,
  getAllBooks as helperGetAllBooks,
  getAllCanons as helperGetAllCanons,
  getAllDownloads as helperGetAllDownloads,
  getAllPosts as helperGetAllPosts,
  getAllEvents as helperGetAllEvents,
  getAllPrints as helperGetAllPrints,
  getAllResources as helperGetAllResources,
  getAllStrategies as helperGetAllStrategies,
  getAllShorts as helperGetAllShorts,
  getDocBySlug as helperGetDocBySlug,
  getServerBookBySlug as helperGetServerBookBySlug,
  getServerCanonBySlug as helperGetServerCanonBySlug,
} from "@/lib/contentlayer-helper";

// Re-export with consistent naming
export const normalizeSlug = helperNormalizeSlug;
export const sanitizeData = helperSanitizeData;

// ------------------------------
// Core data access (static imports)
// ------------------------------
export function getAllContentlayerDocs() {
  return helperGetAllContentlayerDocs();
}

export function getAllBooks() {
  return helperGetAllBooks();
}

export function getAllCanons() {
  return helperGetAllCanons();
}

export function getAllDownloads() {
  return helperGetAllDownloads();
}

export function getAllPosts() {
  return helperGetAllPosts();
}

export function getAllEvents() {
  return helperGetAllEvents();
}

export function getAllPrints() {
  return helperGetAllPrints();
}

export function getAllResources() {
  return helperGetAllResources();
}

export function getAllStrategies() {
  return helperGetAllStrategies();
}

export function getAllShorts() {
  return helperGetAllShorts();
}

export function isContentlayerLoaded(): boolean {
  const docs = getAllContentlayerDocs();
  return Array.isArray(docs) && docs.length > 0;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) {
    throw new Error("Build aborted: Contentlayer data is empty.");
  }
}

export function getContentlayerData() {
  return {
    allDocuments: getAllContentlayerDocs(),
    allBooks: getAllBooks(),
    allCanons: getAllCanons(),
    allDownloads: getAllDownloads(),
    allPosts: getAllPosts(),
    allEvents: getAllEvents(),
    allPrints: getAllPrints(),
    allResources: getAllResources(),
    allStrategies: getAllStrategies(),
    allShorts: getAllShorts(),
  };
}

// ------------------------------
// Legacy + resilient lookups
// ------------------------------
export const getDocBySlug = helperGetDocBySlug;
export const getDocumentBySlug = getDocBySlug;

// ------------------------------
// Published collections
// ------------------------------
export const getShorts = () => getAllShorts().filter(isPublished);
export const getServerAllShorts = () => getShorts();

export const getCanons = () => getAllCanons().filter(isPublished);
export const getServerAllCanons = () => getCanons();

export const getBooks = () => getAllBooks().filter(isPublished);
export const getServerAllBooks = () => getBooks();

export const getPublishedPosts = () => getAllPosts().filter(isPublished);
export const getPosts = () => getPublishedPosts();

// ------------------------------
// Typed slug lookups
// ------------------------------
export const getServerShortBySlug = (slug: string) => {
  const target = normalizeSlug(slug);
  return (
    getShorts().find((s: any) => {
      const sSlug = normalizeSlug(s.slug || s._raw?.flattenedPath || "");
      return sSlug === target || sSlug.endsWith(`/${target}`) || sSlug.includes(`/shorts/${target}`);
    }) || null
  );
};

export const getServerBookBySlug = helperGetServerBookBySlug;

export const getServerCanonBySlug = (slug: string) => {
  // First try the imported function
  if (helperGetServerCanonBySlug) {
    return helperGetServerCanonBySlug(slug);
  }
  
  // Fallback logic
  const target = normalizeSlug(slug);
  return (
    getCanons().find((c: any) => {
      const cSlug = normalizeSlug(c.slug || c._raw?.flattenedPath || "");
      return cSlug === target || cSlug.endsWith(`/${target}`);
    }) || null
  );
};

export function getPostBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return (
    getPublishedPosts().find((p: any) => {
      const pSlug = normalizeSlug(p.slug || p._raw?.flattenedPath || "");
      return pSlug === target || pSlug.endsWith(`/${target}`);
    }) || null
  );
}

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
  ].filter(isPublished);

  return (sanitizeData(combined) || []) as any[];
}

// Export all the static functions that other files expect
export const documentKinds = Helper.documentKinds || [];
export const getCardProps = Helper.getCardProps;
export const getPublishedDocuments = () => getAllCombinedDocs();
export const getPublishedDocumentsByType = (kind: string) => 
  getAllCombinedDocs().filter((doc: any) => getDocKind(doc) === kind);
export const coerceShortTheme = Helper.coerceShortTheme || ((theme: any) => theme || null);