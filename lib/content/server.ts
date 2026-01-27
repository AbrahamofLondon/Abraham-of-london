// lib/content/server.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * SERVER-ONLY CONTENT ACCESS
 * - Used in API routes + getStaticProps/getServerSideProps
 * - Must be stable, sync-first (Pages Router)
 */


import "server-only";

import { normalizeSlug, isDraftContent, isPublished, getAccessLevel, getDocHref, getDocKind } from "@/lib/content/utils";
export { normalizeSlug, isDraftContent, isPublished, getAccessLevel, getDocHref, getDocKind };


const WARN =
  process.env.NODE_ENV !== "production"
    ? (...args: any[]) => console.warn("[CONTENT:SERVER]", ...args)
    : () => {};

export type ServerContentlayerData = {
  allDocuments: any[];
  allBooks: any[];
  allCanons: any[];
  allDownloads: any[];
  allPosts: any[];
  allEvents: any[];
  allPrints: any[];
  allResources: any[];
  allStrategies: any[];
  allShorts: any[];
};

const EMPTY_ARR: any[] = [];
const EMPTY_DATA: ServerContentlayerData = {
  allDocuments: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allPosts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
  allShorts: [],
};

import {
  allBooks,
  allCanons,
  allDocuments,
  allDownloads,
  allEvents,
  allPosts,
  allPrints,
  allResources,
  allShorts,
  allStrategies,
} from "@/lib/contentlayer-compat";

import { normalizeSlug, isDraftContent, isPublished, getAccessLevel, getDocHref, getDocKind } from "@/lib/content/index";
import { sanitizeData, toUiDoc, resolveDocCoverImage, resolveDocDownloadUrl } from "@/lib/content/shared";


// ---------------------------
// Core getters (SYNC)
// ---------------------------
export function getContentlayerData(): ServerContentlayerData {
  try {
    return {
      allDocuments: Array.isArray(allDocuments) ? allDocuments : [],
      allBooks: Array.isArray(allBooks) ? allBooks : [],
      allCanons: Array.isArray(allCanons) ? allCanons : [],
      allDownloads: Array.isArray(allDownloads) ? allDownloads : [],
      allPosts: Array.isArray(allPosts) ? allPosts : [],
      allEvents: Array.isArray(allEvents) ? allEvents : [],
      allPrints: Array.isArray(allPrints) ? allPrints : [],
      allResources: Array.isArray(allResources) ? allResources : [],
      allStrategies: Array.isArray(allStrategies) ? allStrategies : [],
      allShorts: Array.isArray(allShorts) ? allShorts : [],
    };
  } catch (e) {
    WARN("getContentlayerData failed; returning EMPTY_DATA.", e);
    return EMPTY_DATA;
  }
}

export function isContentlayerLoaded(): boolean {
  try {
    return getContentlayerData().allDocuments.length > 0;
  } catch {
    return false;
  }
}

export function assertContentlayerHasDocs(list: unknown, label = "Contentlayer"): void {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`${label} loaded 0 documents. Check content paths + Contentlayer build.`);
  }
}

// ---------------------------
// Published selectors
// ---------------------------
export function getPublishedDocuments(): any[] {
  try {
    return getContentlayerData().allDocuments.filter(isPublished);
  } catch (e) {
    WARN("getPublishedDocuments failed; returning [].", e);
    return EMPTY_ARR;
  }
}

export function getAllContentlayerDocs(): any[] {
  return getPublishedDocuments();
}

export function getPublishedPosts(): any[] {
  try {
    const posts = getContentlayerData().allPosts || [];
    return posts.filter(isPublished);
  } catch (e) {
    WARN("getPublishedPosts failed; returning [].", e);
    return EMPTY_ARR;
  }
}

// ---------------------------
// Generic doc access (fixes pages/[slug] + pages/content/[...slug])
// ---------------------------
export function getDocBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedDocuments().find((d) => normalizeSlug(d?.slug) === target) || null;
}

export function getDocumentBySlug(slug: string): any | null {
  return getDocBySlug(slug);
}

// ---------------------------
// Collections (server)
// ---------------------------
export function getServerAllBooks(): any[] {
  return getContentlayerData().allBooks;
}
export function getServerBookBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllBooks().find((b) => normalizeSlug(b?.slug) === target) || null;
}

export function getServerAllCanons(): any[] {
  return getContentlayerData().allCanons;
}
export function getServerCanonBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllCanons().find((c) => normalizeSlug(c?.slug) === target) || null;
}

export function getServerAllDownloads(): any[] {
  return getContentlayerData().allDownloads;
}
export function getServerDownloadBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllDownloads().find((d) => normalizeSlug(d?.slug) === target) || null;
}

export function getServerAllEvents(): any[] {
  return getContentlayerData().allEvents;
}
export function getServerEventBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllEvents().find((e) => normalizeSlug(e?.slug) === target) || null;
}

export function getServerAllShorts(): any[] {
  return getContentlayerData().allShorts;
}
export function getServerShortBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllShorts().find((s) => normalizeSlug(s?.slug) === target) || null;
}

export function getServerAllResources(): any[] {
  return getContentlayerData().allResources;
}
export function getServerResourceBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllResources().find((r) => normalizeSlug(r?.slug) === target) || null;
}

export function getServerAllPrints(): any[] {
  return getContentlayerData().allPrints;
}
export function getServerPrintBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllPrints().find((p) => normalizeSlug(p?.slug) === target) || null;
}

export function getServerAllStrategies(): any[] {
  return getContentlayerData().allStrategies;
}
export function getServerStrategyBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getServerAllStrategies().find((s) => normalizeSlug(s?.slug) === target) || null;
}

// ---------------------------
// Legacy aliases expected by pages/index.tsx and helper layers
// ---------------------------

export function getAllShorts(): any[] {
  return getServerAllShorts().filter(isPublished);
}

export function getBooks(): any[] {
  return getServerAllBooks().filter(isPublished);
}
export function getCanons(): any[] {
  return getServerAllCanons().filter(isPublished);
}
export function getDownloads(): any[] {
  return getServerAllDownloads().filter(isPublished);
}
export function getEvents(): any[] {
  return getServerAllEvents().filter(isPublished);
}
export function getPrints(): any[] {
  return getServerAllPrints().filter(isPublished);
}
export function getResources(): any[] {
  return getServerAllResources().filter(isPublished);
}
export function getStrategies(): any[] {
  return getServerAllStrategies().filter(isPublished);
}
export function getShorts(): any[] {
  return getServerAllShorts().filter(isPublished);
}

export function getAllCombinedDocs(): any[] {
  const d = getContentlayerData();
  return sanitizeData([
    ...(d.allDocuments || []),
    ...(d.allBooks || []),
    ...(d.allCanons || []),
    ...(d.allDownloads || []),
    ...(d.allPosts || []),
    ...(d.allEvents || []),
    ...(d.allPrints || []),
    ...(d.allResources || []),
    ...(d.allStrategies || []),
    ...(d.allShorts || []),
  ]);
}

// Posts (fix pages/blog/[slug].tsx)
export function getPostBySlug(slug: string): any | null {
  const target = normalizeSlug(slug);
  return getPublishedPosts().find((p) => normalizeSlug(p?.slug) === target) || null;
}

export function getPostBySlugWithContent(slug: string): any | null {
  // If your post includes body.raw, it will be present here already.
  return getPostBySlug(slug);
}

// Async conveniences (some code awaits these)
export async function getServerAllBooksAsync() {
  return getServerAllBooks();
}
export async function getServerAllCanonsAsync() {
  return getServerAllCanons();
}
export async function getServerAllDownloadsAsync() {
  return getServerAllDownloads();
}
export async function getServerAllShortsAsync() {
  return getServerAllShorts();
}

// Re-export safe utilities for server callers
export {
  normalizeSlug,
  isDraftContent,
  isPublished,
  sanitizeData,
  toUiDoc,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getAccessLevel,
  getDocHref,
  getDocKind,
};