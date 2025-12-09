/* eslint-disable @typescript-eslint/no-explicit-any */

// Centralized Contentlayer imports to avoid path resolution issues
import path from "path";

// ============================================================================
// 1. CORE TYPES - FIXED WITH PROPER EXPORTS
// ============================================================================

// Export interfaces WITH export keyword
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
  published?: boolean; // NEW: Added for Short type compatibility
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
  status?: 'published' | 'draft' | 'archived';
  format?: string;
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

// NEW: Short document interface
export interface ShortDocument extends ContentlayerDocument {
  type: "Short";
  theme?: string;
  audience?: string;
  readTime?: string;
  published?: boolean; // Explicitly declared here as well
}

// ============================================================================
// 2. CONTENTLAYER EXPORTS LOADING
// ============================================================================

let contentlayerExports: any = {};

try {
  const generatedPath = path.join(process.cwd(), ".contentlayer", "generated");
  contentlayerExports = require(generatedPath);
} catch (error) {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    console.warn(
      "[contentlayer-helper] .contentlayer/generated not found – using empty exports.",
      error
    );
  }
  contentlayerExports = {};
}

// ============================================================================
// 3. ROBUST COLLECTION GETTERS
// ============================================================================

function safeCastArray<T>(collection: unknown, fallback: T[] = []): T[] {
  if (!Array.isArray(collection)) return fallback;
  return collection as T[];
}

function getCollection<T extends ContentlayerDocument>(
  key: string, 
  fallback: T[] = []
): T[] {
  const collection = contentlayerExports[key];
  return safeCastArray<T>(collection, fallback);
}

// ============================================================================
// 4. COLLECTIONS (EXPORTED)
// ============================================================================

export const allPosts: PostDocument[] = getCollection<PostDocument>("allPosts");
export const allBooks: BookDocument[] = getCollection<BookDocument>("allBooks");
export const allDownloads: DownloadDocument[] = getCollection<DownloadDocument>("allDownloads");
export const allEvents: EventDocument[] = getCollection<EventDocument>("allEvents");
export const allPrints: PrintDocument[] = getCollection<PrintDocument>("allPrints");
export const allStrategies: StrategyDocument[] = getCollection<StrategyDocument>("allStrategies");
export const allResources: ResourceDocument[] = getCollection<ResourceDocument>("allResources");
export const allCanons: CanonDocument[] = getCollection<CanonDocument>("allCanons");
export const allShorts: ShortDocument[] = getCollection<ShortDocument>("allShorts"); // NEW
export const allDocuments: ContentlayerDocument[] = getCollection<ContentlayerDocument>("allDocuments");

export const allContent: ContentlayerDocument[] = [...allDocuments];
export const allPublished: ContentlayerDocument[] = allDocuments.filter(
  (doc: ContentlayerDocument) => !doc.draft && doc.published !== false // UPDATED: Check both draft and published
);

// ============================================================================
// 5. TYPE GUARDS (EXPORTED)
// ============================================================================

export function isPost(doc: ContentlayerDocument): doc is PostDocument {
  return doc.type === "Post";
}

export function isBook(doc: ContentlayerDocument): doc is BookDocument {
  return doc.type === "Book";
}

export function isDownload(doc: ContentlayerDocument): doc is DownloadDocument {
  return doc.type === "Download";
}

export function isEvent(doc: ContentlayerDocument): doc is EventDocument {
  return doc.type === "Event";
}

export function isPrint(doc: ContentlayerDocument): doc is PrintDocument {
  return doc.type === "Print";
}

export function isResource(doc: ContentlayerDocument): doc is ResourceDocument {
  return doc.type === "Resource";
}

export function isCanon(doc: ContentlayerDocument): doc is CanonDocument {
  return doc.type === "Canon";
}

export function isStrategy(doc: ContentlayerDocument): doc is StrategyDocument {
  return doc.type === "Strategy";
}

export function isShort(doc: ContentlayerDocument): doc is ShortDocument { // NEW
  return doc.type === "Short";
}

// ============================================================================
// 6. HELPER FUNCTIONS (EXPORTED) - UPDATED WITH MDX.TS COMPATIBILITY
// ============================================================================

// CRITICAL: These functions are required by mdx.ts
export function getAllContentlayerDocs(): ContentlayerDocument[] {
  return allDocuments;
}

export function getContentlayerDocBySlug(slug: string): ContentlayerDocument | null {
  const doc = getDocumentBySlug(slug);
  return doc || null;
}

export function getPublishedDocuments<T extends ContentlayerDocument>(
  docs: T[] = allDocuments as T[]
): T[] {
  return docs
    .filter((doc: T) => !doc.draft && doc.published !== false) // UPDATED: Check published flag
    .sort(
      (a: T, b: T) =>
        new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
    );
}

export function getDocumentsByType<T extends ContentlayerDocument>(
  type: string
): T[] {
  return allDocuments.filter((doc: ContentlayerDocument) => doc.type === type) as T[];
}

export function getDocumentBySlug(
  slug: string,
  type?: string
): ContentlayerDocument | undefined {
  const candidates = type
    ? allDocuments.filter((doc: ContentlayerDocument) => doc.type === type)
    : allDocuments;

  return candidates.find((doc: ContentlayerDocument) => doc.slug === slug);
}

export function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(
    (doc: ContentlayerDocument) => (doc as any).featured === true && !doc.draft
  );
}

export function isContentlayerLoaded(): boolean {
  return Object.keys(contentlayerExports).length > 0;
}

// NEW: Short-specific helper functions
export function getPublishedShorts(): ShortDocument[] {
  return getPublishedDocuments<ShortDocument>(allShorts);
}

export function getShortBySlug(slug: string): ShortDocument | null {
  return getPublishedShorts().find((short) => short.slug === slug) ?? null;
}

// NEW: convenience for homepage etc - ADDED HERE
export function getLatestShorts(limit: number = 3): ShortDocument[] {
  return getPublishedShorts()
    .slice()
    .sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, limit);
}

// ============================================================================
// 7. CARD MAPPING FUNCTIONS (EXPORTED)
// ============================================================================

export function mapToBaseCardProps(doc: ContentlayerDocument): any {
  return {
    slug: doc.slug,
    title: doc.title || 'Untitled',
    subtitle: (doc as any).subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    featured: (doc as any).featured || false,
    accessLevel: (doc as any).accessLevel || null,
    lockMessage: (doc as any).lockMessage || null,
  };
}

export function mapToBookCardProps(doc: BookDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    isbn: doc.isbn || null,
    publisher: doc.publisher || null,
    publishDate: doc.date || null,
  };
}

export function mapToBlogPostCardProps(doc: PostDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    readTime: doc.readTime || null,
    category: doc.category || null,
  };
}

export function mapToCanonCardProps(doc: CanonDocument): any {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    volumeNumber: doc.volumeNumber || null,
    readTime: doc.readTime || null,
  };
}

export function mapToShortCardProps(doc: ShortDocument): any { // NEW
  return {
    ...mapToBaseCardProps(doc),
    theme: doc.theme || null,
    audience: doc.audience || null,
    readTime: doc.readTime || null,
  };
}

export function getCardPropsForDocument(doc: ContentlayerDocument): any {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  if (isShort(doc)) return mapToShortCardProps(doc); // NEW
  return mapToBaseCardProps(doc);
}

// ============================================================================
// 8. UTILITY FUNCTIONS (EXPORTED)
// ============================================================================

export function getCardFallbackConfig() {
  return {
    defaultImage: '/images/fallback-card.jpg',
    defaultTitle: 'Untitled',
    defaultDescription: 'No description available.',
    defaultTags: [] as string[],
    defaultAuthor: 'Unknown Author',
    defaultAvatar: '/images/default-avatar.jpg',
  };
}

export function getCardImage(
  image: string | null | undefined,
  fallback?: string
): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

// ============================================================================
// 9. TYPE ALIASES (EXPORTED)
// ============================================================================

export type Post = PostDocument;
export type Book = BookDocument;
export type Download = DownloadDocument;
export type Event = EventDocument;
export type Print = PrintDocument;
export type Resource = ResourceDocument;
export type Canon = CanonDocument;
export type Strategy = StrategyDocument;
export type Short = ShortDocument; // NEW

export type DocumentTypes =
  | PostDocument
  | BookDocument
  | DownloadDocument
  | EventDocument
  | PrintDocument
  | StrategyDocument
  | ResourceDocument
  | CanonDocument
  | ShortDocument; // UPDATED: Added ShortDocument

// ============================================================================
// 10. RE-EXPORT FOR BACKWARD COMPATIBILITY
// ============================================================================

// For compatibility with existing imports
export {
  allPosts as posts,
  allBooks as books,
  allCanons as canons,
  allEvents as events,
  allPrints as prints,
  allStrategies as strategies,
  allResources as resources,
  allDownloads as downloads,
  allShorts as shorts, // NEW
};

// ============================================================================
// 11. DEFAULT EXPORT FOR EASY IMPORT
// ============================================================================

// Create a default export object for convenience
const contentlayerHelper = {
  // Collections
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
  allShorts, // NEW
  allDocuments,
  allContent,
  allPublished,
  
  // Type guards
  isPost,
  isBook,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isStrategy,
  isShort, // NEW
  
  // Helper functions
  getAllContentlayerDocs,
  getContentlayerDocBySlug,
  getPublishedDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getFeaturedDocuments,
  isContentlayerLoaded,
  getPublishedShorts, // NEW
  getShortBySlug, // NEW
  getLatestShorts, // NEW: Added here
  
  // Mapping functions
  mapToBaseCardProps,
  mapToBookCardProps,
  mapToBlogPostCardProps,
  mapToCanonCardProps,
  mapToShortCardProps, // NEW
  getCardPropsForDocument,
  
  // Utility functions
  getCardFallbackConfig,
  getCardImage,
  formatCardDate,
};

export default contentlayerHelper;

// ============================================================================
// 12. LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Export everything individually as well (already done above)
// This ensures both named imports and default import work