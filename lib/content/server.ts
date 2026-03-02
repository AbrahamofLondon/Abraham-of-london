/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — SOVEREIGN SERVER-ONLY CONTENT ACCESS
 * Integrated with AES-256-GCM Decryption and NextAuth Session Verification.
 * ✅ BUILD-SAFE: Guards against auth calls during static generation
 */

import {
  isDraftContent,
  getDocHref,
  getDocKind as sharedGetDocKind,
  toUiDoc as sharedToUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  normalizeSlug as sharedNormalizeSlug,
} from "@/lib/content/shared";

import { decryptDocument } from "@/lib/security";
import { canAccessDoc } from "@/lib/content/access-engine";

// Import all helpers from contentlayer-helper
import {
  normalizeSlug as helperNormalizeSlug,
  sanitizeData as helperSanitizeData,
  getAllContentlayerDocs as helperGetAllContentlayerDocs,
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
  isPublished as helperIsPublished,
  getAccessLevel as helperGetAccessLevel,
  toUiDoc as helperToUiDoc,
  documentKinds,
  getCardProps,
} from "@/lib/contentlayer-helper";

// ------------------------------
// 🔐 BUILD-TIME SAFETY GUARD
// ------------------------------
const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

// ------------------------------
// DYNAMIC IMPORTS for auth (prevents client bundling)
// ------------------------------
async function getAuthSession() {
  if (IS_BUILD) return null;
  
  try {
    // Dynamic import to keep auth out of client bundles
    const { getAuthSession: getServerAuthSession } = await import("@/lib/auth/server");
    return await getServerAuthSession();
  } catch (error) {
    console.error("[CONTENT_SERVER] Failed to load auth:", error);
    return null;
  }
}

// ------------------------------
// TYPES — exported for downstream type re-exports (SSOT)
// ------------------------------

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

// ------------------------------
// Re-exports - EXPORT EVERYTHING THAT PAGES ARE TRYING TO IMPORT
// ------------------------------
export {
  isDraftContent,
  getDocHref,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
};

// Export normalizeSlug and sanitizeData explicitly
export const normalizeSlug = helperNormalizeSlug;
export const sanitizeData = helperSanitizeData;

// Export other utilities
export const isPublished = helperIsPublished;
export const getAccessLevel = helperGetAccessLevel;
export const toUiDoc = helperToUiDoc;
export const getDocKind = sharedGetDocKind;

export { documentKinds, getCardProps };

// ------------------------------
// PRIMARY EXPORTS - Core document access functions
// ------------------------------

/**
 * Get document by slug (primary export - used everywhere)
 */
export function getDocumentBySlug(slug: string): any | null {
  return helperGetDocBySlug(slug);
}

/**
 * Alias for getDocumentBySlug (for backward compatibility)
 */
export const getDocBySlug = getDocumentBySlug;

/**
 * Get download document by slug - LEGACY SHIM
 * Used by downloads/dl routes and tokenStore.postgres.ts
 */
export function getDownloadBySlug(slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));
  
  // Try downloads collection first
  const downloads = getAllDownloads();
  const download = downloads.find((d: any) => 
    d.slug === s || d._raw?.flattenedPath?.includes(s)
  );
  
  if (download) return download;
  
  // Fallback to generic document lookup
  return getDocumentBySlug(s) || getDocumentBySlug(`downloads/${s}`);
}

// Export all contentlayer data accessors
export const getContentlayerData = helperGetAllContentlayerDocs;

// ------------------------------
// Core data access functions
// ------------------------------
export function getAllContentlayerDocs() {
  return helperGetAllContentlayerDocs();
}

export function getAllBooks() {
  return helperGetAllBooks();
}

export function getAllCanons() {
  return helperGetAllCanons();
}

export function getAllDownloads() {
  return helperGetAllDownloads();
}

export function getAllPosts() {
  return helperGetAllPosts();
}

export function getAllEvents() {
  return helperGetAllEvents();
}

export function getAllPrints() {
  return helperGetAllPrints();
}

export function getAllResources() {
  return helperGetAllResources();
}

export function getAllShorts() {
  return helperGetAllShorts();
}

export function getAllStrategies() {
  return helperGetAllStrategies().filter(helperIsPublished);
}

export function isContentlayerLoaded(): boolean {
  const docs = getAllContentlayerDocs();
  return Array.isArray(docs) && docs.length > 0;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) {
    throw new Error("Build aborted: Contentlayer data is empty.");
  }
}

// ------------------------------
// Collection Helpers (Published)
// ------------------------------
export const getShorts = () => getAllShorts().filter(helperIsPublished);
export const getCanons = () => getAllCanons().filter(helperIsPublished);
export const getBooks = () => getAllBooks().filter(helperIsPublished);
export const getDownloads = () => getAllDownloads().filter(helperIsPublished);
export const getPublishedPosts = () => getAllPosts().filter(helperIsPublished);
export const getPublishedBooks = () => getBooks();

// ------------------------------
// 🔒 SLUG NORMALIZATION (SSOT)
// ------------------------------
function bareSectionSlug(section: string, input: any): string {
  const s = String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  const sectionRe = new RegExp(`^${section}\\/`, "i");
  if (sectionRe.test(s)) return s.replace(sectionRe, "");

  const n = helperNormalizeSlug(s).replace(/^\/+/, "").replace(/\/+$/, "");
  return n.replace(sectionRe, "");
}

function matchesSlugVariants(section: string, doc: any, targetBare: string): boolean {
  const a = bareSectionSlug(section, doc?.slug);
  const b = bareSectionSlug(section, doc?._raw?.flattenedPath);
  const c = bareSectionSlug(section, doc?._raw?.sourceFilePath);

  return a === targetBare || b === targetBare || c === targetBare;
}

// ------------------------------
// 🔐 SOVEREIGN DECRYPTION ENGINES (Build-Safe)
// ------------------------------
async function secureProcessDocument(doc: any): Promise<any | null> {
  if (!doc) return null;

  // 🛡️ During build, skip auth checks
  if (IS_BUILD) {
    return {
      ...doc,
      isLocked: false,
      content: doc.content || doc.body?.raw || "",
      _buildMode: true,
    };
  }

  // 1. Check if document is encrypted
  let meta: any = {};
  try {
    meta = typeof doc.metadata === "string" ? JSON.parse(doc.metadata) : doc.metadata || {};
  } catch {
    meta = {};
  }

  const encryptionData = meta;
  if (!encryptionData?.isEncrypted) return doc;

  // 2. Get session and check clearance
  const session = await getAuthSession();
  const userRole = (session?.user as any)?.tier || (session?.user as any)?.role || "public";
  const isAuthorized = canAccessDoc(doc, userRole);

  // 3. Decrypt or redact
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

// ------------------------------
// 🚀 SECURE LOOKUPS (Build-Safe)
// ------------------------------
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
    helperGetServerBookBySlug(targetBare) ||
    helperGetServerBookBySlug(`books/${targetBare}`) ||
    helperGetServerBookBySlug(`/books/${targetBare}`);

  if (helperDoc) return await secureProcessDocument(helperDoc);

  const fallback = getBookBySlug(targetBare);
  return await secureProcessDocument(fallback);
}

export async function getServerCanonBySlug(slug: string) {
  const targetBare = bareSectionSlug("canon", slug);

  const helperDoc =
    helperGetServerCanonBySlug(targetBare) ||
    helperGetServerCanonBySlug(`canon/${targetBare}`) ||
    helperGetServerCanonBySlug(`/canon/${targetBare}`);

  return await secureProcessDocument(helperDoc);
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const targetBare = bareSectionSlug("blog", slug);
  const doc = getPublishedPosts().find((p: any) => matchesSlugVariants("blog", p, targetBare)) || null;
  return await secureProcessDocument(doc);
}

// ------------------------------
// Unified combined document access
// ------------------------------
export function getAllCombinedDocs(): any[] {
  const d = helperGetAllContentlayerDocs();
  const combined = [...d].filter(helperIsPublished);
  const sanitized = (helperSanitizeData(combined) || []) as any[];

  if (process.env.NODE_ENV === "development" && !IS_BUILD) {
    const requiredBriefs = ["institutional-governance"];
    requiredBriefs.forEach((slug) => {
      const found = sanitized.find(
        (doc) => doc.slug === slug || String(doc._raw?.flattenedPath || "").includes(slug)
      );
      if (!found) {
        console.error(`🚨 [Link-Integrity Alert]: Critical asset '${slug}' is missing.`);
      } else {
        console.log(`✅ [Vault Verified]: Asset '${slug}' is live.`);
      }
    });
  }

  return sanitized;
}

export const getPublishedDocuments = () => getAllCombinedDocs();

// ------------------------------
// Misc collections
// ------------------------------
export function getAllLexicons() {
  const docs = getAllCombinedDocs();
  return docs.filter((d) => d.kind === "lexicon" || String(d._raw?.sourceFilePath || "").includes("lexicon/"));
}

export function getAllBlogs() {
  return getAllPosts();
}

export function getServerAllEvents() {
  return getAllEvents().filter(helperIsPublished);
}

export function getServerEventBySlug(slug: string) {
  const targetBare = bareSectionSlug("events", slug);
  return getAllEvents().find((e: any) => matchesSlugVariants("events", e, targetBare)) || null;
}

export function getSecureDocument(id: string) {
  console.warn(`getSecureDocument lookup for id: ${id}`);
  return null;
}