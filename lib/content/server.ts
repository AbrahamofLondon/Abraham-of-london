/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — SOVEREIGN SERVER-ONLY CONTENT ACCESS
 * Integrated with AES-256-GCM Decryption and NextAuth Session Verification.
 */

import * as Helper from "@/lib/contentlayer-helper";
import { decryptDocument } from "@/lib/security";
import { getAuthSession } from "@/lib/auth/options";
import { canAccessDoc } from "@/lib/content/index"; // Using the synchronized role logic
import {
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "@/lib/content/shared";

// Re-exports
export {
  isDraftContent,
  isPublished,
  getAccessLevel,
  getDocHref,
  getDocKind,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
};

// ------------------------------
// Direct static imports from contentlayer-helper
// ------------------------------
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
} from "@/lib/contentlayer-helper";

export const normalizeSlug = helperNormalizeSlug;
export const sanitizeData = helperSanitizeData;

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
// Core data access
// ------------------------------
export function getAllContentlayerDocs() { return helperGetAllContentlayerDocs(); }
export function getAllBooks() { return helperGetAllBooks(); }
export function getAllCanons() { return helperGetAllCanons(); }
export function getAllDownloads() { return helperGetAllDownloads(); }
export function getAllPosts() { return helperGetAllPosts(); }
export function getAllEvents() { return helperGetAllEvents(); }
export function getAllPrints() { return helperGetAllPrints(); }
export function getAllResources() { return helperGetAllResources(); }
export function getAllStrategies() { return helperGetAllStrategies(); }
export function getAllShorts() { return helperGetAllShorts(); }

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
// 🚀 SECURE LOOKUPS (The fix for your 3-month bug)
// ------------------------------

export async function getServerShortBySlug(slug: string) {
  const target = normalizeSlug(slug);
  const doc = getShorts().find((s: any) => {
    const sSlug = normalizeSlug(s.slug || s._raw?.flattenedPath || "");
    return sSlug === target || sSlug.endsWith(`/${target}`) || sSlug.includes(`/shorts/${target}`);
  }) || null;
  
  return await secureProcessDocument(doc);
}

export async function getServerBookBySlug(slug: string) {
  const doc = helperGetServerBookBySlug(slug);
  return await secureProcessDocument(doc);
}

export async function getServerCanonBySlug(slug: string) {
  const target = normalizeSlug(slug);
  const doc = getCanons().find((c: any) => {
    const cSlug = normalizeSlug(c.slug || c._raw?.flattenedPath || "");
    return cSlug === target || cSlug.endsWith(`/${target}`);
  }) || null;
  
  return await secureProcessDocument(doc);
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const target = normalizeSlug(slug);
  const doc = getPublishedPosts().find((p: any) => {
    const pSlug = normalizeSlug(p.slug || p._raw?.flattenedPath || "");
    return pSlug === target || pSlug.endsWith(`/${target}`);
  }) || null;

  return await secureProcessDocument(doc);
}

// ------------------------------
// Collection Helpers
// ------------------------------
export const getShorts = () => getAllShorts().filter(isPublished);
export const getCanons = () => getAllCanons().filter(isPublished);
export const getBooks = () => getAllBooks().filter(isPublished);
export const getPublishedPosts = () => getAllPosts().filter(isPublished);

export function getAllCombinedDocs(): any[] {
  const d = helperGetAllContentlayerDocs();
  const combined = [...d].filter(isPublished);
  return (sanitizeData(combined) || []) as any[];
}

export const documentKinds = Helper.documentKinds || [];
export const getCardProps = Helper.getCardProps;
export const getPublishedDocuments = () => getAllCombinedDocs();