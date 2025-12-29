/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Single canonical Contentlayer surface.
 * - Runtime comes from: "contentlayer/generated"
 * - Types + utilities exposed for the rest of the app.
 *
 * DO NOT import from ".contentlayer/..." anywhere else.
 */

import * as generated from "contentlayer/generated";

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

export interface ShortDocument extends ContentlayerDocument {
  type: "Short";
  theme?: string;
  audience?: string;
  readTime?: string;
  published?: boolean;
  accessLevel?: string;
  lockMessage?: string;
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

/* -------------------------------------------------------------------------- */
/* Runtime collections                                                        */
/* -------------------------------------------------------------------------- */

const safeArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export const allPosts = safeArray<PostDocument>((generated as any).allPosts);
export const allBooks = safeArray<BookDocument>((generated as any).allBooks);
export const allDownloads = safeArray<DownloadDocument>((generated as any).allDownloads);
export const allEvents = safeArray<EventDocument>((generated as any).allEvents);
export const allPrints = safeArray<PrintDocument>((generated as any).allPrints);
export const allStrategies = safeArray<StrategyDocument>((generated as any).allStrategies);
export const allResources = safeArray<ResourceDocument>((generated as any).allResources);
export const allCanons = safeArray<CanonDocument>((generated as any).allCanons);
export const allShorts = safeArray<ShortDocument>((generated as any).allShorts);

export const allDocuments = safeArray<ContentlayerDocument>((generated as any).allDocuments);

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
  return allDocuments.filter((d) => (d as any)?.featured === true && !d?.draft);
}

export function isContentlayerLoaded(): boolean {
  return (
    allDocuments.length > 0 ||
    Object.keys(generated as any).some((k) => k.startsWith("all") && Array.isArray((generated as any)[k]))
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

function mapToBookCardProps(doc: BookDocument) {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    isbn: doc.isbn || null,
    publisher: doc.publisher || null,
    publishDate: doc.date || null,
  };
}

function mapToBlogPostCardProps(doc: PostDocument) {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    readTime: doc.readTime || null,
    category: doc.category || null,
  };
}

function mapToCanonCardProps(doc: CanonDocument) {
  return {
    ...mapToBaseCardProps(doc),
    author: doc.author || null,
    volumeNumber: doc.volumeNumber || null,
    readTime: doc.readTime || null,
  };
}

function mapToShortCardProps(doc: ShortDocument) {
  return {
    ...mapToBaseCardProps(doc),
    theme: doc.theme || null,
    readTime: doc.readTime || null,
  };
}

export function getCardPropsForDocument(doc: ContentlayerDocument) {
  if (isBook(doc)) return mapToBookCardProps(doc);
  if (isPost(doc)) return mapToBlogPostCardProps(doc);
  if (isCanon(doc)) return mapToCanonCardProps(doc);
  if (isShort(doc)) return mapToShortCardProps(doc);
  return mapToBaseCardProps(doc);
}

export type ContentlayerCardProps = ReturnType<typeof getCardPropsForDocument>;

/**
 * Re-export generated stuff (optional). This keeps other "direct generated" imports working.
 */
export * from "contentlayer/generated";