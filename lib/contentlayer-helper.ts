/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/**
 * THE CORE ENGINE - Robust, centralized document handling.
 * Synchronizes file paths, slugs, and complex metadata (SEO, Visuals, Assets).
 */

export type DocKind =
  | "post" | "book" | "download" | "event" | "print" 
  | "resource" | "strategy" | "canon" | "short" | "unknown";

/**
 * Enhanced return type for Vault components to ensure 
 * complete data delivery including new SEO/Social fields.
 */
export interface ContentlayerDocBase {
  _id: string;
  type: string;
  title: string;
  date: string;
  slug: string;
  url: string;
  excerpt?: string;
  description?: string;
  coverImage?: string;
  coverAspect?: string;
  coverFit?: string;
  ogTitle?: string;
  ogDescription?: string;
  socialCaption?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
}

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

// Collections
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
export const isDraft = (doc: any): boolean => doc?.draft === true || String(doc?.draft).toLowerCase() === "true";
export const isPublished = (doc: any): boolean => !isDraft(doc);

/**
 * normalizeSlug: THE central authority for URL generation and file matching.
 * Synchronized with contentlayer.config.ts logic.
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
    return (last === "index" ? parts[parts.length - 2] : last) || "untitled";
  }
  return "untitled";
}

export function getDocKind(doc: any): DocKind {
  const type = (doc?.type || doc?._type || "").toLowerCase();
  if (KIND_URL_MAP[type as DocKind]) return type as DocKind;
  const dir = (doc._raw?.sourceFileDir || "").toLowerCase();
  if (dir.includes("shorts")) return "short";
  const match = Object.keys(KIND_URL_MAP).find(k => dir.includes(k)) as DocKind;
  return match || "unknown";
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

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return limit ? items.slice(0, limit) : items;
}

// --- SYSTEM-WIDE NAMED EXPORTS ---

export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

// --- BY-SLUG LOOKUP ENGINE ---

const cleanMatch = (s: string) => String(s ?? "").trim().toLowerCase();

export const getPostBySlug = (s: string) => getPublishedPosts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getBookBySlug = (s: string) => getAllBooks().find(d => normalizeSlug(d) === cleanMatch(s));
export const getCanonBySlug = (s: string) => getAllCanons().find(d => normalizeSlug(d) === cleanMatch(s));
export const getShortBySlug = (s: string) => getPublishedShorts().find(d => normalizeSlug(d) === cleanMatch(s));
export const getPrintBySlug = (s: string) => getAllPrints().find(d => normalizeSlug(d) === cleanMatch(s));
export const getResourceBySlug = (s: string) => getAllResources().find(d => normalizeSlug(d) === cleanMatch(s));
export const getDownloadBySlug = (s: string) => getAllDownloads().find(d => normalizeSlug(d) === cleanMatch(s));

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Build Failure] 0 documents detected in ${where}. Check CI content path.`);
  }
}