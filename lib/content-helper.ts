// lib/content-helper.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CLIENT-SAFE CONTENT HELPER
 * For use in React components and client-side code
 * NO server dependencies, NO contentlayer imports
 */

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

// Client-side only utilities
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
  createDocumentUrl
};