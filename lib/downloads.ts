// lib/downloads.ts
// Downloads data facade (MDX-backed)

import {
  getMdxDownloadsMeta,
  getMdxDownloadBySlug,
  getMdxFeaturedDownloads,
} from "@/lib/server/downloads-data";

// Type definitions (kept permissive to match your current codebase posture)
export type Download = any;
export type DownloadMeta = Download;
export type DownloadFieldKey = keyof DownloadMeta;

/**
 * Get all downloads (async)
 */
export async function getAllDownloads(): Promise<DownloadMeta[]> {
  try {
    const downloads = await getMdxDownloadsMeta();
    return Array.isArray(downloads) ? downloads : [];
  } catch {
    return [];
  }
}

/**
 * Get download by slug (async)
 */
export async function getDownloadBySlug(slug: string): Promise<Download | null> {
  try {
    return await getMdxDownloadBySlug(slug);
  } catch {
    return null;
  }
}

/**
 * Get download slugs (async)
 */
export async function getDownloadSlugs(): Promise<string[]> {
  const downloads = await getAllDownloads();
  return downloads.map((d) => d?.slug).filter(Boolean);
}

/**
 * Get public downloads (async)
 */
export async function getPublicDownloads(): Promise<DownloadMeta[]> {
  const downloads = await getAllDownloads();
  return downloads.filter((download: any) => {
    const isDraft = download?.draft === true;
    const isNotPublished = download?.published === false;
    const isStatusDraft = download?.status === "draft";
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get featured downloads (async)
 */
export async function getFeaturedDownloads(): Promise<DownloadMeta[]> {
  try {
    const featured = await getMdxFeaturedDownloads();
    return Array.isArray(featured) ? featured : [];
  } catch {
    return [];
  }
}