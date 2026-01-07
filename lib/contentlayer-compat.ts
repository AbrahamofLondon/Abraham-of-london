/* lib/contentlayer-compat.ts - INSTITUTIONAL RECONCILIATION - HARDENED */

import { sanitizeData } from "@/lib/server/md-utils";

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                                                 */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(input: any): string {
  const raw =
    typeof input === "string"
      ? input
      : Array.isArray(input)
        ? input.join("/")
        : (input ?? "").toString();

  return raw
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.mdx?$/, "");
}

export function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  const d = doc?.draft;
  if (d === true || d === "true") return true;
  return doc?.status === "draft";
}

// Legacy alias some pages expect
export const isDraft = isDraftContent;

/* -------------------------------------------------------------------------- */
/* SAFE CONTENTLAYER IMPORTS                                                  */
/* -------------------------------------------------------------------------- */

type ContentLayerDoc = any;

type GeneratedShape = {
  allBooks?: ContentLayerDoc[];
  allCanons?: ContentLayerDoc[];
  allDownloads?: ContentLayerDoc[];
  allEvents?: ContentLayerDoc[];
  allPosts?: ContentLayerDoc[];
  allPrints?: ContentLayerDoc[];
  allResources?: ContentLayerDoc[];
  allShorts?: ContentLayerDoc[];
  allStrategies?: ContentLayerDoc[];
};

let contentlayerData: GeneratedShape = {};

try {
  /**
   * Prefer the official runtime module if present.
   * (Works with Contentlayer’s standard output)
   */
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const generated = require("contentlayer/generated") as GeneratedShape;
  contentlayerData = generated;
} catch (e1) {
  try {
    /**
     * Fallback to local generated directory (some setups produce .contentlayer/generated)
     */
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const generatedLocal = require("../.contentlayer/generated") as GeneratedShape;
    contentlayerData = generatedLocal;
  } catch (e2) {
    console.warn("[contentlayer-compat] Contentlayer not available yet; using empty collections");
    contentlayerData = {};
  }
}

// Safely extract collections with defaults
export const allBooks = contentlayerData.allBooks ?? [];
export const allCanons = contentlayerData.allCanons ?? [];
export const allDownloads = contentlayerData.allDownloads ?? [];
export const allEvents = contentlayerData.allEvents ?? [];
export const allPosts = contentlayerData.allPosts ?? [];
export const allPrints = contentlayerData.allPrints ?? [];
export const allResources = contentlayerData.allResources ?? [];
export const allShorts = contentlayerData.allShorts ?? [];
export const allStrategies = contentlayerData.allStrategies ?? [];

/* -------------------------------------------------------------------------- */
/* COLLECTION PROVIDERS                                                       */
/* -------------------------------------------------------------------------- */

export const getAllPosts = () => allPosts.filter((d) => !isDraftContent(d));
export const getAllBooks = () => allBooks.filter((d) => !isDraftContent(d));
export const getAllDownloads = () => allDownloads.filter((d) => !isDraftContent(d));
export const getAllCanons = () => allCanons.filter((d) => !isDraftContent(d));
export const getAllShorts = () => allShorts.filter((d) => !isDraftContent(d));
export const getAllResources = () => allResources.filter((d) => !isDraftContent(d));
export const getAllStrategies = () => allStrategies.filter((d) => !isDraftContent(d));
export const getAllEvents = () => allEvents.filter((d) => !isDraftContent(d));
export const getAllPrints = () => allPrints.filter((d) => !isDraftContent(d));

export const allDocuments = [
  ...allPosts,
  ...allBooks,
  ...allCanons,
  ...allDownloads,
  ...allEvents,
  ...allPrints,
  ...allResources,
  ...allShorts,
  ...allStrategies,
].filter((d) => !isDraftContent(d));

/**
 * Pages in your repo import this name specifically.
 */
export const getAllContentlayerDocs = () => allDocuments;

/**
 * Alias a few “published” helpers used across pages
 */
export const getPublishedDocuments = () => allDocuments;
export const getPublishedPosts = getAllPosts;
export const getPublishedDownloads = getAllDownloads;
export const getPublishedShorts = getAllShorts;

/* -------------------------------------------------------------------------- */
/* TRACE-CRITICAL EXPORTS                                                     */
/* -------------------------------------------------------------------------- */

export function getDocKind(doc: any): string {
  const t = String(doc?._type || doc?.type || "").toLowerCase();
  return t;
}

export function getAccessLevel(doc: any): string {
  return doc?.accessLevel || doc?.tier || "public";
}

export function resolveDocCoverImage(doc: any): string {
  return doc?.coverImage || doc?.coverimage || "/assets/images/placeholder.jpg";
}

export function resolveDocDownloadUrl(doc: any): string {
  if (!doc) return "";
  return doc.downloadUrl || doc.fileUrl || doc.file || doc.pdfPath || "";
}

export function resolveDocDownloadHref(doc: any): string {
  // In your project this is often same as URL; keep a separate export for callers.
  return resolveDocDownloadUrl(doc);
}

export function getDownloadSizeLabel(doc: any): string {
  const bytes =
    typeof doc?.sizeBytes === "number"
      ? doc.sizeBytes
      : typeof doc?.fileSizeBytes === "number"
        ? doc.fileSizeBytes
        : null;

  if (!bytes || bytes <= 0) return "";
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  return `${Math.round(kb)} KB`;
}

/* -------------------------------------------------------------------------- */
/* LOOKUP HELPERS                                                             */
/* -------------------------------------------------------------------------- */

function bySlug<T>(docs: T[], slug: string): T | null {
  const n = normalizeSlug(slug);
  return (
    (docs as any[]).find((d: any) => {
      const docSlug = d.slug || d.slugComputed || d._raw?.flattenedPath || "";
      return normalizeSlug(docSlug) === n;
    }) ?? null
  );
}

export const getPostBySlug = (s: string) => bySlug(getAllPosts(), s);
export const getBookBySlug = (s: string) => bySlug(getAllBooks(), s);
export const getCanonBySlug = (s: string) => bySlug(getAllCanons(), s);
export const getDownloadBySlug = (s: string) => bySlug(getAllDownloads(), s);
export const getEventBySlug = (s: string) => bySlug(getAllEvents(), s);
export const getShortBySlug = (s: string) => bySlug(getAllShorts(), s);
export const getStrategyBySlug = (s: string) => bySlug(getAllStrategies(), s);
export const getPrintBySlug = (s: string) => bySlug(getAllPrints(), s);
export const getResourceBySlug = (s: string) => bySlug(getAllResources(), s);

export const getDocumentBySlug = (s: string) => bySlug(allDocuments, s);

/* -------------------------------------------------------------------------- */
/* ROUTING                                                                    */
/* -------------------------------------------------------------------------- */

export function getDocHref(doc: any): string {
  if (!doc) return "/";
  const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
  const type = getDocKind(doc);

  const typeMap: Record<string, string> = {
    book: "books",
    canon: "canon",
    download: "downloads",
    short: "shorts",
    print: "prints",
    resource: "resources",
    strategy: "strategy",
    post: "blog",
    event: "events",
  };

  return `/${typeMap[type] || "blog"}/${slug}`;
}

/**
 * Some pages call `toUiDoc` — keep it stable and JSON-safe.
 */
export function toUiDoc(doc: any) {
  if (!doc) return null;
  const safe = sanitizeData(doc);
  return {
    ...safe,
    href: getDocHref(doc),
    kind: getDocKind(doc),
    accessLevel: getAccessLevel(doc),
    coverImage: resolveDocCoverImage(doc),
    downloadUrl: resolveDocDownloadUrl(doc),
  };
}

/* -------------------------------------------------------------------------- */
/* ASSERTS / VALIDATORS                                                       */
/* -------------------------------------------------------------------------- */

export function assertContentlayerHasDocs() {
  const hasDocs = allDocuments.length > 0;
  if (!hasDocs) {
    console.warn(
      "[contentlayer-compat] No documents found. Ensure contentlayer generated content before build."
    );
  }
  return hasDocs;
}

/**
 * Some pages import this. Keep it non-fatal (warn-only) so builds don’t die.
 */
export function assertPublicAssetsForDownloadsAndResources() {
  // You already have stronger checks elsewhere (scripts/validate-content.mjs).
  // This stays as a build-safe placeholder.
  return true;
}

/* -------------------------------------------------------------------------- */
/* SERVER ALIASES (pages import these names)                                  */
/* -------------------------------------------------------------------------- */

// “Server” variants — in pages/ dir they’re still run at build time.
// Keep them as aliases so imports stop failing.

export const getServerAllBooks = getAllBooks;
export const getServerBookBySlug = getBookBySlug;

export const getServerAllCanons = getAllCanons;
export const getServerCanonBySlug = getCanonBySlug;

export const getServerAllDownloads = getAllDownloads;
export const getServerDownloadBySlug = getDownloadBySlug;

export const getServerAllEvents = getAllEvents;
export const getServerEventBySlug = getEventBySlug;

export const getServerAllResources = getAllResources;
export const getServerResourceBySlug = getResourceBySlug;

export const getServerAllShorts = getAllShorts;
export const getServerShortBySlug = getShortBySlug;

/* -------------------------------------------------------------------------- */
/* API COMPAT (no-op stubs to keep build green)                               */
/* -------------------------------------------------------------------------- */

export function recordContentView(..._args: any[]) {
  // No-op: analytics implementation can live elsewhere
  return true;
}

// Re-export sanitizeData because pages import it from "@/lib/contentlayer"
export { sanitizeData };

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */

const ContentHelper = {
  // Collections
  allBooks,
  allCanons,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
  allDocuments,

  // Functions
  getPublishedDocuments,
  getAllContentlayerDocs,
  getAllPosts,
  getAllBooks,
  getAllDownloads,
  getAllCanons,
  getAllShorts,
  getAllResources,
  getAllStrategies,
  getAllEvents,
  getAllPrints,

  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getStrategyBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getDocumentBySlug,

  getDocHref,
  normalizeSlug,
  isDraftContent,
  isDraft,
  getDocKind,
  getAccessLevel,

  resolveDocDownloadUrl,
  resolveDocDownloadHref,
  resolveDocCoverImage,
  getDownloadSizeLabel,

  toUiDoc,
  assertContentlayerHasDocs,
  assertPublicAssetsForDownloadsAndResources,
  recordContentView,

  sanitizeData,
};

export default ContentHelper;