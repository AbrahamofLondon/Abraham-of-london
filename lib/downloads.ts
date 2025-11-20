// lib/downloads.ts
// Thin facade over the server-side downloads-data helpers.
// Used by pages and components so we can refactor the backend without touching the UI layer.

import type {
  Download,
  DownloadMeta,
  DownloadFieldKey,
} from "@/lib/server/downloads-data";
import {
  getAllDownloadsMeta as _getAllDownloadsMeta,
  getDownloadBySlug as _getDownloadBySlug,
  getDownloadSlugs as _getDownloadSlugs,
} from "@/lib/server/downloads-data";

export type { Download, DownloadMeta, DownloadFieldKey };

/**
 * All downloads (meta only) for listings / grids.
 */
export function getAllDownloads(): DownloadMeta[] {
  return _getAllDownloadsMeta();
}

/**
 * Slugs for getStaticPaths in pages/downloads/[slug].tsx.
 */
export function getDownloadSlugs(): string[] {
  return _getDownloadSlugs();
}

/**
 * Full download (including MDX content) for detail pages.
 */
export function getDownloadBySlug(slug: string): Download | null {
  return _getDownloadBySlug(slug);
}