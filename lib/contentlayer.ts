/* eslint-disable @typescript-eslint/no-explicit-any */

// lib/contentlayer.ts
// Typed wrapper around Contentlayer2 output.
// ✅ avoids relying on contentlayer/generated TS types (which may not exist / mismatch)
// ✅ uses require() to load .contentlayer/generated on Windows safely

import path from "path";

// ----------------------------------------------------------------------------
// Types (what the rest of your app imports)
// ----------------------------------------------------------------------------

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

// Friendly aliases used across your codebase
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
  | ResourceDocument
  | CanonDocument
  | StrategyDocument;

// ----------------------------------------------------------------------------
// Load generated exports
// ----------------------------------------------------------------------------

type GeneratedExports = Record<string, any>;
let generated: GeneratedExports = {};

try {
  const generatedPath = path.join(process.cwd(), ".contentlayer", "generated");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  generated = require(generatedPath) as GeneratedExports;
} catch (error) {
  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    console.warn("[contentlayer] .contentlayer/generated not found – using empty exports.", error);
  }
  generated = {};
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function getCollection<T extends ContentlayerDocument>(key: string): T[] {
  return safeArray<T>(generated[key]);
}

// ----------------------------------------------------------------------------
// Collections
// ----------------------------------------------------------------------------

export const allPosts = getCollection<PostDocument>("allPosts");
export const allBooks = getCollection<BookDocument>("allBooks");
export const allDownloads = getCollection<DownloadDocument>("allDownloads");
export const allEvents = getCollection<EventDocument>("allEvents");
export const allPrints = getCollection<PrintDocument>("allPrints");
export const allStrategies = getCollection<StrategyDocument>("allStrategies");
export const allResources = getCollection<ResourceDocument>("allResources");
export const allCanons = getCollection<CanonDocument>("allCanons");
export const allDocuments = getCollection<ContentlayerDocument>("allDocuments");

export const allContent: ContentlayerDocument[] = [...allDocuments];
export const allPublished: ContentlayerDocument[] = allDocuments.filter((d) => !d.draft);

// ----------------------------------------------------------------------------
// Type guards
// ----------------------------------------------------------------------------

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

export function isContentlayerLoaded(): boolean {
  return Object.keys(generated).length > 0;
}<PASTE THE BLOCK ABOVE HERE EXACTLY>
