/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/index.ts — SSOT Content API (Client-safe)
 *
 * HARD RULE:
 * - Do NOT import per-type exports (Post/Book/etc) from contentlayer/generated,
 *   because contentlayer2 output may not export them as named types.
 * - Use `allDocuments` and infer.
 */

import { allDocuments } from "contentlayer/generated";

// -----------------------------
// Tier definitions
// -----------------------------
export type Tier = "free" | "basic" | "premium" | "enterprise" | "restricted";

export const TIER_HIERARCHY: Record<Tier, number> = {
  "free": 0,
  "basic": 1,
  "premium": 2,
  "enterprise": 3,
  "restricted": 4,
};

// -----------------------------
// Minimal doc shape (stable)
// -----------------------------
export type ContentDoc = {
  type?: string; // "Post" | "Short" | ...
  title?: string;
  slug?: string;
  href?: string;
  draft?: boolean;
  published?: boolean;
  accessLevel?: string;
  tier?: string;
  classification?: string;
  metadata?: any;
  body?: { raw?: string; code?: string } | any;
  content?: string;
  _raw?: {
    flattenedPath?: string;
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
  };
  [key: string]: any;
};

export type DocKind =
  | "post"
  | "short"
  | "book"
  | "canon"
  | "brief"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "intelligence"
  | "lexicon"
  | "unknown";

// -----------------------------
// Tier utilities
// -----------------------------
export function normalizeTier(tier: string | Tier): Tier {
  if (!tier) return "free";
  
  const normalized = tier.toString().toLowerCase().trim();
  
  // Handle legacy/public names
  if (normalized === "public" || normalized === "free") return "free";
  if (normalized === "inner-circle" || normalized === "basic") return "basic";
  if (normalized === "inner-circle-plus" || normalized === "premium") return "premium";
  if (normalized === "inner-circle-elite" || normalized === "enterprise") return "enterprise";
  if (normalized === "private" || normalized === "restricted") return "restricted";
  
  // Try direct match
  if (isTier(normalized)) return normalized as Tier;
  
  return "free";
}

export function isTier(value: string): value is Tier {
  return ["free", "basic", "premium", "enterprise", "restricted"].includes(value);
}

export function getRequiredTier(doc: any): Tier {
  if (!doc) return "free";
  
  // Check explicit tier field
  if (doc.tier) {
    return normalizeTier(doc.tier);
  }
  
  // Check accessLevel as fallback
  if (doc.accessLevel) {
    return normalizeTier(doc.accessLevel);
  }
  
  // Check classification
  if (doc.classification) {
    return normalizeTier(doc.classification);
  }
  
  return "free";
}

export function isTierAllowed(requiredTier: Tier, userTier: Tier): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function canAccessDoc(doc: any, userTier: string | Tier = "free"): boolean {
  const required = getRequiredTier(doc);
  const user = normalizeTier(userTier);
  return isTierAllowed(required, user);
}

export function getAccessLevel(doc: any): { tier: Tier; requiresAuth: boolean; requiresInnerCircle: boolean; requiresAdmin: boolean } {
  const tier = getRequiredTier(doc);
  return {
    tier,
    requiresAuth: tier !== "free",
    requiresInnerCircle: tier === "basic" || tier === "premium" || tier === "enterprise",
    requiresAdmin: tier === "restricted",
  };
}

// -----------------------------
// Normalizers
// -----------------------------
export function normalizeSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "");
}

export function getFlattenedPath(doc: any): string {
  return String(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "");
}

export function getDocSlug(doc: any): string {
  return normalizeSlug(String(doc?.slug || "").trim()) || normalizeSlug(getFlattenedPath(doc));
}

// -----------------------------
// Publication status
// -----------------------------
export function isPublished(doc: any): boolean {
  // published defaults to true; draft defaults to false
  const draft = Boolean(doc?.draft);
  const published = doc?.published === undefined ? true : Boolean(doc?.published);
  return published && !draft;
}

export function isDraft(doc: any): boolean {
  return Boolean(doc?.draft) || doc?.published === false;
}

export function isPublic(doc: any): boolean {
  if (!doc) return false;
  if (!isPublished(doc)) return false;
  const tier = getRequiredTier(doc);
  return tier === "free";
}

// Aliases for backward compatibility
export const isPublishedContent = isPublished;
export const isPublicDoc = isPublic;
export const isDraftDoc = isDraft;

// -----------------------------
// Kind resolver (single source)
// -----------------------------
export function getDocKind(doc: any): DocKind {
  const t = String(doc?.type || "").toLowerCase();

  if (t === "post") return "post";
  if (t === "short") return "short";
  if (t === "book") return "book";
  if (t === "canon") return "canon";
  if (t === "brief") return "brief";
  if (t === "download") return "download";
  if (t === "event") return "event";
  if (t === "print") return "print";
  if (t === "resource") return "resource";
  if (t === "strategy") return "strategy";
  if (t === "intelligence") return "intelligence";
  if (t === "lexicon") return "lexicon";

  // Fallback based on path (covers weird manifests)
  const fp = getFlattenedPath(doc).toLowerCase();
  if (fp.startsWith("blog/")) return "post";
  if (fp.startsWith("shorts/")) return "short";
  if (fp.startsWith("books/")) return "book";
  if (fp.startsWith("canon/")) return "canon";
  if (fp.startsWith("briefs/")) return "brief";
  if (fp.startsWith("downloads/")) return "download";
  if (fp.startsWith("events/")) return "event";
  if (fp.startsWith("prints/")) return "print";
  if (fp.startsWith("resources/")) return "resource";
  if (fp.startsWith("strategy/")) return "strategy";
  if (fp.startsWith("intelligence/")) return "intelligence";
  if (fp.startsWith("lexicon/")) return "lexicon";

  return "unknown";
}

// -----------------------------
// Collections (client-safe)
// -----------------------------
export function getAllContentlayerDocs(): ContentDoc[] {
  return (allDocuments as any[]).slice() as ContentDoc[];
}

export function getPublishedDocuments(): ContentDoc[] {
  return getAllContentlayerDocs().filter(isPublished);
}

export function getDocumentsByKind(kind: DocKind): ContentDoc[] {
  return getAllContentlayerDocs().filter((d) => getDocKind(d) === kind);
}

export function getDocBySlug(slug: string): ContentDoc | null {
  const target = normalizeSlug(slug);
  const docs = getAllContentlayerDocs();

  for (const d of docs) {
    const s = getDocSlug(d);
    if (s === target || s.endsWith(`/${target}`)) return d;
  }
  return null;
}

// -----------------------------
// Type guards (used by UI)
// -----------------------------
export const isPost = (doc: any) => getDocKind(doc) === "post";
export const isShort = (doc: any) => getDocKind(doc) === "short";
export const isBook = (doc: any) => getDocKind(doc) === "book";
export const isCanon = (doc: any) => getDocKind(doc) === "canon";
export const isBrief = (doc: any) => getDocKind(doc) === "brief";
export const isDownload = (doc: any) => getDocKind(doc) === "download";
export const isEvent = (doc: any) => getDocKind(doc) === "event";
export const isPrint = (doc: any) => getDocKind(doc) === "print";
export const isResource = (doc: any) => getDocKind(doc) === "resource";
export const isStrategy = (doc: any) => getDocKind(doc) === "strategy";
export const isIntelligence = (doc: any) => getDocKind(doc) === "intelligence";
export const isLexicon = (doc: any) => getDocKind(doc) === "lexicon";