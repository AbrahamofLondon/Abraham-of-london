// lib/content-mappers.ts - UPDATED IMPORTS
import type { 
  DocBase 
} from "@/lib/content";

// Define specific types based on DocBase
export interface Post extends DocBase {
  type: "Post";
  readTime?: string;
  category?: string;
}

export interface Book extends DocBase {
  type: "Book";
  author?: string;
  isbn?: string;
  publisher?: string;
}

export interface Canon extends DocBase {
  type: "Canon";
  author?: string;
  volumeNumber?: string | number;
  readTime?: string;
}

export interface Download extends DocBase {
  type: "Download";
  fileSize?: string;
  fileType?: string;
  downloadUrl?: string;
  requiresEmail?: boolean;
}

export interface Resource extends DocBase {
  type: "Resource";
  category?: string;
  downloadUrl?: string;
}

export interface Event extends DocBase {
  type: "Event";
  startDate?: string;
  endDate?: string;
  location?: string;
  registrationUrl?: string;
}

export interface Print extends DocBase {
  type: "Print";
  price?: string;
  dimensions?: string;
  coverImage?: string;
}

// Define strict union of known types + generic fallback
export type AnyDoc =
  | Post
  | Book
  | Download
  | Resource
  | Event
  | Print
  | Canon
  | (Record<string, any> & { type?: string; slug?: string; title?: string });

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

// Export type guards
export function isBook(doc: AnyDoc): doc is Book {
  return doc?.type === "Book";
}

export function isPost(doc: AnyDoc): doc is Post {
  return doc?.type === "Post";
}

export function isCanon(doc: AnyDoc): doc is Canon {
  return doc?.type === "Canon";
}

export function isDownload(doc: AnyDoc): doc is Download {
  return doc?.type === "Download";
}

export function isResource(doc: AnyDoc): doc is Resource {
  return doc?.type === "Resource";
}

export function isEvent(doc: AnyDoc): doc is Event {
  return doc?.type === "Event";
}

export function isPrint(doc: AnyDoc): doc is Print {
  return doc?.type === "Print";
}

export function mapToBaseCardProps(doc: AnyDoc) {
  // Use safe access for all fields since AnyDoc might be a generic record
  const d = doc as any;
  return {
    slug: s(d.slug || d._raw?.flattenedPath),
    title: s(d.title) || "Untitled",
    subtitle: d.subtitle ?? null,
    excerpt: d.excerpt ?? null,
    description: d.description ?? null,
    coverImage: d.coverImage ?? null,
    date: d.date ?? null,
    tags: Array.isArray(d.tags) ? d.tags : [],
    featured: Boolean(d.featured),
    accessLevel: d.accessLevel ?? null,
    lockMessage: d.lockMessage ?? null,
    type: d.type || 'Page', // Ensure type is passed through for UI badges
  };
}

export function mapToBookCardProps(doc: Book) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    author: doc.author ?? null,
    isbn: doc.isbn ?? null,
    publisher: doc.publisher ?? null,
    publishDate: doc.date ?? null,
  };
}

export function mapToBlogPostCardProps(doc: Post) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    author: doc.author ?? null,
    readTime: doc.readTime ?? null,
    category: doc.category ?? null,
  };
}

export function mapToCanonCardProps(doc: Canon) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    author: doc.author ?? null,
    volumeNumber: doc.volumeNumber ?? null,
    readTime: doc.readTime ?? null,
  };
}

export function mapToDownloadCardProps(doc: Download) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    fileSize: doc.fileSize ?? null,
    fileType: doc.fileType ?? null,
    downloadUrl: doc.downloadUrl ?? null,
    requiresEmail: doc.requiresEmail ?? false,
  };
}

export function mapToResourceCardProps(doc: Resource) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    category: doc.category ?? null,
    downloadUrl: doc.downloadUrl ?? null,
  };
}

export function mapToEventCardProps(doc: Event) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    startDate: doc.startDate ?? null,
    endDate: doc.endDate ?? null,
    location: doc.location ?? null,
    registrationUrl: doc.registrationUrl ?? null,
  };
}

export function mapToPrintCardProps(doc: Print) {
  const base = mapToBaseCardProps(doc);
  return {
    ...base,
    price: doc.price ?? null,
    dimensions: doc.dimensions ?? null,
  };
}

export function getCardPropsForDocument(doc: AnyDoc) {
  const t = s((doc as any).type);
  if (t === "Book") return mapToBookCardProps(doc as Book);
  if (t === "Post") return mapToBlogPostCardProps(doc as Post);
  if (t === "Canon") return mapToCanonCardProps(doc as Canon);
  if (t === "Download") return mapToDownloadCardProps(doc as Download);
  if (t === "Resource") return mapToResourceCardProps(doc as Resource);
  if (t === "Event") return mapToEventCardProps(doc as Event);
  if (t === "Print") return mapToPrintCardProps(doc as Print);
  return mapToBaseCardProps(doc);
}

// Export the card props interface
export interface BaseCardProps {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  date: string | null;
  tags: string[];
  featured: boolean;
  accessLevel: string | null;
  lockMessage: string | null;
  type: string;
}

export interface BookCardProps extends BaseCardProps {
  author: string | null;
  isbn: string | null;
  publisher: string | null;
  publishDate: string | null;
}

export interface PostCardProps extends BaseCardProps {
  author: string | null;
  readTime: string | null;
  category: string | null;
}

export interface CanonCardProps extends BaseCardProps {
  author: string | null;
  volumeNumber: string | number | null;
  readTime: string | null;
}

// Create a default export for convenience
const contentMappers = {
  // Type guards
  isBook,
  isPost,
  isCanon,
  isDownload,
  isResource,
  isEvent,
  isPrint,
  
  // Mappers
  mapToBaseCardProps,
  mapToBookCardProps,
  mapToBlogPostCardProps,
  mapToCanonCardProps,
  mapToDownloadCardProps,
  mapToResourceCardProps,
  mapToEventCardProps,
  mapToPrintCardProps,
  getCardPropsForDocument,
  
  // Types
  type: {
    AnyDoc: {} as AnyDoc,
    Post: {} as Post,
    Book: {} as Book,
    Canon: {} as Canon,
    Download: {} as Download,
    Resource: {} as Resource,
    Event: {} as Event,
    Print: {} as Print,
  }
};

export default contentMappers;
