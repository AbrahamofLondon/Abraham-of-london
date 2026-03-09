// lib/downloads.ts
// Downloads data facade (MDX-backed, async-safe)

import {
  getAllDownloadsMeta,
  getMdxDownloadBySlug,
  getMdxFeaturedDownloads,
} from "@/lib/server/downloads-data";

// Type definitions kept permissive for compatibility
export type Download = any;
export type DownloadMeta = Download;
export type DownloadFieldKey = keyof DownloadMeta;

/**
 * Get all downloads (async)
 */
export async function getAllDownloads(): Promise<DownloadMeta[]> {
  try {
    const downloads = await getAllDownloadsMeta();
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
  return downloads
    .map((d) => String(d?.slug || "").trim())
    .filter(Boolean);
}

/**
 * Get public downloads (async)
 */
export async function getPublicDownloads(): Promise<DownloadMeta[]> {
  const downloads = await getAllDownloads();

  return downloads.filter((download: any) => {
    const isDraft = download?.draft === true;
    const isNotPublished = download?.published === false;
    const isStatusDraft = String(download?.status || "").toLowerCase() === "draft";
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