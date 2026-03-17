/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/content/server.ts — PAGES-ROUTER SAFE CONTENT FACADE (SSOT)
 */

import {
  isDraftContent,
  getDocHref,
  getDocKind as sharedGetDocKind,
  toUiDoc as sharedToUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
} from "@/lib/content/shared";

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
  getServerCanonBySlug as helperGetServerCanonBySlug, // This was imported but not used
  getAccessLevel as helperGetAccessLevel,
  toUiDoc as helperToUiDoc,
  documentKinds,
  getCardProps,
} from "@/lib/contentlayer-helper";

const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-export";

/* -----------------------------------------------------------------------------
   Stable Types & Re-exports
----------------------------------------------------------------------------- */
export type ContentDoc = any;
export type DocKind = any;

export {
  isDraftContent,
  getDocHref,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  documentKinds,
  getCardProps,
};

export const normalizeSlug = helperNormalizeSlug;
export const sanitizeData = helperSanitizeData;
export const getAccessLevel = helperGetAccessLevel;
export const toUiDoc = helperToUiDoc || sharedToUiDoc;
export const getDocKind = sharedGetDocKind;

function isLiveDoc(d: any): boolean {
  if (!d) return false;
  if (d.draft === true) return false;
  if (d.published === false) return false;
  return true;
}
export const isPublished = isLiveDoc;

/* -----------------------------------------------------------------------------
   Collection Getters
----------------------------------------------------------------------------- */
export const getAllBooks = () => helperGetAllBooks?.() || [];
export const getAllCanons = () => helperGetAllCanons?.() || [];
export const getAllDownloads = () => helperGetAllDownloads?.() || [];
export const getAllPosts = () => helperGetAllPosts?.() || [];
export const getAllEvents = () => helperGetAllEvents?.() || [];
export const getAllPrints = () => helperGetAllPrints?.() || [];
export const getAllResources = () => helperGetAllResources?.() || [];
export const getAllStrategies = () => helperGetAllStrategies?.() || [];
export const getAllShorts = () => helperGetAllShorts?.() || [];
export const getAllLexicons = () => []; 
export const getAllBlogs = () => getAllPosts();

/**
 * Aggregator for all document types (Required by Sitemaps and Search)
 */
export const getAllCombinedDocs = () => {
  return [
    ...getAllBooks(),
    ...getAllCanons(),
    ...getAllDownloads(),
    ...getAllPosts(),
    ...getAllEvents(),
    ...getAllPrints(),
    ...getAllResources(),
    ...getAllStrategies(),
    ...getAllShorts(),
  ];
};

// Published Filters
export const getPublishedBooks = () => getAllBooks().filter(isLiveDoc);
export const getPublishedPosts = () => getAllPosts().filter(isLiveDoc);
export const getPublishedDocuments = () => getAllCombinedDocs().filter(isLiveDoc);

/**
 * Filtered aggregator for search index building.
 */
export const getPublishedDocumentsByType = (kind: string) => {
  const k = String(kind || "").toLowerCase().trim();
  return getAllCombinedDocs().filter((d: any) => {
    const type = String(d.type || "").toLowerCase();
    const docKind = String(d.docKind || "").toLowerCase();
    const dKind = String(d.kind || "").toLowerCase();
    
    return (type === k || docKind === k || dKind === k) && isLiveDoc(d);
  });
};

/* -----------------------------------------------------------------------------
   Slug Lookups
----------------------------------------------------------------------------- */
export const getDocumentBySlug = (slug: string) => helperGetDocBySlug?.(helperNormalizeSlug(slug)) || null;
export const getDocBySlug = getDocumentBySlug;

export const getDownloadBySlug = (slug: string) => {
  const normalized = helperNormalizeSlug(slug);
  return getAllDownloads().find(d => 
    d.slug === normalized || d._raw?.flattenedPath === normalized
  ) || null;
};

export const getServerEventBySlug = (slug: string) => 
  getAllEvents().find(e => e.slug === slug || e._raw?.flattenedPath === slug) || null;

export const getServerAllEvents = () => getAllEvents();

/* -----------------------------------------------------------------------------
   Registry Access
----------------------------------------------------------------------------- */
export function getAllContentlayerDocs(): any[] {
  return getAllCombinedDocs();
}

export const getContentlayerData = getAllContentlayerDocs;

/* -----------------------------------------------------------------------------
   Optional Secure Processing
----------------------------------------------------------------------------- */
async function maybeDecryptDocument(doc: any): Promise<any | null> {
  if (!doc || IS_BUILD) return doc;
  
  let metadata: any = {};
  try {
    metadata = typeof doc?.metadata === "string" ? JSON.parse(doc.metadata) : doc?.metadata || {};
  } catch { metadata = {}; }

  if (!metadata?.isEncrypted) return doc;

  try {
    const [{ decryptDocument }, { getInnerCircleAccess }] = await Promise.all([
      import("@/lib/security"),
      import("@/lib/inner-circle/access.server"),
    ]);

    const access = await getInnerCircleAccess({}); 
    
    if (!access.hasAccess) {
      return {
        ...doc,
        content: "CLASSIFIED: Requires clearance.",
        body: { ...doc.body, raw: "REDACTED" },
        isLocked: true,
      };
    }

    const decrypted = decryptDocument(
      doc.content || doc.body?.raw || "",
      metadata.iv,
      metadata.authTag
    );

    return { ...doc, content: decrypted, body: { ...doc.body, raw: decrypted }, isLocked: false };
  } catch (error) {
    console.error("[CONTENT_SERVER] Cryptographic error:", error);
    return { ...doc, isLocked: true };
  }
}

/**
 * Server-side specific getters with security/decryption pass
 */
export async function getServerBookBySlug(slug: string) {
  const doc = helperGetServerBookBySlug?.(slug) || null;
  return await maybeDecryptDocument(doc);
}

// ✅ FIXED: Exporting the Canon handler required by lib/server/canon-data.ts
export async function getServerCanonBySlug(slug: string) {
  const doc = helperGetServerCanonBySlug?.(slug) || null;
  return await maybeDecryptDocument(doc);
}