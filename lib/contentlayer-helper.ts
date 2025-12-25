// lib/contentlayer-helper.ts - COMPLETE FIXED VERSION WITH TYPE GUARDS
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "@/lib/contentlayer";

/* -------------------------------------------------------------------------- */
/* Node.js-only imports (guarded for browser compatibility)                   */
/* -------------------------------------------------------------------------- */

// These will only be available server-side
const isServer = typeof window === "undefined";
let fs: any = null;
let path: any = null;

if (isServer) {
  // Dynamic require to avoid webpack bundling for browser
  fs = eval('require')("fs");
  path = eval('require')("path");
}

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

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

export type AccessLevel = "public" | "inner-circle" | "private";

export type ContentDoc = any;

// Basic type interfaces for better type safety
export interface BaseDoc {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  tags?: string[];
  coverImage?: string;
  _raw: {
    flattenedPath: string;
    sourceFileName: string;
  };
  [key: string]: unknown;
}

export interface PostDoc extends BaseDoc {
  type: "post";
  featured?: boolean;
  category?: string;
  readTime?: string;
}

export interface BookDoc extends BaseDoc {
  type: "book";
  subtitle?: string;
  isbn?: string;
  publisher?: string;
}

export interface DownloadDoc extends BaseDoc {
  type: "download";
  file?: string;
  pdfPath?: string;
  downloadFile?: string;
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  accessLevel?: AccessLevel;
}

export interface EventDoc extends BaseDoc {
  type: "event";
  startDate?: string;
  endDate?: string;
  location?: string;
  registrationUrl?: string;
}

export interface PrintDoc extends BaseDoc {
  type: "print";
  format?: string;
  dimensions?: string;
  price?: string | number;
  inStock?: boolean;
}

export interface ResourceDoc extends BaseDoc {
  type: "resource";
  format?: string;
  file?: string;
}

export interface StrategyDoc extends BaseDoc {
  type: "strategy";
  framework?: string;
  category?: string;
}

export interface CanonDoc extends BaseDoc {
  type: "canon";
  volume?: number;
  chapter?: number;
}

export interface ShortDoc extends BaseDoc {
  type: "short";
  theme?: string;
  readTime?: string;
}

export type AnyDoc = PostDoc | BookDoc | DownloadDoc | EventDoc | PrintDoc | ResourceDoc | StrategyDoc | CanonDoc | ShortDoc;

// Type aliases for backward compatibility
export type PostType = PostDoc;
export type BookType = BookDoc;
export type DownloadType = DownloadDoc;
export type EventType = EventDoc;
export type PrintType = PrintDoc;
export type ResourceType = ResourceDoc;
export type StrategyType = StrategyDoc;
export type CanonType = CanonDoc;
export type ShortType = ShortDoc;

/* -------------------------------------------------------------------------- */
/* Type Guards                                                                */
/* -------------------------------------------------------------------------- */

export const isPost = (doc: AnyDoc): doc is PostType => doc.type === "post";
export const isDownload = (doc: AnyDoc): doc is DownloadType => doc.type === "download";
export const isBook = (doc: AnyDoc): doc is BookType => doc.type === "book";
export const isEvent = (doc: AnyDoc): doc is EventType => doc.type === "event";
export const isPrint = (doc: AnyDoc): doc is PrintType => doc.type === "print";
export const isResource = (doc: AnyDoc): doc is ResourceType => doc.type === "resource";
export const isCanon = (doc: AnyDoc): doc is CanonType => doc.type === "canon";
export const isShort = (doc: AnyDoc): doc is ShortType => doc.type === "short";
export const isStrategy = (doc: AnyDoc): doc is StrategyType => doc.type === "strategy";
export const isDraft = (doc: AnyDoc): boolean => Boolean(doc.draft);
export const isPublished = (doc: AnyDoc): boolean => !isDraft(doc);
export const isContentlayerLoaded = (): boolean => true;

/* -------------------------------------------------------------------------- */
/* Routing                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const cleanStr = (v: unknown) => String(v ?? "").trim();
const cleanLower = (v: unknown) => cleanStr(v).toLowerCase();
const trimTrailingSlashes = (s: string) => s.replace(/\/+$/, "");
const trimLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

function pickArray(name: string): ContentDoc[] {
  const v = (generated as any)[name];
  return Array.isArray(v) ? v : [];
}

/**
 * Build-time only. Resolves a public URL path ("/assets/...") to an absolute FS path.
 * Returns null if the URL path is not a site-local absolute path.
 */
export function publicUrlToFsPath(publicUrl: string): string | null {
  if (!isServer || !path) return null;
  
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  return path.join(process.cwd(), "public", trimLeadingSlashes(u));
}

export function publicFileExists(publicUrl: string): boolean {
  if (!isServer || !fs) return false;
  
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return false;
  try {
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

export function publicFileSizeBytes(publicUrl: string): number | null {
  if (!isServer || !fs) return null;
  
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return null;
  try {
    const stat = fs.statSync(fsPath);
    return typeof stat.size === "number" ? stat.size : null;
  } catch {
    return null;
  }
}

export function formatBytes(bytes: number): string {
  const b = Math.max(0, bytes);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

/**
 * Canonical slug normalizer. Deterministic and resilient.
 */
function toCanonicalSlug(input: unknown): string {
  let s = cleanStr(input);
  if (!s) return "";

  s = s.split("#")[0]?.split("?")[0] ?? s;
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = trimTrailingSlashes(cleanLower(s));
  s = trimLeadingSlashes(s);

  if (!s) return "";

  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/* -------------------------------------------------------------------------- */
/* Collections                                                                */
/* -------------------------------------------------------------------------- */

export const allPosts = pickArray("allPosts");
export const allBooks = pickArray("allBooks");
export const allDownloads = pickArray("allDownloads");
export const allEvents = pickArray("allEvents");
export const allPrints = pickArray("allPrints");
export const allResources = pickArray("allResources");
export const allStrategies = pickArray("allStrategies");
export const allCanons = pickArray("allCanons");
export const allShorts = pickArray("allShorts");

/* -------------------------------------------------------------------------- */
/* Draft / Publish                                                            */
/* -------------------------------------------------------------------------- */

export const isDraftContent = (doc: ContentDoc): boolean =>
  doc?.draft === true || cleanStr(doc?._raw?.sourceFileName).startsWith("_");

export const isPublishedContent = (doc: ContentDoc): boolean => !isDraftContent(doc);

/* -------------------------------------------------------------------------- */
/* Kind detection                                                             */
/* -------------------------------------------------------------------------- */

export function getDocKind(doc: ContentDoc): DocKind {
  const raw = cleanLower(doc?._type ?? doc?.type);
  switch (raw) {
    case "post":
      return "post";
    case "book":
      return "book";
    case "canon":
      return "canon";
    case "short":
      return "short";
    case "download":
      return "download";
    case "resource":
      return "resource";
    case "event":
      return "event";
    case "print":
      return "print";
    case "strategy":
      return "strategy";
    default:
      return "unknown";
  }
}

/* -------------------------------------------------------------------------- */
/* Slug normalisation                                                         */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(doc: ContentDoc): string {
  if (!doc) return "";

  const explicit = toCanonicalSlug(doc.slug);
  if (explicit) return explicit;

  const fp = cleanStr(doc?._raw?.flattenedPath);
  if (!fp) return "";

  const fpClean = trimTrailingSlashes(cleanLower(fp));
  const parts = fpClean.split("/").filter(Boolean);
  if (!parts.length) return "";

  const last = parts[parts.length - 1];
  const slug = last === "index" ? parts[parts.length - 2] ?? "" : last;

  return toCanonicalSlug(slug);
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export function getAccessLevel(doc: ContentDoc): AccessLevel {
  const v = cleanLower(doc?.accessLevel);
  if (v === "inner-circle" || v === "private" || v === "public") return v;
  return "public";
}

export function isPublic(doc: ContentDoc): boolean {
  return getAccessLevel(doc) === "public";
}

// Alias for compatibility
export function getRequiredTier(doc: ContentDoc): AccessLevel {
  return getAccessLevel(doc);
}

/* -------------------------------------------------------------------------- */
/* URLs                                                                       */
/* -------------------------------------------------------------------------- */

export function getDocHref(doc: ContentDoc): string {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  const base = KIND_URL_MAP[kind] ?? "/content";
  return slug ? `${base}/${slug}` : base;
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Universal cover resolver across all 9 doc types.
 * Strict behavior: if doc provides a value, we return it with a leading slash.
 */
export function resolveDocCoverImage(doc: ContentDoc): string {
  const explicit = cleanStr(doc?.coverImage || doc?.image || doc?.cover);
  if (explicit) return ensureLeadingSlash(explicit);

  return getDocKind(doc) === "short" ? SHORT_GLOBAL_FALLBACK : GLOBAL_FALLBACK_IMAGE;
}

/* -------------------------------------------------------------------------- */
/* Download URL resolution (STRICT + CANONICAL)                               */
/* -------------------------------------------------------------------------- */

export function resolveDocDownloadUrl(doc: ContentDoc): string | null {
  const raw =
    cleanStr(doc?.downloadUrl) ||
    cleanStr(doc?.fileUrl) ||
    cleanStr(doc?.pdfPath) ||
    cleanStr(doc?.file) ||
    cleanStr(doc?.downloadFile);

  if (!raw) return null;

  const url = ensureLeadingSlash(raw);

  if (url.startsWith("/downloads/")) {
    return url.replace(/^\/downloads\//, "/assets/downloads/");
  }

  if (url.startsWith("/assets/downloads/")) {
    return url;
  }

  return url;
}

export function resolveDocDownloadHref(doc: ContentDoc): string | null {
  const direct = resolveDocDownloadUrl(doc);
  if (!direct) return null;

  const access = getAccessLevel(doc);
  if (access === "public") return direct;

  const slug = normalizeSlug(doc);
  if (!slug) return null;

  return `/api/downloads/${encodeURIComponent(slug)}`;
}

export function resolveDocDownloadSizeLabel(doc: ContentDoc): string | null {
  const explicit = cleanStr(doc?.fileSize);
  if (explicit) return explicit;

  const url = resolveDocDownloadUrl(doc);
  if (!url) return null;

  const bytes = publicFileSizeBytes(url);
  if (bytes == null) return null;

  return formatBytes(bytes);
}

/* -------------------------------------------------------------------------- */
/* Aggregation                                                                */
/* -------------------------------------------------------------------------- */

export const getAllContentlayerDocs = (): ContentDoc[] =>
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

export const getPublishedDocuments = (): ContentDoc[] =>
  getAllContentlayerDocs().filter(isPublishedContent);

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): ContentDoc[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort(
      (a, b) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
    );

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

/* Named Queries */
export const getPublishedPosts = () => getPublishedDocumentsByType("post");
export const getAllBooks = () => getPublishedDocumentsByType("book");
export const getAllCanons = () => getPublishedDocumentsByType("canon");
export const getAllDownloads = () => getPublishedDocumentsByType("download");
export const getAllEvents = () => getPublishedDocumentsByType("event");
export const getAllPrints = () => getPublishedDocumentsByType("print");
export const getAllResources = () => getPublishedDocumentsByType("resource");
export const getAllStrategies = () => getPublishedDocumentsByType("strategy");
export const getPublishedShorts = () => getPublishedDocumentsByType("short");

// Alias for compatibility
export const getRecentShorts = (limit?: number) => 
  getPublishedDocumentsByType("short", limit);

/* By Slug */
const cleanMatch = (s: string) => toCanonicalSlug(s);

export const getDownloadBySlug = (s: string) =>
  getAllDownloads().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getPostBySlug = (s: string) =>
  getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getBookBySlug = (s: string) =>
  getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getCanonBySlug = (s: string) =>
  getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getShortBySlug = (s: string) =>
  getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getResourceBySlug = (s: string) =>
  getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getEventBySlug = (s: string) =>
  getAllEvents().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getPrintBySlug = (s: string) =>
  getAllPrints().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getStrategyBySlug = (s: string) =>
  getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

/* -------------------------------------------------------------------------- */
/* Build Guard                                                                */
/* -------------------------------------------------------------------------- */

export function assertContentlayerHasDocs(where: string) {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Critical Build Error] No Contentlayer documents found at ${where}`);
  }
}

/**
 * Validates that site-local /assets/* referenced by ANY doc exist in /public.
 * This covers the "all 9 doc types" requirement (covers images + other assets).
 * It DOES NOT guess, it only validates deterministic /assets/ paths.
 */
export function assertPublicAssetsExistForAllDocs(docs: ContentDoc[]) {
  const missing: string[] = [];

  for (const doc of docs) {
    const kind = getDocKind(doc);
    const slug = normalizeSlug(doc) || "(no-slug)";
    const label = `${kind}/${slug}`;

    // Cover images (if under /assets/)
    const img = resolveDocCoverImage(doc);
    if (img.startsWith("/assets/") && !publicFileExists(img)) {
      missing.push(`${label} coverImage -> ${img}`);
    }

    // Download files (if present and under /assets/)
    const dl = resolveDocDownloadUrl(doc);
    if (dl && dl.startsWith("/assets/") && !publicFileExists(dl)) {
      missing.push(`${label} downloadFile -> ${dl}`);
    }
  }

  if (missing.length) {
    throw new Error(
      `[Critical Build Error] Missing public assets referenced by content:\n` + missing.join("\n"),
    );
  }
}

/**
 * Validates that all download files referenced in download documents exist in the public directory.
 * This is a specific version of assertPublicAssetsExistForAllDocs focused only on downloads.
 */
export function assertDownloadFilesExist(): void {
  if (!isServer) {
    console.warn('assertDownloadFilesExist is only available server-side');
    return;
  }
  
  const downloads = getAllDownloads();
  const missing: string[] = [];

  for (const doc of downloads) {
    const slug = normalizeSlug(doc) || "(no-slug)";
    const label = `download/${slug}`;

    // Check download files
    const dl = resolveDocDownloadUrl(doc);
    if (dl && dl.startsWith("/assets/") && !publicFileExists(dl)) {
      missing.push(`${label} downloadFile -> ${dl}`);
    }
    
    // Also check cover images for downloads
    const img = resolveDocCoverImage(doc);
    if (img.startsWith("/assets/") && !publicFileExists(img)) {
      missing.push(`${label} coverImage -> ${img}`);
    }
  }

  if (missing.length) {
    throw new Error(
      `[Critical Build Error] Missing download files referenced by content:\n` + missing.join("\n")
    );
  }
}

// Optional: Add an alias for backward compatibility if needed
export const assertDownloadsExist = assertDownloadFilesExist;

/* -------------------------------------------------------------------------- */
/* Card Props Helper                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Universal card props extractor for all doc types.
 */
export function getCardPropsForDocument(doc: ContentDoc): {
  slug: string;
  title: string;
  excerpt: string | null;
  description: string | null;
  href: string;
  coverImage: string | null;
  tags: string[];
  date: string | null;
  kind: DocKind;
  accessLevel: AccessLevel;
  fileSize: string | null;
} {
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);
  const access = getAccessLevel(doc);
  
  return {
    slug,
    title: cleanStr(doc?.title) || "Untitled",
    excerpt: cleanStr(doc?.excerpt) || null,
    description: cleanStr(doc?.description) || null,
    href: getDocHref(doc),
    coverImage: resolveDocCoverImage(doc),
    tags: Array.isArray(doc?.tags) ? doc.tags.map(cleanStr) : [],
    date: doc?.date ? safeDate(doc.date) : null,
    kind,
    accessLevel: access,
    fileSize: kind === "download" ? resolveDocDownloadSizeLabel(doc) : null,
  };
}

export type ContentlayerCardProps = ReturnType<typeof getCardPropsForDocument>;

/* -------------------------------------------------------------------------- */
/* Utility Helpers                                                            */
/* -------------------------------------------------------------------------- */

function safeDate(input: unknown): string {
  if (!input) return "";
  try {
    const date = new Date(String(input));
    return date.toISOString().split("T")[0] || "";
  } catch {
    return "";
  }
}

/* -------------------------------------------------------------------------- */
/* Document Getter                                                            */
/* -------------------------------------------------------------------------- */

export const getDocumentBySlug = (slug: string): ContentDoc | null => {
  const slugClean = toCanonicalSlug(slug);
  
  // Try all collections in order of priority
  const collections = [
    { getter: getPostBySlug, name: "post" },
    { getter: getBookBySlug, name: "book" },
    { getter: getDownloadBySlug, name: "download" },
    { getter: getShortBySlug, name: "short" },
    { getter: getCanonBySlug, name: "canon" },
    { getter: getResourceBySlug, name: "resource" },
    { getter: getEventBySlug, name: "event" },
    { getter: getPrintBySlug, name: "print" },
    { getter: getStrategyBySlug, name: "strategy" },
  ];
  
  for (const { getter, name } of collections) {
    const doc = getter(slugClean);
    if (doc) return doc;
  }
  
  return null;
};

/* -------------------------------------------------------------------------- */
/* Featured Documents                                                         */
/* -------------------------------------------------------------------------- */

export const getFeaturedDocuments = (limit?: number): ContentDoc[] => {
  const allDocs = getPublishedDocuments();
  const featured = allDocs.filter(doc => doc?.featured === true);
  
  // Sort by date (newest first)
  const sorted = featured.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
  
  return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
};