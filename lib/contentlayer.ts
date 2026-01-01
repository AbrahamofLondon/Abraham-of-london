/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Single canonical Contentlayer surface.
 * - Runtime data: Loaded safely via require() to prevent crashes.
 * - Types: Defined locally to prevent "Chicken & Egg" build errors.
 */

// 1. DEFINE LOCAL TYPES (Breaks dependency on unbuilt files)
export interface ContentlayerDocument {
  _id: string;
  _raw: {
    flattenedPath: string;
    sourceFileName: string;
    sourceFilePath: string;
    contentType: string;
  };
  type: string;
  slug?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  excerpt?: string;
  date?: string;
  coverImage?: string;
  coverimage?: string; // Legacy support
  tags?: string[];
  draft?: boolean;
  featured?: boolean;
  accessLevel?: string;
  lockMessage?: string;
  author?: string;
  category?: string;
  readTime?: string;
  [key: string]: any;
}

// Specific Type Interfaces
export interface Post extends ContentlayerDocument { type: 'Post'; }
export interface Book extends ContentlayerDocument { 
  type: 'Book'; 
  isbn?: string; 
  publisher?: string; 
}
export interface Download extends ContentlayerDocument { 
  type: 'Download'; 
  file?: string; 
  downloadUrl?: string; 
  fileSize?: string;
}
export interface Canon extends ContentlayerDocument { 
  type: 'Canon'; 
  volumeNumber?: number | string; 
  order?: number; 
}
export interface Event extends ContentlayerDocument { 
  type: 'Event'; 
  eventDate?: string; 
  location?: string; 
}
export interface Short extends ContentlayerDocument { type: 'Short'; theme?: string; }
export interface Print extends ContentlayerDocument { type: 'Print'; price?: string; available?: boolean; }
export interface Strategy extends ContentlayerDocument { type: 'Strategy'; }
export interface Resource extends ContentlayerDocument { type: 'Resource'; resourceType?: string; }

// Union Type
export type DocumentTypes = 
  | Post | Book | Download | Canon | Event | Short | Print | Strategy | Resource;

// Export Aliases for legacy files
export type PostDocument = Post;
export type BookDocument = Book;
export type DownloadDocument = Download;
export type CanonDocument = Canon;
export type EventDocument = Event;
export type ShortDocument = Short;
export type PrintDocument = Print;
export type StrategyDocument = Strategy;
export type ResourceDocument = Resource;

/* -------------------------------------------------------------------------- */
/* Runtime collections (Safe Loading)                                         */
/* -------------------------------------------------------------------------- */

const safeArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// Dynamic import holder
let generatedContent: any = {};

// Try to load content, fail silently if not built yet
if (process.env.DISABLE_CONTENTLAYER !== 'true') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    generatedContent = require(".contentlayer/generated");
  } catch (error) {
    // console.warn("⚠️ Contentlayer not built. Running in bootstrap mode.");
    generatedContent = {};
  }
}

// 3. EXPORT DATA COLLECTIONS (With type casting)
export const allPosts = safeArray<Post>(generatedContent.allPosts);
export const allBooks = safeArray<Book>(generatedContent.allBooks);
export const allDownloads = safeArray<Download>(generatedContent.allDownloads);
export const allEvents = safeArray<Event>(generatedContent.allEvents);
export const allPrints = safeArray<Print>(generatedContent.allPrints);
export const allStrategies = safeArray<Strategy>(generatedContent.allStrategies);
export const allResources = safeArray<Resource>(generatedContent.allResources);
export const allCanons = safeArray<Canon>(generatedContent.allCanons);
export const allShorts = safeArray<Short>(generatedContent.allShorts);

export const allDocuments = safeArray<ContentlayerDocument>(generatedContent.allDocuments);

/* -------------------------------------------------------------------------- */
/* Type guards                                                                */
/* -------------------------------------------------------------------------- */

export function isPost(doc: any): doc is Post { return doc?.type === "Post"; }
export function isBook(doc: any): doc is Book { return doc?.type === "Book"; }
export function isDownload(doc: any): doc is Download { return doc?.type === "Download"; }
export function isEvent(doc: any): doc is Event { return doc?.type === "Event"; }
export function isPrint(doc: any): doc is Print { return doc?.type === "Print"; }
export function isResource(doc: any): doc is Resource { return doc?.type === "Resource"; }
export function isCanon(doc: any): doc is Canon { return doc?.type === "Canon"; }
export function isStrategy(doc: any): doc is Strategy { return doc?.type === "Strategy"; }
export function isShort(doc: any): doc is Short { return doc?.type === "Short"; }

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function getPublishedDocuments<T extends ContentlayerDocument>(docs: T[] = allDocuments as T[]): T[] {
  return docs
    .filter((d) => d && !d.draft)
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
}

export function getDocumentBySlug(slug: string): ContentlayerDocument | undefined {
  return allDocuments.find((d) => d._raw.flattenedPath.split('/').pop() === slug || d.slug === slug);
}

/* -------------------------------------------------------------------------- */
/* UI UTILITIES                                                               */
/* -------------------------------------------------------------------------- */

export function getCardFallbackConfig() {
  return {
    defaultImage: "/assets/images/placeholder.jpg",
    defaultTitle: "Untitled",
    defaultDescription: "No description available.",
    defaultTags: [] as string[],
    defaultAuthor: "Unknown Author",
    defaultAvatar: "/assets/images/avatar.jpg",
  };
}

export function getCardImage(image: string | null | undefined, fallback?: string): string {
  if (!image) return fallback || getCardFallbackConfig().defaultImage;
  return image;
}

export function formatCardDate(dateString: string | null | undefined): string {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return "";
  }
}

export function getCardPropsForDocument(doc: ContentlayerDocument) {
  // Base properties available on all documents
  const base = {
    slug: doc.slug || doc._raw.flattenedPath.split('/').pop() || "unknown",
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || null,
    // Ensure both description AND excerpt are available
    description: doc.description || null,
    excerpt: doc.excerpt || doc.description || null,
    coverImage: doc.coverImage || doc.coverimage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    type: doc.type,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    author: doc.author || null,
    category: doc.category || null,
    readTime: doc.readTime || null,
  };

  // Add specific fields based on type
  if (isCanon(doc)) {
    return { ...base, volumeNumber: doc.volumeNumber, order: doc.order };
  }
  if (isBook(doc)) {
    return { ...base, isbn: doc.isbn, publisher: doc.publisher };
  }
  if (isEvent(doc)) {
    return { ...base, eventDate: doc.eventDate, location: doc.location };
  }
  if (isPrint(doc)) {
    return { ...base, price: doc.price, available: doc.available };
  }
  
  return base;
}