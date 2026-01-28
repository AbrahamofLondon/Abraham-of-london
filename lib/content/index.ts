// lib/content/index.ts

// Export client-safe utilities
export * from "./client-utils";

// DO NOT export server modules here
// Server modules should be imported directly

// Remove duplicate type exports - they're already exported by export *
// export type { ContentDoc, DocKind } from "./client-utils"; // REMOVE THIS

// Export gating types (create local types since ./gating doesn't exist)
export type Tier = 'public' | 'free' | 'member' | 'architect' | 'inner-circle';

// Helper functions that are safe for client
export function getRequiredTier(doc: any): string {
  return doc?.requiredTier || 'public';
}

export function normalizeTier(tier: string): Tier {
  const normalized = tier?.toLowerCase() || 'public';
  return (['public', 'free', 'member', 'architect', 'inner-circle'].includes(normalized) 
    ? normalized as Tier 
    : 'public');
}

export function isTierAllowed(userTier: Tier, requiredTier: Tier): boolean {
  const tiers: Tier[] = ['public', 'free', 'member', 'architect', 'inner-circle'];
  const userIndex = tiers.indexOf(userTier);
  const requiredIndex = tiers.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

export function canAccessDoc(doc: any, userTier: Tier = 'public'): boolean {
  const requiredTier = normalizeTier(getRequiredTier(doc));
  return isTierAllowed(userTier, requiredTier);
}

export function isPublic(doc: any): boolean {
  return getAccessLevel(doc) === 'public';
}

// Create simple implementations for missing guards
export function isContentlayerLoaded(): boolean {
  if (typeof window !== 'undefined') {
    return !!(window as any).__contentlayer;
  }
  return true;
}

export function assertContentlayerHasDocs(): void {
  if (!isContentlayerLoaded()) {
    console.warn('ContentLayer data is not loaded. Run contentlayer build first.');
  }
}