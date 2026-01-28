// lib/content/shared.ts - CLIENT-SAFE VERSION ONLY
/**
 * Client-safe utilities for content handling
 * DO NOT re-export server-only code
 */

// Only export client-safe functions
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