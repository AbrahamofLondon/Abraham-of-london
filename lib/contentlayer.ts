/* eslint-disable @typescript-eslint/no-explicit-any */

// Centralized Contentlayer imports to avoid path resolution issues
import path from "path";

// ============================================================================
// 1. CORE TYPES
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
  // comes out of Contentlayer as string, but we allow number for safety
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
// 4. COLLECTIONS (NOT EXPORTED YET)
// ============================================================================

const allPosts: PostDocument[] = getCollection("allPosts");
const allBooks: BookDocument[] = getCollection("allBooks");
const allDownloads: DownloadDocument[] = getCollection("allDownloads");
const allEvents: EventDocument[] = getCollection("allEvents");
const allPrints: PrintDocument[] = getCollection("allPrints");
const allStrategies: StrategyDocument[] = getCollection("allStrategies");
const allResources: ResourceDocument[] = getCollection("allResources");
const allCanons: CanonDocument[] = getCollection("allCanons");
const allDocuments: ContentlayerDocument[] = getCollection("allDocuments");

// Combined collections for convenience
const allContent = [...allDocuments];
const allPublished = getCollection("allDocuments").filter(
  (doc) => !doc.draft
);

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

/**
 * Get all non-draft documents sorted by date (newest first)
 */
function getPublishedDocuments<T extends ContentlayerDocument>(
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
function getDocumentsByType<T extends ContentlayerDocument>(
  type: T["type"]
): T[] {
  return allDocuments.filter((doc) => doc.type === type) as T[];
}

/**
 * Find document by slug
 */
function getDocumentBySlug(
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
function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(
    (doc) => (doc as any).featured === true && !doc.draft
  );
}

/**
 * Check if contentlayer is properly loaded
 */
function isContentlayerLoaded(): boolean {
  return Object.keys(contentlayerExports).length > 0;
}

// ============================================================================
// 6. TYPE GUARD HELPERS
// ============================================================================

function isPost(doc: ContentlayerDocument): doc is PostDocument {
  return doc.type === "Post";
}

function isBook(doc: ContentlayerDocument): doc is BookDocument {
  return doc.type === "Book";
}

function isDownload(
  doc: ContentlayerDocument
): doc is DownloadDocument {
  return doc.type === "Download";
}

function isEvent(doc: ContentlayerDocument): doc is EventDocument {
  return doc.type === "Event";
}

function isPrint(doc: ContentlayerDocument): doc is PrintDocument {
  return doc.type === "Print";
}

function isResource(
  doc: ContentlayerDocument
): doc is ResourceDocument {
  return doc.type === "Resource";
}

function isCanon(doc: ContentlayerDocument): doc is CanonDocument {
  return doc.type === "Canon";
}

function isStrategy(
  doc: ContentlayerDocument
): doc is StrategyDocument {
  return doc.type === "Strategy";
}

// ============================================================================
// 7. CARD COMPONENT MAPPING FUNCTIONS
// ============================================================================

function mapToBaseCardProps(doc: ContentlayerDocument): any {
  return {
    slug: doc.slug,
    title: doc.title || 'Untitled',
    subtitle: doc.subtitle || null,
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

// Helper to get the right card props for any document
function getCardPropsForDocument(doc: ContentlayerDocument): any {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  return mapToBaseCardProps(doc);
}

// ============================================================================
// 8. UTILITY FUNCTIONS FOR CARDS
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
// 9. TYPE EXPORTS FOR CONVENIENCE
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
// 10. COMPLETE EXPORT FOR ALL NEEDED FUNCTIONS AND TYPES
// ============================================================================

// Export all mapping functions
export {
  mapToBaseCardProps,
  mapToBookCardProps,
  mapToBlogPostCardProps,
  mapToCanonCardProps,
  getCardPropsForDocument,
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

// Export all helper functions
export {
  getPublishedDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getFeaturedDocuments,
  isContentlayerLoaded,
  getCardFallbackConfig,
  getCardImage,
  formatCardDate,
};

// Export all types
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