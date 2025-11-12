<<<<<<< HEAD
import fs from "fs";
import path from "path";
import { ensureDir, listMdFiles, fileToSlug, readFrontmatter, sortByDateDesc } from "./fs-utils";

export type DownloadMeta = {
  slug: string;
  title?: string;
  date?: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  coverImage?: string;
  author?: string;
  readTime?: string;
  coverAspect?: string;
  coverFit?: string;
  coverPosition?: string;
  href?: string; // required by DownloadsGrid consumer
};

export type DownloadItem = DownloadMeta & { body?: string; content?: string };

const COLLECTION = "downloads";

export function getAllDownloadSlugs(): string[] {
  const abs = ensureDir(COLLECTION);
  if (!abs) return [];
  return listMdFiles(abs).map(fileToSlug);
}

export function getAllDownloads(fields?: string[]): DownloadItem[] {
  const abs = ensureDir(COLLECTION);
  if (!abs) return [];
  const items = listMdFiles(abs).map((absFile) => {
    const slug = fileToSlug(absFile);
    const { data, content } = readFrontmatter(absFile);
    const href = (data?.href && String(data.href)) || `/downloads/${slug}`;
    const meta: any = { slug, href, ...data };
    if (fields?.includes("content") || fields?.includes("body")) {
      meta.body = content; meta.content = content;
    }
    return meta as DownloadItem;
  });
  return sortByDateDesc(items);
}

export function getDownloadBySlug(slug: string, fields?: string[]): DownloadItem | null {
  const abs = ensureDir(COLLECTION);
  if (!abs) return null;
  const guess = [".mdx", ".md"].map(ext => path.join(abs, `${slug}${ext}`));
  const found = guess.find(f => { try { return fs.existsSync(f); } catch { return false; }});
  if (!found) return null;
  const { data, content } = readFrontmatter(found);
  const href = (data?.href && String(data.href)) || `/downloads/${slug}`;
  const meta: any = { slug, href, ...data, body: content, content };
  if (fields?.length) {
    const picked: any = { slug, href };
    for (const f of fields) picked[f] = meta[f];
    return picked;
  }
  return meta as DownloadItem;
=======
// lib/downloads.ts - PRODUCTION SAFE VERSION
import { allDownloads } from "contentlayer/generated";

// Type-safe fallback for Download type
interface SafeDownload {
  _id: string;
  title: string;
  slug: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  type: string;
  url: string;
  subtitle?: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
  [key: string]: any;
}

/**
 * Safely get all downloads with comprehensive error handling
 */
export function getAllDownloads(): SafeDownload[] {
  try {
    if (typeof allDownloads === 'undefined') {
      console.warn('⚠️ ContentLayer downloads data is undefined - returning empty array');
      return [];
    }

    if (!Array.isArray(allDownloads)) {
      console.error('❌ ContentLayer downloads is not an array:', typeof allDownloads);
      return [];
    }

    const safeDownloads = allDownloads.filter((download): download is SafeDownload => {
      const isValid = download && 
                     typeof download === 'object' &&
                     typeof download._id === 'string' &&
                     typeof download.title === 'string' &&
                     typeof download.slug === 'string' &&
                     typeof download.date === 'string' &&
                     typeof download.author === 'string' &&
                     typeof download.readTime === 'string' &&
                     typeof download.category === 'string' &&
                     typeof download.type === 'string' &&
                     typeof download.url === 'string';

      if (!isValid) {
        console.warn('🚨 Filtering out invalid download:', download);
      }

      return isValid;
    });

    if (safeDownloads.length !== allDownloads.length) {
      console.warn(`🔄 Filtered ${allDownloads.length - safeDownloads.length} invalid downloads`);
    }

    return safeDownloads;

  } catch (error) {
    console.error('💥 Critical error in getAllDownloads:', error);
    return [];
  }
>>>>>>> test-netlify-fix
}

/**
 * Safely get a download by slug with fallbacks
 */
export function getDownloadBySlug(slug: string): SafeDownload | null {
  try {
    if (!slug || typeof slug !== 'string') {
      console.warn('⚠️ Invalid slug provided to getDownloadBySlug:', slug);
      return null;
    }

    const downloads = getAllDownloads();
    const download = downloads.find(download => download.slug === slug);

    if (!download) {
      console.warn(`🔍 Download not found for slug: "${slug}"`);
      return null;
    }

    return download;

  } catch (error) {
    console.error(`💥 Error finding download with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get downloads by type with validation
 */
export function getDownloadsByType(type: string): SafeDownload[] {
  try {
    if (!type || typeof type !== 'string') {
      console.warn('⚠️ Invalid type provided to getDownloadsByType:', type);
      return [];
    }

    return getAllDownloads().filter(download => 
      download.type?.toLowerCase() === type.toLowerCase()
    );

  } catch (error) {
    console.error(`💥 Error getting downloads by type "${type}":`, error);
    return [];
  }
}

/**
 * Get downloads - MISSING FUNCTION THAT CAUSED BUILD ERROR
 * This is likely the function being imported elsewhere
 */
export function getDownloads(): SafeDownload[] {
  return getAllDownloads();
}

// Export types for use in other files
export type { SafeDownload as Download };