// scripts/pdf/constants.ts - CENTRAL CONFIGURATION
export const PDF_CONFIG = {
  // Tier mapping: Build commands → Legacy generator → Display names
  tiers: {
    // Build command tiers (used in package.json)
    'architect': {
      legacy: 'inner-circle-plus',
      display: 'ARCHITECT',
      level: 3
    },
    'member': {
      legacy: 'inner-circle', 
      display: 'MEMBER',
      level: 2
    },
    'free': {
      legacy: 'public',
      display: 'FREE',
      level: 1
    },
    'premium': {
      legacy: 'inner-circle-plus',
      display: 'PREMIUM',
      level: 3
    }
  },
  
  // Quality levels
  qualities: ['premium', 'enterprise'] as const,
  
  // Supported formats
  formats: ['A4', 'Letter', 'A3'] as const,
  
  // Output configuration
  outputDir: './public/assets/downloads',
  
  // Expected file patterns for verification
  expectedFiles: (tier: string) => [
    `legacy-architecture-canvas-a4-premium-${tier}.pdf`,
    `legacy-architecture-canvas-letter-premium-${tier}.pdf`,
    `legacy-architecture-canvas-a3-premium-${tier}.pdf`
  ]
} as const;

export type BuildTier = keyof typeof PDF_CONFIG.tiers;
export type Quality = typeof PDF_CONFIG.qualities[number];
export type Format = typeof PDF_CONFIG.formats[number];