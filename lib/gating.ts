/* ============================================================================
 * ENTERPRISE GATING & ACCESS CONTROL SYSTEM
 * Version: 2.1.0
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
 * TIER_HIERARCHY matches the contentlayer-helper definition
 * 'free' | 'basic' | 'premium' | 'enterprise' | 'restricted'
 */
const TIER_HIERARCHY: Record<Tier, number> = {
  "free": 0,
  "basic": 1,
  "premium": 2,
  "enterprise": 3,
  "restricted": 4,
};

// Maps legacy/display names to system tiers
const TIER_NAME_MAP: Record<string, Tier> = {
  "public": "free",
  "inner-circle": "basic", 
  "inner-circle-plus": "premium",
  "inner-circle-elite": "enterprise",
  "private": "restricted",
};

export const resolveTierName = (displayName: string): Tier => {
  const normalized = displayName.toLowerCase().trim();
  return TIER_NAME_MAP[normalized] || normalizeTier(displayName);
};

/* -------------------------------------------------------------------------- */
/* ACCESS CHECKERS                                                            */
/* -------------------------------------------------------------------------- */

export const canAccessByTier = (doc: any, userTier: Tier | string): boolean => {
  if (!doc) return false;
  if (isDraftDoc(doc)) return false;
  if (isPublicDoc(doc)) return true;
  return canAccessDoc(doc, userTier);
};

export const requiresInnerCircle = (doc: any): boolean => {
  if (!doc) return false;
  const tier = getRequiredTier(doc);
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
  
  const userTierValue = options.userTier ? resolveTierName(options.userTier as string) : 'free';
  const { cookies, requirePublished = true } = options;
  
  if (requirePublished && !isPublishedDoc(doc)) {
    return { allowed: false, reason: 'Document is not published' };
  }
  
  if (isDraftDoc(doc)) {
    return { allowed: false, reason: 'Document is a draft' };
  }

  if (isPublicDoc(doc)) return { allowed: true };

  // Tier check
  if (canAccessDoc(doc, userTierValue)) return { allowed: true };
  
  // Legacy cookie check
  if (requiresInnerCircle(doc) && hasInnerCircleAccess(cookies)) {
    return { allowed: true };
  }
  
  return { allowed: false, reason: 'Insufficient access level' };
};

/* -------------------------------------------------------------------------- */
/* UI UTILITIES                                                               */
/* -------------------------------------------------------------------------- */

export const getAccessRedirectUrl = (doc: any, returnTo?: string): string => {
  const tier = getRequiredTier(doc);
  let path = `/membership?required=${tier}`;

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
    "free": "Public",
    "basic": "Inner Circle",
    "premium": "Inner Circle Plus",
    "enterprise": "Inner Circle Elite",
    "restricted": "Private",
  };
  return names[normalized] || "Public";
};

export const filterByAccess = (
  docs: any[],
  options: { userTier?: Tier | string; cookies?: any; includeDrafts?: boolean; } = {}
): any[] => {
  const userTierValue = options.userTier ? resolveTierName(options.userTier as string) : 'free';
  return docs.filter(doc => {
    const { allowed } = checkDocumentAccess(doc, { 
      userTier: userTierValue, 
      cookies: options.cookies, 
      requirePublished: !options.includeDrafts 
    });
    return allowed;
  });
};

/* -------------------------------------------------------------------------- */
/* TIER UTILITIES                                                             */
/* -------------------------------------------------------------------------- */

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
    "basic": "Inner Circle membership content",
    "premium": "Plus membership content with additional resources",
    "enterprise": "Elite level content and features",
    "restricted": "Restricted administrative access",
  };
  return descriptions[normalized] || "Access level not defined";
};

/* -------------------------------------------------------------------------- */
/* EXPORT OBJECT                                                              */
/* -------------------------------------------------------------------------- */

const Gating = {
  // Helper Imports
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  getAccessLevel,
  isPublicDoc,
  isDraftDoc,
  isPublishedDoc,
  
  // Logic
  canAccessByTier,
  requiresInnerCircle,
  hasInnerCircleAccess,
  checkDocumentAccess,
  getAccessRedirectUrl,
  getTierDisplayName,
  filterByAccess,
  resolveTierName,
  isHigherTier,
  isSameOrHigherTier,
  getTierDescription,
  
  // Constants
  TIER_HIERARCHY,
  TIER_NAME_MAP,
};

export default Gating;