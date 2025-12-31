// lib/gating.ts
// Centralized content gating and access control

// Import Tier type directly
import type { Tier as TierType } from "@/lib/contentlayer-helper";

// Import other functions
import {
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  getAccessLevel,
  isPublic as isPublicDoc,
  isDraft as isDraftDoc,
  isPublishedContent as isPublishedDoc,
} from "@/lib/contentlayer-helper";

// Re-export Tier type
export type Tier = TierType;

// Re-export tier functions
export {
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  getAccessLevel,
  isPublicDoc,
  isDraftDoc,
  isPublishedDoc,
};

/**
 * Enhanced access control with multiple check types
 */

// Check if user can access document based on tier
export const canAccessByTier = (doc: any, userTier: Tier | string): boolean => {
  if (!doc) return false;
  
  // Check draft status
  if (isDraftDoc(doc)) return false;
  
  // Check public access first (fast path)
  if (isPublicDoc(doc)) return true;
  
  // Check tier-based access
  return canAccessDoc(doc, userTier);
};

// Check if document requires inner circle access
export const requiresInnerCircle = (doc: any): boolean => {
  if (!doc) return false;
  
  const tier = getRequiredTier(doc);
  const accessLevel = getAccessLevel(doc);
  
  // Documents with 'restricted' tier or 'private' access level require inner circle
  return tier === 'restricted' || accessLevel === 'private' || accessLevel === 'restricted';
};

// Check if user has inner circle access
export const hasInnerCircleAccess = (cookies: any): boolean => {
  return cookies?.get('innerCircleAccess')?.value === 'true';
};

// Comprehensive access check combining all methods
export const checkDocumentAccess = (
  doc: any, 
  options: {
    userTier?: Tier | string;
    cookies?: any;
    requirePublished?: boolean;
  } = {}
): { allowed: boolean; reason?: string } => {
  if (!doc) {
    return { allowed: false, reason: 'Document not found' };
  }
  
  const { userTier = 'free', cookies, requirePublished = true } = options;
  
  // Check if document is published
  if (requirePublished && !isPublishedDoc(doc)) {
    return { allowed: false, reason: 'Document is not published' };
  }
  
  // Check if document is a draft
  if (isDraftDoc(doc)) {
    return { allowed: false, reason: 'Document is a draft' };
  }
  
  // Check public access
  if (isPublicDoc(doc)) {
    return { allowed: true };
  }
  
  // Check tier-based access
  const tierAllowed = canAccessDoc(doc, userTier);
  if (tierAllowed) {
    return { allowed: true };
  }
  
  // Check inner circle access for restricted content
  if (requiresInnerCircle(doc)) {
    const hasInnerCircle = hasInnerCircleAccess(cookies);
    if (hasInnerCircle) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Inner circle access required' };
  }
  
  // Default: not allowed
  return { allowed: false, reason: 'Insufficient access level' };
};

// Helper to get redirect URL for unauthorized access
export const getAccessRedirectUrl = (
  doc: any,
  returnTo?: string
): string => {
  let redirectPath = '/inner-circle/locked';
  
  if (requiresInnerCircle(doc)) {
    redirectPath = '/inner-circle/locked';
  } else {
    // For tier-based restrictions, show upgrade page
    const requiredTier = getRequiredTier(doc);
    if (requiredTier !== 'free') {
      redirectPath = `/upgrade?required=${requiredTier}`;
    }
  }
  
  if (returnTo) {
    const url = new URL(redirectPath, 'http://localhost');
    url.searchParams.set('returnTo', returnTo);
    return url.pathname + url.search;
  }
  
  return redirectPath;
};

// Tier comparison helpers
export const isHigherTier = (tier1: Tier | string, tier2: Tier | string): boolean => {
  const tierOrder: Record<Tier, number> = {
    'free': 0,
    'basic': 1,
    'premium': 2,
    'enterprise': 3,
    'restricted': 4,
  };
  
  const t1 = normalizeTier(tier1);
  const t2 = normalizeTier(tier2);
  
  return tierOrder[t1] > tierOrder[t2];
};

export const getTierDisplayName = (tier: Tier | string): string => {
  const normalized = normalizeTier(tier);
  
  const displayNames: Record<Tier, string> = {
    'free': 'Free',
    'basic': 'Basic',
    'premium': 'Premium',
    'enterprise': 'Enterprise',
    'restricted': 'Inner Circle',
  };
  
  return displayNames[normalized];
};

export const getTierDescription = (tier: Tier | string): string => {
  const normalized = normalizeTier(tier);
  
  const descriptions: Record<Tier, string> = {
    'free': 'Access to free content only',
    'basic': 'Basic content access',
    'premium': 'Premium content and features',
    'enterprise': 'Full enterprise access',
    'restricted': 'Exclusive inner circle content',
  };
  
  return descriptions[normalized];
};

// Document filtering by access level
export const filterByAccess = (
  docs: any[],
  options: {
    userTier?: Tier | string;
    cookies?: any;
    includeDrafts?: boolean;
  } = {}
): any[] => {
  const { userTier = 'free', cookies, includeDrafts = false } = options;
  
  return docs.filter(doc => {
    // Skip drafts unless explicitly included
    if (!includeDrafts && isDraftDoc(doc)) {
      return false;
    }
    
    // Check access
    const { allowed } = checkDocumentAccess(doc, {
      userTier,
      cookies,
      requirePublished: !includeDrafts,
    });
    
    return allowed;
  });
};

// Default export for convenience
const Gating = {
  // Types
  Tier,
  
  // Core tier functions
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  
  // Access level functions
  getAccessLevel,
  isPublicDoc,
  isDraftDoc,
  isPublishedDoc,
  
  // Enhanced access control
  canAccessByTier,
  requiresInnerCircle,
  hasInnerCircleAccess,
  checkDocumentAccess,
  getAccessRedirectUrl,
  
  // Tier utilities
  isHigherTier,
  getTierDisplayName,
  getTierDescription,
  
  // Document filtering
  filterByAccess,
};

export default Gating;