/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/contentlayer/index.ts — COMPAT LAYER (SSOT)
 *
 * Purpose:
 * - Provide a stable import surface for the app.
 * - Do NOT depend on non-existent "@/contentlayer/generated/types".
 * - Do NOT depend on contentlayer exporting Post/Book/etc as named TS types.
 */

import { allDocuments } from "contentlayer/generated";

// ✅ The only types we guarantee in this codebase:
import type { ContentDoc, DocKind } from "@/lib/content/index";
export type { ContentDoc, DocKind };

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
// (useful if CardDisplay expects it)
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

// Default export (if anything imports default)
const contentlayerApi = {
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
};

export default contentlayerApi;