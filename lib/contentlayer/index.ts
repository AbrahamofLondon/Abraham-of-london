/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/contentlayer/index.ts — COMPAT LAYER (SSOT) [HARDENED]
 *
 * Goals:
 * - Stable import surface for the app
 * - No dependency on "@/contentlayer/generated/types"
 * - No assumption that contentlayer exports named TS types for each doc
 * - Build-safe on Windows/CI when generated module is missing
 * - Avoid circular imports (never import from "@/lib/contentlayer" here)
 */

import type { ContentDoc, DocKind } from "@/lib/content/index";
export type { ContentDoc, DocKind };

type Generated = {
  allDocuments?: any[];
  allPosts?: any[];
  allShorts?: any[];
  allBooks?: any[];
  allCanons?: any[];
  allBriefs?: any[];
  allDownloads?: any[];
  allEvents?: any[];
  allPrints?: any[];
  allResources?: any[];
  allStrategies?: any[];
  allIntelligence?: any[];
  allLexicons?: any[];
};

let _cache: Generated | null = null;

function loadGenerated(): Generated {
  if (_cache) return _cache;

  // 1) Preferred virtual module (when available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _cache = require("contentlayer/generated") as Generated;
    return _cache;
  } catch {
    // continue
  }

  // 2) Fallback: local output path (contentlayer2 / Windows)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _cache = require("../../.contentlayer/generated") as Generated;
    return _cache;
  } catch (e) {
    // Fail-soft: do not crash the app; return empty collections.
    console.warn(
      "⚠️ [CONTENTLAYER_COMPAT] Generated content missing. Run: pnpm content:build",
      e
    );
    _cache = {};
    return _cache;
  }
}

// -----------------------------
// Generated collections (safe)
// -----------------------------
const g: any = loadGenerated();

export const allDocuments: any[] = Array.isArray(g.allDocuments) ? g.allDocuments : [];

export const allPosts: any[] = Array.isArray(g.allPosts) ? g.allPosts : [];
export const allShorts: any[] = Array.isArray(g.allShorts) ? g.allShorts : [];
export const allBooks: any[] = Array.isArray(g.allBooks) ? g.allBooks : [];
export const allCanons: any[] = Array.isArray(g.allCanons) ? g.allCanons : [];
export const allBriefs: any[] = Array.isArray(g.allBriefs) ? g.allBriefs : [];
export const allDownloads: any[] = Array.isArray(g.allDownloads) ? g.allDownloads : [];
export const allEvents: any[] = Array.isArray(g.allEvents) ? g.allEvents : [];
export const allPrints: any[] = Array.isArray(g.allPrints) ? g.allPrints : [];
export const allResources: any[] = Array.isArray(g.allResources) ? g.allResources : [];
export const allStrategies: any[] = Array.isArray(g.allStrategies) ? g.allStrategies : [];
export const allIntelligence: any[] = Array.isArray(g.allIntelligence) ? g.allIntelligence : [];
export const allLexicons: any[] = Array.isArray(g.allLexicons) ? g.allLexicons : [];

// -----------------------------
// Data (stable)
// -----------------------------
export const getAllDocuments = (): ContentDoc[] => (allDocuments as any[]) as ContentDoc[];

// -----------------------------
// Kind helpers (stable)
// -----------------------------
export const isPost = (doc: any): boolean => String(doc?.type) === "Post";
export const isShort = (doc: any): boolean => String(doc?.type) === "Short";
export const isBook = (doc: any): boolean => String(doc?.type) === "Book";
export const isCanon = (doc: any): boolean => String(doc?.type) === "Canon";
export const isBrief = (doc: any): boolean => String(doc?.type) === "Brief";
export const isDownload = (doc: any): boolean => String(doc?.type) === "Download";
export const isEvent = (doc: any): boolean => String(doc?.type) === "Event";
export const isPrint = (doc: any): boolean => String(doc?.type) === "Print";
export const isResource = (doc: any): boolean => String(doc?.type) === "Resource";
export const isStrategy = (doc: any): boolean => String(doc?.type) === "Strategy";
export const isIntelligence = (doc: any): boolean => String(doc?.type) === "Intelligence";
export const isLexicon = (doc: any): boolean => String(doc?.type) === "Lexicon";

// -----------------------------
// Optional: docKind mapping
// -----------------------------
export const toDocKind = (doc: any): DocKind => {
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
  return "unknown";
};

// -----------------------------
// Optional: common finders (safe)
// -----------------------------
export const findBySlug = (slug: string): ContentDoc | null => {
  const s = String(slug || "").trim();
  if (!s) return null;

  const docs = getAllDocuments() as any[];
  return (docs.find((d) => String(d?.slug) === s) ?? null) as ContentDoc | null;
};

export const findByFlattenedPath = (flattenedPath: string): ContentDoc | null => {
  const p = String(flattenedPath || "").trim();
  if (!p) return null;

  const docs = getAllDocuments() as any[];
  return (docs.find((d) => String(d?._raw?.flattenedPath) === p) ?? null) as ContentDoc | null;
};

// Default export (if anything imports default)
const contentlayerApi = {
  allDocuments,
  allPosts,
  allShorts,
  allBooks,
  allCanons,
  allBriefs,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allIntelligence,
  allLexicons,

  getAllDocuments,
  isPost,
  isShort,
  isBook,
  isCanon,
  isBrief,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isStrategy,
  isIntelligence,
  isLexicon,
  toDocKind,
  findBySlug,
  findByFlattenedPath,
};

export default contentlayerApi;