/* lib/contentlayer/index.ts - COMPLETE FIX */
// Re-export everything from contentlayer-helper
export * from "../contentlayer-helper";

// Export from data.ts
export { getContentlayerData } from "./data";

// Import and re-export types from contentlayer-helper
import type { ContentDoc, DocKind } from "../contentlayer-helper";
export type { ContentDoc, DocKind };

// Re-export document types from ContentLayer
export type { Post, Book, Download, Event, Print, Resource, Strategy, Canon, Short } from '@/contentlayer/generated/types';

// Define and export the missing functions that CardDisplay needs
export const isPost = (doc: any): boolean => doc.type === "Post";
export const isBook = (doc: any): boolean => doc.type === "Book";
export const isCanon = (doc: any): boolean => doc.type === "Canon";
export const isDownload = (doc: any): boolean => doc.type === "Download";
export const isEvent = (doc: any): boolean => doc.type === "Event";
export const isPrint = (doc: any): boolean => doc.type === "Print";
export const isResource = (doc: any): boolean => doc.type === "Resource";
export const isStrategy = (doc: any): boolean => doc.type === "Strategy";

// For backward compatibility
export type DocumentTypes = ContentDoc;

// Card display helpers
export const getCardPropsForDocument = (doc: ContentDoc) => ({
  title: doc.title || "Untitled",
  subtitle: doc.subtitle,
  excerpt: doc.excerpt,
  description: doc.description,
  coverImage: doc.coverImage,
  date: doc.date,
  tags: doc.tags || [],
  slug: doc.slug || "",
});

export const formatCardDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export const getCardImage = (coverImage: string | null | undefined, fallback: string): string => {
  return coverImage || fallback;
};

// Import the actual ContentHelper
import ContentHelper from "../contentlayer-helper";
import { getContentlayerData } from "./data";

const DefaultExport = {
  ...ContentHelper,
  getContentlayerData,
  // Add all the functions we defined above
  isPost,
  isBook,
  isCanon,
  isDownload,
  isEvent,
  isPrint,
  isResource,
  isStrategy,
  getCardPropsForDocument,
  formatCardDate,
  getCardImage,
  ContentDoc: {} as ContentDoc, // For type-only, this won't be used at runtime
  DocumentTypes: {} as DocumentTypes, // For type-only
};

export default DefaultExport;