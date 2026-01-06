/* lib/contentlayer-compat.ts - INSTITUTIONAL RECONCILIATION - FIXED */

import { sanitizeData } from "@/lib/server/md-utils";

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                                                 */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(input: string): string {
  return ((typeof input === 'string') ? input : (Array.isArray(input) ? input.join('/') : (input ?? '').toString())).trim().replace(/^\/+/, "").replace(/\/+$/, "").replace(/\.mdx?$/, "");
}

export function isDraftContent(doc: any): boolean {
  if (!doc) return true;
  const d = doc?.draft;
  if (d === true || d === "true") return true;
  return doc?.status === "draft";
}

/* -------------------------------------------------------------------------- */
/* SAFE CONTENTLAYER IMPORTS                                                  */
/* -------------------------------------------------------------------------- */

// Define types to prevent build-time errors
type ContentLayerDoc = any;

// Safe dynamic imports or fallbacks
let contentlayerData: {
  allBooks?: ContentLayerDoc[];
  allCanons?: ContentLayerDoc[];
  allDownloads?: ContentLayerDoc[];
  allEvents?: ContentLayerDoc[];
  allPosts?: ContentLayerDoc[];
  allPrints?: ContentLayerDoc[];
  allResources?: ContentLayerDoc[];
  allShorts?: ContentLayerDoc[];
  allStrategies?: ContentLayerDoc[];
} = {};

try {
  // This will only work at build time
  const generated = require('../.contentlayer/generated');
  contentlayerData = generated;
} catch (error) {
  console.warn('Contentlayer not available yet, using empty collections');
  // Initialize with empty arrays
  contentlayerData = {
    allBooks: [],
    allCanons: [],
    allDownloads: [],
    allEvents: [],
    allPosts: [],
    allPrints: [],
    allResources: [],
    allShorts: [],
    allStrategies: [],
  };
}

// Safely extract collections with defaults
export const allBooks = contentlayerData.allBooks || [];
export const allCanons = contentlayerData.allCanons || [];
export const allDownloads = contentlayerData.allDownloads || [];
export const allEvents = contentlayerData.allEvents || [];
export const allPosts = contentlayerData.allPosts || [];
export const allPrints = contentlayerData.allPrints || [];
export const allResources = contentlayerData.allResources || [];
export const allShorts = contentlayerData.allShorts || [];
export const allStrategies = contentlayerData.allStrategies || [];

/* -------------------------------------------------------------------------- */
/* COLLECTION PROVIDERS                                                       */
/* -------------------------------------------------------------------------- */

export const getAllPosts = () => allPosts.filter(d => !isDraftContent(d));
export const getAllBooks = () => allBooks.filter(d => !isDraftContent(d));
export const getAllDownloads = () => allDownloads.filter(d => !isDraftContent(d));
export const getAllCanons = () => allCanons.filter(d => !isDraftContent(d));
export const getAllShorts = () => allShorts.filter(d => !isDraftContent(d));
export const getAllResources = () => allResources.filter(d => !isDraftContent(d));
export const getAllStrategies = () => allStrategies.filter(d => !isDraftContent(d));
export const getAllEvents = () => allEvents.filter(d => !isDraftContent(d));
export const getAllPrints = () => allPrints.filter(d => !isDraftContent(d));

export const allDocuments = [
  ...allPosts, ...allBooks, ...allCanons, ...allDownloads,
  ...allEvents, ...allPrints, ...allResources, ...allShorts, ...allStrategies
].filter(d => !isDraftContent(d));

/* -------------------------------------------------------------------------- */
/* TRACE-CRITICAL EXPORTS (Resolves "Attempted import error")                 */
/* -------------------------------------------------------------------------- */

export const getPublishedDocuments = () => allDocuments;
export const getPublishedPosts = getAllPosts;
export const getPublishedDownloads = getAllDownloads;
export const getPublishedShorts = getAllShorts;

export function getDocKind(doc: any): string {
  const t = String(doc?._type || doc?.type || "").toLowerCase();
  return t;
}

export function getAccessLevel(doc: any): string {
  return doc?.accessLevel || "public";
}

export function resolveDocCoverImage(doc: any): string {
  return doc?.coverImage || doc?.coverimage || "/assets/images/placeholder.jpg";
}

export function resolveDocDownloadUrl(doc: any): string {
  if (!doc) return "";
  return doc.downloadUrl || doc.fileUrl || doc.file || doc.pdfPath || "";
}

/* -------------------------------------------------------------------------- */
/* LOOKUP HELPERS                                                             */
/* -------------------------------------------------------------------------- */

function bySlug<T>(docs: T[], slug: string): T | null {
  const n = normalizeSlug(slug);
  return docs.find((d: any) => {
    const docSlug = d.slug || d.slugComputed || d._raw?.flattenedPath || "";
    return normalizeSlug(docSlug) === n;
  }) || null;
}

export const getPostBySlug = (s: string) => bySlug(getAllPosts(), s);
export const getBookBySlug = (s: string) => bySlug(getAllBooks(), s);
export const getCanonBySlug = (s: string) => bySlug(getAllCanons(), s);
export const getDownloadBySlug = (s: string) => bySlug(getAllDownloads(), s);
export const getEventBySlug = (s: string) => bySlug(getAllEvents(), s);
export const getShortBySlug = (s: string) => bySlug(getAllShorts(), s);
export const getDocumentBySlug = (s: string) => bySlug(allDocuments, s);

export function getDocHref(doc: any): string {
  if (!doc) return "/";
  const slug = normalizeSlug(doc.slug || doc._raw?.flattenedPath || "");
  const type = getDocKind(doc);
  const typeMap: Record<string, string> = {
    book: 'books', canon: 'canon', download: 'downloads',
    short: 'shorts', print: 'prints', resource: 'resources',
    strategy: 'strategy', post: 'blog', event: 'events'
  };
  return `/${typeMap[type] || 'blog'}/${slug}`;
}

export function assertContentlayerHasDocs() {
  const hasDocs = allDocuments.length > 0;
  if (!hasDocs) {
    console.warn("[Contentlayer] No documents found. Make sure contentlayer has generated the content.");
  }
  return hasDocs;
}

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORT                                                             */
/* -------------------------------------------------------------------------- */

const ContentHelper = {
  // Collections
  allBooks,
  allCanons,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
  allDocuments,
  
  // Functions
  getPublishedDocuments,
  getAllPosts,
  getPostBySlug,
  getBookBySlug,
  getCanonBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getShortBySlug,
  getDocumentBySlug,
  getDocHref,
  normalizeSlug,
  isDraftContent,
  getDocKind,
  getAccessLevel,
  resolveDocDownloadUrl,
  resolveDocCoverImage,
  assertContentlayerHasDocs,
};

export default ContentHelper;
