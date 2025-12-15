/* eslint-disable @typescript-eslint/no-explicit-any */

// Centralized Contentlayer imports to avoid path resolution issues
import path from "path";
import fs from 'fs';

// ============================================================================
// 0. IMPORT CANON FUNCTIONS
// ============================================================================

import { 
  getPublicCanon as getPublicCanonFromLib, 
  getAllCanons as getAllCanonsFromLib,
  getCanonDocBySlug,
  getCanonIndexItems 
} from './canon';

// ============================================================================
// 1. CORE TYPES - DECLARED WITHOUT EXPORT
// ============================================================================

interface ContentlayerDocument {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  slug: string;
  url?: string;
  title?: string;
  date?: string;
  draft?: boolean;
  excerpt?: string;
  description?: string;
  tags?: string[];
  coverImage?: string;
  body: {
    raw: string;
    code: string;
  };
}

interface PostDocument extends ContentlayerDocument {
  type: "Post";
  category?: string;
  author?: string;
  readTime?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

interface ShortDocument extends ContentlayerDocument {
  type: "Short";
  category?: string;
  author?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

interface BookDocument extends ContentlayerDocument {
  type: "Book";
  subtitle?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
  status?: "published" | "draft" | "archived";
  format?: string;
}

interface DownloadDocument extends ContentlayerDocument {
  type: "Download";
  subtitle?: string;
  author?: string;
  file?: string;
  pdfPath?: string;
  downloadFile?: string;
  fileUrl?: string;
  downloadUrl?: string;
  fileSize?: string;
  accessLevel?: string;
  lockMessage?: string;
}

interface PrintDocument extends ContentlayerDocument {
  type: "Print";
  dimensions?: string;
  price?: string;
  available?: boolean;
  downloadFile?: string;
  accessLevel?: string;
  lockMessage?: string;
}

interface ResourceDocument extends ContentlayerDocument {
  type: "Resource";
  resourceType?: string;
  author?: string;
  fileUrl?: string;
  downloadUrl?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

interface CanonDocument extends ContentlayerDocument {
  type: "Canon";
  subtitle?: string;
  author?: string;
  coverAspect?: string;
  coverFit?: string;
  volumeNumber?: string | number;
  order?: number;
  featured?: boolean;
  readTime?: string;
  accessLevel?: string;
  lockMessage?: string;
}

interface EventDocument extends ContentlayerDocument {
  type: "Event";
  eventDate?: string;
  time?: string;
  location?: string;
  registrationUrl?: string;
  isUpcoming?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

interface StrategyDocument extends ContentlayerDocument {
  type: "Strategy";
  category?: string;
  author?: string;
  accessLevel?: string;
  lockMessage?: string;
}

// ============================================================================
// 2. CONTENTLAYER EXPORTS LOADING - FIXED VERSION
// ============================================================================

let contentlayerExports: any = {};

// Try to load contentlayer/generated directly
try {
  // First try direct import from contentlayer/generated
  contentlayerExports = require('contentlayer/generated');
  
  // If it's empty, try alternative loading strategies
  if (!contentlayerExports || Object.keys(contentlayerExports).length === 0) {
    const generatedPath = path.join(process.cwd(), ".contentlayer", "generated");
    
    if (fs.existsSync(generatedPath)) {
      // Try index.js first
      const indexPath = path.join(generatedPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        contentlayerExports = require(indexPath);
      } else {
        // Try individual collections
        const collectionFiles = fs.readdirSync(generatedPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
        if (collectionFiles.length > 0) {
          contentlayerExports = {};
          // This is a simplified approach - in reality you might need to load each file
          console.warn('ContentLayer: Found individual collection files but not a unified index. Some features may not work correctly.');
        }
      }
    }
  }
} catch (error) {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    console.warn(
      "[contentlayer] ContentLayer exports not found – using empty exports.",
      error
    );
  }
  contentlayerExports = {};
}

// ============================================================================
// 3. ROBUST COLLECTION GETTERS WITH PROPER TYPING
// ============================================================================

function safeCastArray<T>(collection: unknown, fallback: T[] = []): T[] {
  if (!Array.isArray(collection)) return fallback;
  return collection as T[];
}

function getCollection<T extends ContentlayerDocument>(
  key: string,
  fallback: T[] = []
): T[] {
  const collection = contentlayerExports?.[key];
  return safeCastArray<T>(collection, fallback);
}

// ============================================================================
// 4. COLLECTIONS
// ============================================================================

const allPosts: PostDocument[] = getCollection<PostDocument>("allPosts");
const allShorts: ShortDocument[] = getCollection<ShortDocument>("allShorts");
const allBooks: BookDocument[] = getCollection<BookDocument>("allBooks");
const allDownloads: DownloadDocument[] = getCollection<DownloadDocument>("allDownloads");
const allEvents: EventDocument[] = getCollection<EventDocument>("allEvents");
const allPrints: PrintDocument[] = getCollection<PrintDocument>("allPrints");
const allStrategies: StrategyDocument[] = getCollection<StrategyDocument>("allStrategies");
const allResources: ResourceDocument[] = getCollection<ResourceDocument>("allResources");
const allDocuments: ContentlayerDocument[] = getCollection<ContentlayerDocument>("allDocuments");

// "content" on your site = all documents, regardless of type
const allContent: ContentlayerDocument[] = [...allDocuments];

const allPublished: ContentlayerDocument[] = allDocuments.filter(
  (doc: ContentlayerDocument) => !doc?.draft
);

// ============================================================================
// 5. TYPE-SPECIFIC GETTER FUNCTIONS - ADDING MISSING FUNCTIONS
// ============================================================================

function getPublishedPosts(): PostDocument[] {
  return allPosts.filter(post => !post.draft);
}

function getPublishedShorts(): ShortDocument[] {
  return allShorts.filter(short => !short.draft);
}

function getRecentShorts(limit: number = 5): ShortDocument[] {
  return getPublishedShorts()
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
    .slice(0, limit);
}

function getShortBySlug(slug: string): ShortDocument | undefined {
  return allShorts.find(short => normalizeSlug(short) === slug && !short.draft);
}

function getShortUrl(short: ShortDocument): string {
  return `/shorts/${normalizeSlug(short)}`;
}

function getPublicCanon(): CanonDocument[] {
  // Use the imported function from canon.ts
  const canonItems = getPublicCanonFromLib();
  // Map to CanonDocument type if needed
  return canonItems as unknown as CanonDocument[];
}

function getAllBooks(): BookDocument[] {
  return allBooks.filter(book => !book.draft);
}

function getAllDownloads(): DownloadDocument[] {
  return allDownloads.filter(download => !download.draft);
}

function getAllEvents(): EventDocument[] {
  return allEvents.filter(event => !event.draft);
}

function getAllPrints(): PrintDocument[] {
  return allPrints.filter(print => !print.draft);
}

function getAllResources(): ResourceDocument[] {
  return allResources.filter(resource => !resource.draft);
}

function getAllCanons(): CanonDocument[] {
  // Use the imported function from canon.ts
  return getAllCanonsFromLib() as unknown as CanonDocument[];
}

function getAllStrategies(): StrategyDocument[] {
  return allStrategies.filter(strategy => !strategy.draft);
}

function getPublishedDocumentsByType(type: string): ContentlayerDocument[] {
  return allDocuments.filter(doc => doc.type === type && !doc.draft);
}

function getCanonIndexItemsFromHelper() {
  return getCanonIndexItems();
}

function getCanonDocBySlugFromHelper(slug: string) {
  return getCanonDocBySlug(slug);
}

// ============================================================================
// 6. ROUTING + NORMALIZATION (SINGLE SOURCE OF TRUTH)
// ============================================================================

type DocKind =
  | "post"
  | "short"
  | "book"
  | "canon"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "content"
  | "unknown";

/**
 * Normalizes a slug from either `doc.slug` or `_raw.flattenedPath`.
 * - Strips directories, removes trailing "index"
 * - Falls back to empty string (never throws)
 */
function normalizeSlug(doc: any): string {
  const direct = typeof doc?.slug === "string" ? doc.slug.trim() : "";
  if (direct) return direct;

  const fp =
    typeof doc?._raw?.flattenedPath === "string" ? doc._raw.flattenedPath : "";
  if (!fp) return "";

  const parts = fp.split("/").filter(Boolean);
  if (!parts.length) return "";

  const last = parts[parts.length - 1];
  if (last && last !== "index") return last;

  return parts[parts.length - 2] ?? "";
}

/**
 * Converts Contentlayer `type` to a stable lower-case kind used by your UI/routes.
 */
function getDocKind(doc: any): DocKind {
  const t = String(doc?.type ?? doc?._type ?? "").trim().toLowerCase();

  // map your document types
  if (t === "post") return "post";
  if (t === "short") return "short";
  if (t === "book") return "book";
  if (t === "canon") return "canon";
  if (t === "download") return "download";
  if (t === "event") return "event";
  if (t === "print") return "print";
  if (t === "resource") return "resource";
  if (t === "strategy") return "strategy";

  // if unknown but exists in the content shelf, treat as generic content
  if (t) return "content";
  return "unknown";
}

function isDraft(doc: any): boolean {
  return Boolean(doc?.draft);
}

function isShort(doc: any): doc is ShortDocument {
  return doc?.type === "Short";
}

/**
 * SINGLE ROUTE TRUTH.
 * Update here, and every index/detail page stays consistent.
 *
 * ✅ posts at /blog/[slug]
 */
function getDocHref(doc: any): string {
  const slug = normalizeSlug(doc);
  const kind = getDocKind(doc);

  // never return broken paths
  const safeSlug = slug || "untitled";

  switch (kind) {
    case "post":
      return `/blog/${safeSlug}`;
    case "short":
      return `/shorts/${safeSlug}`;
    case "book":
      return `/books/${safeSlug}`;
    case "canon":
      return `/canon/${safeSlug}`;
    case "download":
      return `/downloads/${safeSlug}`;
    case "event":
      return `/events/${safeSlug}`;
    case "print":
      return `/prints/${safeSlug}`;
    case "resource":
      return `/resources/${safeSlug}`;
    case "strategy":
      return `/content/${safeSlug}`;
    default:
      return `/content/${safeSlug}`;
  }
}

/**
 * Convenience used by your pages.
 */
function getAllContentlayerDocs(): ContentlayerDocument[] {
  return allDocuments;
}

/**
 * Finds a doc by its computed href.
 */
function getDocByHref(href: string): ContentlayerDocument | undefined {
  const target = String(href || "").trim();
  if (!target) return undefined;
  return allDocuments.find((d) => getDocHref(d) === target);
}

/**
 * Safe doc fetch by slug + kind (kind optional).
 */
function getBySlugAndKind(
  slug: string,
  kind?: DocKind
): ContentlayerDocument | undefined {
  const s = String(slug || "").trim();
  if (!s) return undefined;

  const docs = kind
    ? allDocuments.filter((d) => getDocKind(d) === kind)
    : allDocuments;

  return docs.find((d) => normalizeSlug(d) === s);
}

// ============================================================================
// 7. HELPER FUNCTIONS
// ============================================================================

function getPublishedDocuments<T extends ContentlayerDocument>(
  docs: T[] = allDocuments as T[]
): T[] {
  return docs
    .filter((doc: T) => !doc?.draft)
    .sort(
      (a: T, b: T) =>
        new Date(b?.date || "").getTime() - new Date(a?.date || "").getTime()
    );
}

function getDocumentsByType<T extends ContentlayerDocument>(type: string): T[] {
  return allDocuments.filter((doc: ContentlayerDocument) => doc.type === type) as T[];
}

function getDocumentBySlug(
  slug: string,
  type?: string
): ContentlayerDocument | undefined {
  const s = String(slug || "").trim();
  if (!s) return undefined;

  const candidates = type
    ? allDocuments.filter((doc: ContentlayerDocument) => doc.type === type)
    : allDocuments;

  return candidates.find((doc: ContentlayerDocument) => normalizeSlug(doc) === s);
}

function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(
    (doc: ContentlayerDocument) => (doc as any).featured === true && !doc?.draft
  );
}

function isContentlayerLoaded(): boolean {
  return Object.keys(contentlayerExports || {}).length > 0;
}

// ============================================================================
// 8. TYPE GUARDS
// ============================================================================

function isPost(doc: ContentlayerDocument): doc is PostDocument {
  return doc.type === "Post";
}

function isBook(doc: ContentlayerDocument): doc is BookDocument {
  return doc.type === "Book";
}

function isDownload(doc: ContentlayerDocument): doc is DownloadDocument {
  return doc.type === "Download";
}

function isEvent(doc: ContentlayerDocument): doc is EventDocument {
  return doc.type === "Event";
}

function isPrint(doc: ContentlayerDocument): doc is PrintDocument {
  return doc.type === "Print";
}

function isResource(doc: ContentlayerDocument): doc is ResourceDocument {
  return doc.type === "Resource";
}

function isStrategy(doc: ContentlayerDocument): doc is StrategyDocument {
  return doc.type === "Strategy";
}

// ============================================================================
// 9. CARD MAPPING FUNCTIONS
// ============================================================================

function mapToBaseCardProps(doc: ContentlayerDocument): any {
  return {
    slug: normalizeSlug(doc),
    href: getDocHref(doc), // helpful for UI consistency
    title: doc.title || "Untitled",
    subtitle: (doc as any).subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    featured: (doc as any).featured || false,
    accessLevel: (doc as any).accessLevel || null,
    lockMessage: (doc as any).lockMessage || null,
    kind: getDocKind(doc),
  };
}

function mapToBookCardProps(doc: BookDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    isbn: doc.isbn || null,
    publisher: doc.publisher || null,
    publishDate: doc.date || null,
  };
}

function mapToBlogPostCardProps(doc: PostDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    readTime: doc.readTime || null,
    category: doc.category || null,
  };
}

function mapToCanonCardProps(doc: CanonDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    volumeNumber: doc.volumeNumber || null,
    readTime: doc.readTime || null,
    order: doc.order || null,
  };
}

// NOTE: getCardPropsForDocument is now defined in @/components/Cards/index.tsx
// This function is kept for backward compatibility
function getCardPropsForDocument(doc: ContentlayerDocument): any {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  return mapToBaseCardProps(doc);
}

// ============================================================================
// 10. TYPE ALIASES
// ============================================================================

type Post = PostDocument;
type Book = BookDocument;
type Download = DownloadDocument;
type Event = EventDocument;
type Print = PrintDocument;
type Resource = ResourceDocument;
type Canon = CanonDocument;
type Strategy = StrategyDocument;

type DocumentTypes =
  | PostDocument
  | BookDocument
  | DownloadDocument
  | EventDocument
  | PrintDocument
  | StrategyDocument
  | ResourceDocument
  | CanonDocument;

type AnyDoc = ContentlayerDocument;
type ContentlayerCardProps = ReturnType<typeof getCardPropsForDocument>;

// ============================================================================
// 11. SINGLE COMPREHENSIVE EXPORT SECTION (NO DUPLICATES)
// ============================================================================

// Export all collections
export {
  allPosts,
  allShorts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allDocuments,
  allContent,
  allPublished,
};

// Export type-specific getters
export {
  getPublishedPosts,
  getPublishedShorts,
  getRecentShorts,
  getShortBySlug,
  getShortUrl,
  getPublicCanon,
  getAllBooks,
  getAllDownloads,
  getAllEvents,
  getAllPrints,
  getAllResources,
  getAllCanons,
  getAllStrategies,
  getPublishedDocumentsByType,
  getCanonIndexItemsFromHelper as getCanonIndexItems,
  getCanonDocBySlugFromHelper as getCanonDocBySlug,
};

// Export routing + normalization + helper functions (ALL IN ONE PLACE)
export {
  getAllContentlayerDocs,
  getDocKind,
  normalizeSlug,
  isDraft,
  getDocHref,
  getDocByHref,
  getBySlugAndKind,
  getDocumentBySlug,
  getDocumentsByType,
  getPublishedDocuments,
  getFeaturedDocuments,
  isContentlayerLoaded,
};

// Export all type guards
export {
  isPost,
  isShort,
  isBook,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isStrategy,
};

// Export all mapping functions (for backward compatibility)
export {
  mapToBaseCardProps,
  mapToBookCardProps,
  mapToBlogPostCardProps,
  mapToCanonCardProps,
  getCardPropsForDocument,
};

// Export all types and interfaces
export type {
  ContentlayerDocument,
  PostDocument,
  ShortDocument,
  BookDocument,
  DownloadDocument,
  EventDocument,
  PrintDocument,
  ResourceDocument,
  CanonDocument,
  StrategyDocument,
  Post,
  Book,
  Download,
  Event,
  Print,
  Resource,
  Canon,
  Strategy,
  DocumentTypes,
  AnyDoc,
  ContentlayerCardProps,
};