/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "@/lib/contentlayer";

/* -------------------------------------------------------------------------- */
/* 1. TYPES & INTERFACES                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Document kind enumeration for all content types in the system.
 * Each kind maps to a specific URL route.
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

/**
 * Access tier system for gated content.
 * Higher tiers require higher membership levels.
 */
export type AccessLevel =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

export type Tier = AccessLevel;

/**
 * Raw metadata from Contentlayer's internal processing.
 */
interface RawMeta {
  flattenedPath?: string;
  sourceFileName?: string;
}

/**
 * ContentDoc: Permissive input shape that accepts messy frontmatter.
 * All fields are optional because frontmatter is untrusted input.
 */
export interface ContentDoc {
  // Contentlayer discriminators (varies by setup)
  _type?: string;
  type?: string;
  documentType?: string;

  _raw?: RawMeta;

  // Common metadata (can be messy in frontmatter)
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;

  date?: string | Date | null;

  slug?: string | null; // May include nested paths
  canonicalUrl?: string | null;

  // Some docs include precomputed url/href fields
  url?: string | null; // Canonical internal route if present
  href?: string | null; // CTA only

  draft?: boolean;
  featured?: boolean;

  accessLevel?: string | null;
  lockMessage?: string | null;

  tags?: unknown;

  // Media
  coverImage?: string | null;
  coverimage?: string | null;
  normalizedCoverImage?: string | null;

  // Aspect hints (varies across docs)
  coverAspect?: string | null;
  aspect?: string | null;

  // Reading time variants
  readTime?: string | null;
  readtime?: string | null;
  readingTime?: string | null;
  normalizedReadTime?: string | null;

  // Download variants
  canonicalPdfHref?: string | null;
  downloadUrl?: string | null;
  fileUrl?: string | null;
  pdfPath?: string | null;
  file?: string | null;
  downloadFile?: string | null;
  
  // NEW: Add file size handling
  fileSize?: number | string | null;
  size?: number | string | null;
  downloadSize?: number | string | null;
  fileSizeLabel?: string | null;

  // Prints/events/other
  available?: boolean | null;

  body?: { raw?: string; code?: string } | null;
  content?: string | null;

  // Allow arbitrary frontmatter passthrough (untrusted)
  [key: string]: unknown;
}

/**
 * UI-ready card properties for consistent display.
 */
export interface CardProps {
  kind: DocKind;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  href: string;

  // Media (always present or null-safe)
  coverImage: string;
  coverAspect: string | null;

  // Meta
  tags: string[];
  dateISO: string | null; // ISO string
  readTime: string | null;

  // Access
  accessLevel: AccessLevel;
  lockMessage: string | null;

  // Downloads
  downloadHref: string | null;
  downloadSizeLabel: string | null; // NEW: Add file size label
}

/**
 * Search document shape for indexing.
 */
export type SearchDocType = "post" | "book" | "download" | "print" | "resource" | "canon";

export interface SearchDoc {
  type: SearchDocType;
  slug: string;
  href: string;
  title: string;
  dateISO: string | null;
  excerpt: string | null;
  tags: string[];
  coverImage: string | null;
  coverAspect: string | null;
}

/* -------------------------------------------------------------------------- */
/* 2. VALIDATION TYPES                                                        */
/* -------------------------------------------------------------------------- */

export type ValidationIssueLevel = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  level: ValidationIssueLevel;
  code: string;
  message: string;
  slug?: string;
  field?: string;
  suggestion?: string;
}

export interface ContentMetrics {
  totalDocuments: number;
  publishedDocuments: number;
  draftDocuments: number;
  byKind: Record<DocKind, number>;
  byTier: Record<Tier, number>;
  featuredCount: number;
  avgTagsPerDocument: number;
  dateRange: { earliest: string | null; latest: string | null };
  validationIssues: number;
}

export interface BatchOptions {
  includeDrafts?: boolean;
  filterByKind?: DocKind[];
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'title' | 'slug';
  sortDirection?: 'asc' | 'desc';
  featuredOnly?: boolean;
  withTag?: string;
}

/* -------------------------------------------------------------------------- */
/* 3. CONFIGURATION                                                           */
/* -------------------------------------------------------------------------- */

interface ContentlayerHelperConfig {
  // URLs
  kindUrlMap: Record<DocKind, string>;
  fallbackImage: string;
  shortFallbackImage: string;
  shortThemeCovers: Record<string, string>;
  
  // Behavior
  strictMode: boolean;
  logWarnings: boolean;
  throwOnMissingAssets: boolean;
  
  // Search
  searchableKinds: DocKind[];
  
  // Tier
  tierOrder: Tier[];
  defaultTier: Tier;
  
  // Performance
  enableCaching: boolean;
  cacheMaxSize: number;
}

const KIND_URL_MAP: Record<DocKind, string> = {
  post: "/blog",
  book: "/books",
  download: "/downloads",
  event: "/events",
  print: "/prints",
  resource: "/resources",
  strategy: "/strategy",
  canon: "/canon",
  short: "/shorts",
  unknown: "/content",
};

const GLOBAL_FALLBACK_IMAGE = "/assets/images/writing-desk.webp";
const SHORT_GLOBAL_FALLBACK = "/assets/images/shorts/cover.jpg";

const SHORT_THEME_COVERS: Record<string, string> = {
  default: "/assets/images/shorts/themes/default-cover.jpg",
  faith: "/assets/images/shorts/themes/faith.jpg",
  gentle: "/assets/images/shorts/themes/gentle.jpg",
  "hard-truths": "/assets/images/shorts/themes/hard-truths.jpg",
  "inner-life": "/assets/images/shorts/themes/inner-life.jpg",
  "outer-life": "/assets/images/shorts/themes/outer-life.jpg",
  purpose: "/assets/images/shorts/themes/purpose.jpg",
  relationships: "/assets/images/shorts/themes/relationships.jpg",
};

const TIER_ORDER: Tier[] = [
  "public",
  "inner-circle",
  "inner-circle-plus",
  "inner-circle-elite",
  "private",
];

const DEFAULT_CONFIG: ContentlayerHelperConfig = {
  kindUrlMap: KIND_URL_MAP,
  fallbackImage: GLOBAL_FALLBACK_IMAGE,
  shortFallbackImage: SHORT_GLOBAL_FALLBACK,
  shortThemeCovers: SHORT_THEME_COVERS,
  strictMode: process.env.NODE_ENV === "production",
  logWarnings: process.env.NODE_ENV === "development",
  throwOnMissingAssets: process.env.CI === "true",
  searchableKinds: ["post", "book", "download", "print", "resource", "canon"],
  tierOrder: TIER_ORDER,
  defaultTier: "public",
  enableCaching: true,
  cacheMaxSize: 1000,
};

let config = DEFAULT_CONFIG;

/**
 * Configure the helper behavior at runtime.
 */
export function configureContentlayerHelper(overrides: Partial<ContentlayerHelperConfig>): void {
  config = { ...config, ...overrides };
  clearCaches();
}

/* -------------------------------------------------------------------------- */
/* 4. UTILITY FUNCTIONS                                                       */
/* -------------------------------------------------------------------------- */

// Enhanced memoization with cache clearing support
type MemoFn<T extends (...args: any[]) => any> = T & { __cache?: Map<string, ReturnType<T>> };

const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string
): MemoFn<T> => {
  if (!config.enableCaching) return fn as MemoFn<T>;
  
  const wrapped = ((...args: Parameters<T>) => {
    const cache = wrapped.__cache!;
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    if (cache.size < config.cacheMaxSize) {
      cache.set(key, result);
    }
    return result;
  }) as MemoFn<T>;
  
  wrapped.__cache = new Map<string, ReturnType<T>>();
  return wrapped;
};

// Track memoized functions for clearing
const memoizedFunctions: Set<MemoFn<any>> = new Set();

// Clear all caches (useful for testing or config changes)
export function clearCaches(): void {
  for (const fn of memoizedFunctions) {
    fn.__cache?.clear();
  }
}

// Type-safe coercion utilities
const str = (v: unknown, fallback = ""): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
};

const strTrim = (v: unknown, fallback = ""): string => str(v, fallback).trim();

const strOrNull = (v: unknown): string | null => {
  const s = strTrim(v, "");
  return s ? s : null;
};

const lower = (v: unknown, fallback = ""): string => strTrim(v, fallback).toLowerCase();

const bool = (v: unknown, fallback = false): boolean => {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(s)) return true;
    if (["false", "0", "no", "n"].includes(s)) return false;
  }
  return fallback;
};

// String manipulation utilities
const stripQueryAndHash = (s: string): string => s.split("#")[0]?.split("?")[0] ?? s;

const ensureLeadingSlash = (s: string): string => (s.startsWith("/") ? s : `/${s}`);

const normalizeSlashes = (s: string): string => s.replace(/\\/g, "/").replace(/\/{2,}/g, "/");

function normalizeInternalPath(input: unknown): string {
  let s = strTrim(input, "");
  if (!s) return "";

  // Allow remote passthrough
  if (/^https?:\/\//i.test(s)) return s;

  s = stripQueryAndHash(s);
  s = normalizeSlashes(s);
  s = ensureLeadingSlash(s);
  return s;
}

function isValidInternalUrl(u: string): boolean {
  return u.startsWith("/") && !u.startsWith("//");
}

/**
 * Canonical slug = last segment only
 * NOTE: used where pages expect [slug].tsx.
 */
function toCanonicalSlug(input: unknown): string {
  let s = strTrim(input, "");
  if (!s) return "";
  s = stripQueryAndHash(s);
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = normalizeSlashes(s);
  s = s.replace(/\/+$/, "");
  s = s.replace(/^\/+/, "");
  if (!s) return "";
  const parts = s.split("/").filter(Boolean);
  return parts.length ? parts[parts.length - 1] : s;
}

/* -------------------------------------------------------------------------- */
/* 5. CORE COLLECTIONS                                                        */
/* -------------------------------------------------------------------------- */

interface GeneratedArrays {
  allPosts?: unknown;
  allBooks?: unknown;
  allDownloads?: unknown;
  allEvents?: unknown;
  allPrints?: unknown;
  allResources?: unknown;
  allStrategies?: unknown;
  allCanons?: unknown;
  allShorts?: unknown;
}

function pickArray<K extends keyof GeneratedArrays>(name: K): ContentDoc[] {
  const v = (generated as unknown as GeneratedArrays)[name];
  return Array.isArray(v) ? (v as ContentDoc[]) : [];
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

/**
 * Get all documents from Contentlayer.
 */
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

/* -------------------------------------------------------------------------- */
/* 6. DOCUMENT PROPERTIES                                                     */
/* -------------------------------------------------------------------------- */

export const isDraftContent = (doc: ContentDoc): boolean =>
  bool(doc?.draft, false) || str(doc?._raw?.sourceFileName, "").startsWith("_");

export const isPublishedContent = (doc: ContentDoc): boolean => !isDraftContent(doc);

export const getPublishedDocuments = (): ContentDoc[] =>
  getAllContentlayerDocs().filter(isPublishedContent);

export const getFeaturedDocuments = (): ContentDoc[] => {
  const docs = getPublishedDocuments();
  return docs.filter((d) => bool((d as any)?.featured, false));
};

export const getFeaturedDocumentsByType = (type: string): ContentDoc[] => {
  const t = lower(type, "");
  if (!t) return getFeaturedDocuments();

  return getFeaturedDocuments().filter((d) => {
    const dt = lower((d as any)?.type || (d as any)?._type || (d as any)?.documentType, "");
    return dt === t;
  });
};

/**
 * Get document kind with memoization.
 */
export const getDocKind = memoize(
  (doc: ContentDoc): DocKind => {
    const raw = lower(doc?._type ?? doc?.type ?? (doc as any)?.documentType, "");
    switch (raw) {
      case "post":
        return "post";
      case "book":
        return "book";
      case "download":
        return "download";
      case "event":
        return "event";
      case "print":
        return "print";
      case "resource":
        return "resource";
      case "strategy":
        return "strategy";
      case "canon":
        return "canon";
      case "short":
        return "short";
      default:
        return "unknown";
    }
  },
  (doc) => doc._raw?.flattenedPath || strTrim(doc?.slug, '') || 'unknown'
);

memoizedFunctions.add(getDocKind as MemoFn<any>);

/**
 * Normalize slug with memoization.
 */
export const normalizeSlug = memoize(
  (doc: ContentDoc): string => {
    if (!doc) return "";

    const explicit = toCanonicalSlug(doc.slug);
    if (explicit) return explicit;

    const fp = strTrim(doc?._raw?.flattenedPath, "");
    if (!fp) return "";

    const fpClean = fp.replace(/\/+$/, "").toLowerCase();
    const parts = fpClean.split("/").filter(Boolean);
    if (!parts.length) return "";

    const last = parts[parts.length - 1];
    const slug = last === "index" ? parts[parts.length - 2] ?? "" : last;

    return toCanonicalSlug(slug);
  },
  (doc) => doc._raw?.flattenedPath || strTrim(doc?.slug, '') || 'unknown'
);

memoizedFunctions.add(normalizeSlug as MemoFn<any>);

/* -------------------------------------------------------------------------- */
/* 7. ACCESS CONTROL                                                          */
/* -------------------------------------------------------------------------- */

export function isTier(v: unknown): v is Tier {
  const s = String(v ?? "").trim().toLowerCase();
  return (TIER_ORDER as string[]).includes(s);
}

export function normalizeTier(v: unknown, fallback: Tier = "public"): Tier {
  const s = String(v ?? "").trim().toLowerCase();
  return (TIER_ORDER as string[]).includes(s) ? (s as Tier) : fallback;
}

/**
 * Centralized access tier interpretation.
 */
export function getRequiredTier(doc: ContentDoc): Tier {
  if (!doc) return config.defaultTier;

  // Primary: your existing accessLevel field
  const accessLevel = normalizeTier((doc as any)?.accessLevel, config.defaultTier);
  if (accessLevel !== config.defaultTier) return accessLevel;

  // Secondary/legacy signals
  const legacy =
    (doc as any)?.requiredTier ??
    (doc as any)?.tier ??
    (doc as any)?.membership ??
    (doc as any)?.plan ??
    (doc as any)?.access;

  return normalizeTier(legacy, config.defaultTier);
}

export function getAccessLevel(doc: ContentDoc): AccessLevel {
  return getRequiredTier(doc);
}

export function isPublic(doc: ContentDoc): boolean {
  return getAccessLevel(doc) === "public";
}

/**
 * Compare user tier vs doc required tier.
 * Returns true if user can access the doc.
 */
export function isTierAllowed(userTier: unknown, requiredTier: unknown): boolean {
  const u = normalizeTier(userTier, config.defaultTier);
  const r = normalizeTier(requiredTier, config.defaultTier);
  return config.tierOrder.indexOf(u) >= config.tierOrder.indexOf(r);
}

/**
 * Convenience for callers that already have a doc.
 */
export function canAccessDoc(doc: ContentDoc, userTier: unknown): boolean {
  return isTierAllowed(userTier, getRequiredTier(doc));
}

/* -------------------------------------------------------------------------- */
/* 8. METADATA NORMALIZATION                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Tag coercion with support for comma and pipe separators.
 */
function coerceTags(doc: ContentDoc): string[] {
  // Accept tags as:
  // - array
  // - comma-separated string
  // - pipe-separated string
  // - single string
  const t = (doc as any)?.tags;

  if (Array.isArray(t)) {
    return t
      .map((x) => strTrim(x, ""))
      .filter(Boolean)
      .map((x) => lower(x, ""));
  }

  if (typeof t === "string") {
    const s = t.trim();
    if (!s) return [];
    
    // Split by comma or pipe
    if (s.includes(",") || s.includes("|")) {
      return s
        .split(/[,|]/g)
        .map((x) => lower(x.trim(), ""))
        .filter(Boolean);
    }
    
    // Single tag
    const tag = lower(s, "");
    return tag ? [tag] : [];
  }

  return [];
}

/**
 * Date normalization to ISO string.
 */
export function resolveDocDateISO(doc: ContentDoc): string | null {
  const v = (doc as any)?.date;
  if (!v) return null;

  try {
    const d = v instanceof Date ? v : new Date(String(v));
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function safeTime(doc: ContentDoc): number {
  const iso = resolveDocDateISO(doc);
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

/* -------------------------------------------------------------------------- */
/* 9. URL ROUTING                                                             */
/* -------------------------------------------------------------------------- */

export function getDocHref(doc: ContentDoc): string {
  // Trust explicit internal url if valid
  const computedUrl = strTrim(doc?.url, "");
  if (computedUrl) {
    const n = normalizeInternalPath(computedUrl);
    if (n && isValidInternalUrl(n)) return n;
  }

  const kind = getDocKind(doc);
  const base = config.kindUrlMap[kind] ?? "/content";

  const slug = normalizeSlug(doc);
  return slug ? `${base}/${slug}` : base;
}

export function getDocCanonicalUrlPath(doc: ContentDoc): string {
  return getDocHref(doc);
}

/* -------------------------------------------------------------------------- */
/* 10. MEDIA RESOLUTION                                                       */
/* -------------------------------------------------------------------------- */

function normalizeThemeKey(k: string): string {
  const s = lower(k, "")
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/[^\w-]/g, "");

  if (s.includes("hard") && s.includes("truth")) return "hard-truths";
  if (s.includes("inner") && s.includes("life")) return "inner-life";
  if (s.includes("outer") && s.includes("life")) return "outer-life";
  if (s.includes("relationship")) return "relationships";
  if (s.includes("faith") || s.includes("scripture") || s.includes("theology")) return "faith";
  if (s.includes("purpose") || s.includes("calling") || s.includes("destiny")) return "purpose";
  if (s.includes("gentle") || s.includes("soft") || s.includes("comfort")) return "gentle";
  return s;
}

function resolveShortCover(doc: ContentDoc): string {
  // Computed first
  const normalized = normalizeInternalPath((doc as any)?.normalizedCoverImage);
  if (normalized && isValidInternalUrl(normalized)) return normalized;

  // Raw variants
  const explicit = normalizeInternalPath(
    (doc as any)?.coverImage || (doc as any)?.coverimage || (doc as any)?.image || (doc as any)?.cover
  );
  if (explicit && isValidInternalUrl(explicit)) return explicit;

  const tags = coerceTags(doc);
  const themeHint = lower((doc as any)?.theme || (doc as any)?.category || "", "");
  const candidates = [themeHint, ...tags].filter(Boolean);

  for (const c of candidates) {
    const key = normalizeThemeKey(c);
    const cover = config.shortThemeCovers[key];
    if (cover) return cover;
  }

  return config.shortThemeCovers.default || config.shortFallbackImage;
}

export function resolveDocCoverImage(doc: ContentDoc): string {
  const kind = getDocKind(doc);

  if (kind === "short") {
    const cover = normalizeInternalPath(resolveShortCover(doc));
    return cover || config.shortFallbackImage;
  }

  const normalized = normalizeInternalPath((doc as any)?.normalizedCoverImage);
  if (normalized && isValidInternalUrl(normalized)) return normalized;

  const explicit = normalizeInternalPath(
    (doc as any)?.coverImage || (doc as any)?.coverimage || (doc as any)?.image || (doc as any)?.cover
  );
  if (explicit && isValidInternalUrl(explicit)) return explicit;

  return config.fallbackImage;
}

export function resolveDocReadTime(doc: ContentDoc): string | null {
  const normalized = strTrim((doc as any)?.normalizedReadTime, "");
  if (normalized) return normalized;

  const raw =
    strTrim((doc as any)?.readTime, "") ||
    strTrim((doc as any)?.readtime, "") ||
    strTrim((doc as any)?.readingTime, "");

  return raw || null;
}

/**
 * Cover aspect normalization.
 */
export function resolveDocCoverAspect(doc: ContentDoc): string | null {
  const raw = strTrim((doc as any)?.coverAspect ?? (doc as any)?.aspect, "");
  if (!raw) return null;

  return raw.toLowerCase();
}

/* -------------------------------------------------------------------------- */
/* 11. DOWNLOAD URLs                                                          */
/* -------------------------------------------------------------------------- */

export function resolveDocDownloadUrl(doc: ContentDoc): string | null {
  const canonical = strTrim((doc as any)?.canonicalPdfHref, "");
  if (canonical) return normalizeInternalPath(canonical);

  const raw =
    strTrim((doc as any)?.downloadUrl, "") ||
    strTrim((doc as any)?.fileUrl, "") ||
    strTrim((doc as any)?.pdfPath, "") ||
    strTrim((doc as any)?.file, "") ||
    strTrim((doc as any)?.downloadFile, "");

  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  const url = normalizeInternalPath(raw);

  // Normalize legacy "/downloads/foo.pdf" -> "/assets/downloads/foo.pdf"
  if (url.startsWith("/downloads/")) return url.replace(/^\/downloads\//, "/assets/downloads/");

  return url;
}

export function resolveDocDownloadHref(doc: ContentDoc): string | null {
  const direct = resolveDocDownloadUrl(doc);
  if (!direct) return null;

  if (getAccessLevel(doc) === "public") return direct;

  const slug = normalizeSlug(doc);
  if (!slug) return null;

  return `/api/downloads/${encodeURIComponent(slug)}`;
}

/**
 * File size label resolution.
 */
export function resolveDocDownloadSizeLabel(doc: ContentDoc): string | null {
  if (!doc || typeof doc !== 'object') return null;
  
  // Try different property names
  const sizeProp = doc.size || doc.fileSize || doc.downloadSize || doc.fileSizeLabel;
  
  if (typeof sizeProp === 'string') {
    const trimmed = sizeProp.trim();
    return trimmed || null;
  }
  
  // If size is a number in bytes, format it
  if (typeof sizeProp === 'number') {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = sizeProp;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }
  
  return null;
}

/* -------------------------------------------------------------------------- */
/* 12. QUERY FUNCTIONS                                                        */
/* -------------------------------------------------------------------------- */

export function getPublishedDocumentsByType(kind: DocKind, limit?: number): ContentDoc[] {
  const items = getPublishedDocuments()
    .filter((d) => getDocKind(d) === kind)
    .sort((a, b) => safeTime(b) - safeTime(a));

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export const getPublishedPosts = (): ContentDoc[] => getPublishedDocumentsByType("post");
export const getAllBooks = (): ContentDoc[] => getPublishedDocumentsByType("book");
export const getAllDownloads = (): ContentDoc[] => getPublishedDocumentsByType("download");
export const getAllEvents = (): ContentDoc[] => getPublishedDocumentsByType("event");
export const getAllPrints = (): ContentDoc[] => getPublishedDocumentsByType("print");
export const getAllResources = (): ContentDoc[] => getPublishedDocumentsByType("resource");
export const getAllStrategies = (): ContentDoc[] => getPublishedDocumentsByType("strategy");
export const getAllCanons = (): ContentDoc[] => getPublishedDocumentsByType("canon");
export const getPublishedShorts = (): ContentDoc[] => getPublishedDocumentsByType("short");

/* By Slug: last-segment match only */
const cleanMatch = (s: string): string => toCanonicalSlug(s);

export const getPostBySlug = (s: string): ContentDoc | null =>
  getPublishedPosts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getBookBySlug = (s: string): ContentDoc | null =>
  getAllBooks().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getDownloadBySlug = (s: string): ContentDoc | null =>
  getAllDownloads().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getResourceBySlug = (s: string): ContentDoc | null =>
  getAllResources().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getEventBySlug = (s: string): ContentDoc | null =>
  getAllEvents().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getPrintBySlug = (s: string): ContentDoc | null =>
  getAllPrints().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getStrategyBySlug = (s: string): ContentDoc | null =>
  getAllStrategies().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getCanonBySlug = (s: string): ContentDoc | null =>
  getAllCanons().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

export const getShortBySlug = (s: string): ContentDoc | null =>
  getPublishedShorts().find((d) => normalizeSlug(d) === cleanMatch(s)) ?? null;

/* -------------------------------------------------------------------------- */
/* 13. UI-READY PROPS                                                         */
/* -------------------------------------------------------------------------- */

// Runtime type guard for ContentDoc
export function isContentDoc(v: unknown): v is ContentDoc {
  if (!v || typeof v !== 'object') return false;
  
  const obj = v as Record<string, unknown>;
  
  // Must have at least one of these identifiers
  const hasIdentifier = 
    typeof obj._raw === 'object' ||
    typeof obj.slug === 'string' ||
    typeof obj.title === 'string';
    
  // Allow unknown kinds for future expansion
  return hasIdentifier;
}

// Assert that a value is a ContentDoc
export function assertContentDoc(v: unknown, context?: string): asserts v is ContentDoc {
  if (!isContentDoc(v)) {
    const error = new Error(
      `Invalid ContentDoc${context ? ` in ${context}` : ''}: ${JSON.stringify(v).slice(0, 100)}`
    );
    if (config.strictMode) {
      throw error;
    } else if (config.logWarnings) {
      console.warn(error.message);
    }
  }
}

/**
 * Get document category with proper inference.
 */
function getDocCategory(doc: ContentDoc, tags: string[]): string | null {
  const explicit = strOrNull((doc as any)?.category);
  if (explicit) return explicit;
  const theme = strOrNull((doc as any)?.theme);
  if (theme) return theme;
  return tags[0] ?? null;
}

export function getCardPropsForDocument(doc: ContentDoc): CardProps {
  assertContentDoc(doc, 'getCardPropsForDocument');
  
  const kind = getDocKind(doc);
  const slug = normalizeSlug(doc);

  return {
    kind,
    slug,
    title: strTrim((doc as any)?.title, "Untitled"),
    subtitle: strOrNull((doc as any)?.subtitle),
    excerpt: strOrNull((doc as any)?.excerpt),
    description: strOrNull((doc as any)?.description),
    href: getDocHref(doc),

    coverImage: resolveDocCoverImage(doc),
    coverAspect: resolveDocCoverAspect(doc),

    tags: coerceTags(doc),
    dateISO: resolveDocDateISO(doc),
    readTime: resolveDocReadTime(doc),

    accessLevel: getAccessLevel(doc),
    lockMessage: strOrNull((doc as any)?.lockMessage),

    downloadHref: kind === "download" ? resolveDocDownloadHref(doc) : null,
    downloadSizeLabel: resolveDocDownloadSizeLabel(doc), // NEW
  };
}

export function getSearchDocForDocument(doc: ContentDoc): SearchDoc | null {
  const card = getCardPropsForDocument(doc);

  // Only index allowed kinds
  const allowedKinds = new Set(config.searchableKinds);
  if (!allowedKinds.has(card.kind)) return null;

  return {
    type: card.kind as SearchDocType,
    slug: card.slug,
    href: card.href,
    title: card.title,
    dateISO: card.dateISO,
    excerpt: card.excerpt ?? card.description ?? null,
    tags: card.tags,
    coverImage: card.coverImage ? card.coverImage : null,
    coverAspect: card.coverAspect,
  };
}

/* -------------------------------------------------------------------------- */
/* 14. DOCUMENT VALIDATION                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Validate a single document for common issues.
 */
export function validateDocument(doc: ContentDoc): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const slug = normalizeSlug(doc);
  
  // Required fields
  if (!strTrim(doc?.title, '')) {
    issues.push({
      level: 'warning',
      code: 'MISSING_TITLE',
      message: `Document is missing a title`,
      slug,
      field: 'title',
      suggestion: 'Add a descriptive title',
    });
  }
  
  // Date validation
  if (doc.date) {
    const iso = resolveDocDateISO(doc);
    if (!iso) {
      issues.push({
        level: 'warning',
        code: 'INVALID_DATE',
        message: `Date format is invalid`,
        slug,
        field: 'date',
        suggestion: 'Use ISO format (YYYY-MM-DD) or Date object',
      });
    }
  }
  
  // Cover image validation
  const cover = resolveDocCoverImage(doc);
  if (cover === config.fallbackImage || cover === config.shortFallbackImage) {
    issues.push({
      level: 'info',
      code: 'USING_FALLBACK_COVER',
      message: `Using fallback cover image`,
      slug,
      field: 'coverImage',
      suggestion: 'Add a coverImage field',
    });
  }
  
  // Slug validation
  if (!slug) {
    issues.push({
      level: 'error',
      code: 'INVALID_SLUG',
      message: `Document has no valid slug`,
      field: 'slug',
      suggestion: 'Add a slug or ensure flattenedPath is set',
    });
  }
  
  return issues;
}

/**
 * Validate all documents and return aggregated issues.
 */
export function validateAllDocuments(): Record<string, ValidationIssue[]> {
  const result: Record<string, ValidationIssue[]> = {};
  const docs = getAllContentlayerDocs();
  
  for (const doc of docs) {
    const slug = normalizeSlug(doc);
    if (slug) {
      result[slug] = validateDocument(doc);
    }
  }
  
  return result;
}

/* -------------------------------------------------------------------------- */
/* 15. BATCH OPERATIONS                                                       */
/* -------------------------------------------------------------------------- */

export function getDocumentsBatch(options: BatchOptions = {}): ContentDoc[] {
  const {
    includeDrafts = false,
    filterByKind,
    limit,
    offset = 0,
    sortBy = 'date',
    sortDirection = 'desc',
    featuredOnly = false,
    withTag,
  } = options;
  
  let docs = includeDrafts 
    ? getAllContentlayerDocs() 
    : getPublishedDocuments();
    
  if (featuredOnly) {
    docs = docs.filter(doc => bool((doc as any)?.featured, false));
  }
  
  if (filterByKind?.length) {
    docs = docs.filter(doc => filterByKind.includes(getDocKind(doc)));
  }
  
  if (withTag) {
    const tagLower = withTag.toLowerCase();
    docs = docs.filter(doc => {
      const tags = coerceTags(doc);
      return tags.some(t => t.toLowerCase() === tagLower);
    });
  }
  
  // Sorting
  docs.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'date':
        aVal = safeTime(a);
        bVal = safeTime(b);
        break;
      case 'title':
        aVal = strTrim(a.title, '').toLowerCase();
        bVal = strTrim(b.title, '').toLowerCase();
        break;
      case 'slug':
        aVal = normalizeSlug(a);
        bVal = normalizeSlug(b);
        break;
      default:
        return 0;
    }
    
    const modifier = sortDirection === 'desc' ? -1 : 1;
    return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * modifier;
  });
  
  // Pagination
  const start = offset;
  const end = limit ? start + limit : docs.length;
  return docs.slice(start, end);
}

/* -------------------------------------------------------------------------- */
/* 16. QUERY BUILDER                                                          */
/* -------------------------------------------------------------------------- */

export class ContentQueryBuilder {
  private documents: ContentDoc[] = getAllContentlayerDocs();
  private shouldIncludeDrafts = false;
  
  constructor() {}
  
  includeDrafts(include = true): this {
    this.shouldIncludeDrafts = include;
    if (!include) {
      this.documents = this.documents.filter(isPublishedContent);
    }
    return this;
  }
  
  ofKind(kind: DocKind): this {
    this.documents = this.documents.filter(doc => getDocKind(doc) === kind);
    return this;
  }
  
  withTag(tag: string): this {
    const tagLower = tag.toLowerCase();
    this.documents = this.documents.filter(doc => {
      const tags = coerceTags(doc);
      return tags.some(t => t.toLowerCase() === tagLower);
    });
    return this;
  }
  
  featuredOnly(): this {
    this.documents = this.documents.filter(doc => bool((doc as any)?.featured, false));
    return this;
  }
  
  sortByDate(direction: 'asc' | 'desc' = 'desc'): this {
    const dir = direction === 'asc' ? 1 : -1;
    this.documents.sort((a, b) => (safeTime(a) - safeTime(b)) * dir);
    return this;
  }
  
  sortByTitle(direction: 'asc' | 'desc' = 'asc'): this {
    const modifier = direction === 'asc' ? 1 : -1;
    this.documents.sort((a, b) => {
      const aTitle = strTrim(a.title, '').toLowerCase();
      const bTitle = strTrim(b.title, '').toLowerCase();
      return aTitle.localeCompare(bTitle) * modifier;
    });
    return this;
  }
  
  limit(count: number): this {
    this.documents = this.documents.slice(0, count);
    return this;
  }
  
  offset(count: number): this {
    this.documents = this.documents.slice(count);
    return this;
  }
  
  get(): ContentDoc[] {
    return [...this.documents];
  }
  
  getCardProps(): CardProps[] {
    return this.documents.map(getCardPropsForDocument);
  }
  
  getSearchDocs(): SearchDoc[] {
    return this.documents
      .map(getSearchDocForDocument)
      .filter((doc): doc is SearchDoc => doc !== null);
  }
}

/* -------------------------------------------------------------------------- */
/* 17. METRICS COLLECTION                                                     */
/* -------------------------------------------------------------------------- */

export function collectContentMetrics(): ContentMetrics {
  const allDocs = getAllContentlayerDocs();
  const published = getPublishedDocuments();
  const drafts = allDocs.filter(isDraftContent);
  const featured = getFeaturedDocuments();
  
  const byKind: Record<DocKind, number> = {} as Record<DocKind, number>;
  const byTier: Record<Tier, number> = {} as Record<Tier, number>;
  
  allDocs.forEach(doc => {
    const kind = getDocKind(doc);
    const tier = getRequiredTier(doc);
    
    byKind[kind] = (byKind[kind] || 0) + 1;
    byTier[tier] = (byTier[tier] || 0) + 1;
  });
  
  const dates = published
    .map(doc => resolveDocDateISO(doc))
    .filter((d): d is string => d !== null)
    .sort();
    
  const totalTags = published.reduce((sum, doc) => sum + coerceTags(doc).length, 0);
  
  // Count validation issues
  let validationIssues = 0;
  const validation = validateAllDocuments();
  Object.values(validation).forEach(issues => {
    validationIssues += issues.length;
  });
  
  return {
    totalDocuments: allDocs.length,
    publishedDocuments: published.length,
    draftDocuments: drafts.length,
    byKind,
    byTier,
    featuredCount: featured.length,
    avgTagsPerDocument: published.length ? totalTags / published.length : 0,
    dateRange: {
      earliest: dates[0] || null,
      latest: dates[dates.length - 1] || null,
    },
    validationIssues,
  };
}

/* -------------------------------------------------------------------------- */
/* 18. UTILITY FUNCTIONS                                                      */
/* -------------------------------------------------------------------------- */

// Exported theme coercion for Shorts
export function coerceShortTheme(doc: ContentDoc, tags?: string[]): string | null {
  const explicit = String((doc as any)?.theme ?? "").trim();
  if (explicit) return explicit;

  const t = Array.isArray(tags) ? tags : coerceTags(doc);

  // Light inference — keep it stable and boring
  const joined = t.join(" ").toLowerCase();
  if (joined.includes("faith") || joined.includes("scripture") || joined.includes("theology")) return "Faith";
  if (joined.includes("purpose") || joined.includes("calling") || joined.includes("destiny")) return "Purpose";
  if (joined.includes("relationship")) return "Relationships";
  if (joined.includes("hard") && joined.includes("truth")) return "Hard Truths";
  if (joined.includes("gentle") || joined.includes("comfort")) return "Gentle";

  return "General";
}

/* -------------------------------------------------------------------------- */
/* 19. BACKWARD COMPATIBILITY                                                 */
/* -------------------------------------------------------------------------- */

// Old name some files use
export const isPublished = isPublishedContent;
export const isDraft = isDraftContent;

// Sometimes people imported "getPublishedShorts" logic through helper anyway
export const getShorts = getPublishedShorts;

// Legacy type exports for compatibility
export type PostType = ContentDoc;
export type BookType = ContentDoc;
export type DownloadType = ContentDoc;
export type EventType = ContentDoc;
export type PrintType = ContentDoc;
export type ResourceType = ContentDoc;
export type StrategyType = ContentDoc;
export type CanonType = ContentDoc;
export type ShortType = ContentDoc;

/* -------------------------------------------------------------------------- */
/* 20. CRITICAL BUILD GUARD                                                   */
/* -------------------------------------------------------------------------- */

export function assertContentlayerHasDocs(where: string): void {
  if (getAllContentlayerDocs().length === 0) {
    throw new Error(`[Critical Build Error] No Contentlayer documents found at ${where}`);
  }
}

/* -------------------------------------------------------------------------- */
/* 21. UI DOCUMENT CONVERSION                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Convert a ContentDoc to a UI-friendly document shape.
 * Used by pages that need a standardized UI object.
 */
export interface UiDoc {
  title: string;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  category: string | null;
  dateISO: string | null; // ISO datetime string
  readTime: string | null;
  tags: string[] | null;
  slug: string;
}

export function toUiDoc(doc: ContentDoc): UiDoc {
  const cardProps = getCardPropsForDocument(doc);
  const tags = cardProps.tags;
  
  // Get category with proper inference
  const category = getDocCategory(doc, tags);

  return {
    title: cardProps.title,
    excerpt: cardProps.excerpt,
    description: cardProps.description,
    coverImage: cardProps.coverImage,
    category,
    dateISO: cardProps.dateISO,
    readTime: cardProps.readTime,
    tags: tags.length > 0 ? tags : null,
    slug: cardProps.slug,
  };
}

/* -------------------------------------------------------------------------- */
/* 22. CONFIGURATION GETTER                                                   */
/* -------------------------------------------------------------------------- */

// Export configuration getter for debugging
export function getConfig(): Readonly<ContentlayerHelperConfig> {
  return { ...config };
}

/* -------------------------------------------------------------------------- */
/* 23. KIND BASE PATH GETTER (Backward Compatibility)                         */
/* -------------------------------------------------------------------------- */

/**
 * Get the base path for a document kind.
 * Used by some older components.
 */
export function getKindBasePath(kind: DocKind): string {
  return config.kindUrlMap[kind] ?? "/content";
}

/**
 * Get the base path for a document.
 */
export function getDocBasePath(doc: ContentDoc): string {
  const kind = getDocKind(doc);
  return getKindBasePath(kind);
}

/* -------------------------------------------------------------------------- */
/* 24. INITIALIZATION                                                         */
/* -------------------------------------------------------------------------- */

if (process.env.NODE_ENV === "development") {
  configureContentlayerHelper({ logWarnings: true, strictMode: false });
} else if (process.env.NODE_ENV === "production") {
  configureContentlayerHelper({ logWarnings: false, strictMode: true, enableCaching: true });
}