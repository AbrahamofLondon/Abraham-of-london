// lib/content/server.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SERVER-ONLY CONTENT ACCESS
 * - Used in API routes + getStaticProps/getServerSideProps
 * - Optimized for 2026 Portfolio Scale
 */

import { 
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
} from "@/lib/content/utils";

// Re-export shared logic for server-side consumers
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
};

import {
  allBooks,
  allCanons,
  allDocuments,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
} from "@/lib/contentlayer-compat";

const WARN =
  process.env.NODE_ENV !== "production"
    ? (...args: any[]) => console.warn("[CONTENT:SERVER]", ...args)
    : () => {};

export type ServerContentlayerData = {
  allDocuments: any[];
  allBooks: any[];
  allCanons: any[];
  allDownloads: any[];
  allPosts: any[];
  allEvents: any[];
  allPrints: any[];
  allResources: any[];
  allStrategies: any[];
  allShorts: any[];
};

const EMPTY_ARR: any[] = [];
const EMPTY_DATA: ServerContentlayerData = {
  allDocuments: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allPosts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
  allShorts: [],
};

// ---------------------------
// Path-Based Intelligence (New for 2026)
// ---------------------------

/**
 * Advanced Resolver: Determines the 'Kind' of document based on its 
 * physical location in the /content directory if frontmatter is missing.
 */
export function getDocKindByPath(doc: any): string {
  if (doc.kind) return doc.kind; 

  const path = doc._raw?.sourceFileDir || "";
  if (path.startsWith("canon")) return "canon";
  if (path.startsWith("strategy")) return "strategy";
  if (path.startsWith("blog")) return "blog";
  if (path.startsWith("shorts")) return "short";
  if (path.startsWith("prints")) return "print";
  if (path.startsWith("downloads")) return "download";
  if (path.startsWith("books")) return "book";
  if (path.startsWith("events")) return "event";
  if (path.startsWith("resources")) return "resource";
  
  return "document";
}

// ---------------------------
// Core getters (SYNC)
// ---------------------------
export function getContentlayerData(): ServerContentlayerData {
  try {
    return {
      allDocuments: Array.isArray(allDocuments) ? allDocuments : [],
      allBooks: Array.isArray(allBooks) ? allBooks : [],
      allCanons: Array.isArray(allCanons) ? allCanons : [],
      allDownloads: Array.isArray(allDownloads) ? allDownloads : [],
      allPosts: Array.isArray(allPosts) ? allPosts : [],
      allEvents: Array.isArray(allEvents) ? allEvents : [],
      allPrints: Array.isArray(allPrints) ? allPrints : [],
      allResources: Array.isArray(allResources) ? allResources : [],
      allStrategies: Array.isArray(allStrategies) ? allStrategies : [],
      allShorts: Array.isArray(allShorts) ? allShorts : [],
    };
  } catch (e) {
    WARN("getContentlayerData failed; returning EMPTY_DATA.", e);
    return EMPTY_DATA;
  }
}

export function isContentlayerLoaded(): boolean {
  try {
    return (allDocuments?.length || 0) > 0;
  } catch {
    return false;
  }
}

// ---------------------------
// Published selectors
// ---------------------------
export function getPublishedDocuments(): any[] {
  try {
    return (allDocuments || []).filter(isPublished);
  } catch (e) {
    WARN("getPublishedDocuments failed; returning [].", e);
    return EMPTY_ARR;
  }
}

export function getAllContentlayerDocs(): any[] {
  return getPublishedDocuments();
}

/**
 * Specifically for the Downloads/Prints Sitemap Extension
 */
export function getDownloadableAssets(): any[] {
  return getPublishedDocuments().filter((doc) => {
    const kind = getDocKindByPath(doc);
    return kind === "print" || kind === "download" || !!doc.downloadUrl || !!doc.fileUrl;
  });
}

// ---------------------------
// Generic doc access
// ---------------------------
export function getDocBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedDocuments().find((d) => normalizeSlug(d?.slug) === target) || null;
}

export function getDocumentBySlug(slug: string): any | null {
  return getDocBySlug(slug);
}

// ---------------------------
// Collections (Server Sync)
// ---------------------------
export function getServerAllBooks(): any[] { return allBooks || []; }
export function getServerAllCanons(): any[] { return allCanons || []; }
export async function getServerAllCanonsAsync() { return getServerAllCanons(); }

export function getServerAllStrategies(): any[] { return allStrategies || []; }
export function getServerAllShorts(): any[] { return allShorts || []; }
export async function getServerAllShortsAsync() { return getServerAllShorts(); }

export function getServerAllPrints(): any[] { return allPrints || []; }
export function getServerAllDownloads(): any[] { return allDownloads || []; }
export async function getServerAllDownloadsAsync() { return getServerAllDownloads(); }

// ---------------------------
// Legacy Aliases (Preserving existing Page logic)
// ---------------------------
export function getBooks(): any[] { return getServerAllBooks().filter(isPublished); }
export function getCanons(): any[] { return getServerAllCanons().filter(isPublished); }
export function getStrategies(): any[] { return getServerAllStrategies().filter(isPublished); }
export function getShorts(): any[] { return getServerAllShorts().filter(isPublished); }
export function getPrints(): any[] { return getServerAllPrints().filter(isPublished); }
export function getDownloads(): any[] { return getServerAllDownloads().filter(isPublished); }
export function getEvents(): any[] { return (allEvents || []).filter(isPublished); }
export function getResources(): any[] { return (allResources || []).filter(isPublished); }

export function getPublishedPosts(): any[] {
  return (allPosts || []).filter(isPublished);
}

export function getPostBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedPosts().find((p) => normalizeSlug(p?.slug) === target) || null;
}

/**
 * Aggregator for the Central Vault Index
 */
export function getAllCombinedDocs(): any[] {
  const d = getContentlayerData();
  return sanitizeData([
    ...(d.allDocuments || []),
    ...(d.allBooks || []),
    ...(d.allCanons || []),
    ...(d.allDownloads || []),
    ...(d.allPosts || []),
    ...(d.allEvents || []),
    ...(d.allPrints || []),
    ...(d.allResources || []),
    ...(d.allStrategies || []),
    ...(d.allShorts || []),
  ]);
}