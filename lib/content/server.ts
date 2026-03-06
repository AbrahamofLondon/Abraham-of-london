/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — SOVEREIGN SERVER-ONLY CONTENT ACCESS (SSOT)
 *
 * What this fixes:
 * - Empty indexes (0 posts/downloads/strategies etc.) when helpers mismatch folder names.
 * - Over-strict publish gating (requiring published === true).
 * - Folder taxonomy reality:
 *   content/blog, content/books, content/downloads, content/strategy, content/shorts, etc.
 *
 * Hard rules:
 * - LIVE unless explicitly draft === true OR published === false.
 * - Collections are resolved from the full doc registry, then optionally refined.
 * - Keeps contentlayer compiled MDX code available for pages.
 */

// 🚨 DEV ASSERT: Never silently render empty
if (process.env.NODE_ENV === "development") {
  // We need to dynamically import to avoid circular dependency
  try {
    const { getAllContentlayerDocs } = require("./server");
    const n = getAllContentlayerDocs().length;
    if (n === 0) {
      // eslint-disable-next-line no-console
      console.error("🚨 SSOT: Contentlayer registry resolved 0 docs. Loader is failing.");
    }
  } catch (e) {
    // Ignore during initial load
  }
}

import {
  isDraftContent,
  getDocHref,
  getDocKind as sharedGetDocKind,
  toUiDoc as sharedToUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "@/lib/content/shared";

import { decryptDocument } from "@/lib/security";
import { canAccessDoc } from "@/lib/content/access-engine";

import {
  normalizeSlug as helperNormalizeSlug,
  sanitizeData as helperSanitizeData,
  getAllContentlayerDocs as helperGetAllContentlayerDocs,

  // legacy helpers (may be empty / mismatched)
  getAllBooks as helperGetAllBooks,
  getAllCanons as helperGetAllCanons,
  getAllDownloads as helperGetAllDownloads,
  getAllPosts as helperGetAllPosts,
  getAllEvents as helperGetAllEvents,
  getAllPrints as helperGetAllPrints,
  getAllResources as helperGetAllResources,
  getAllStrategies as helperGetAllStrategies,
  getAllShorts as helperGetAllShorts,

  getDocBySlug as helperGetDocBySlug,
  getServerBookBySlug as helperGetServerBookBySlug,
  getServerCanonBySlug as helperGetServerCanonBySlug,

  // keep for downstream
  getAccessLevel as helperGetAccessLevel,
  toUiDoc as helperToUiDoc,
  documentKinds,
  getCardProps,
} from "@/lib/contentlayer-helper";

/* -----------------------------------------------------------------------------
  BUILD-TIME SAFETY GUARD
----------------------------------------------------------------------------- */
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

/* -----------------------------------------------------------------------------
  Dynamic auth import (prevents client bundling)
----------------------------------------------------------------------------- */
async function getAuthSession() {
  if (IS_BUILD) return null;

  try {
    const { getAuthSession: getServerAuthSession } = await import("@/lib/auth/server");
    return await getServerAuthSession();
  } catch (error) {
    console.error("[CONTENT_SERVER] Failed to load auth:", error);
    return null;
  }
}

/* -----------------------------------------------------------------------------
  TYPES (SSOT)
----------------------------------------------------------------------------- */
export type DocKind =
  | "post"
  | "short"
  | "book"
  | "canon"
  | "brief"
  | "dispatch"
  | "intelligence"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "lexicon"
  | "unknown";

export type ContentDoc = {
  _id?: string;
  type?: string;
  kind?: string;

  title?: string;
  slug?: string;
  href?: string;

  draft?: boolean;
  published?: boolean;

  accessLevel?: string;
  tier?: string;
  classification?: string;
  requiresAuth?: boolean;

  body?: { raw?: string; code?: string };
  content?: string;

  metadata?: any;
  _raw?: {
    flattenedPath?: string;
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
  };

  [key: string]: any;
};

/* -----------------------------------------------------------------------------
  Re-exports expected by pages/importers
----------------------------------------------------------------------------- */
export {
  isDraftContent,
  getDocHref,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
};

export const normalizeSlug = helperNormalizeSlug;
export const sanitizeData = helperSanitizeData;

export const getAccessLevel = helperGetAccessLevel;
export const toUiDoc = helperToUiDoc;
export const getDocKind = sharedGetDocKind;

export { documentKinds, getCardProps };

/* -----------------------------------------------------------------------------
  LIVE / PUBLISHED LOGIC (tolerant, SSOT)
----------------------------------------------------------------------------- */
function isLiveDoc(d: any): boolean {
  if (!d) return false;

  // explicit negatives only
  if (d.draft === true) return false;
  if (d.published === false) return false;

  // everything else is live
  return true;
}

/* -----------------------------------------------------------------------------
  SLUG NORMALISATION (folder-aware + safe)
----------------------------------------------------------------------------- */
function cleanPathish(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function bareSectionSlug(section: string, input: unknown): string {
  let s = cleanPathish(input);
  if (!s || s.includes("..")) return "";

  const lower = () => s.toLowerCase();
  const sec = String(section || "").toLowerCase();

  // strip repeatedly
  while (lower().startsWith(`${sec}/`)) s = s.slice(sec.length + 1);
  while (lower().startsWith(`vault/${sec}/`)) s = s.slice(`vault/${sec}/`.length);
  while (lower().startsWith(`content/${sec}/`)) s = s.slice(`content/${sec}/`.length);

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";

  return s;
}

function matchesSlugVariants(section: string, doc: any, targetBare: string): boolean {
  const a = bareSectionSlug(section, doc?.slug);
  if (a && a === targetBare) return true;

  const b = bareSectionSlug(section, doc?._raw?.flattenedPath);
  if (b && b === targetBare) return true;

  const c = bareSectionSlug(section, doc?._raw?.sourceFilePath);
  if (c && c === targetBare) return true;

  return false;
}

/* -----------------------------------------------------------------------------
  CONTENTLAYER REGISTRY (single source)
----------------------------------------------------------------------------- */
export function getAllContentlayerDocs(): any[] {
  const docs = helperGetAllContentlayerDocs() || [];
  return Array.isArray(docs) ? docs : [];
}

export const getContentlayerData = getAllContentlayerDocs;

export function isContentlayerLoaded(): boolean {
  const docs = getAllContentlayerDocs();
  return Array.isArray(docs) && docs.length > 0;
}

// ✅ DEV ASSERT: Never silently render empty
if (process.env.NODE_ENV === "development") {
  const n = getAllContentlayerDocs().length;
  if (n === 0) {
    // eslint-disable-next-line no-console
    console.error("🚨 SSOT: Contentlayer registry resolved 0 docs. Loader is failing.");
  }
}

/**
 * Derive docs for a collection from the global registry.
 * This avoids mismatches like:
 * - "posts" helper but folder is "blog"
 * - "strategies" helper but folder is "strategy"
 */
function deriveByFolderPrefix(prefixes: string[], docs?: any[]): any[] {
  const all = docs || getAllContentlayerDocs();
  const pfx = prefixes.map((p) => String(p).toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "") + "/");

  return (all || []).filter((d: any) => {
    if (!d) return false;
    const fp = String(d?._raw?.flattenedPath || d?._raw?.sourceFilePath || "").toLowerCase();
    if (!fp) return false;
    return pfx.some((p) => fp.startsWith(p));
  });
}

/* -----------------------------------------------------------------------------
  Core collection getters (SSOT)
----------------------------------------------------------------------------- */
export function getAllBooks(): any[] {
  const fromHelper = helperGetAllBooks?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["books"]);
}

export function getAllCanons(): any[] {
  const fromHelper = helperGetAllCanons?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["canon", "vault/canon"]);
}

export function getAllDownloads(): any[] {
  const fromHelper = helperGetAllDownloads?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["downloads", "vault/downloads"]);
}

export function getAllEvents(): any[] {
  const fromHelper = helperGetAllEvents?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["events", "vault/events"]);
}

export function getAllPrints(): any[] {
  const fromHelper = helperGetAllPrints?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["prints", "vault/prints"]);
}

export function getAllResources(): any[] {
  const fromHelper = helperGetAllResources?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["resources", "vault/resources"]);
}

export function getAllShorts(): any[] {
  const fromHelper = helperGetAllShorts?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;
  return deriveByFolderPrefix(["shorts", "vault/shorts"]);
}

/**
 * Blog posts live under content/blog (not content/posts).
 * Some helpers call them "posts". We normalize here.
 */
export function getAllPosts(): any[] {
  const fromHelper = helperGetAllPosts?.() || [];
  if (Array.isArray(fromHelper) && fromHelper.length) return fromHelper;

  // fallback to folder inference
  return deriveByFolderPrefix(["blog", "posts", "vault/blog"]);
}

/**
 * Strategies live under content/strategy (singular).
 */
export function getAllStrategies(): any[] {
  const fromHelper = helperGetAllStrategies?.() || [];
  const usable =
    Array.isArray(fromHelper) && fromHelper.length
      ? fromHelper
      : deriveByFolderPrefix(["strategy", "strategies", "vault/strategy"]);

  // Keep only live docs
  return usable.filter(isLiveDoc);
}

/* -----------------------------------------------------------------------------
  Published collection helpers (SSOT)
----------------------------------------------------------------------------- */
export const getShorts = () => getAllShorts().filter(isLiveDoc);
export const getCanons = () => getAllCanons().filter(isLiveDoc);
export const getBooks = () => getAllBooks().filter(isLiveDoc);
export const getDownloads = () => getAllDownloads().filter(isLiveDoc);
export const getPublishedPosts = () => getAllPosts().filter(isLiveDoc);
export const getPublishedBooks = () => getBooks();

/* -----------------------------------------------------------------------------
  Primary doc access
----------------------------------------------------------------------------- */
export function getDocumentBySlug(slug: string): any | null {
  return helperGetDocBySlug(slug);
}

export const getDocBySlug = getDocumentBySlug;

/**
 * Legacy shim used by download token routes, etc.
 */
export function getDownloadBySlug(slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));

  const downloads = getAllDownloads();
  const download =
    downloads.find(
      (d: any) =>
        bareSectionSlug("downloads", d?.slug) === bareSectionSlug("downloads", s) ||
        String(d?._raw?.flattenedPath || "").includes(s)
    ) || null;

  if (download) return download;

  return getDocumentBySlug(s) || getDocumentBySlug(`downloads/${s}`);
}

/* -----------------------------------------------------------------------------
  Secure processing / decryption (build-safe)
----------------------------------------------------------------------------- */
async function secureProcessDocument(doc: any): Promise<any | null> {
  if (!doc) return null;

  // During build: do not auth-gate, do not decrypt; just surface what exists.
  if (IS_BUILD) {
    return {
      ...doc,
      isLocked: false,
      content: doc.content || doc.body?.raw || "",
      _buildMode: true,
    };
  }

  // Read encryption metadata
  let meta: any = {};
  try {
    meta = typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata || {};
  } catch {
    meta = {};
  }

  const encryptionData = meta;
  if (!encryptionData?.isEncrypted) return doc;

  // session + clearance
  const session = await getAuthSession();
  const userRole = (session?.user as any)?.tier || (session?.user as any)?.role || "public";
  const isAuthorized = canAccessDoc(doc, userRole);

  if (isAuthorized) {
    try {
      const decryptedBody = decryptDocument(
        doc.content || doc.body?.raw || "",
        encryptionData.iv,
        encryptionData.authTag
      );

      return {
        ...doc,
        content: decryptedBody,
        body: { ...doc.body, raw: decryptedBody },
        isLocked: false,
      };
    } catch (error) {
      console.error(`❌ DECRYPTION FAILURE [${doc.slug}]:`, error);
      return {
        ...doc,
        content: "ERROR: Cryptographic Integrity Breach.",
        isLocked: true,
      };
    }
  }

  return {
    ...doc,
    content: "CLASSIFIED: This document requires higher clearance.",
    body: { ...doc.body, raw: "REDACTED" },
    isLocked: true,
  };
}

/* -----------------------------------------------------------------------------
  Secure lookups by section (SSOT slug matching)
----------------------------------------------------------------------------- */
export async function getServerShortBySlug(slug: string) {
  const targetBare = bareSectionSlug("shorts", slug);
  const doc = getShorts().find((s: any) => matchesSlugVariants("shorts", s, targetBare)) || null;
  return await secureProcessDocument(doc);
}

export function getBookBySlug(slug: string): any | null {
  const targetBare = bareSectionSlug("books", slug);
  const doc = getBooks().find((b: any) => matchesSlugVariants("books", b, targetBare)) || null;
  return doc;
}

export async function getServerBookBySlug(slug: string) {
  const targetBare = bareSectionSlug("books", slug);

  const helperDoc =
    (await helperGetServerBookBySlug?.(targetBare)) ||
    (await helperGetServerBookBySlug?.(`books/${targetBare}`)) ||
    (await helperGetServerBookBySlug?.(`/books/${targetBare}`));

  if (helperDoc) return await secureProcessDocument(helperDoc);

  const fallback = getBookBySlug(targetBare);
  return await secureProcessDocument(fallback);
}

export async function getServerCanonBySlug(slug: string) {
  const targetBare = bareSectionSlug("canon", slug);

  const helperDoc =
    (await helperGetServerCanonBySlug?.(targetBare)) ||
    (await helperGetServerCanonBySlug?.(`canon/${targetBare}`)) ||
    (await helperGetServerCanonBySlug?.(`/canon/${targetBare}`));

  return await secureProcessDocument(helperDoc);
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const targetBare = bareSectionSlug("blog", slug);
  const doc = getPublishedPosts().find((p: any) => matchesSlugVariants("blog", p, targetBare)) || null;
  return await secureProcessDocument(doc);
}

/* -----------------------------------------------------------------------------
  Unified combined access (SSOT)
----------------------------------------------------------------------------- */
export function getAllCombinedDocs(): any[] {
  const d = getAllContentlayerDocs() || [];
  const combined = [...d].filter(isLiveDoc);
  const sanitized = (helperSanitizeData(combined) || []) as any[];
  return sanitized;
}

export const getPublishedDocuments = () => getAllCombinedDocs();

/* -----------------------------------------------------------------------------
  Misc collections (folder inference)
----------------------------------------------------------------------------- */
export function getAllLexicons() {
  const docs = getAllCombinedDocs();
  return docs.filter((d) => {
    const fp = String(d?._raw?.flattenedPath || "").toLowerCase();
    const kind = String(d?.kind || d?.type || "").toLowerCase();
    return kind === "lexicon" || fp.startsWith("lexicon/");
  });
}

export function getAllBlogs() {
  // semantic alias: blog is posts
  return getAllPosts();
}

export function getServerAllEvents() {
  return getAllEvents().filter(isLiveDoc);
}

export function getServerEventBySlug(slug: string) {
  const targetBare = bareSectionSlug("events", slug);
  return getAllEvents().find((e: any) => matchesSlugVariants("events", e, targetBare)) || null;
}

export function getSecureDocument(id: string) {
  console.warn(`getSecureDocument lookup for id: ${id}`);
  return null;
}

/* -----------------------------------------------------------------------------
  Published lookups by kind/type (SSOT helper for Search Index)
----------------------------------------------------------------------------- */
export function getPublishedDocumentsByType(kind: DocKind): ContentDoc[] {
  const k = String(kind || "").toLowerCase().trim() as DocKind;
  if (!k) return [];

  const docs = (getPublishedDocuments?.() || []) as ContentDoc[];

  return docs.filter((d) => {
    const dk = String((d as any)?.kind || "").toLowerCase();
    const dt = String((d as any)?.type || "").toLowerCase();
    const fp = String((d as any)?._raw?.flattenedPath || "").toLowerCase();

    if (dk === k || dt === k) return true;

    // folder inference (covers mixed legacy + missing kind/type)
    if (k === "short" && fp.startsWith("shorts/")) return true;
    if (k === "event" && fp.startsWith("events/")) return true;
    if (k === "post" && (fp.startsWith("blog/") || fp.startsWith("posts/"))) return true;
    if (k === "brief" && fp.startsWith("briefs/")) return true;
    if (k === "canon" && fp.startsWith("canon/")) return true;
    if (k === "book" && fp.startsWith("books/")) return true;
    if (k === "download" && fp.startsWith("downloads/")) return true;
    if (k === "resource" && fp.startsWith("resources/")) return true;
    if (k === "strategy" && fp.startsWith("strategy/")) return true;
    if (k === "lexicon" && fp.startsWith("lexicon/")) return true;
    if (k === "print" && fp.startsWith("prints/")) return true;

    return false;
  });
}