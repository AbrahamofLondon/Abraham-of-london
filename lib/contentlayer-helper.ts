/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

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

export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

// Aliases (if old imports exist)
export { allCanons as allCanon, allPosts as allPost };

export const isDraft = (doc: any) =>
  doc?.draft === true || doc?._raw?.sourceFileName?.startsWith("_");

export const isPublished = (doc: any) => !isDraft(doc);

export function normalizeSlug(doc: any): string {
  if (!doc) return "";
  const s = typeof doc.slug === "string" ? doc.slug.trim() : "";
  if (s) return s.toLowerCase().replace(/\/+$/, "");
  const fp = String(doc._raw?.flattenedPath ?? "");
  if (!fp) return "";
  const parts = fp.split("/");
  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] : last;
  return String(slug).toLowerCase().replace(/\/+$/, "");
}

export function getDocKind(doc: any): DocKind {
  // Contentlayer sets `_type` to document name (Post, Canon, etc.)
  const t = String(doc?._type ?? doc?.type ?? "").toLowerCase();
  if (t === "post") return "post";
  if (t === "book") return "book";
  if (t === "canon") return "canon";
  if (t === "short") return "short";
  if (t === "download") return "download";
  if (t === "resource") return "resource";
  if (t === "event") return "event";
  if (t === "print") return "print";
  if (t === "strategy") return "strategy";
  return "unknown";
}

export function getDocHref(doc: any): string {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  return `${KIND_URL_MAP[kind]}/${slug}`;
}

export function resolveDocCoverImage(doc: any): string {
  const explicit = doc?.coverImage || doc?.image || doc?.cover;
  if (typeof explicit === "string" && explicit.trim()) return explicit;
  return getDocKind(doc) === "short" ? SHORT_GLOBAL_FALLBACK : GLOBAL_FALLBACK_IMAGE;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  const url = doc?.downloadUrl || doc?.fileUrl || doc?.pdfPath || doc?.file || doc?.downloadFile;
  return typeof url === "string" && url.trim() ? url : null;
}

export const getAllContentlayerDocs = () =>
  [
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

export const getPublishedDocuments = () => getAllContentlayerDocs().filter(isPublished);

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): any[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return limit ? items.slice(0, limit) : items;
}

// Named exports
export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

const cleanMatch = (s: string) => String(s || "").trim().toLowerCase().replace(/\/+$/, "");

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