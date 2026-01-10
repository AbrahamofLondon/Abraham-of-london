// lib/strategies.ts
// Strategies data facade

import { getAllStrategiesMeta } from "@/lib/server/strategies-data";

// Type definitions
export type Strategy = any;
export type StrategyMeta = Strategy;
export type StrategyFieldKey = keyof StrategyMeta;

/**
 * Get all strategies
 */
export function getAllStrategies(): StrategyMeta[] {
  try {
    const strategies = getAllStrategiesMeta();
    return Array.isArray(strategies) ? strategies : [];
  } catch {
    return [];
  }
}

/**
 * Get strategy by slug
 */
export function getStrategyBySlug(slug: string): Strategy | null {
  try {
    const strategies = getAllStrategies();
    return strategies.find(s => s.slug === slug) || null;
  } catch {
    return null;
  }
}

/**
 * Get strategy slugs
 */
export function getStrategySlugs(): string[] {
  const strategies = getAllStrategies();
  return strategies.map(s => s.slug).filter(Boolean);
}

/**
 * Get public strategies
 */
export function getPublicStrategies(): StrategyMeta[] {
  const strategies = getAllStrategies();
  return strategies.filter(strategy => {
    const isDraft = strategy.draft === true;
    const isNotPublished = strategy.published === false;
    const isStatusDraft = strategy.status === 'draft';
    return !(isDraft || isNotPublished || isStatusDraft);
  });
}

/**
 * Get strategies by type
 */
export function getStrategiesByType(type: string): StrategyMeta[] {
  const strategies = getPublicStrategies();
  return strategies.filter(s => s.strategyType === type);
}


