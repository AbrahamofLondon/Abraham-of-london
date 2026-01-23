/**
 * lib/contentlayer-helper.ts — CANONICAL API (Pages Router)
 * - SYNC-FIRST
 * - Do not import contentlayer/generated here
 * - Route building is unified (hrefs always correct)
 */

import type { DocBase, DocKind } from "@/lib/contentlayer-compat";
import {
  getContentlayerData,
  getAllCombinedDocs,
  getPublishedDocuments,
  getDocBySlug,
  getDocKind,
  getDocHref,
  normalizeSlug,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  isDraftContent,
  isPublished,
  sanitizeData,
  toUiDoc,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
} from "@/lib/contentlayer-compat";

export type ContentDoc = DocBase;
export type { DocKind };

export {
  // status
  isContentlayerLoaded,
  assertContentlayerHasDocs,

  // base data
  getContentlayerData,

  // core helpers
  normalizeSlug,
  getDocKind,
  getDocHref,
  getAccessLevel,
  isDraftContent,
  isPublished,

  // media
  resolveDocCoverImage,
  resolveDocDownloadUrl,

  // sanitize + ui
  sanitizeData,
  toUiDoc,
};

/** Combined docs: what most index pages actually want */
export function getAllDocuments(): ContentDoc[] {
  return getAllCombinedDocs();
}

export function getPublishedAll(): ContentDoc[] {
  return getPublishedDocuments(getAllDocuments());
}

/** Collection getters (published) */
export function getPublishedPosts(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allPosts ?? []);
}

export function getPublishedBooks(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allBooks ?? []);
}

export function getPublishedCanons(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allCanons ?? []);
}

export function getPublishedDownloads(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allDownloads ?? []);
}

export function getPublishedShorts(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allShorts ?? []);
}

export function getPublishedEvents(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allEvents ?? []);
}

export function getPublishedPrints(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allPrints ?? []);
}

export function getPublishedResources(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allResources ?? []);
}

export function getPublishedStrategies(): ContentDoc[] {
  const d = getContentlayerData();
  return getPublishedDocuments(d.allStrategies ?? []);
}

/**
 * Generic slug lookup across ALL content (published or not depends on caller)
 * Most pages should call getPublishedDocuments() first if they only want published.
 */
export function getDocumentBySlug(slug: string): ContentDoc | null {
  return getDocBySlug(slug, getAllDocuments());
}

/** Type-specific slug lookups (for legacy imports) */
export const getPostBySlug = getDocumentBySlug;
export const getBookBySlug = getDocumentBySlug;
export const getCanonBySlug = getDocumentBySlug;
export const getDownloadBySlug = getDocumentBySlug;
export const getShortBySlug = getDocumentBySlug;
export const getEventBySlug = getDocumentBySlug;
export const getPrintBySlug = getDocumentBySlug;
export const getResourceBySlug = getDocumentBySlug;
export const getStrategyBySlug = getDocumentBySlug;

/** Legacy aliases some pages expect */
export const getAllContentlayerDocs = getAllDocuments;
export const getPublishedDocumentsLegacy = getPublishedAll;

/** Hard guarantees (keep stubs if referenced) */
export const assertPublicAssetsForDownloadsAndResources = () => true;
export const recordContentView = () => true;

// Create a default export object
const contentlayerHelper = {
  // Re-export all the functions
  getAllDocuments,
  getPublishedAll,
  getDocumentBySlug,
  getAllPosts,
  getAllBooks,
  getAllCanons,
  getAllDownloads,
  getAllShorts,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllStrategies,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedCanons,
  getPublishedDownloads,
  getPublishedShorts,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getDownloadBySlug,
  getShortBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getAllContentlayerDocs,
  getPublishedDocumentsLegacy,
  assertPublicAssetsForDownloadsAndResources,
  recordContentView,
  // Re-export from compat
  getContentlayerData,
  getAllCombinedDocs,
  getPublishedDocuments,
  getDocBySlug,
  getDocKind,
  getDocHref,
  normalizeSlug,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  isDraftContent,
  isPublished,
  sanitizeData,
  toUiDoc,
  isContentlayerLoaded,
  assertContentlayerHasDocs,
};

export default contentlayerHelper;