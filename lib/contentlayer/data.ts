import { safeSlice } from "@/lib/utils/safe";

// lib/contentlayer/data.ts
/**
 * ContentLayer data export for build-time usage
 * This file provides the getContentlayerData function that pages need during build
 */

// Import REAL data from your contentlayer-generated files
import { 
  allDocuments,
  allPosts,
  allBooks,
  allDownloads,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allCanons,
  allShorts
} from '@/lib/contentlayer-generated';

// Import document types from your contentlayer config
import type { 
  Post, Book, Download, Event, Print, Resource, Strategy, Canon, Short 
} from '@/contentlayer/generated/types';

export type ContentLayerDocument = Post | Book | Download | Event | Print | Resource | Strategy | Canon | Short;

export function getContentlayerData(): {
  available: boolean;
  documentCount: number;
  documents: ContentLayerDocument[];
  types: string[];
  error?: string;
  warning?: string;
} {
  try {
    const documents = allDocuments as unknown as ContentLayerDocument[];
    
    if (!documents || documents.length === 0) {
      return {
        available: false,
        documentCount: 0,
        documents: [],
        types: [],
        warning: 'No ContentLayer documents found. Run "pnpm contentlayer build" to generate content.'
      };
    }
    
    // Extract unique document types
    const types = Array.from(
      new Set(
        documents.map(doc => doc.type || 'unknown')
      )
    );
    
    return {
      available: true,
      documentCount: documents.length,
      documents: safeSlice(documents, 0, 50), // Limit for performance
      types
    };
  } catch (error) {
    console.error('[ContentLayer] getContentlayerData failed:', error);
    
    return {
      available: false,
      documentCount: 0,
      documents: [],
      types: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export function getAllDocuments(): ContentLayerDocument[] {
  return allDocuments as unknown as ContentLayerDocument[];
}

export function getDocumentsByType(type: string): ContentLayerDocument[] {
  const documents = getAllDocuments();
  return documents.filter(doc => doc.type === type);
}

export function getDocumentBySlug(slug: string): ContentLayerDocument | null {
  const documents = getAllDocuments();
  return documents.find(doc => doc.slug === slug) || null;
}

export function getPublishedDocuments(): ContentLayerDocument[] {
  const documents = getAllDocuments();
  return documents.filter(doc => !doc.draft && doc.published !== false);
}

// Document type specific getters
export function getPostBySlug(slug: string): Post | null {
  const post = allPosts.find(post => post.slug === slug);
  return post || null;
}

export function getPostBySlugWithContent(slug: string): Post | null {
  return getPostBySlug(slug);
}

export function getPublishedPosts(): Post[] {
  return allPosts.filter(post => !post.draft && post.published !== false);
}

export function getBookBySlug(slug: string): Book | null {
  const book = allBooks.find(book => book.slug === slug);
  return book || null;
}

export function getPublishedBooks(): Book[] {
  return allBooks.filter(book => !book.draft && book.published !== false);
}

export function getDownloadBySlug(slug: string): Download | null {
  const download = allDownloads.find(download => download.slug === slug);
  return download || null;
}

export function getPublishedDownloads(): Download[] {
  return allDownloads.filter(download => !download.draft && download.published !== false);
}

export function getEventBySlug(slug: string): Event | null {
  const event = allEvents.find(event => event.slug === slug);
  return event || null;
}

export function getPublishedEvents(): Event[] {
  return allEvents.filter(event => !event.draft && event.published !== false);
}

export function getPrintBySlug(slug: string): Print | null {
  const print = allPrints.find(print => print.slug === slug);
  return print || null;
}

export function getPublishedPrints(): Print[] {
  return allPrints.filter(print => !print.draft && print.published !== false);
}

export function getResourceBySlug(slug: string): Resource | null {
  const resource = allResources.find(resource => resource.slug === slug);
  return resource || null;
}

export function getPublishedResources(): Resource[] {
  return allResources.filter(resource => !resource.draft && resource.published !== false);
}

export function getStrategyBySlug(slug: string): Strategy | null {
  const strategy = allStrategies.find(strategy => strategy.slug === slug);
  return strategy || null;
}

export function getPublishedStrategies(): Strategy[] {
  return allStrategies.filter(strategy => !strategy.draft && strategy.published !== false);
}

export function getCanonBySlug(slug: string): Canon | null {
  const canon = allCanons.find(canon => canon.slug === slug);
  return canon || null;
}

export function getPublishedCanons(): Canon[] {
  return allCanons.filter(canon => !canon.draft && canon.published !== false);
}

export function getShortBySlug(slug: string): Short | null {
  const short = allShorts.find(short => short.slug === slug);
  return short || null;
}

export function getPublishedShorts(): Short[] {
  return allShorts.filter(short => !short.draft && short.published !== false);
}

export function coerceShortTheme(theme: any): string {
  if (typeof theme === 'string') return theme;
  return theme?.toString() || 'default';
}

// Alias functions for compatibility
export const getDocBySlug = getDocumentBySlug;

// Default export for backward compatibility
const dataApi = {
  getContentlayerData,
  getAllDocuments,
  getDocumentsByType,
  getDocumentBySlug,
  getPublishedDocuments,
  getDocBySlug,
  
  // Post functions
  getPostBySlug,
  getPostBySlugWithContent,
  getPublishedPosts,
  
  // Book functions
  getBookBySlug,
  getPublishedBooks,
  
  // Download functions
  getDownloadBySlug,
  getPublishedDownloads,
  
  // Event functions
  getEventBySlug,
  getPublishedEvents,
  
  // Print functions
  getPrintBySlug,
  getPublishedPrints,
  
  // Resource functions
  getResourceBySlug,
  getPublishedResources,
  
  // Strategy functions
  getStrategyBySlug,
  getPublishedStrategies,
  
  // Canon functions
  getCanonBySlug,
  getPublishedCanons,
  
  // Short functions
  getShortBySlug,
  getPublishedShorts,
  coerceShortTheme
};

export default dataApi;