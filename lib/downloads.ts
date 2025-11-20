// lib/downloads.ts
// Content-layer backed helpers for downloads & print resources.

import {
  allDownloads,
  allPrints,
  type Download as CLDownload,
  type Print as CLPrint,
} from "contentlayer/generated";

/**
 * Canonical runtime types
 */
export type Download = CLDownload;
export type DownloadMeta = CLDownload;
export type DownloadFieldKey = keyof Download;

export type PrintResource = CLPrint;
export type PrintMeta = CLPrint;

// -----------------------------------------------------------------------------
// Downloads
// -----------------------------------------------------------------------------

function sortByDateDesc<T extends { date?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

/**
 * All downloads (meta) for listings.
 */
export function getAllDownloads(): DownloadMeta[] {
  if (!allDownloads || !Array.isArray(allDownloads)) return [];
  return sortByDateDesc(allDownloads);
}

/**
 * Slugs for getStaticPaths in pages/downloads/[slug].tsx.
 */
export function getDownloadSlugs(): string[] {
  return allDownloads.map((doc) => doc.slug);
}

/**
 * Full download (including MDX content) for detail pages.
 */
export function getDownloadBySlug(slug: string): Download | null {
  const target = String(slug).trim().toLowerCase();
  const found =
    allDownloads.find(
      (doc) =>
        doc.slug.toLowerCase() === target ||
        doc.slug.toLowerCase() === target.replace(/\.mdx?$/iu, ""),
    ) ?? null;
  return found;
}

// -----------------------------------------------------------------------------
// Prints (print-ready resources)
// -----------------------------------------------------------------------------

export function getAllPrints(): PrintMeta[] {
  if (!allPrints || !Array.isArray(allPrints)) return [];
  return sortByDateDesc(allPrints);
}

export function getPrintBySlug(slug: string): PrintResource | null {
  const target = String(slug).trim().toLowerCase();
  const found =
    allPrints.find(
      (doc) =>
        doc.slug.toLowerCase() === target ||
        doc.slug.toLowerCase() === target.replace(/\.mdx?$/iu, ""),
    ) ?? null;
  return found;
}