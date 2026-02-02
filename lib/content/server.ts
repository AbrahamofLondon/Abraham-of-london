/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SERVER-ONLY CONTENT ACCESS
 * - Optimized for 2026 Portfolio Scale (Bare Slug Strategy)
 * - Resilience: Map all naming permutations to prevent build-time TypeErrors.
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

// -----------------------------------------------------------------------------
// Path-Based Intelligence
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// Core Data Access
// -----------------------------------------------------------------------------

export function isContentlayerLoaded(): boolean {
  return Array.isArray(allDocuments) && allDocuments.length > 0;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) throw new Error("Build aborted: Contentlayer data is empty.");
}

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
    WARN("getContentlayerData failed.", e);
    return EMPTY_DATA;
  }
}

// -----------------------------------------------------------------------------
// Advanced Selection & Resilient Slug Logic
// -----------------------------------------------------------------------------

export function getAllContentlayerDocs(): any[] {
  return allDocuments || [];
}

export function getDocBySlug(slug: string): any | null {
  if (!slug) return null;
  const target = normalizeSlug(slug);
  const docs = (allDocuments || []).filter(isPublished);

  return docs.find((d) => {
    const dSlug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
    const dBare = dSlug.split('/').pop(); 
    return dSlug === target || dBare === target;
  }) || null;
}

export function getDocumentBySlug(slug: string): any | null {
  return getDocBySlug(slug);
}

// -----------------------------------------------------------------------------
// Bulletproof Collection Mapping (The Final Fix)
// -----------------------------------------------------------------------------

// Shorts
export function getShorts() { return (allShorts || []).filter(isPublished); }
export function getAllShorts() { return getShorts(); }
export function getServerAllShorts() { return getShorts(); }

// Canons
export function getCanons() { return (allCanons || []).filter(isPublished); }
export function getAllCanons() { return getCanons(); }
export function getServerAllCanons() { return getCanons(); }

// Books
export function getBooks() { return (allBooks || []).filter(isPublished); }
export function getAllBooks() { return getBooks(); }
export function getServerAllBooks() { return getBooks(); }

// Downloads
export function getDownloads() { return (allDownloads || []).filter(isPublished); }
export function getAllDownloads() { return getDownloads(); }
export function getServerAllDownloads() { return getDownloads(); }

// Events
export function getEvents() { return (allEvents || []).filter(isPublished); }
export function getAllEvents() { return getEvents(); }
export function getServerAllEvents() { return getEvents(); }

// Resources
export function getResources() { return (allResources || []).filter(isPublished); }
export function getAllResources() { return getResources(); }
export function getServerAllResources() { return getResources(); }

// Prints
export function getPrints() { return (allPrints || []).filter(isPublished); }
export function getAllPrints() { return getPrints(); }
export function getServerAllPrints() { return getPrints(); }

// Strategies
export function getStrategies() { return (allStrategies || []).filter(isPublished); }
export function getAllStrategies() { return getStrategies(); }
export function getServerAllStrategies() { return getStrategies(); }

// Posts / Blog
export function getPublishedPosts() { return (allPosts || []).filter(isPublished); }
export function getPosts() { return getPublishedPosts(); }
export function getAllPosts() { return getPublishedPosts(); }

// -----------------------------------------------------------------------------
// Slug Lookups for Specific Types
// -----------------------------------------------------------------------------

export function getServerShortBySlug(slug: string) { return getShorts().find(s => normalizeSlug(s.slug || s._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerBookBySlug(slug: string) { return getBooks().find(b => normalizeSlug(b.slug || b._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerCanonBySlug(slug: string) { return getCanons().find(c => normalizeSlug(c.slug || c._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerDownloadBySlug(slug: string) { return getDownloads().find(d => normalizeSlug(d.slug || d._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerEventBySlug(slug: string) { return getEvents().find(e => normalizeSlug(e.slug || e._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerResourceBySlug(slug: string) { return getResources().find(r => normalizeSlug(r.slug || r._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerPrintBySlug(slug: string) { return getPrints().find(p => normalizeSlug(p.slug || p._raw.flattenedPath).includes(normalizeSlug(slug))); }
export function getServerStrategyBySlug(slug: string) { return getStrategies().find(s => normalizeSlug(s.slug || s._raw.flattenedPath).includes(normalizeSlug(slug))); }

export function getPostBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedPosts().find((p) => {
    const pSlug = normalizeSlug(p.slug || p._raw?.flattenedPath || "");
    return pSlug === target || pSlug.endsWith(`/${target}`);
  }) || null;
}

export function getPostBySlugWithContent(slug: string) { return getPostBySlug(slug); }

// -----------------------------------------------------------------------------
// Aggregators & Assets
// -----------------------------------------------------------------------------

export function getPublishedDocuments() { return (allDocuments || []).filter(isPublished); }

export function getDownloadableAssets(): any[] {
  return getPublishedDocuments().filter((doc) => {
    const kind = getDocKindByPath(doc);
    return kind === "print" || kind === "download" || !!doc.downloadUrl || !!doc.fileUrl;
  });
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
  
  return sanitizeData(combined);
}