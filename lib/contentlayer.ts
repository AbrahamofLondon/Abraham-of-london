// lib/contentlayer.ts — BUILD-SAFE CONTENTLAYER ADAPTER (SSOT)
// Prevents hard-crash when .contentlayer/generated is missing (Windows/CI).
// NOTE: Do NOT import "server-only" here because this module is used in pages/* (sitemaps).

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
};

let cache: Generated | null = null;

function loadGenerated(): Generated {
  if (cache) return cache;

  // Guard: never attempt require in the browser
  if (typeof window !== "undefined") {
    cache = {};
    return cache;
  }

  // 1) Preferred virtual module (if available)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cache = require("contentlayer/generated") as Generated;
    return cache;
  } catch {
    // continue
  }

  // 2) Fallback to local output (Contentlayer2 on Windows often writes here)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cache = require("../.contentlayer/generated") as Generated;
    return cache;
  } catch (e) {
    console.warn("⚠️ [CONTENTLAYER] Generated module missing. Run: pnpm content:build", e);
    cache = {};
    return cache;
  }
}

// -------------------------------
// Named exports (SSOT surface)
// -------------------------------
export const allDocuments = (loadGenerated().allDocuments ?? []) as any[];
export const allPosts = (loadGenerated().allPosts ?? []) as any[];
export const allShorts = (loadGenerated().allShorts ?? []) as any[];
export const allBooks = (loadGenerated().allBooks ?? []) as any[];
export const allCanons = (loadGenerated().allCanons ?? []) as any[];
export const allDownloads = (loadGenerated().allDownloads ?? []) as any[];
export const allBriefs = (loadGenerated().allBriefs ?? []) as any[];
export const allEvents = (loadGenerated().allEvents ?? []) as any[];
export const allPrints = (loadGenerated().allPrints ?? []) as any[];
export const allResources = (loadGenerated().allResources ?? []) as any[];
export const allStrategies = (loadGenerated().allStrategies ?? []) as any[];
export const allIntelligences = (loadGenerated().allIntelligences ?? []) as any[];
export const allLexicons = (loadGenerated().allLexicons ?? []) as any[];

// Optional escape hatch for advanced callers
export function getGeneratedUnsafe(): Generated {
  return loadGenerated();
}

// -------------------------------
// Default export (legacy compat)
// -------------------------------
const contentlayerApi = {
  allDocuments,
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
  getGeneratedUnsafe,
};

export default contentlayerApi;