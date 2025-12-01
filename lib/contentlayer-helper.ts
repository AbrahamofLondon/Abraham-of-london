// lib/contentlayer-helper.ts
// Centralized Contentlayer imports to avoid path resolution issues

import type { DocumentGen } from 'contentlayer2/core';

// Use dynamic import for ES modules instead of require()
let contentlayerExports: any = {};

// Initialize asynchronously
try {
  // Use dynamic import for ES modules
  const module = await import('.contentlayer/generated');
  contentlayerExports = module;
} catch (error) {
  console.warn('Contentlayer not available, using empty exports', error);
}

// Define proper TypeScript interfaces
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
  type: 'Post';
}

export interface BookDocument extends ContentlayerDocument {
  type: 'Book';
}

export interface DownloadDocument extends ContentlayerDocument {
  type: 'Download';
}

export interface PrintDocument extends ContentlayerDocument {
  type: 'Print';
  available?: boolean;
}

export interface ResourceDocument extends ContentlayerDocument {
  type: 'Resource';
}

export interface CanonDocument extends ContentlayerDocument {
  type: 'Canon';
  featured?: boolean;
  order?: number;
  subtitle?: string;
  volumeNumber?: number;
}

export interface EventDocument extends ContentlayerDocument {
  type: 'Event';
  eventDate?: string;
  location?: string;
}

export interface StrategyDocument extends ContentlayerDocument {
  type: 'Strategy';
  category?: string;
}

// Safe collection getters with proper typing
function safeGetCollection<T>(collection: T[] | undefined, fallback: T[] = []): T[] {
  return Array.isArray(collection) ? collection : fallback;
}

// Export all collections with proper typing and safe access
export const allPosts: PostDocument[] = safeGetCollection(contentlayerExports.allPosts);
export const allBooks: BookDocument[] = safeGetCollection(contentlayerExports.allBooks);
export const allDownloads: DownloadDocument[] = safeGetCollection(contentlayerExports.allDownloads);
export const allEvents: EventDocument[] = safeGetCollection(contentlayerExports.allEvents);
export const allPrints: PrintDocument[] = safeGetCollection(contentlayerExports.allPrints);
export const allStrategies: StrategyDocument[] = safeGetCollection(contentlayerExports.allStrategies);
export const allResources: ResourceDocument[] = safeGetCollection(contentlayerExports.allResources);
export const allCanons: CanonDocument[] = safeGetCollection(contentlayerExports.allCanons);
export const allDocuments: ContentlayerDocument[] = safeGetCollection(contentlayerExports.allDocuments);

// Helper to get all non-draft documents
export function getPublishedDocuments(): ContentlayerDocument[] {
  return allDocuments.filter(doc => !doc.draft);
}

// Export types
export type Post = PostDocument;
export type Book = BookDocument;
export type Download = DownloadDocument;
export type Event = EventDocument;
export type Print = PrintDocument;
export type Strategy = StrategyDocument;
export type Resource = ResourceDocument;
export type Canon = CanonDocument;
export type DocumentTypes = 
  | PostDocument 
  | BookDocument 
  | DownloadDocument 
  | EventDocument 
  | PrintDocument 
  | StrategyDocument 
  | ResourceDocument 
  | CanonDocument;