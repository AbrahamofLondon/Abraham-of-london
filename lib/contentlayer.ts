// lib/contentlayer.ts — BUILD-SAFE CONTENTLAYER ADAPTER (SSOT)
//
// Historically this module loaded `contentlayer/generated` at the top
// level via `require("contentlayer/generated")`. That pulled the full
// 16-collection JSON barrel into every build worker before any page
// function ran, and was the last `[MODULE_INIT] lib/contentlayer` line
// logged before the OOM kill at exit 137 during page-data collection.
//
// This version routes every export through `lib/contentlayer-helper`,
// which reads only the requested kind's `.contentlayer/generated/<Type>/
// _index.json` on demand and caches per-kind. `allDocuments` is wrapped
// in a Proxy so it only triggers the full corpus walk if a caller
// actually iterates/filters it.
//
// NOTE: Do NOT import "server-only" here because this module is used in
// pages/* (sitemaps). The exported shape is preserved — many shared libs
// consume these as direct array re-exports (`allPosts.filter(...)`).

console.log("[MODULE_INIT] lib/contentlayer");

import * as helper from "@/lib/contentlayer-helper";

type Generated = {
  allDocuments?: any[];
  allPosts?: any[];
  allShorts?: any[];
  allBooks?: any[];
  allCanons?: any[];
  allDownloads?: any[];
  allBriefs?: any[];
  allEvents?: any[];
  allPrints?: any[];
  allResources?: any[];
  allStrategies?: any[];
  allIntelligences?: any[];
  allLexicons?: any[];
  allPlaybooks?: any[];
  allVaults?: any[];
};

function safeCall(fn: () => any[] | undefined): any[] {
  if (typeof window !== "undefined") return [];
  try {
    return (fn() || []) as any[];
  } catch (e) {
    console.warn("⚠️ [CONTENTLAYER] per-kind loader failed", e);
    return [];
  }
}

// -------------------------------
// Named exports — each per-kind read goes through the narrow helper and
// touches only its own collection's index file. These are eager because
// they are small and downstream code treats them as real arrays.
// -------------------------------
export const allPosts = safeCall(() => helper.getAllPosts() as any[]);
export const allShorts = safeCall(() => helper.getAllShorts() as any[]);
export const allBooks = safeCall(() => helper.getAllBooks() as any[]);
export const allCanons = safeCall(() => helper.getAllCanons() as any[]);
export const allDownloads = safeCall(() => helper.getAllDownloads() as any[]);
export const allBriefs = safeCall(() => helper.getAllBriefs() as any[]);
export const allEvents = safeCall(() => helper.getAllEvents() as any[]);
export const allPrints = safeCall(() => helper.getAllPrints() as any[]);
export const allResources = safeCall(() => helper.getAllResources() as any[]);
export const allStrategies = safeCall(() => helper.getAllStrategies() as any[]);
export const allLexicons = safeCall(() => helper.getAllLexicon() as any[]);
export const allPlaybooks = safeCall(
  () => (helper as any).getAllPlaybooks?.() as any[],
);
export const allVaults = safeCall(() => helper.getAllVault() as any[]);
export const allIntelligences = safeCall(
  () => (helper as any).getAllIntelligences?.() as any[],
);

// -------------------------------
// `allDocuments` — lazy Proxy. Only triggers the full-corpus walk when a
// caller actually iterates/filters it. Many build-path modules import
// `allDocuments` but never touch it during build, so the walk never runs
// in those workers.
// -------------------------------
let _allDocuments: any[] | null = null;
function loadAllDocuments(): any[] {
  if (_allDocuments) return _allDocuments;
  if (typeof window !== "undefined") {
    _allDocuments = [];
    return _allDocuments;
  }
  try {
    _allDocuments = (helper.getAllContentlayerDocs() || []) as any[];
  } catch (e) {
    console.warn("⚠️ [CONTENTLAYER] getAllContentlayerDocs failed", e);
    _allDocuments = [];
  }
  return _allDocuments;
}

export const allDocuments: any[] = new Proxy([] as any[], {
  get(_target, prop) {
    const arr = loadAllDocuments();
    const v = (arr as any)[prop];
    return typeof v === "function" ? v.bind(arr) : v;
  },
  has(_target, prop) {
    return prop in loadAllDocuments();
  },
  ownKeys() {
    return Reflect.ownKeys(loadAllDocuments());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(loadAllDocuments(), prop);
  },
}) as any[];

// Optional escape hatch for advanced callers
export function getGeneratedUnsafe(): Generated {
  return {
    allDocuments: loadAllDocuments(),
    allPosts,
    allShorts,
    allBooks,
    allCanons,
    allDownloads,
    allBriefs,
    allEvents,
    allPrints,
    allResources,
    allStrategies,
    allIntelligences,
    allLexicons,
    allPlaybooks,
    allVaults,
  };
}

// -------------------------------
// Default export (legacy compat)
// -------------------------------
const contentlayerApi = {
  get allDocuments() {
    return loadAllDocuments();
  },
  allPosts,
  allShorts,
  allBooks,
  allCanons,
  allDownloads,
  allBriefs,
  allEvents,
  allPrints,
  allResources,
  allStrategies,
  allIntelligences,
  allLexicons,
  allPlaybooks,
  allVaults,
  getGeneratedUnsafe,
};

export default contentlayerApi;
