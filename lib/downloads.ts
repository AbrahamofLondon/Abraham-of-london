// lib/downloads.ts
// -----------------------------------------------------------------------------
// Thin wrapper around lib/server/downloads-data for server-side usage only.
// -----------------------------------------------------------------------------

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
 * Full download (including content) for detail pages.
 */
export function getDownloadBySlug(slug: string): Download | null {
  return _getDownloadBySlug(slug);
}
