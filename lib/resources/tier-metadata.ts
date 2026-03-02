/* lib/resources/tier-metadata.ts - SSOT ALIGNED */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier, getTierLabel } from "@/lib/access/tier-policy";

export interface TierDirective {
  tier: AccessTier;  // Use SSOT AccessTier
  displayTier?: string; // Original display value for UI (e.g., "Board", "Founder")
  mandate: string;
  focusNodes: string[];
  riskThreshold: string;
}

// Map legacy display tiers to SSOT AccessTier
const tierMapping: Record<string, AccessTier> = {
  'Board': 'architect',
  'Founder': 'architect',
  'Household': 'client',
  'Director': 'owner',
  'Partner': 'architect',
  'Principal': 'owner',
};

export const TIER_DIRECTIVES: Record<string, TierDirective> = {
  Board: {
    tier: tierMapping['Board'],
    displayTier: 'Board',
    mandate: "Fiduciary Sovereignty & Long-Range Survival",
    focusNodes: ["Capital Structure", "Governance", "Succession"],
    riskThreshold: "Existential / Systemic",
  },
  Founder: {
    tier: tierMapping['Founder'],
    displayTier: 'Founder',
    mandate: "Operational Agency & Velocity Calibration",
    focusNodes: ["Product-Logic", "Talent Density", "Market-Entry"],
    riskThreshold: "Strategic / Competitive",
  },
  Household: {
    tier: tierMapping['Household'],
    displayTier: 'Household',
    mandate: "Legacy Persistence & Private Stability",
    focusNodes: ["Asset Protection", "Knowledge Transfer", "Privacy"],
    riskThreshold: "Generational / Personal",
  },
};

/**
 * Get directive by SSOT tier
 */
export function getDirectiveByTier(tier: AccessTier | string): TierDirective | undefined {
  const normalized = normalizeRequiredTier(tier);
  
  // Find first directive with matching normalized tier
  const entry = Object.values(TIER_DIRECTIVES).find(d => d.tier === normalized);
  return entry;
}

/**
 * Get display label for a tier directive
 */
export function getDirectiveLabel(tier: AccessTier | string): string {
  const normalized = normalizeRequiredTier(tier);
  const directive = getDirectiveByTier(normalized);
  
  if (directive?.displayTier) {
    return directive.displayTier;
  }
  
  return getTierLabel(normalized);
}

export default TIER_DIRECTIVES;