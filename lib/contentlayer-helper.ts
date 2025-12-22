/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";
import fs from "node:fs";
import path from "node:path";

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
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  return path.join(process.cwd(), "public", trimLeadingSlashes(u));
}

export function publicFileExists(publicUrl: string): boolean {
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return false;
  try {
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

export function publicFileSizeBytes(publicUrl: string): number | null {
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

export const isDraft = (doc: ContentDoc): boolean =>
  doc?.draft === true || cleanStr(doc?._raw?.sourceFileName).startsWith("_");

export const isPublished = (doc: ContentDoc): boolean => !isDraft(doc);

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
  getAllContentlayerDocs().filter(isPublished);

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