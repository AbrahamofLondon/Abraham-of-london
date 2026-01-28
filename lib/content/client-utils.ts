// lib/content/client-utils.ts - CLIENT-SAFE ONLY
/**
 * Client-safe utilities for content handling
 * Used by pages that render content
 */

// Type definitions
export type ContentDoc = any; // Replace with proper type from contentlayer if available
export type DocKind = 'post' | 'book' | 'download' | 'event' | 'canon' | 'short' | 'resource' | 'strategy' | 'print';

// Core utilities
export function sanitizeData<T>(input: T): T {
  // Keep this intentionally conservative; do NOT mutate unknown shapes aggressively.
  return input;
}

export function toUiDoc<T extends Record<string, any>>(doc: T): T {
  // Adapter hook: if you later need to map internal docs → UI docs, do it here.
  return doc;
}

export function resolveDocCoverImage(doc: any): string | null {
  return doc?.coverImage ?? doc?.image ?? null;
}

export function resolveDocDownloadUrl(doc: any): string | null {
  // Prefer explicit download fields, otherwise derive from slug if present
  if (doc?.downloadUrl) return doc.downloadUrl;
  if (doc?.slug) return `/downloads/${doc.slug}`;
  return null;
}

export function normalizeSlug(slug: string | string[]): string {
  if (Array.isArray(slug)) return slug.join("/");
  return slug;
}

export function getDocKind(doc: any): DocKind {
  const kind = doc?.docKind || doc?.type || "unknown";
  return kind as DocKind;
}

export function getDocHref(doc: any): string {
  if (doc?.href) return doc.href;
  if (doc?.slug) return `/${doc.slug}`;
  return "#";
}

export function isDraftContent(doc: any): boolean {
  return doc?.draft === true;
}

// ✅ NEW: Functions that were missing
export function isPublished(doc: any): boolean {
  return !isDraftContent(doc);
}

export function getAccessLevel(doc: any): string {
  return doc?.accessLevel || 'public';
}

// Safe utility functions for content
export function safeFirstChar(str: string | undefined | null): string {
  return str?.[0] || '';
}

export function safeSlice<T>(arr: T[] | undefined | null, start?: number, end?: number): T[] {
  return arr?.slice(start, end) || [];
}

// Content filtering and sorting
export function filterPublished(docs: any[]): any[] {
  return docs.filter(doc => isPublished(doc));
}

export function sortByDate(docs: any[], ascending: boolean = false): any[] {
  return [...docs].sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

// Content type checking
export function isPost(doc: any): boolean {
  return getDocKind(doc) === 'post';
}

export function isBook(doc: any): boolean {
  return getDocKind(doc) === 'book';
}

export function isDownload(doc: any): boolean {
  return getDocKind(doc) === 'download';
}

export function isCanon(doc: any): boolean {
  return getDocKind(doc) === 'canon';
}

export function isShort(doc: any): boolean {
  return getDocKind(doc) === 'short';
}