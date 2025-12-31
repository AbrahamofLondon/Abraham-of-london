/* ============================================================================
 * ENTERPRISE GATING & ACCESS CONTROL SYSTEM
 * Version: 2.0.0
 * ============================================================================ */

import type { Tier as TierType } from "@/lib/contentlayer-helper";
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

// Export the type so other files can use it
export type Tier = TierType;

/**
 * TIER_HIERARCHY must match the hierarchy defined in contentlayer-helper.ts
 * Based on your original Tier type: 'free' | 'basic' | 'premium' | 'enterprise' | 'restricted'
 */
const TIER_HIERARCHY: Record<Tier, number> = {
  "free": 0,
  "basic": 1,
  "premium": 2,
  "enterprise": 3,
  "restricted": 4,
};

// Helper to map your new naming convention to the actual Tier values
const TIER_NAME_MAP: Record<string, Tier> = {
  "public": "free",
  "inner-circle": "restricted", // or "premium" depending on your hierarchy
  "inner-circle-plus": "enterprise",
  "inner-circle-elite": "enterprise", // or create a new tier if needed
  "private": "restricted",
};

/**
 * Convert display tier names to actual Tier values
 */
export const resolveTierName = (displayName: string): Tier => {
  const normalized = displayName.toLowerCase().trim();
  return TIER_NAME_MAP[normalized] || normalizeTier(displayName);
};

/**
 * Access Checkers
 */
export const canAccessByTier = (doc: any, userTier: Tier | string): boolean => {
  if (!doc) return false;
  if (isDraftDoc(doc)) return false;
  if (isPublicDoc(doc)) return true;
  return canAccessDoc(doc, userTier);
};

export const requiresInnerCircle = (doc: any): boolean => {
  if (!doc) return false;
  const tier = getRequiredTier(doc);
  // Any tier higher than 'free' requires at least basic membership
  return TIER_HIERARCHY[tier] >= TIER_HIERARCHY["basic"];
};

export const hasInnerCircleAccess = (cookies: any): boolean => {
  return cookies?.get('innerCircleAccess')?.value === 'true';
};

export const checkDocumentAccess = (
  doc: any, 
  options: {
    userTier?: Tier | string;
    cookies?: any;
    requirePublished?: boolean;
  } = {}
): { allowed: boolean; reason?: string } => {
  if (!doc) return { allowed: false, reason: 'Document not found' };
  
  // Convert display tier names to actual Tier values if needed
  const userTierValue = options.userTier ? resolveTierName(options.userTier as string) : 'free';
  const { cookies, requirePublished = true } = options;
  
  if (requirePublished && !isPublishedDoc(doc)) {
    return { allowed: false, reason: 'Document is not published' };
  }
  
  if (isDraftDoc(doc)) {
    return { allowed: false, reason: 'Document is a draft' };
  }

  if (isPublicDoc(doc)) return { allowed: true };

  // Tier check logic
  if (canAccessDoc(doc, userTierValue)) return { allowed: true };
  
  // Cookie fallback for specific restricted legacy content
  if (requiresInnerCircle(doc) && hasInnerCircleAccess(cookies)) {
    return { allowed: true };
  }
  
  return { allowed: false, reason: 'Insufficient access level' };
};

/**
 * UI & Routing Helpers
 */
export const getAccessRedirectUrl = (doc: any, returnTo?: string): string => {
  const tier = getRequiredTier(doc);
  let path = `/membership?required=${tier}`;

  // Map tier to appropriate redirect page
  if (tier === "restricted") {
    path = "/admin/login";
  } else if (TIER_HIERARCHY[tier] >= TIER_HIERARCHY["basic"]) {
    path = "/inner-circle/locked";
  }
  
  if (returnTo) {
    const url = new URL(path, 'http://localhost');
    url.searchParams.set('returnTo', returnTo);
    return url.pathname + url.search;
  }
  
  return path;
};

export const getTierDisplayName = (tier: Tier | string): string => {
  const normalized = normalizeTier(tier);
  const names: Record<Tier, string> = {
    "free": "Free",
    "basic": "Basic",
    "premium": "Premium",
    "enterprise": "Enterprise",
    "restricted": "Restricted",
  };
  return names[normalized] || "Free";
};

/**
 * Filter a document array based on permissions
 */
export const filterByAccess = (
  docs: any[],
  options: { userTier?: Tier | string; cookies?: any; includeDrafts?: boolean; } = {}
): any[] => {
  const userTierValue = options.userTier ? resolveTierName(options.userTier as string) : 'free';
  const { cookies, includeDrafts = false } = options;
  
  return docs.filter(doc => {
    const { allowed } = checkDocumentAccess(doc, { 
      userTier: userTierValue, 
      cookies, 
      requirePublished: !includeDrafts 
    });
    return allowed;
  });
};

/**
 * Additional utility functions
 */
export const isHigherTier = (tier1: Tier | string, tier2: Tier | string): boolean => {
  const t1 = normalizeTier(tier1);
  const t2 = normalizeTier(tier2);
  return TIER_HIERARCHY[t1] > TIER_HIERARCHY[t2];
};

export const isSameOrHigherTier = (tier1: Tier | string, tier2: Tier | string): boolean => {
  const t1 = normalizeTier(tier1);
  const t2 = normalizeTier(tier2);
  return TIER_HIERARCHY[t1] >= TIER_HIERARCHY[t2];
};

export const getTierDescription = (tier: Tier | string): string => {
  const normalized = normalizeTier(tier);
  const descriptions: Record<Tier, string> = {
    "free": "Public content accessible to all visitors",
    "basic": "Basic membership content",
    "premium": "Premium content with additional resources",
    "enterprise": "Enterprise-level content and features",
    "restricted": "Restricted access content",
  };
  return descriptions[normalized] || "Access level not defined";
};

/* -------------------------------------------------------------------------- */
/* Compatibility layer for old code                                           */
/* -------------------------------------------------------------------------- */

// These functions maintain compatibility with code expecting the old tier names
export const requiresInnerCircleLegacy = (doc: any): boolean => {
  return requiresInnerCircle(doc);
};

export const getAccessRedirectUrlLegacy = (doc: any, returnTo?: string): string => {
  return getAccessRedirectUrl(doc, returnTo);
};

/* -------------------------------------------------------------------------- */
/* Default export for convenience                                             */
/* -------------------------------------------------------------------------- */
const Gating = {
  // Tier type (exported separately as type)
  
  // Functions from contentlayer-helper
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  getAccessLevel,
  isPublicDoc,
  isDraftDoc,
  isPublishedDoc,
  
  // Enhanced access control functions
  canAccessByTier,
  requiresInnerCircle,
  hasInnerCircleAccess,
  checkDocumentAccess,
  getAccessRedirectUrl,
  getTierDisplayName,
  filterByAccess,
  resolveTierName,
  
  // Additional utilities
  isHigherTier,
  isSameOrHigherTier,
  getTierDescription,
  
  // Compatibility functions
  requiresInnerCircleLegacy,
  getAccessRedirectUrlLegacy,
  
  // Tier hierarchy constant (value, not type)
  TIER_HIERARCHY,
  TIER_NAME_MAP,
};

export default Gating;