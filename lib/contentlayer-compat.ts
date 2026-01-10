/**
 * Contentlayer Compatibility Layer - Next.js (Pages Router) SYNC-FIRST
 * - Works with existing pages that call getters synchronously
 * - Falls back to empty collections if generated module is unavailable
 *
 * IMPORTANT:
 * This file is intended for Next.js Pages Router (getStaticProps/getStaticPaths),
 * where synchronous arrays are commonly used in legacy code.
 */

export interface DocBase {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  slug?: string;
  slugComputed?: string;
  href?: string;
  hrefComputed?: string;
  date?: string;
  updated?: string;
  author?: string;
  description?: string;
  excerpt?: string;
  draft?: boolean;
  published?: boolean;
  tags?: string[];
  category?: string;
  coverImage?: string;
  featured?: boolean;
  accessLevel?: string;
  tier?: string;
  requiresAuth?: boolean;
  body?: {
    raw?: string;
    code?: string;
  };
  // Download-specific fields
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  fileFormat?: string;
  requiresEmail?: boolean;
}

type GeneratedShape = {
  allDocuments: DocBase[];
  allPosts: DocBase[];
  allBooks: DocBase[];
  allCanons: DocBase[];
  allDownloads: DocBase[];
  allShorts: DocBase[];
  allEvents: DocBase[];
  allPrints: DocBase[];
  allResources: DocBase[];
  allStrategies: DocBase[];
};

const FALLBACK: GeneratedShape = {
  allDocuments: [],
  allPosts: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allShorts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
};

function safeArray<T>(v: any): T[] {
  return Array.isArray(v) ? v : [];
}

let DATA: GeneratedShape = FALLBACK;

// Try load generated content synchronously.
// If it fails (e.g., contentlayer not installed / not generated), we keep FALLBACK.
try {
  // Static import path for Contentlayer2 output in your repo
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("../.contentlayer/generated");

  DATA = {
    allDocuments: safeArray<DocBase>(mod.allDocuments),
    allPosts: safeArray<DocBase>(mod.allPosts),
    allBooks: safeArray<DocBase>(mod.allBooks),
    allCanons: safeArray<DocBase>(mod.allCanons),
    allDownloads: safeArray<DocBase>(mod.allDownloads),
    allShorts: safeArray<DocBase>(mod.allShorts),
    allEvents: safeArray<DocBase>(mod.allEvents),
    allPrints: safeArray<DocBase>(mod.allPrints),
    allResources: safeArray<DocBase>(mod.allResources),
    allStrategies: safeArray<DocBase>(mod.allStrategies),
  };
  console.log(`[Contentlayer] Loaded ${DATA.allDownloads.length} downloads`);
} catch (error) {
  console.warn("[Contentlayer] Generated module unavailable — using fallback empty collections.");
  console.warn("Error details:", error.message);
  DATA = FALLBACK;
}

/** Core getters */
export function getContentlayerData(): GeneratedShape {
  return DATA;
}

/** Helpers */
export function normalizeSlug(slug: string): string {
  return (slug || "").replace(/^\/|\/$/g, "").trim();
}

export function getDocHref(doc: DocBase | any): string {
  if (!doc) return "/";
  return doc.hrefComputed || doc.href || `/${normalizeSlug(doc.slugComputed || doc.slug || "")}`;
}

export function getAccessLevel(doc: DocBase | any): string {
  return doc?.accessLevel || doc?.tier || "public";
}

export function isDraft(doc: DocBase | any): boolean {
  return doc?.draft === true;
}

export function isDraftContent(doc: DocBase | any): boolean {
  return isDraft(doc);
}

export function isPublished(doc: DocBase | any): boolean {
  return !isDraft(doc) && doc?.published !== false;
}

/** Legacy exports your pages import */
export function assertContentlayerHasDocs(): boolean {
  const docs = DATA.allDocuments ?? [];
  if (docs.length === 0) {
    console.warn("⚠ No ContentLayer documents found");
    return false;
  }
  return true;
}

export function getDocKind(doc: DocBase | any): string {
  return doc?.type || "unknown";
}

export function resolveDocCoverImage(doc: DocBase | any): string | null {
  return doc?.coverImage || (doc as any)?.featuredImage || null;
}

export function resolveDocDownloadUrl(doc: DocBase | any): string | null {
  return (doc as any)?.downloadUrl || (doc as any)?.fileUrl || (doc as any)?.downloadFile || null;
}

export function toUiDoc(doc: DocBase | any): any {
  if (!doc) return doc;
  return {
    ...doc,
    href: getDocHref(doc),
    slug: normalizeSlug(doc.slugComputed || doc.slug || ""),
    coverImage: resolveDocCoverImage(doc),
    downloadUrl: resolveDocDownloadUrl(doc),
  };
}

export function sanitizeData(input: any): any {
  if (!input) return input;
  try {
    const seen = new WeakSet();
    const walk = (obj: any): any => {
      if (obj === null || typeof obj !== "object") return obj;
      if (seen.has(obj)) return "[Circular]";
      seen.add(obj);
      if (Array.isArray(obj)) return obj.map(walk);

      const out: any = {};
      for (const k of Object.keys(obj)) {
        if (k.startsWith("_") && k !== "_id" && k !== "_raw") continue;
        out[k] = walk(obj[k]);
      }
      return out;
    };
    return walk(input);
  } catch {
    return input;
  }
}

export async function recordContentView(slug: string, type?: string): Promise<void> {
  if (typeof window !== "undefined") {
    console.log(`Content view: ${type || "unknown"}/${slug}`);
  }
}

/** Collection getters (SYNC) */
export function getAllContentlayerDocs(): DocBase[] {
  return DATA.allDocuments ?? [];
}
export function getAllPosts(): DocBase[] {
  return DATA.allPosts ?? [];
}
export function getAllBooks(): DocBase[] {
  return DATA.allBooks ?? [];
}
export function getAllCanons(): DocBase[] {
  return DATA.allCanons ?? [];
}
export function getAllDownloads(): DocBase[] {
  return DATA.allDownloads ?? [];
}
export function getAllShorts(): DocBase[] {
  return DATA.allShorts ?? [];
}
export function getAllEvents(): DocBase[] {
  return DATA.allEvents ?? [];
}
export function getAllPrints(): DocBase[] {
  return DATA.allPrints ?? [];
}
export function getAllResources(): DocBase[] {
  return DATA.allResources ?? [];
}
export function getAllStrategies(): DocBase[] {
  return DATA.allStrategies ?? [];
}

export function getPublishedDocuments(docs?: DocBase[]): DocBase[] {
  const source = docs ?? getAllContentlayerDocs();
  return (source ?? []).filter((d) => isPublished(d));
}

export function getDocBySlug(slug: string, collection?: DocBase[]): DocBase | null {
  const normalizedSlug = normalizeSlug(slug);
  const docs = collection ?? getAllContentlayerDocs();

  const foundDoc = (docs ?? []).find((doc) => {
    const a = normalizeSlug(doc.slugComputed || doc.slug || "");
    const b = normalizeSlug(doc._raw?.flattenedPath || "");
    return a === normalizedSlug || b === normalizedSlug;
  });

  if (!foundDoc) {
    console.warn(`[getDocBySlug] No document found for slug: ${normalizedSlug}`);
  }
  
  return foundDoc ?? null;
}

/** Server convenience (SYNC signatures expected by legacy pages) */
export function getServerAllPosts(): DocBase[] {
  return getPublishedDocuments(getAllPosts());
}
export function getServerPostBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllPosts());
}

export function getServerAllBooks(): DocBase[] {
  return getPublishedDocuments(getAllBooks());
}
export function getServerBookBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllBooks());
}

export function getServerAllCanons(): DocBase[] {
  return getPublishedDocuments(getAllCanons());
}
export function getServerCanonBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllCanons());
}

export function getServerAllDownloads(): DocBase[] {
  return getPublishedDocuments(getAllDownloads());
}

export function getServerDownloadBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllDownloads());
}

// ADDED: Export for consistent naming - This was missing!
export function getDownloadBySlug(slug: string): DocBase | null {
  return getServerDownloadBySlug(slug);
}

// ADDED: Export getAllDownloads for async/await usage
export async function getAllDownloadsAsync(): Promise<DocBase[]> {
  return Promise.resolve(getAllDownloads());
}

export function getServerAllShorts(): DocBase[] {
  return getPublishedDocuments(getAllShorts());
}
export function getServerShortBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllShorts());
}

export function getServerAllEvents(): DocBase[] {
  return getPublishedDocuments(getAllEvents());
}
export function getServerEventBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllEvents());
}


export function getServerResourceBySlug(slug: string): DocBase | null {
  return getDocBySlug(slug, getAllResources());
}

export function getAllDocuments(): DocBase[] {
  return getAllContentlayerDocs();
}

export function getServerAllResources(): DocBase[] {
  return getPublishedDocuments(getAllResources());
}

export async function getAllDocumentsAsync(): Promise<DocBase[]> {
  return Promise.resolve(getAllDocuments());
}

/** Direct exports some code may import */
export const allDocuments = DATA.allDocuments ?? [];
export const allPosts = DATA.allPosts ?? [];
export const allBooks = DATA.allBooks ?? [];
export const allCanons = DATA.allCanons ?? [];
export const allDownloads = DATA.allDownloads ?? [];
export const allShorts = DATA.allShorts ?? [];
export const allEvents = DATA.allEvents ?? [];
export const allPrints = DATA.allPrints ?? [];
export const allResources = DATA.allResources ?? [];
export const allStrategies = DATA.allStrategies ?? [];

// Ensure all exports are available
export default {
  getAllDownloads,
  getDownloadBySlug,
  getServerAllDownloads,
  getServerDownloadBySlug,
  getAllDownloadsAsync,
  sanitizeData,
  allDownloads,
};
