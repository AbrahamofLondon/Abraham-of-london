/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/content/server.ts — PAGES-ROUTER SAFE CONTENT FACADE (SYNC COMPAT)
 *
 * Design:
 * - Safe to import from pages/**
 * - No `server-only` marker
 * - Top-level helper import is allowed because helper no longer depends on `server-only`
 * - Synchronous registry/getter API for backward compatibility
 * - Async secure/decryption handlers only where genuinely needed
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
  getAllBriefs as helperGetAllBriefs,
  getAllIntelligence as helperGetAllIntelligence,
  getAllLexicon as helperGetAllLexicon,
  getAllVault as helperGetAllVault,
  getAllPlaybooks as helperGetAllPlaybooks,
  getAllEditorials as helperGetAllEditorials,
  getDocBySlug as helperGetDocBySlug,
  getBookBySlug as helperGetBookBySlug,
  getCanonBySlug as helperGetCanonBySlug,
  getDownloadBySlug as helperGetDownloadBySlug,
  getEventBySlug as helperGetEventBySlug,
  getPrintBySlug as helperGetPrintBySlug,
  getResourceBySlug as helperGetResourceBySlug,
  getStrategyBySlug as helperGetStrategyBySlug,
  getShortBySlug as helperGetShortBySlug,
  getPostBySlug as helperGetPostBySlug,
  getBriefBySlug as helperGetBriefBySlug,
  getAccessLevel as helperGetAccessLevel,
  getDocKind as helperGetDocKind,
  toUiDoc as helperToUiDoc,
  documentKinds,
  getCardProps,
  type ContentDoc,
  type DocKind,
} from "@/lib/contentlayer-helper";


const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

export type { ContentDoc, DocKind };

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
export const toUiDoc = helperToUiDoc ?? sharedToUiDoc;

/**
 * Important:
 * Use the helper's content-aware doc kind resolver as primary SSOT.
 * Keep sharedGetDocKind available only as fallback if needed elsewhere.
 */
export const getDocKind = helperGetDocKind || sharedGetDocKind;

function isLiveDoc(doc: any): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;
  return true;
}

export const isPublished = isLiveDoc;

/* -----------------------------------------------------------------------------
   Collection Getters — SYNC
----------------------------------------------------------------------------- */
export const getAllBooks = (): ContentDoc[] => helperGetAllBooks();
export const getAllCanons = (): ContentDoc[] => helperGetAllCanons();
export const getAllDownloads = (): ContentDoc[] => helperGetAllDownloads();
export const getAllPosts = (): ContentDoc[] => helperGetAllPosts();
export const getAllEvents = (): ContentDoc[] => helperGetAllEvents();
export const getAllPrints = (): ContentDoc[] => helperGetAllPrints();
export const getAllResources = (): ContentDoc[] => helperGetAllResources();
export const getAllStrategies = (): ContentDoc[] => helperGetAllStrategies();
export const getAllShorts = (): ContentDoc[] => helperGetAllShorts();
export const getAllBriefs = (): ContentDoc[] => helperGetAllBriefs();
export const getAllIntelligence = (): ContentDoc[] => helperGetAllIntelligence();

/**
 * Backward-compatible lexicon aliases.
 * Some older files may call singular, others plural.
 */
export const getAllLexicons = (): ContentDoc[] => helperGetAllLexicon();
export const getAllLexicon = (): ContentDoc[] => helperGetAllLexicon();

export const getAllVault = (): ContentDoc[] => helperGetAllVault();
export const getAllPlaybooks = (): ContentDoc[] => helperGetAllPlaybooks();
export const getAllEditorials = (): ContentDoc[] => helperGetAllEditorials();
export const getAllBlogs = (): ContentDoc[] => getAllPosts();

export const getAllCombinedDocs = (): ContentDoc[] => {
  return helperGetAllContentlayerDocs();
};

export const getPublishedBooks = (): ContentDoc[] => getAllBooks().filter(isLiveDoc);
export const getPublishedCanons = (): ContentDoc[] => getAllCanons().filter(isLiveDoc);
export const getPublishedDownloads = (): ContentDoc[] => getAllDownloads().filter(isLiveDoc);
export const getPublishedPosts = (): ContentDoc[] => getAllPosts().filter(isLiveDoc);
export const getPublishedEvents = (): ContentDoc[] => getAllEvents().filter(isLiveDoc);
export const getPublishedPrints = (): ContentDoc[] => getAllPrints().filter(isLiveDoc);
export const getPublishedResources = (): ContentDoc[] => getAllResources().filter(isLiveDoc);
export const getPublishedStrategies = (): ContentDoc[] => getAllStrategies().filter(isLiveDoc);
export const getPublishedShorts = (): ContentDoc[] => getAllShorts().filter(isLiveDoc);
export const getPublishedBriefs = (): ContentDoc[] => getAllBriefs().filter(isLiveDoc);
export const getPublishedIntelligence = (): ContentDoc[] => getAllIntelligence().filter(isLiveDoc);
export const getPublishedLexicons = (): ContentDoc[] => getAllLexicons().filter(isLiveDoc);
export const getPublishedLexicon = (): ContentDoc[] => getAllLexicon().filter(isLiveDoc);
export const getPublishedVault = (): ContentDoc[] => getAllVault().filter(isLiveDoc);
export const getPublishedDocuments = (): ContentDoc[] => getAllCombinedDocs().filter(isLiveDoc);

export const getPublishedDocumentsByType = (kind: string): ContentDoc[] => {
  const requested = String(kind || "").toLowerCase().trim();
  if (!requested) return [];

  return getAllCombinedDocs().filter((doc: any) => {
    const type = String(doc?.type || "").toLowerCase();
    const docKind = String(doc?.docKind || "").toLowerCase();
    const legacyKind = String(doc?.kind || "").toLowerCase();

    return (
      (type === requested || docKind === requested || legacyKind === requested) &&
      isLiveDoc(doc)
    );
  });
};

/* -----------------------------------------------------------------------------
   Slug Lookups — SYNC
----------------------------------------------------------------------------- */
export const getDocumentBySlug = (slug: string): ContentDoc | null =>
  helperGetDocBySlug(helperNormalizeSlug(slug));

export const getDocBySlug = getDocumentBySlug;

export const getPostBySlug = (slug: string): ContentDoc | null =>
  helperGetPostBySlug(helperNormalizeSlug(slug));

export const getBookBySlug = (slug: string): ContentDoc | null =>
  helperGetBookBySlug(helperNormalizeSlug(slug));

export const getDownloadBySlug = (slug: string): ContentDoc | null =>
  helperGetDownloadBySlug(helperNormalizeSlug(slug));

export const getResourceBySlug = (slug: string): ContentDoc | null =>
  helperGetResourceBySlug(helperNormalizeSlug(slug));

export const getEventBySlug = (slug: string): ContentDoc | null =>
  helperGetEventBySlug(helperNormalizeSlug(slug));

export const getPrintBySlug = (slug: string): ContentDoc | null =>
  helperGetPrintBySlug(helperNormalizeSlug(slug));

export const getStrategyBySlug = (slug: string): ContentDoc | null =>
  helperGetStrategyBySlug(helperNormalizeSlug(slug));

export const getCanonBySlug = (slug: string): ContentDoc | null =>
  helperGetCanonBySlug(helperNormalizeSlug(slug));

export const getBriefBySlug = (slug: string): ContentDoc | null =>
  helperGetBriefBySlug(helperNormalizeSlug(slug));

export const getShortBySlug = (slug: string): ContentDoc | null =>
  helperGetShortBySlug(helperNormalizeSlug(slug));

export const getServerEventBySlug = getEventBySlug;
export const getServerAllEvents = getAllEvents;

/* -----------------------------------------------------------------------------
   Registry Access — SYNC
----------------------------------------------------------------------------- */
export function getAllContentlayerDocs(): ContentDoc[] {
  return helperGetAllContentlayerDocs();
}

export const getContentlayerData = getAllContentlayerDocs;

/* -----------------------------------------------------------------------------
   Optional Secure Processing — ASYNC ONLY WHERE NEEDED
----------------------------------------------------------------------------- */
async function maybeDecryptDocument(doc: ContentDoc | null): Promise<ContentDoc | null> {
  if (!doc || IS_BUILD) return doc;

  let metadata: any = {};
  try {
    metadata =
      typeof doc?.metadata === "string"
        ? JSON.parse(doc.metadata)
        : doc?.metadata || {};
  } catch {
    metadata = {};
  }

  if (!metadata?.isEncrypted) return doc;

  try {
    const [{ decryptDocument }, { getInnerCircleAccess }] = await Promise.all([
      import("@/lib/security"),
      import("@/lib/inner-circle/access.server"),
    ]);

    const access = await getInnerCircleAccess({});

    if (!access?.hasAccess) {
      return {
        ...doc,
        content: "CLASSIFIED: Requires clearance.",
        body: { ...(doc.body || {}), raw: "REDACTED" },
        isLocked: true,
      } as ContentDoc;
    }

    const decrypted = decryptDocument(
      String(doc.content || doc.body?.raw || ""),
      metadata.iv,
      metadata.authTag
    );

    return {
      ...doc,
      content: decrypted,
      body: { ...(doc.body || {}), raw: decrypted },
      isLocked: false,
    } as ContentDoc;
  } catch (error) {
    console.error("[CONTENT_SERVER] Cryptographic error:", error);
    return { ...doc, isLocked: true } as ContentDoc;
  }
}

export async function getServerBookBySlug(slug: string): Promise<ContentDoc | null> {
  const doc = helperGetBookBySlug(helperNormalizeSlug(slug));
  return maybeDecryptDocument(doc);
}

export async function getServerCanonBySlug(slug: string): Promise<ContentDoc | null> {
  const doc = helperGetCanonBySlug(helperNormalizeSlug(slug));
  return maybeDecryptDocument(doc);
}
