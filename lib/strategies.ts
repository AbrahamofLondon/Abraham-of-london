// lib/strategies.ts
// Strategies data facade (MDX-backed)

import {
  getAllStrategiesMeta,
  getStrategyBySlug as getStrategyBySlugServer,
} from "@/lib/server/strategies-data";

export type Strategy = any;
export type StrategyMeta = Strategy;
export type StrategyFieldKey = keyof StrategyMeta;

/**
 * Get all strategies (async)
 */
export async function getAllStrategies(): Promise<StrategyMeta[]> {
  try {
    const strategies = await getAllStrategiesMeta();
    return Array.isArray(strategies) ? strategies : [];
  } catch {
    return [];
  }
}

/**
 * Get strategy by slug (async)
 */
export async function getStrategyBySlug(slug: string): Promise<Strategy | null> {
  try {
    // Prefer server loader (loads content when available)
    const doc = await getStrategyBySlugServer(slug);
    if (doc) return doc;

    // Fallback to meta list
    const strategies = await getAllStrategies();
    return strategies.find((s: any) => s?.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Get strategy slugs (async)
 */
export async function getStrategySlugs(): Promise<string[]> {
  const strategies = await getAllStrategies();
  return strategies.map((s: any) => s?.slug).filter(Boolean);
}

/**
 * Get public strategies (async)
 */
export async function getPublicStrategies(): Promise<StrategyMeta[]> {
  const strategies = await getAllStrategies();
  return strategies.filter((strategy: any) => {
    const isDraft = strategy?.draft === true;
    const isNotPublished = strategy?.published === false;
    const isStatusDraft = strategy?.status === "draft";
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get strategies by type (async)
 */
export async function getStrategiesByType(type: string): Promise<StrategyMeta[]> {
  const strategies = await getPublicStrategies();
  const target = String(type || "").toLowerCase().trim();
  return strategies.filter((s: any) => String(s?.strategyType || "").toLowerCase().trim() === target);
}