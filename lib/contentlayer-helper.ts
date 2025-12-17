/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/**
 * THE CORE ENGINE - IMMUTABLE SINGLE SOURCE OF TRUTH
 * Unified logic for slug matching, asset resolution, and build-safety.
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

function pickArray(name: string): any[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

// Collections (Raw Arrays)
export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

// Logic & Status
export const isDraft = (doc: any): boolean => {
  if (!doc) return true;
  return doc.draft === true || String(doc.draft).toLowerCase() === "true";
};

export const isPublished = (doc: any): boolean => !isDraft(doc);

/**
 * normalizeSlug: Unified authority for URL strings.
 */
export function normalizeSlug(doc: any): string {
  if (!doc) return "";
  if (doc.slug && typeof doc.slug === "string") {
    return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  }
  const fp = doc._raw?.flattenedPath || "";
  if (fp) {
    const parts = fp.split("/");
    const last = parts[parts.length - 1];
    return (last === "index" ? parts[parts.length - 2] : last).toLowerCase();
  }
  return "untitled";
}

export function getDocKind(doc: any): DocKind {
  const type = (doc?.type || doc?._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;
  const dir = (doc._raw?.sourceFileDir || "").toLowerCase();
  if (dir.includes("shorts")) return "short";
  return (Object.keys(KIND_URL_MAP).find(k => dir.includes(k)) as DocKind) || "unknown";
}

export function getDocHref(doc: any): string {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  return `${KIND_URL_MAP[kind] || "/content"}/${slug}`;
}

// Asset Resolvers
export function resolveDocCoverImage(doc: any): string {
  const explicit = doc?.coverImage || doc?.image;
  if (typeof explicit === "string" && explicit.trim()) return explicit;
  return getDocKind(doc) === "short" ? SHORT_GLOBAL_FALLBACK : GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  const url = doc?.downloadUrl || doc?.fileUrl || doc?.pdfPath || doc?.file || doc?.downloadFile;
  return (typeof url === "string" && url.trim()) ? url : null;
}

// Global Getters
export const getAllContentlayerDocs = () => [
  ...allPosts, ...allBooks, ...allDownloads, ...allEvents, 
  ...allPrints, ...allResources, ...allStrategies, ...allCanons, ...allShorts
].filter(Boolean);

export const getPublishedDocuments = () => getAllContentlayerDocs().filter(isPublished);

/**
 * getPublishedDocumentsByType: Ensures chronological order 
 * and visibility of all 133 files.
 */
export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return limit ? items.slice(0, limit) : items;
}

// Named Exports for System Parity
export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

// By-Slug Engine
const cleanMatch = (s: string) => String(s ?? "").trim().toLowerCase().replace(/\/$/, "");

export const getPostBySlug = (s: string) => getPublishedPosts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getCanonBySlug = (s: string) => getAllCanons().find(d => normalizeSlug(d) === cleanMatch(s));
export const getShortBySlug = (s: string) => getPublishedShorts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getPrintBySlug = (s: string) => getAllPrints().find(d => normalizeSlug(d) === cleanMatch(s));
export const getBookBySlug = (s: string) => getAllBooks().find(d => normalizeSlug(d) === cleanMatch(s));

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Build Error] 0 documents found in ${where}`);
  }
}