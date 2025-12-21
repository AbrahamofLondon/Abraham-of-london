// lib/contentlayer-helper.ts — STRICT, SCHEMA-ALIGNED, FULL EXPORTS
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/**
 * DocKind used across the app for routing / filtering.
 */
export type DocKind =
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "canon"
  | "short"
  | "unknown";

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

/**
 * Contentlayer (generated) exposes arrays like allPosts, allBooks, etc.
 * We read defensively to avoid hard crashes during partial builds.
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

// legacy aliases (keep to prevent old imports breaking)
export { allCanons as allCanon, allPosts as allPost };

/**
 * In your schema:
 * - commonFields includes "draft"
 * - Short additionally has "published" (default true)
 *
 * Publishing logic:
 * - If doc.draft === true => NOT published
 * - If doc._raw.sourceFileName starts "_" => NOT published
 * - If doc._type === "Short" and published === false => NOT published
 */
export function isDraft(doc: any): boolean {
  if (!doc) return true;
  if (doc?.draft === true) return true;
  if (String(doc?._raw?.sourceFileName ?? "").startsWith("_")) return true;
  if (String(doc?._type ?? "").toLowerCase() === "short" && doc?.published === false) return true;
  return false;
}

export function isPublished(doc: any): boolean {
  return !isDraft(doc);
}

/**
 * Prefer Contentlayer's computed `url` field.
 * Your config guarantees url exists for each document type.
 */
export function getDocHref(doc: any): string {
  const url = doc?.url;
  if (typeof url === "string" && url.trim()) return url.trim();
  // defensive fallback (should not happen if schema computedFields works)
  return "/content";
}

/**
 * Normalise slug for lookups.
 * Prefer doc.slug; else last segment of doc.url; else last of flattenedPath.
 */
export function normalizeSlug(docOrSlug: any): string {
  if (typeof docOrSlug === "string") {
    return docOrSlug.trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  }

  const doc = docOrSlug;
  const s = typeof doc?.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase().replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() ?? "";

  const url = typeof doc?.url === "string" ? doc.url.trim() : "";
  if (url) return url.toLowerCase().replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() ?? "";

  const fp = String(doc?._raw?.flattenedPath ?? "");
  if (!fp) return "";
  const parts = fp.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] : last;
  return String(slug || "").toLowerCase();
}

/**
 * Kind detection (Contentlayer sets `_type` as your doc type name: Post, Book, etc.)
 */
export function getDocKind(doc: any): DocKind {
  const t = String(doc?._type ?? doc?.type ?? "").toLowerCase();
  if (t === "post") return "post";
  if (t === "book") return "book";
  if (t === "download") return "download";
  if (t === "event") return "event";
  if (t === "print") return "print";
  if (t === "resource") return "resource";
  if (t === "strategy") return "strategy";
  if (t === "canon") return "canon";
  if (t === "short") return "short";
  return "unknown";
}

/**
 * Cover image resolution:
 * - Your schema uses coverImage: string
 * - But keep fallbacks for safety
 */
export function resolveDocCoverImage(doc: any): string {
  const explicit =
    doc?.coverImage ||
    doc?.image ||
    doc?.cover ||
    doc?.ogImage;

  if (typeof explicit === "string" && explicit.trim()) return explicit.trim();
  return getDocKind(doc) === "short" ? SHORT_GLOBAL_FALLBACK : GLOBAL_FALLBACK_IMAGE;
}

/**
 * Downloads may expose file/fileUrl/pdfPath/downloadUrl/etc
 */
export function resolveDocDownloadUrl(doc: any): string | null {
  const url =
    doc?.downloadUrl ||
    doc?.fileUrl ||
    doc?.pdfPath ||
    doc?.file ||
    doc?.downloadFile;

  return typeof url === "string" && url.trim() ? url.trim() : null;
}

/**
 * Aggregate utilities
 */
export function getAllContentlayerDocs(): any[] {
  return [
    ...allPosts,
    ...allBooks,
    ...allDownloads,
    ...allEvents,
    ...allPrints,
    ...allResources,
    ...allStrategies,
    ...allCanons,
    ...allShorts,
  ].filter(Boolean);
}

export function getPublishedDocuments(): any[] {
  return getAllContentlayerDocs().filter(isPublished);
}

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => {
      const da = new Date(a?.date ?? 0).getTime();
      const db = new Date(b?.date ?? 0).getTime();
      return db - da;
    });

  return typeof limit === "number" ? items.slice(0, Math.max(0, limit)) : items;
}

/**
 * Named exports you rely on elsewhere
 */
export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

/**
 * ✅ The missing exports causing your build warnings:
 * - getRecentShorts
 * - getShortUrl
 */
export function getRecentShorts(limit = 3): any[] {
  return getPublishedShorts().slice(0, Math.max(0, limit));
}

export function getShortUrl(short: any): string {
  // Prefer computed url from Contentlayer
  return getDocHref(short);
}

/**
 * Slug lookups
 */
const cleanMatch = (s: string) =>
  String(s || "").trim().toLowerCase().replace(/^\/+|\/+$/g, "").split("/").filter(Boolean).pop() ?? "";

export const getPostBySlug = (s: string) =>
  getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getBookBySlug = (s: string) =>
  getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getCanonBySlug = (s: string) =>
  getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getShortBySlug = (s: string) =>
  getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getDownloadBySlug = (s: string) =>
  getAllDownloads().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getResourceBySlug = (s: string) =>
  getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getEventBySlug = (s: string) =>
  getAllEvents().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getPrintBySlug = (s: string) =>
  getAllPrints().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getStrategyBySlug = (s: string) =>
  getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export function assertContentlayerHasDocs(where: string) {
  const count = getAllContentlayerDocs().length;
  if (count === 0) throw new Error(`[Critical Build Error] 0 documents found in ${where}`);
}