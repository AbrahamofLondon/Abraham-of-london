/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CONTENT HELPER with REAL ContentLayer data
 * Re-exports actual ContentLayer functions for both client and server
 */

// Import REAL data access functions
import {
  getAllDocuments,
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts,
  coerceShortTheme
} from './contentlayer/data';

// Import client-safe utilities
import {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  getDocHref as getDocumentHref,
  getDocKind as getDocumentKind
} from './content/shared';

// Re-export all client-safe functions
export {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  getDocumentHref,
  getDocumentKind
};

// Export types from ContentLayer
export type { Post, Book, Download, Event, Print, Resource, Strategy, Canon, Short } from '@/contentlayer/generated/types';

// Define generic types for flexibility
export type ContentDoc = any;
export type DocKind = string;

// Client-side only utilities (these are safe for both client and server)
export function formatDocumentDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getReadingTime(content?: string): number {
  if (!content) return 0;
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getExcerpt(content: string, maxLength: number = 160): string {
  if (!content) return '';
  
  // Remove markdown and HTML tags
  const plain = content
    .replace(/[#*`\[\]]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  if (plain.length <= maxLength) return plain;
  
  return plain.substring(0, maxLength).trim() + '…';
}

export function createDocumentUrl(slug: string, type?: string): string {
  const normalized = normalizeSlug(slug);
  if (!normalized) return '/';
  
  switch (type) {
    case 'book':
      return `/books/${normalized}`;
    case 'canon':
      return `/canon/${normalized}`;
    case 'download':
      return `/downloads/${normalized}`;
    case 'post':
      return `/blog/${normalized}`;
    case 'print':
      return `/prints/${normalized}`;
    case 'resource':
      return `/resources/${normalized}`;
    case 'strategy':
      return `/strategy/${normalized}`;
    case 'event':
      return `/events/${normalized}`;
    case 'short':
      return `/shorts/${normalized}`;
    default:
      return `/${normalized}`;
  }
}

// ===== RE-EXPORT REAL CONTENTLAYER FUNCTIONS =====

// Document getters
export {
  getAllDocuments,
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts,
  coerceShortTheme
};

// Alias functions for backward compatibility
export const getDocBySlug = getDocumentBySlug;
export const getPostBySlugWithContent = getPostBySlug;

// Additional collection getters (aliases for consistency)
export const getAllPosts = getPublishedPosts;
export const getAllBooks = getPublishedBooks;
export const getAllDownloads = getPublishedDownloads;
export const getAllEvents = getPublishedEvents;
export const getAllPrints = getPublishedPrints;
export const getAllResources = getPublishedResources;
export const getAllStrategies = getPublishedStrategies;
export const getAllCanons = getPublishedCanons;
export const getAllShorts = getPublishedShorts;

// Extended collection getters (return empty arrays for now, can be implemented if needed)
export const getAllArticles = (): any[] => [];
export const getAllGuides = (): any[] => [];
export const getAllTutorials = (): any[] => [];
export const getAllCaseStudies = (): any[] => [];
export const getAllWhitepapers = (): any[] => [];
export const getAllReports = (): any[] => [];
export const getAllNewsletters = (): any[] => [];
export const getAllSermons = (): any[] => [];
export const getAllDevotionals = (): any[] => [];
export const getAllPrayers = (): any[] => [];
export const getAllTestimonies = (): any[] => [];
export const getAllPodcasts = (): any[] => [];
export const getAllVideos = (): any[] => [];
export const getAllCourses = (): any[] => [];
export const getAllLessons = (): any[] => [];
export const getAllContentlayerDocs = getAllDocuments;

// For backward compatibility with old imports
export const ContentHelper = {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
  formatDocumentDate,
  getReadingTime,
  getExcerpt,
  createDocumentUrl,
  getAllDocuments,
  getDocumentBySlug,
  getPostBySlug,
  getBookBySlug,
  getDownloadBySlug,
  getEventBySlug,
  getPrintBySlug,
  getResourceBySlug,
  getStrategyBySlug,
  getCanonBySlug,
  getShortBySlug,
  getPublishedPosts,
  getPublishedBooks,
  getPublishedDownloads,
  getPublishedEvents,
  getPublishedPrints,
  getPublishedResources,
  getPublishedStrategies,
  getPublishedCanons,
  getPublishedShorts
};

// Default export
export default ContentHelper;