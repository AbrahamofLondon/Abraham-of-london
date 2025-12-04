/* eslint-disable @typescript-eslint/no-explicit-any */

// Centralized Contentlayer imports to avoid path resolution issues

import path from "path";

// ============================================================================
// 1. CORE TYPES
// ============================================================================

export interface ContentlayerDocument {
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

export interface PostDocument extends ContentlayerDocument {
  type: "Post";
  category?: string;
  author?: string;
  readTime?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

export interface BookDocument extends ContentlayerDocument {
  type: "Book";
  subtitle?: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

export interface DownloadDocument extends ContentlayerDocument {
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

export interface PrintDocument extends ContentlayerDocument {
  type: "Print";
  dimensions?: string;
  price?: string;
  available?: boolean;
  downloadFile?: string;
  accessLevel?: string;
  lockMessage?: string;
}

export interface ResourceDocument extends ContentlayerDocument {
  type: "Resource";
  resourceType?: string;
  author?: string;
  fileUrl?: string;
  downloadUrl?: string;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

export interface CanonDocument extends ContentlayerDocument {
  type: "Canon";
  subtitle?: string;
  author?: string;
  coverAspect?: string;
  coverFit?: string;
  // comes out of Contentlayer as string, but we allow number for safety
  volumeNumber?: string | number;
  order?: number;
  featured?: boolean;
  readTime?: string;
  accessLevel?: string;
  lockMessage?: string;
}

export interface EventDocument extends ContentlayerDocument {
  type: "Event";
  eventDate?: string;
  time?: string;
  location?: string;
  registrationUrl?: string;
  isUpcoming?: boolean;
  accessLevel?: string;
  lockMessage?: string;
}

export interface StrategyDocument extends ContentlayerDocument {
  type: "Strategy";
  category?: string;
  author?: string;
  accessLevel?: string;
  lockMessage?: string;
}

// ============================================================================
// 2. CONTENTLAYER EXPORTS LOADING (SYNCHRONOUS)
// ============================================================================

let contentlayerExports: any = {};

try {
  // Resolve .contentlayer/generated from project root, not from compiled file location
  const generatedPath = path.join(process.cwd(), ".contentlayer", "generated");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  contentlayerExports = require(generatedPath);
} catch (error) {
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    // Helpful, but non-fatal
    // eslint-disable-next-line no-console
    console.warn(
      "[contentlayer-helper] .contentlayer/generated not found – using empty exports.",
      "This is normal during the first build or if content hasn't been generated yet.",
      error
    );
  }
  contentlayerExports = {};
}

// ============================================================================
// 3. SAFE COLLECTION GETTERS
// ============================================================================

function safeGetCollection<T>(
  collection: T[] | undefined,
  fallback: T[] = []
): T[] {
  return Array.isArray(collection) ? collection : fallback;
}

function getCollection<T>(key: string, fallback: T[] = []): T[] {
  const collection = contentlayerExports[key];
  return safeGetCollection(collection, fallback);
}

// ============================================================================
// 4. EXPORTED COLLECTIONS
// ============================================================================

export const allPosts: PostDocument[] = getCollection("allPosts");
export const allBooks: BookDocument[] = getCollection("allBooks");
export const allDownloads: DownloadDocument[] = getCollection("allDownloads");
export const allEvents: EventDocument[] = getCollection("allEvents");
export const allPrints: PrintDocument[] = getCollection("allPrints");
export const allStrategies: StrategyDocument[] = getCollection("allStrategies");
export const allResources: ResourceDocument[] = getCollection("allResources");
export const allCanons: CanonDocument[] = getCollection("allCanons");
export const allDocuments: ContentlayerDocument[] = getCollection(
  "allDocuments"
);

// Combined collections for convenience
export const allContent = [...allDocuments];
export const allPublished = getCollection("allDocuments").filter(
  (doc) => !doc.draft
);

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Get all non-draft documents sorted by date (newest first)
 */
export function getPublishedDocuments<T extends ContentlayerDocument>(
  docs: T[] = allDocuments
): T[] {
  return docs
    .filter((doc) => !doc.draft)
    .sort(
      (a, b) =>
        new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
    );
}

/**
 * Get documents by type
 */
export function getDocumentsByType<T extends ContentlayerDocument>(
  type: T["type"]
): T[] {
  return allDocuments.filter((doc) => doc.type === type) as T[];
}

/**
 * Find document by slug
 */
export function getDocumentBySlug(
  slug: string,
  type?: string
): ContentlayerDocument | undefined {
  const candidates = type
    ? allDocuments.filter((doc) => doc.type === type)
    : allDocuments;

  return candidates.find((doc) => doc.slug === slug);
}

/**
 * Get featured documents
 */
export function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(
    (doc) => (doc as any).featured === true && !doc.draft
  );
}

/**
 * Check if contentlayer is properly loaded
 */
export function isContentlayerLoaded(): boolean {
  return Object.keys(contentlayerExports).length > 0;
}

// ============================================================================
// 6. TYPE EXPORTS (for convenience)
// ============================================================================

export type Post = PostDocument;
export type Book = BookDocument;
export type Download = DownloadDocument;
export type Event = EventDocument;
export type Print = PrintDocument;
export type Resource = ResourceDocument;
export type Canon = CanonDocument;
export type Strategy = StrategyDocument;

export type DocumentTypes =
  | PostDocument
  | BookDocument
  | DownloadDocument
  | EventDocument
  | PrintDocument
  | StrategyDocument
  | ResourceDocument
  | CanonDocument;

// Type guard helpers
export function isPost(doc: ContentlayerDocument): doc is PostDocument {
  return doc.type === "Post";
}

export function isBook(doc: ContentlayerDocument): doc is BookDocument {
  return doc.type === "Book";
}

export function isDownload(
  doc: ContentlayerDocument
): doc is DownloadDocument {
  return doc.type === "Download";
}

export function isEvent(doc: ContentlayerDocument): doc is EventDocument {
  return doc.type === "Event";
}

export function isPrint(doc: ContentlayerDocument): doc is PrintDocument {
  return doc.type === "Print";
}

export function isResource(
  doc: ContentlayerDocument
): doc is ResourceDocument {
  return doc.type === "Resource";
}

export function isCanon(doc: ContentlayerDocument): doc is CanonDocument {
  return doc.type === "Canon";
}

export function isStrategy(
  doc: ContentlayerDocument
): doc is StrategyDocument {
  return doc.type === "Strategy";
}