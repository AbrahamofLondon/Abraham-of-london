// lib/downloads.ts
// Downloads data facade

import { getAllDownloadsMeta, getDownloadBySlug as getDownloadBySlugServer } from "@/lib/server/downloads-data";

// Type definitions
export type Download = any;
export type DownloadMeta = Download;
export type DownloadFieldKey = keyof DownloadMeta;

/**
 * Get all downloads
 */
export function getAllDownloads(): DownloadMeta[] {
  try {
    const downloads = getAllDownloadsMeta();
    return Array.isArray(downloads) ? downloads : [];
  } catch {
    return [];
  }
}

/**
 * Get download by slug
 */
export function getDownloadBySlug(slug: string): Download | null {
  try {
    return getDownloadBySlugServer(slug);
  } catch {
    return null;
  }
}

/**
 * Get download slugs
 */
export function getDownloadSlugs(): string[] {
  const downloads = getAllDownloads();
  return downloads.map(d => d.slug).filter(Boolean);
}

/**
 * Get public downloads
 */
export function getPublicDownloads(): DownloadMeta[] {
  const downloads = getAllDownloads();
  return downloads.filter(download => {
    const isDraft = download.draft === true;
    const isNotPublished = download.published === false;
    const isStatusDraft = download.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}


