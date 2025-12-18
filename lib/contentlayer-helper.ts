/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

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

// Raw Data Extractors
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

// Pluralization Aliases for System Parity
export { allCanons as allCanon, allPosts as allPost };

// Status Helpers
export const isDraft = (doc: any) => doc?.draft === true || doc?._raw?.sourceFileName?.startsWith('_');
export const isPublished = (doc: any) => !isDraft(doc);

// Unified URL & Kind Engine
export function normalizeSlug(doc: any): string {
  if (!doc) return "";
  if (doc.slug) return doc.slug.trim().toLowerCase().replace(/\/$/, "");
  const fp = doc._raw?.flattenedPath || "";
  const parts = fp.split("/");
  const last = parts[parts.length - 1];
  return (last === "index" ? parts[parts.length - 2] : last).toLowerCase();
}

export function getDocKind(doc: any): DocKind {
  const type = (doc?.type || doc?._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;
  return "unknown";
}

export function getDocHref(doc: any): string {
  return `${KIND_URL_MAP[getDocKind(doc)] || "/content"}/${normalizeSlug(doc)}`;
}

// Global Chronological Getters (The Full 9)
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

// Named Exports for Every Type
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

// Full 9-Type By-Slug Retrieval Engine
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

// Build Verification
export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) throw new Error(`[Critical Build Error] 0 docs found in ${where}`);
  console.log(`[Contentlayer] Verified ${count} documents for ${where}`);
}