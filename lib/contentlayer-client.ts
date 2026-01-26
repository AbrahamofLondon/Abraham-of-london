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

export function getAllPrints() {
  return getWindowData().allPrints;
}

export function getAllResources() {
  return getWindowData().allResources;
}

export function getPrintBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allPrints.find((p: any) => p?.slug === s) || null;
}

export function getResourceBySlug(slug: string) {
  const s = String(slug || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  return getWindowData().allResources.find((r: any) => r?.slug === s) || null;
}