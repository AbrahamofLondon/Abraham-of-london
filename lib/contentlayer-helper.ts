/* eslint-disable @typescript-eslint/no-explicit-any */

// Centralized Contentlayer imports to avoid path resolution issues
import path from "path";

// ============================================================================
// 1. CORE TYPES - DECLARED WITHOUT EXPORT
// ============================================================================

// Declare interfaces WITHOUT export keyword
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

interface BookDocument extends ContentlayerDocument {
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
// 4. COLLECTIONS (DECLARED)
// ============================================================================

const allPosts: PostDocument[] = getCollection<PostDocument>("allPosts");
const allBooks: BookDocument[] = getCollection<BookDocument>("allBooks");
const allDownloads: DownloadDocument[] = getCollection<DownloadDocument>("allDownloads");
const allEvents: EventDocument[] = getCollection<EventDocument>("allEvents");
const allPrints: PrintDocument[] = getCollection<PrintDocument>("allPrints");
const allStrategies: StrategyDocument[] = getCollection<StrategyDocument>("allStrategies");
const allResources: ResourceDocument[] = getCollection<ResourceDocument>("allResources");
const allCanons: CanonDocument[] = getCollection<CanonDocument>("allCanons");
const allDocuments: ContentlayerDocument[] = getCollection<ContentlayerDocument>("allDocuments");

const allContent: ContentlayerDocument[] = [...allDocuments];
const allPublished: ContentlayerDocument[] = allDocuments.filter(
  (doc: ContentlayerDocument) => !doc.draft
);

// ============================================================================
// 5. TYPE GUARDS (DECLARED)
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

function isCanon(doc: ContentlayerDocument): doc is CanonDocument {
  return doc.type === "Canon";
}

function isStrategy(doc: ContentlayerDocument): doc is StrategyDocument {
  return doc.type === "Strategy";
}

// ============================================================================
// 6. HELPER FUNCTIONS (DECLARED)
// ============================================================================

function getPublishedDocuments<T extends ContentlayerDocument>(
  docs: T[] = allDocuments as T[]
): T[] {
  return docs
    .filter((doc: T) => !doc.draft)
    .sort(
      (a: T, b: T) =>
        new Date(b.date || "").getTime() - new Date(a.date || "").getTime()
    );
}

function getDocumentsByType<T extends ContentlayerDocument>(
  type: string
): T[] {
  return allDocuments.filter((doc: ContentlayerDocument) => doc.type === type) as T[];
}

function getDocumentBySlug(
  slug: string,
  type?: string
): ContentlayerDocument | undefined {
  const candidates = type
    ? allDocuments.filter((doc: ContentlayerDocument) => doc.type === type)
    : allDocuments;

  return candidates.find((doc: ContentlayerDocument) => doc.slug === slug);
}

function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(
    (doc: ContentlayerDocument) => (doc as any).featured === true && !doc.draft
  );
}

function isContentlayerLoaded(): boolean {
  return Object.keys(contentlayerExports).length > 0;
}

// ============================================================================
// 7. CARD MAPPING FUNCTIONS (DECLARED)
// ============================================================================

function mapToBaseCardProps(doc: ContentlayerDocument): any {
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
  };
}

function getCardPropsForDocument(doc: ContentlayerDocument): any {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  return mapToBaseCardProps(doc);
}

// ============================================================================
// 8. UTILITY FUNCTIONS (DECLARED)
// ============================================================================

function getCardFallbackConfig() {
  return {
    defaultImage: '/images/fallback-card.jpg',
    defaultTitle: 'Untitled',
    defaultDescription: 'No description available.',
    defaultTags: [] as string[],
    defaultAuthor: 'Unknown Author',
    defaultAvatar: '/images/default-avatar.jpg',
  };
}

function getCardImage(
  image: string | null | undefined,
  fallback?: string
): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

function formatCardDate(dateString: string | null | undefined): string {
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
// 9. TYPE ALIASES (DECLARED)
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

// ============================================================================
// 10. SINGLE COMPREHENSIVE EXPORT SECTION
// ============================================================================

// Export all collections
export {
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allStrategies,
  allResources,
  allCanons,
  allDocuments,
  allContent,
  allPublished,
};

// Export all type guards
export {
  isPost,
  isBook,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isCanon,
  isStrategy,
};

// Export all helper functions
export {
  getPublishedDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getFeaturedDocuments,
  isContentlayerLoaded,
};

// Export all mapping functions
export {
  mapToBaseCardProps,
  mapToBookCardProps,
  mapToBlogPostCardProps,
  mapToCanonCardProps,
  getCardPropsForDocument,
};

// Export all utility functions
export {
  getCardFallbackConfig,
  getCardImage,
  formatCardDate,
};

// Export all types and interfaces
export type {
  ContentlayerDocument,
  PostDocument,
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
};