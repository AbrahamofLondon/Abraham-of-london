/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/contentlayer/index.ts — COMPAT LAYER (SSOT)
 *
 * Goals:
 * - Stable import surface for the app
 * - No dependency on "@/contentlayer/generated/types"
 * - No assumption that contentlayer exports named TS types for each doc
 * - Avoid circular imports (never import from "@/lib/contentlayer" here)
 */

import * as generated from "contentlayer/generated";

// ✅ The only types we guarantee in this codebase:
import type { ContentDoc, DocKind } from "@/lib/content/index";
export type { ContentDoc, DocKind };

// -----------------------------
// Generated collections (safe)
// -----------------------------
// These exports are optional in generated output depending on your schema.
// We expose them anyway (as arrays) so dependants won’t crash on import.
const g: any = generated as any;

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
  return (
    docs.find((d) => String(d?._raw?.flattenedPath) === p) ?? null
  ) as ContentDoc | null;
};

// Default export (if anything imports default)
const contentlayerApi = {
  // collections
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

  // getters/helpers
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