/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Single canonical Contentlayer surface.
 * - Runtime comes from: ".contentlayer/generated"
 * - Types + utilities exposed for the rest of the app.
 *
 * DO NOT import from ".contentlayer/..." anywhere else.
 */

import type * as generatedTypes from "contentlayer/generated";

/* -------------------------------------------------------------------------- */
/* Core types                                                                 */
/* -------------------------------------------------------------------------- */

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
  body?: {
    raw?: string;
    code?: string;
  };
  // Common optional fields for all document types
  featured?: boolean;
  subtitle?: string;
  author?: string;
  accessLevel?: string;
  lockMessage?: string;
  category?: string;
  readTime?: string;
}

export interface PostDocument extends ContentlayerDocument {
  type: "Post";
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
  status?: "published" | "draft" | "archived";
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
  featured?: boolean;
}

export interface PrintDocument extends ContentlayerDocument {
  type: "Print";
  dimensions?: string;
  price?: string;
  available?: boolean;
  downloadFile?: string;
  accessLevel?: string;
  lockMessage?: string;
  featured?: boolean;
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
  featured?: boolean;
}

export interface StrategyDocument extends ContentlayerDocument {
  type: "Strategy";
  category?: string;
  author?: string;
  accessLevel?: string;
  lockMessage?: string;
  featured?: boolean;
}

export interface ShortDocument extends ContentlayerDocument {
  type: "Short";
  theme?: string;
  audience?: string;
  readTime?: string;
  published?: boolean;
  accessLevel?: string;
  lockMessage?: string;
  featured?: boolean;
}

export type DocumentTypes =
  | PostDocument
  | BookDocument
  | DownloadDocument
  | EventDocument
  | PrintDocument
  | StrategyDocument
  | ResourceDocument
  | CanonDocument
  | ShortDocument;

// ============================================
// EXPORT ALIASES FOR LEGACY COMPATIBILITY
// ============================================
export type Post = PostDocument;
export type Book = BookDocument;
export type Canon = CanonDocument;
export type Download = DownloadDocument;
export type Event = EventDocument;
export type Print = PrintDocument;
export type Resource = ResourceDocument;
export type Strategy = StrategyDocument;
export type Short = ShortDocument;

/* -------------------------------------------------------------------------- */
/* Runtime collections                                                        */
/* -------------------------------------------------------------------------- */

const safeArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// Dynamic import that works with Contentlayer's generation process
let generatedContent: any = { allDocuments: [] };
if (process.env.DISABLE_CONTENTLAYER !== 'true') {
  try {
    generatedContent = await import(".contentlayer/generated");
  } catch (error) {
    console.warn("Contentlayer not built yet. Run 'contentlayer build' first.");
  }
}

export const allPosts = safeArray<PostDocument>(generatedContent.allPosts);
export const allBooks = safeArray<BookDocument>(generatedContent.allBooks);
export const allDownloads = safeArray<DownloadDocument>(generatedContent.allDownloads);
export const allEvents = safeArray<EventDocument>(generatedContent.allEvents);
export const allPrints = safeArray<PrintDocument>(generatedContent.allPrints);
export const allStrategies = safeArray<StrategyDocument>(generatedContent.allStrategies);
export const allResources = safeArray<ResourceDocument>(generatedContent.allResources);
export const allCanons = safeArray<CanonDocument>(generatedContent.allCanons);
export const allShorts = safeArray<ShortDocument>(generatedContent.allShorts);

export const allDocuments = safeArray<ContentlayerDocument>(generatedContent.allDocuments);

export const allContent: ContentlayerDocument[] = [...allDocuments];
export const allPublished: ContentlayerDocument[] = allDocuments.filter((d) => !d?.draft);

/* -------------------------------------------------------------------------- */
/* Type guards                                                                */
/* -------------------------------------------------------------------------- */

export function isPost(doc: any): doc is PostDocument {
  return doc?.type === "Post";
}
export function isBook(doc: any): doc is BookDocument {
  return doc?.type === "Book";
}
export function isDownload(doc: any): doc is DownloadDocument {
  return doc?.type === "Download";
}
export function isEvent(doc: any): doc is EventDocument {
  return doc?.type === "Event";
}
export function isPrint(doc: any): doc is PrintDocument {
  return doc?.type === "Print";
}
export function isResource(doc: any): doc is ResourceDocument {
  return doc?.type === "Resource";
}
export function isCanon(doc: any): doc is CanonDocument {
  return doc?.type === "Canon";
}
export function isStrategy(doc: any): doc is StrategyDocument {
  return doc?.type === "Strategy";
}
export function isShort(doc: any): doc is ShortDocument {
  return doc?.type === "Short";
}

/* -------------------------------------------------------------------------- */
/* Basic helper functions                                                     */
/* -------------------------------------------------------------------------- */

export function getPublishedDocuments<T extends ContentlayerDocument>(docs: T[] = allDocuments as T[]): T[] {
  return [...docs]
    .filter((d) => d && !d.draft)
    .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime());
}

export function getDocumentsByType<T extends ContentlayerDocument>(type: string): T[] {
  return allDocuments.filter((d) => d?.type === type) as T[];
}

export function getDocumentBySlug(slug: string, type?: string): ContentlayerDocument | undefined {
  const candidates = type ? allDocuments.filter((d) => d?.type === type) : allDocuments;
  return candidates.find((d) => d?.slug === slug);
}

export function getFeaturedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter((d) => d?.featured === true && !d?.draft);
}

export function isContentlayerLoaded(): boolean {
  return (
    allDocuments.length > 0 ||
    Object.keys(generatedContent).some((k) => k.startsWith("all") && Array.isArray(generatedContent[k]))
  );
}

/* -------------------------------------------------------------------------- */
/* Card mapping + utilities                                                   */
/* -------------------------------------------------------------------------- */

export function getCardFallbackConfig() {
  return {
    defaultImage: "/images/fallback-card.jpg",
    defaultTitle: "Untitled",
    defaultDescription: "No description available.",
    defaultTags: [] as string[],
    defaultAuthor: "Unknown Author",
    defaultAvatar: "/images/default-avatar.jpg",
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

function mapToBaseCardProps(doc: ContentlayerDocument) {
  return {
    slug: doc.slug,
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    featured: doc.featured || false,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    category: doc.category || null,
    readTime: doc.readTime || null,
    author: doc.author || null,
  };
}

function mapToBookCardProps(doc: BookDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    isbn: doc.isbn || null,
    publisher: doc.publisher || null,
    format: doc.format || null,
    status: doc.status || null,
  };
}

function mapToBlogPostCardProps(doc: PostDocument) {
  return mapToBaseCardProps(doc);
}

function mapToCanonCardProps(doc: CanonDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    volumeNumber: doc.volumeNumber || null,
    coverAspect: doc.coverAspect || null,
    coverFit: doc.coverFit || null,
    order: doc.order || null,
  };
}

function mapToShortCardProps(doc: ShortDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    theme: doc.theme || null,
    audience: doc.audience || null,
  };
}

function mapToDownloadCardProps(doc: DownloadDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    file: doc.file || null,
    pdfPath: doc.pdfPath || null,
    downloadFile: doc.downloadFile || null,
    fileUrl: doc.fileUrl || null,
    downloadUrl: doc.downloadUrl || null,
    fileSize: doc.fileSize || null,
  };
}

function mapToPrintCardProps(doc: PrintDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    dimensions: doc.dimensions || null,
    price: doc.price || null,
    available: doc.available || null,
    downloadFile: doc.downloadFile || null,
  };
}

function mapToEventCardProps(doc: EventDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    eventDate: doc.eventDate || null,
    time: doc.time || null,
    location: doc.location || null,
    registrationUrl: doc.registrationUrl || null,
    isUpcoming: doc.isUpcoming || null,
  };
}

function mapToResourceCardProps(doc: ResourceDocument) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    resourceType: doc.resourceType || null,
  };
}

function mapToStrategyCardProps(doc: StrategyDocument) {
  return mapToBaseCardProps(doc);
}

export function getCardPropsForDocument(doc: ContentlayerDocument) {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  if (isShort(doc)) return mapToShortCardProps(doc);
  if (isDownload(doc)) return mapToDownloadCardProps(doc);
  if (isPrint(doc)) return mapToPrintCardProps(doc);
  if (isEvent(doc)) return mapToEventCardProps(doc);
  if (isResource(doc)) return mapToResourceCardProps(doc);
  if (isStrategy(doc)) return mapToStrategyCardProps(doc);
  return mapToBaseCardProps(doc);
}

export type ContentlayerCardProps = ReturnType<typeof getCardPropsForDocument>;

/**
 * Re-export generated stuff (optional). This keeps other "direct generated" imports working.
 */
export * from "contentlayer/generated";