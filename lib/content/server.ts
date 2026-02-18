/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — SOVEREIGN SERVER-ONLY CONTENT ACCESS
 * Integrated with AES-256-GCM Decryption and NextAuth Session Verification.
 */

import {
  isDraftContent,
  getDocHref,
  getDocKind as sharedGetDocKind,
  toUiDoc as sharedToUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "@/lib/content/shared";

import { decryptDocument } from "@/lib/security";
import { getAuthSession } from "@/lib/auth/options";
import { canAccessDoc } from "@/lib/content/access-engine"; // ✅ FIXED: SSOT role logic (no barrel dependency)

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

// Re-exports - EXPORT EVERYTHING THAT PAGES ARE TRYING TO IMPORT
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

// Export getDocBySlug and getContentlayerData
export const getDocBySlug = helperGetDocBySlug;
export const getContentlayerData = helperGetAllContentlayerDocs;

// ------------------------------
// 🔐 SOVEREIGN DECRYPTION ENGINES
// ------------------------------

/**
 * The "Secure Lens": Decrypts content if it's marked as encrypted and user is authorized.
 */
async function secureProcessDocument(doc: any): Promise<any | null> {
  if (!doc) return null;

  // 1. Determine if this document is encrypted via metadata
  let meta = {};
  try {
    meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata || {});
  } catch (e) {
    meta = {};
  }

  const encryptionData = meta as any;
  if (!encryptionData.isEncrypted) return doc; // Not encrypted, return as is.

  // 2. Fetch Session & Check Clearance
  const session = await getAuthSession();
  const userRole = (session?.user?.role as any) || "guest";
  const isAuthorized = canAccessDoc(doc, userRole);

  // 3. Decrypt or Redact
  if (isAuthorized) {
    try {
      const decryptedBody = decryptDocument(
        doc.content || doc.body?.raw || "", 
        encryptionData.iv, 
        encryptionData.authTag
      );
      // Return doc with decrypted content
      return { ...doc, content: decryptedBody, body: { ...doc.body, raw: decryptedBody }, isLocked: false };
    } catch (error) {
      console.error(`❌ DECRYPTION FAILURE [${doc.slug}]:`, error);
      return { ...doc, content: "ERROR: Cryptographic Integrity Breach.", isLocked: true };
    }
  }

  // Fallback: Return doc with redacted content for unauthorized users
  return { 
    ...doc, 
    content: "CLASSIFIED: This document is restricted to Directorate level access only.", 
    body: { ...doc.body, raw: "REDACTED" },
    isLocked: true 
  };
}

// ------------------------------
// Core data access - REMOVED DUPLICATE getAllStrategies
// ------------------------------
export function getAllContentlayerDocs() { return helperGetAllContentlayerDocs(); }
export function getAllBooks() { return helperGetAllBooks(); }
export function getAllCanons() { return helperGetAllCanons(); }
export function getAllDownloads() { return helperGetAllDownloads(); }
export function getAllPosts() { return helperGetAllPosts(); }
export function getAllEvents() { return helperGetAllEvents(); }
export function getAllPrints() { return helperGetAllPrints(); }
export function getAllResources() { return helperGetAllResources(); }
export function getAllShorts() { return helperGetAllShorts(); }

// FIXED: Only one getAllStrategies function
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
// 🚀 SECURE LOOKUPS
// ------------------------------

export async function getServerShortBySlug(slug: string) {
  const target = helperNormalizeSlug(slug);
  const doc = getShorts().find((s: any) => {
    const sSlug = helperNormalizeSlug(s.slug || s._raw?.flattenedPath || "");
    return sSlug === target || sSlug.endsWith(`/${target}`) || sSlug.includes(`/shorts/${target}`);
  }) || null;
  
  return await secureProcessDocument(doc);
}

export async function getServerBookBySlug(slug: string) {
  const doc = helperGetServerBookBySlug(slug);
  return await secureProcessDocument(doc);
}

export async function getServerCanonBySlug(slug: string) {
  const doc = helperGetServerCanonBySlug(slug);
  return await secureProcessDocument(doc);
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const target = helperNormalizeSlug(slug);
  const doc = getPublishedPosts().find((p: any) => {
    const pSlug = helperNormalizeSlug(p.slug || p._raw?.flattenedPath || "");
    return pSlug === target || pSlug.endsWith(`/${target}`);
  }) || null;

  return await secureProcessDocument(doc);
}

// ------------------------------
// Collection Helpers
// ------------------------------
export const getShorts = () => getAllShorts().filter(helperIsPublished);
export const getCanons = () => getAllCanons().filter(helperIsPublished);
export const getBooks = () => getAllBooks().filter(helperIsPublished);
export const getPublishedPosts = () => getAllPosts().filter(helperIsPublished);

/**
 * Unified combined document access with built-in Link-Integrity Audit
 */
export function getAllCombinedDocs(): any[] {
  const d = helperGetAllContentlayerDocs();
  const combined = [...d].filter(helperIsPublished);
  const sanitized = (helperSanitizeData(combined) || []) as any[];

  // SYSTEMATIC AUDIT: Ensure critical files are resolving
  if (process.env.NODE_ENV === 'development') {
    const requiredBriefs = ["institutional-governance"];
    requiredBriefs.forEach(slug => {
      const found = sanitized.find(doc => 
        (doc.slug === slug) || 
        (doc._raw?.flattenedPath?.includes(slug))
      );
      if (!found) {
        console.error(`🚨 [Link-Integrity Alert]: Critical asset '${slug}' is missing from the build.`);
      } else {
        console.log(`✅ [Vault Verified]: Asset '${slug}' is live.`);
      }
    });
  }

  return sanitized;
}

// Fixed duplicate declaration: Pointing to audited combined docs
export const getPublishedDocuments = () => getAllCombinedDocs();

// ------------------------------
// Intelligence Portfolio Extensions
// ------------------------------

export function getAllLexicons() {
  const docs = getAllCombinedDocs();
  return docs.filter(d => d.kind === 'lexicon' || d._raw?.sourceFilePath.includes('lexicon/'));
}

export function getAllBlogs() {
  return getAllPosts();
}

export function getDocumentBySlug(slug: string) {
  return helperGetDocBySlug(slug);
}

export function getServerAllEvents() {
  return getAllEvents().filter(helperIsPublished);
}

export function getServerEventBySlug(slug: string) {
  const target = helperNormalizeSlug(slug);
  return getAllEvents().find((e: any) => {
    const eSlug = helperNormalizeSlug(e.slug || e._raw?.flattenedPath || "");
    return eSlug === target || eSlug.endsWith(`/${target}`);
  }) || null;
}

export function getSecureDocument(id: string) {
  console.warn(`getSecureDocument lookup for id: ${id}`);
  return null;
}

export function getDownloads() {
  return getAllDownloads().filter(helperIsPublished);
}