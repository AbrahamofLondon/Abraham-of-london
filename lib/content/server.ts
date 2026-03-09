/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * lib/content/server.ts — PAGES-ROUTER SAFE CONTENT FACADE (SSOT)
 *
 * Design rules:
 * - NO `import "server-only"` here because pages/* data functions still use it.
 * - NO self-imports / circular require tricks.
 * - NO App Router-only imports at module scope.
 * - Safe to import inside:
 *    - getStaticProps
 *    - getStaticPaths
 *    - getServerSideProps
 *    - pages/api/*
 *
 * Important:
 * - Do NOT import this at module top-level inside pages/* render modules.
 * - Use dynamic import inside data functions instead.
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
  getServerCanonBySlug as helperGetServerCanonBySlug,

  getAccessLevel as helperGetAccessLevel,
  toUiDoc as helperToUiDoc,
  documentKinds,
  getCardProps,
} from "@/lib/contentlayer-helper";

const IS_BUILD =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.NEXT_PHASE === "phase-export";

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
  excerpt?: string;
  description?: string;
  subtitle?: string;
  date?: string;
  readTime?: string | number;
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
   Stable re-exports expected across legacy pages/api/importers
----------------------------------------------------------------------------- */
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

/* -----------------------------------------------------------------------------
   Publication logic
----------------------------------------------------------------------------- */
function isLiveDoc(d: any): boolean {
  if (!d) return false;
  if (d.draft === true) return false;
  if (d.published === false) return false;
  return true;
}

export const isPublished = isLiveDoc;

/* -----------------------------------------------------------------------------
   Path utilities
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

  const sec = String(section || "").toLowerCase();

  while (s.toLowerCase().startsWith(`${sec}/`)) s = s.slice(sec.length + 1);
  while (s.toLowerCase().startsWith(`vault/${sec}/`)) s = s.slice(`vault/${sec}/`.length);
  while (s.toLowerCase().startsWith(`content/${sec}/`)) s = s.slice(`content/${sec}/`.length);

  s = cleanPathish(s);
  if (!s || s.includes("..")) return "";

  return s;
}

function matchesSlugVariants(section: string, doc: any, targetBare: string): boolean {
  if (!doc || !targetBare) return false;

  const a = bareSectionSlug(section, doc?.slug);
  if (a && a === targetBare) return true;

  const b = bareSectionSlug(section, doc?._raw?.flattenedPath);
  if (b && b === targetBare) return true;

  const c = bareSectionSlug(section, doc?._raw?.sourceFilePath);
  if (c && c === targetBare) return true;

  return false;
}

function deriveByFolderPrefix(prefixes: string[], docs?: any[]): any[] {
  const all = docs || getAllContentlayerDocs();
  const normalized = prefixes.map(
    (p) => cleanPathish(String(p).toLowerCase()) + "/"
  );

  return (all || []).filter((d: any) => {
    const fp = String(d?._raw?.flattenedPath || d?._raw?.sourceFilePath || "").toLowerCase();
    return fp ? normalized.some((p) => fp.startsWith(p)) : false;
  });
}

/* -----------------------------------------------------------------------------
   Registry access
----------------------------------------------------------------------------- */
export function getAllContentlayerDocs(): any[] {
  const docs = helperGetAllContentlayerDocs?.() || [];
  return Array.isArray(docs) ? docs : [];
}

export const getContentlayerData = getAllContentlayerDocs;

export function isContentlayerLoaded(): boolean {
  const docs = getAllContentlayerDocs();
  return Array.isArray(docs) && docs.length > 0;
}

export function assertContentlayerHasDocs(): void {
  const docs = getAllContentlayerDocs();
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error("SSOT: Contentlayer registry resolved 0 docs.");
  }
}

if (process.env.NODE_ENV === "development") {
  const docs = getAllContentlayerDocs();
  if (Array.isArray(docs) && docs.length === 0) {
    // eslint-disable-next-line no-console
    console.error("🚨 SSOT: Contentlayer registry resolved 0 docs. Loader is failing.");
  }
}

/* -----------------------------------------------------------------------------
   Core collection getters
----------------------------------------------------------------------------- */
export function getAllBooks(): any[] {
  const docs = helperGetAllBooks?.() || [];
  return Array.isArray(docs) && docs.length ? docs : deriveByFolderPrefix(["books"]);
}

export function getAllCanons(): any[] {
  const docs = helperGetAllCanons?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["canon", "vault/canon"]);
}

export function getAllDownloads(): any[] {
  const docs = helperGetAllDownloads?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["downloads", "vault/downloads"]);
}

export function getAllEvents(): any[] {
  const docs = helperGetAllEvents?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["events", "vault/events"]);
}

export function getAllPrints(): any[] {
  const docs = helperGetAllPrints?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["prints", "vault/prints"]);
}

export function getAllResources(): any[] {
  const docs = helperGetAllResources?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["resources", "vault/resources"]);
}

export function getAllShorts(): any[] {
  const docs = helperGetAllShorts?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["shorts", "vault/shorts"]);
}

export function getAllPosts(): any[] {
  const docs = helperGetAllPosts?.() || [];
  return Array.isArray(docs) && docs.length
    ? docs
    : deriveByFolderPrefix(["blog", "posts", "vault/blog"]);
}

export function getAllStrategies(): any[] {
  const docs = helperGetAllStrategies?.() || [];
  const resolved =
    Array.isArray(docs) && docs.length
      ? docs
      : deriveByFolderPrefix(["strategy", "strategies", "vault/strategy"]);

  return resolved.filter(isLiveDoc);
}

export function getAllLexicons(): any[] {
  return getAllCombinedDocs().filter((d: any) => {
    const fp = String(d?._raw?.flattenedPath || "").toLowerCase();
    const kind = String(d?.kind || d?.type || "").toLowerCase();
    return kind === "lexicon" || fp.startsWith("lexicon/");
  });
}

export function getAllBlogs(): any[] {
  return getAllPosts();
}

/* -----------------------------------------------------------------------------
   Published/live collection helpers
----------------------------------------------------------------------------- */
export const getShorts = () => getAllShorts().filter(isLiveDoc);
export const getCanons = () => getAllCanons().filter(isLiveDoc);
export const getBooks = () => getAllBooks().filter(isLiveDoc);
export const getDownloads = () => getAllDownloads().filter(isLiveDoc);
export const getPublishedPosts = () => getAllPosts().filter(isLiveDoc);
export const getPublishedBooks = () => getBooks();
export const getPublishedDocuments = () => getAllCombinedDocs();

export function getPublishedDocumentsByType(kind: DocKind): ContentDoc[] {
  const k = String(kind || "").toLowerCase().trim() as DocKind;
  if (!k) return [];

  const docs = (getPublishedDocuments() || []) as ContentDoc[];

  return docs.filter((d) => {
    const dk = String((d as any)?.kind || "").toLowerCase();
    const dt = String((d as any)?.type || "").toLowerCase();
    const fp = String((d as any)?._raw?.flattenedPath || "").toLowerCase();

    if (dk === k || dt === k) return true;

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

/* -----------------------------------------------------------------------------
   Direct lookup helpers
----------------------------------------------------------------------------- */
export function getDocumentBySlug(slug: string): any | null {
  return helperGetDocBySlug?.(slug) || null;
}

export const getDocBySlug = getDocumentBySlug;

export function getDownloadBySlug(slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));

  const found =
    getAllDownloads().find(
      (d: any) =>
        bareSectionSlug("downloads", d?.slug) === bareSectionSlug("downloads", s) ||
        String(d?._raw?.flattenedPath || "").includes(s)
    ) || null;

  if (found) return found;

  return getDocumentBySlug(s) || getDocumentBySlug(`downloads/${s}`);
}

export function getBookBySlug(slug: string): any | null {
  const targetBare = bareSectionSlug("books", slug);
  return getBooks().find((b: any) => matchesSlugVariants("books", b, targetBare)) || null;
}

/* -----------------------------------------------------------------------------
   Combined registry helpers
----------------------------------------------------------------------------- */
export function getAllCombinedDocs(): any[] {
  const docs = getAllContentlayerDocs().filter(isLiveDoc);
  const sanitized = helperSanitizeData?.(docs);
  return Array.isArray(sanitized) ? sanitized : docs;
}

/* -----------------------------------------------------------------------------
   Optional secure processing
----------------------------------------------------------------------------- */
async function getAuthSession() {
  if (IS_BUILD) return null;

  try {
    const mod = await import("@/lib/auth/server");
    if (typeof mod.getAuthSession === "function") {
      return await mod.getAuthSession();
    }
    return null;
  } catch {
    return null;
  }
}

async function maybeDecryptDocument(doc: any): Promise<any | null> {
  if (!doc) return null;
  if (IS_BUILD) return doc;

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
    const [{ decryptDocument }, { canAccessDoc }, session] = await Promise.all([
      import("@/lib/security"),
      import("@/lib/content/access-engine"),
      getAuthSession(),
    ]);

    const userRole =
      (session?.user as any)?.tier ||
      (session?.user as any)?.role ||
      "public";

    const allowed = canAccessDoc(doc, userRole);

    if (!allowed) {
      return {
        ...doc,
        content: "CLASSIFIED: This document requires higher clearance.",
        body: { ...doc.body, raw: "REDACTED" },
        isLocked: true,
      };
    }

    const decrypted = decryptDocument(
      doc.content || doc.body?.raw || "",
      metadata.iv,
      metadata.authTag
    );

    return {
      ...doc,
      content: decrypted,
      body: { ...doc.body, raw: decrypted },
      isLocked: false,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[CONTENT_SERVER] Decryption failure for ${doc?.slug || "unknown"}:`, error);
    return {
      ...doc,
      content: "ERROR: Cryptographic Integrity Breach.",
      body: { ...doc.body, raw: "ERROR: Cryptographic Integrity Breach." },
      isLocked: true,
    };
  }
}

/* -----------------------------------------------------------------------------
   Server lookup helpers
----------------------------------------------------------------------------- */
export async function getServerBookBySlug(slug: string) {
  const targetBare = bareSectionSlug("books", slug);

  const helperDoc =
    (await helperGetServerBookBySlug?.(targetBare)) ||
    (await helperGetServerBookBySlug?.(`books/${targetBare}`)) ||
    (await helperGetServerBookBySlug?.(`/books/${targetBare}`)) ||
    null;

  const fallback = helperDoc || getBookBySlug(targetBare);
  return await maybeDecryptDocument(fallback);
}

export async function getServerCanonBySlug(slug: string) {
  const targetBare = bareSectionSlug("canon", slug);

  const helperDoc =
    (await helperGetServerCanonBySlug?.(targetBare)) ||
    (await helperGetServerCanonBySlug?.(`canon/${targetBare}`)) ||
    (await helperGetServerCanonBySlug?.(`/canon/${targetBare}`)) ||
    null;

  return await maybeDecryptDocument(helperDoc);
}

export async function getServerShortBySlug(slug: string) {
  const targetBare = bareSectionSlug("shorts", slug);
  const doc = getShorts().find((s: any) => matchesSlugVariants("shorts", s, targetBare)) || null;
  return await maybeDecryptDocument(doc);
}

export async function getPostBySlug(slug: string): Promise<any | null> {
  const targetBare = bareSectionSlug("blog", slug);
  const doc =
    getPublishedPosts().find((p: any) => matchesSlugVariants("blog", p, targetBare)) || null;
  return await maybeDecryptDocument(doc);
}

export function getServerAllEvents() {
  return getAllEvents().filter(isLiveDoc);
}

export function getServerEventBySlug(slug: string) {
  const targetBare = bareSectionSlug("events", slug);
  return getAllEvents().find((e: any) => matchesSlugVariants("events", e, targetBare)) || null;
}

export function getSecureDocument(id: string) {
  // Legacy compatibility shim
  // eslint-disable-next-line no-console
  console.warn(`getSecureDocument lookup requested for id: ${id}`);
  return null;
}