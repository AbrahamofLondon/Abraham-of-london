// lib/inner-circle/config.ts - SSOT ALIGNED

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";

export const INNER_CIRCLE_CONFIG = {
  cookieName: "innerCircleAccess",
  tokenCookieName: "innerCircleToken",
  
  // UI display tiers - these are mapped to SSOT at runtime
  displayTiers: ["inner-circle", "client", "legacy"] as const,
  
  // Legacy tiers for backward compatibility
  legacyTiers: ["inner-circle", "inner-circle-plus", "inner-circle-elite"] as const,
  
  // Mapping from display tiers to SSOT
  tierMapping: {
    'inner-circle': 'inner-circle',
    'inner-circle-plus': 'client',
    'inner-circle-elite': 'legacy',
  } as Record<string, AccessTier>,
} as const;

export type DisplayTier = (typeof INNER_CIRCLE_CONFIG.displayTiers)[number];
export type LegacyTier = (typeof INNER_CIRCLE_CONFIG.legacyTiers)[number];

/**
 * Normalize a display/legacy tier to SSOT
 */
export function normalizeInnerCircleTier(tier: string): AccessTier {
  const mapping: Record<string, AccessTier> = {
    'inner-circle': 'inner-circle',
    'inner-circle-plus': 'client',
    'inner_circle_plus': 'client',
    'inner-circle-elite': 'legacy',
    'inner_circle_elite': 'legacy',
    'ic': 'inner-circle',
    'ic-plus': 'client',
    'ic-elite': 'legacy',
  };
  
  return mapping[tier.toLowerCase()] || normalizeRequiredTier(tier);
}

/**
 * Get display label for a tier
 */
export function getInnerCircleDisplayTier(tier: AccessTier | string): string {
  const normalized = normalizeRequiredTier(tier);
  
  const displayMap: Record<AccessTier, string> = {
    'public': 'Public',
    'member': 'Member',
    'inner-circle': 'Inner Circle',
    'client': 'Inner Circle Plus',
    'legacy': 'Inner Circle Elite',
    'architect': 'Architect',
    'owner': 'Owner',
  };
  
  return displayMap[normalized] || 'Inner Circle';
}

export default INNER_CIRCLE_CONFIG;