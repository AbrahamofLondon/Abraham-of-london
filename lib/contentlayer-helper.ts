/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/**
 * CORE TYPES & MAPPINGS
 * The single source of truth for the 9 content pillars.
 */
export type DocKind = 
  | "post" | "book" | "download" | "event" | "print" 
  | "resource" | "strategy" | "canon" | "short" | "unknown";

const KIND_URL_MAP: Record<DocKind, string> = {
  post: "/blog",
  book: "/books",
  canon: "/canon",
  download: "/downloads",
  event: "/events",
  print: "/prints",
  short: "/shorts",
  resource: "/resources",
  strategy: "/strategy",
  unknown: "/content",
};

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

/**
 * DATA EXTRACTORS
 * pickArray ensures that even if a content folder is empty, 
 * the app receives [] instead of undefined, preventing build crashes.
 */
function pickArray(name: string): any[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

// Pluralization Aliases to prevent re-export errors in lib/imports.ts
export { allCanons as allCanon, allPosts as allPost };

/**
 * STATUS & SLUG HELPERS
 */
export const isDraft = (doc: any) => 
  doc?.draft === true || doc?._raw?.sourceFileName?.startsWith('_');

export const isPublished = (doc: any) => !isDraft(doc);

export function normalizeSlug(doc: any): string {
  if (!doc) return "";
  if (doc.slug && typeof doc.slug === "string") {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }
  const fp = doc._raw?.flattenedPath || "";
  const parts = fp.split("/");
  const last = parts[parts.length - 1];
  // Handle index.md files by using the parent folder name as slug
  return (last === "index" ? parts[parts.length - 2] : last).toLowerCase();
}

/**
 * KIND & URL RESOLVERS
 */
export function getDocKind(doc: any): DocKind {
  const type = (doc?.type || doc?._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;
  return "unknown";
}

export function getDocHref(doc: any): string {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  return `${KIND_URL_MAP[kind] || "/content"}/${slug}`;
}

export const getShortUrl = (slug: string) => `/shorts/${slug}`;
export const getPostUrl = (slug: string) => `/blog/${slug}`;

/**
 * ASSET RESOLVERS (Resolves missing resolveDocCoverImage/resolveDocDownloadUrl errors)
 */
export function resolveDocCoverImage(doc: any): string {
  const explicit = doc?.coverImage || doc?.image || doc?.cover;
  if (typeof explicit === "string" && explicit.trim()) return explicit;
  return getDocKind(doc) === "short" ? SHORT_GLOBAL_FALLBACK : GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  // Checks all possible download field variations used in the 133 docs
  const url = doc?.downloadUrl || doc?.fileUrl || doc?.pdfPath || doc?.file || doc?.downloadFile;
  return (typeof url === "string" && url.trim()) ? url : null;
}

/**
 * COLLECTION GETTERS
 */
export const getAllContentlayerDocs = () => [
  ...allPosts, ...allBooks, ...allDownloads, ...allEvents, 
  ...allPrints, ...allResources, ...allStrategies, ...allCanons, ...allShorts
].filter(Boolean);

export const getPublishedDocuments = () => getAllContentlayerDocs().filter(isPublished);

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return limit ? items.slice(0, limit) : items;
}

// Named exports for consistency across the page directory
export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");
export const getRecentShorts = (limit = 3) => getPublishedDocumentsByType("short", limit);

/**
 * BY-SLUG ENGINE (The 9-Type Retrieval Core)
 */
const cleanMatch = (s: string) => s.trim().toLowerCase().replace(/\/$/, "");

export const getPostBySlug = (s: string) => getPublishedPosts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getBookBySlug = (s: string) => getAllBooks().find(d => normalizeSlug(d) === cleanMatch(s));
export const getCanonBySlug = (s: string) => getAllCanons().find(d => normalizeSlug(d) === cleanMatch(s));
export const getShortBySlug = (s: string) => getPublishedShorts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getDownloadBySlug = (s: string) => getAllDownloads().find(d => normalizeSlug(d) === cleanMatch(s));
export const getResourceBySlug = (s: string) => getAllResources().find(d => normalizeSlug(d) === cleanMatch(s));
export const getEventBySlug = (s: string) => getAllEvents().find(d => normalizeSlug(d) === cleanMatch(s));
export const getPrintBySlug = (s: string) => getAllPrints().find(d => normalizeSlug(d) === cleanMatch(s));
export const getStrategyBySlug = (s: string) => getAllStrategies().find(d => normalizeSlug(d) === cleanMatch(s));

/**
 * BUILD VALIDATION
 */
export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) throw new Error(`[Critical Build Error] 0 documents found in ${where}`);
}