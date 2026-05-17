// lib/inner-circle/config.ts - SSOT ALIGNED

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";

export const INNER_CIRCLE_CONFIG = {
  cookieName: "innerCircleAccess",
  tokenCookieName: "innerCircleToken",
  
  // UI display tiers - updated to include restricted
  displayTiers: ["inner-circle", "restricted", "client", "legacy"] as const,
  
  // Legacy tiers for backward compatibility
  legacyTiers: ["inner-circle", "inner-circle-plus", "inner-circle-elite"] as const,
  
  // Mapping from display tiers to SSOT
  tierMapping: {
    'inner-circle': 'inner_circle',
    'restricted': 'restricted',
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
    'inner-circle': 'inner_circle',
    'inner-circle-plus': 'client',
    'inner_circle_plus': 'client',
    'inner-circle-elite': 'legacy',
    'inner_circle_elite': 'legacy',
    'ic': 'inner_circle',
    'ic-plus': 'client',
    'ic-elite': 'legacy',
    'restricted': 'restricted',
    'top-secret': 'top_secret',
    'top_secret': 'top_secret',
    'ts': 'top_secret',
    'hardened': 'top_secret',
  };
  
  return mapping[tier.toLowerCase()] || normalizeRequiredTier(tier);
}

/**
 * Get display label for a tier
 * SYSTEM RESOLUTION: Added 'restricted' to satisfy Record<AccessTier, string>
 */
export function getInnerCircleDisplayTier(tier: AccessTier | string): string {
  const normalized = normalizeRequiredTier(tier);
  
  const displayMap: Record<AccessTier, string> = {
    public: 'Public',
    member: 'Member',
    professional: 'Professional',
    inner_circle: 'Professional',
    restricted: 'Restricted Clearance',
    client: 'Inner Circle Plus',
    legacy: 'Inner Circle Elite',
    architect: 'Architect',
    owner: 'Owner',
    top_secret: 'Top Secret',
  };
  
  return displayMap[normalized] || 'Inner Circle';
}

/**
 * Check if a tier is an Inner Circle variant (for UI filtering)
 */
export function isInnerCircleVariant(tier: AccessTier | string): boolean {
  const normalized = normalizeRequiredTier(tier);
  return normalized === 'inner_circle' ||
         normalized === 'restricted' ||
         normalized === 'client' ||
         normalized === 'legacy';
}

/**
 * Check if a tier is Top Secret (highest clearance)
 */
export function isTopSecret(tier: AccessTier | string): boolean {
  const normalized = normalizeRequiredTier(tier);
  return normalized === 'top_secret';
}

export default INNER_CIRCLE_CONFIG;