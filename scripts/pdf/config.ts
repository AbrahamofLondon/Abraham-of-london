// scripts/pdf/config.ts - UNIFIED CONFIGURATION
export const TIER_CONFIG = {
  // Tier mapping between systems
  mapping: {
    // New system (build scripts) → Old system (legacy generator)
    'architect': 'inner-circle-plus',
    'member': 'inner-circle',
    'free': 'public',
    'premium': 'inner-circle-plus', // For simplified orchestrator
    'basic': 'inner-circle',
    'enterprise': 'inner-circle-elite'
  },
  
  // Display names for each tier
  displayNames: {
    'architect': 'ARCHITECT',
    'member': 'MEMBER', 
    'free': 'FREE',
    'premium': 'PREMIUM',
    'inner-circle-plus': 'PREMIUM',
    'inner-circle': 'BASIC',
    'public': 'FREE',
    'inner-circle-elite': 'ENTERPRISE',
    'private': 'RESTRICTED'
  },
  
  // Expected file patterns for verification
  expectedFiles: {
    architect: [
      'legacy-architecture-canvas-a4-premium-architect.pdf',
      'legacy-architecture-canvas-letter-premium-architect.pdf',
      'legacy-architecture-canvas-a3-premium-architect.pdf'
    ],
    member: [
      'legacy-architecture-canvas-a4-premium-member.pdf',
      'legacy-architecture-canvas-letter-premium-member.pdf',
      'legacy-architecture-canvas-a3-premium-member.pdf'
    ],
    free: [
      'legacy-architecture-canvas-a4-premium-free.pdf',
      'legacy-architecture-canvas-letter-premium-free.pdf',
      'legacy-architecture-canvas-a3-premium-free.pdf'
    ]
  }
};

export type BuildTier = 'architect' | 'member' | 'free';
export type LegacyTier = 'public' | 'inner-circle' | 'inner-circle-plus' | 'inner-circle-elite' | 'private';
export type Quality = 'premium' | 'enterprise';
export type Format = 'A4' | 'Letter' | 'A3';

export function mapTierToLegacy(tier: BuildTier | string): LegacyTier {
  const normalized = tier.toLowerCase() as BuildTier;
  return TIER_CONFIG.mapping[normalized] || 'inner-circle-plus';
}

export function getDisplayName(tier: string): string {
  return TIER_CONFIG.displayNames[tier.toLowerCase()] || tier.toUpperCase();
}

export function generateFilename(
  format: Format, 
  quality: Quality, 
  tier: BuildTier | string
): string {
  const formatLower = format.toLowerCase();
  const tierLower = tier.toLowerCase();
  return `legacy-architecture-canvas-${formatLower}-${quality}-${tierLower}.pdf`;
}