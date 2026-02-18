// lib/contentlayer-client.ts
// Client-safe content access (NO next-contentlayer, NO server imports)
// Uses window.__contentlayer if present (your contentlayer.client.js bootstrap),
// otherwise returns empty fallbacks.

export type ClientContentlayerData = {
  allDocuments: any[];
  allPosts: any[];
  allBooks: any[];
  allCanons: any[];
  allDownloads: any[];
  allShorts: any[];
  allEvents: any[];
  allPrints: any[];
  allResources: any[];
  allStrategies: any[];
};

// Define and export the Post type
export type Post = {
  _id: string;
  _raw: {
    sourceFilePath: string;
    sourceFileName: string;
    sourceFileDir: string;
    contentType: string;
    flattenedPath: string;
  };
  type: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
  published?: boolean;
  featured?: boolean;
  slug?: string;
  slugComputed?: string;
  coverImage?: string;
  image?: string;
  author?: string;
  readTime?: string;
  category?: string;
  body?: {
    raw: string;
    html?: string;
    code?: string;
  };
  [key: string]: any;
};

// Define PostForClient (could be the same as Post or a subset)
export type PostForClient = Post;

// Define other document types (for internal use only - not exported)
type _Book = Post & { isbn?: string; publisher?: string };
type _Canon = Post & { volumeNumber?: number; principle?: string };
type _Download = Post & { fileSize?: string; downloadUrl?: string };
type _Short = Post & { format?: 'text' | 'audio' | 'video'; duration?: string };
type _Event = Post & { location?: string; startDate?: string; endDate?: string };
type _Print = Post & { price?: string; dimensions?: string };
type _Resource = Post & { resourceType?: string; downloadUrl?: string };
type _Strategy = Post & { confidential?: boolean; industry?: string };

const EMPTY: ClientContentlayerData = {
  allDocuments: [],
  allPosts: [],
  allBooks: [],
  allCanons: [],
  allDownloads: [],
  allShorts: [],
  allEvents: [],
  allPrints: [],
  allResources: [],
  allStrategies: [],
};

function getWindowData(): ClientContentlayerData {
  if (typeof window === "undefined") return EMPTY;

  const w: any = window as any;
  const data =
    w?.__contentlayer?.data?.default ||
    w?.__contentlayer?.data ||
    null;

  if (!data) return EMPTY;

  // Some builds export named collections, some export as default.
  // Normalize to a single predictable shape.
  return {
    allDocuments: Array.isArray(data.allDocuments) ? data.allDocuments : [],
    allPosts: Array.isArray(data.allPosts) ? data.allPosts : [],
    allBooks: Array.isArray(data.allBooks) ? data.allBooks : [],
    allCanons: Array.isArray(data.allCanons) ? data.allCanons : [],
    allDownloads: Array.isArray(data.allDownloads) ? data.allDownloads : [],
    allShorts: Array.isArray(data.allShorts) ? data.allShorts : [],
    allEvents: Array.isArray(data.allEvents) ? data.allEvents : [],
    allPrints: Array.isArray(data.allPrints) ? data.allPrints : [],
    allResources: Array.isArray(data.allResources) ? data.allResources : [],
    allStrategies: Array.isArray(data.allStrategies) ? data.allStrategies : [],
  };
}

// Minimal client API that won’t crash builds
export function getContentlayerData(): ClientContentlayerData {
  return getWindowData();
}

export function getAllDocuments() {
  return getWindowData().allDocuments;
}

export function getAllPosts() {
  return getWindowData().allPosts;
}

export function getAllBooks() {
  return getWindowData().allBooks;
}

export function getAllCanons() {
  return getWindowData().allCanons;
}

export function getAllDownloads() {
  return getWindowData().allDownloads;
}

export function getAllShorts() {
  return getWindowData().allShorts;
}

export function getAllEvents() {
  return getWindowData().allEvents;
}

export function getAllPrints() {
  return getWindowData().allPrints;
}

export function getAllResources() {
  return getWindowData().allResources;
}

export function getAllStrategies() {
  return getWindowData().allStrategies;
}

export function getPostBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allPosts.find((p: any) => p?.slug === s) || null;
}

export function getBookBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allBooks.find((b: any) => b?.slug === s) || null;
}

export function getCanonBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allCanons.find((c: any) => c?.slug === s) || null;
}

export function getDownloadBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allDownloads.find((d: any) => d?.slug === s) || null;
}

export function getShortBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allShorts.find((sht: any) => sht?.slug === s) || null;
}

export function getEventBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allEvents.find((e: any) => e?.slug === s) || null;
}

export function getPrintBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allPrints.find((p: any) => p?.slug === s) || null;
}

export function getResourceBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allResources.find((r: any) => r?.slug === s) || null;
}

export function getStrategyBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allStrategies.find((s: any) => s?.slug === s) || null;
}