// lib/gating.ts — SSOT ALIGNED (keeps legacy export surface)
import type { AccessTier } from "@/lib/access/tier-policy";
import {
  TIER_ORDER,
  getTierLabel,
  hasAccess,
  normalizeRequiredTier,
  normalizeUserTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

import {
  isDraft as isDraftDoc,
  isPublic as isPublicDoc,
  isPublishedContent as isPublishedDoc,
} from "@/lib/content";

// Export the type so other files can use it
export type Tier = AccessTier;

// Keep a numeric hierarchy (some UI logic relies on it)
export const TIER_HIERARCHY: Record<Tier, number> = Object.fromEntries(
  (TIER_ORDER as readonly Tier[]).map((t, i) => [t, i])
) as Record<Tier, number>;

// Back-compat “name map” (SSOT already handles most; keep for explicitness)
export const TIER_NAME_MAP: Record<string, Tier> = {
  public: "public",
  open: "public",
  free: "public",
  guest: "public",

  basic: "member",
  member: "member",
  members: "member",

  "inner-circle": "inner-circle",
  innercircle: "inner-circle",
  inner_circle: "inner-circle",
  ic: "inner-circle",

  premium: "client",
  private: "client",
  restricted: "client",
  confidential: "client",
  "inner-circle-plus": "inner-circle", // legacy mapped by SSOT anyway

  elite: "legacy",
  "inner-circle-elite": "legacy",

  founder: "architect",
  admin: "owner",
  owner: "owner",
};

export const resolveTierName = (displayName: string): Tier => {
  const key = String(displayName ?? "").toLowerCase().trim();
  return TIER_NAME_MAP[key] ?? normalizeUserTier(displayName);
};

/* -------------------------------------------------------------------------- */
/* ACCESS CHECKERS                                                            */
/* -------------------------------------------------------------------------- */

// Back-compat: returns required tier from doc
export const getRequiredTier = (doc: any): Tier => requiredTierFromDoc(doc);

// Back-compat: normalizes any tier-ish string for “user context”
export const normalizeTier = (tier: string | Tier): Tier => normalizeUserTier(tier);

// Back-compat: allowed check
export const isTierAllowed = (requiredTier: Tier, userTier: Tier): boolean =>
  hasAccess(userTier, requiredTier);

// Back-compat: doc check
export const canAccessDoc = (doc: any, userTier: Tier | string): boolean => {
  if (!doc) return false;
  if (isDraftDoc(doc)) return false;
  if (!isPublishedDoc(doc)) return false;
  const user = normalizeUserTier(userTier);
  const required = requiredTierFromDoc(doc);
  return hasAccess(user, required);
};

export const canAccessByTier = (doc: any, userTier: Tier | string): boolean => {
  if (!doc) return false;
  if (isDraftDoc(doc)) return false;
  if (isPublicDoc(doc)) return true;
  return canAccessDoc(doc, userTier);
};

export const requiresInnerCircle = (doc: any): boolean => {
  if (!doc) return false;
  const required = requiredTierFromDoc(doc);
  // “Requires inner-circle” means: required >= inner-circle
  return hasAccess(required, "inner-circle");
};

// Legacy cookie “innerCircleAccess=true” (keep, but don’t trust it as sole proof)
export const hasInnerCircleAccess = (cookies: any): boolean => {
  try {
    return cookies?.get?.("innerCircleAccess")?.value === "true";
  } catch {
    return false;
  }
};

export const checkDocumentAccess = (
  doc: any,
  options: {
    userTier?: Tier | string;
    cookies?: any;
    requirePublished?: boolean;
  } = {}
): { allowed: boolean; reason?: string } => {
  if (!doc) return { allowed: false, reason: "Document not found" };

  const { cookies, requirePublished = true } = options;
  const userTier = normalizeUserTier(options.userTier ?? "public");

  if (requirePublished && !isPublishedDoc(doc)) return { allowed: false, reason: "Document is not published" };
  if (isDraftDoc(doc)) return { allowed: false, reason: "Document is a draft" };
  if (isPublicDoc(doc)) return { allowed: true };

  const required = requiredTierFromDoc(doc);
  if (hasAccess(userTier, required)) return { allowed: true };

  // Legacy cookie bypass only for “inner-circle-ish” content (not client+)
  if (requiresInnerCircle(doc) && !hasAccess(required, "client") && hasInnerCircleAccess(cookies)) {
    return { allowed: true };
  }

  return { allowed: false, reason: "Insufficient access level" };
};

/* -------------------------------------------------------------------------- */
/* UI UTILITIES                                                               */
/* -------------------------------------------------------------------------- */

export const getAccessLevel = (doc: any) => {
  const tier = requiredTierFromDoc(doc);
  return {
    tier,
    requiresAuth: tier !== "public",
    requiresInnerCircle: hasAccess(tier, "inner-circle"),
    requiresAdmin: hasAccess(tier, "architect"), // admin surfaces start at architect+
  };
};

export const getAccessRedirectUrl = (doc: any, returnTo?: string): string => {
  const tier = requiredTierFromDoc(doc);
  let path = `/membership?required=${tier}`;

  // admin login for architect/owner
  if (hasAccess(tier, "architect")) path = "/admin/login";
  else if (hasAccess(tier, "inner-circle")) path = "/inner-circle/locked";

  if (returnTo) {
    const url = new URL(path, "http://localhost");
    url.searchParams.set("returnTo", returnTo);
    return url.pathname + url.search;
  }
  return path;
};

export const getTierDisplayName = (tier: Tier | string): string => {
  return getTierLabel(tier);
};

export const filterByAccess = (
  docs: any[],
  options: { userTier?: Tier | string; cookies?: any; includeDrafts?: boolean } = {}
): any[] => {
  const userTier = normalizeUserTier(options.userTier ?? "public");
  return docs.filter((doc) => {
    const { allowed } = checkDocumentAccess(doc, {
      userTier,
      cookies: options.cookies,
      requirePublished: !options.includeDrafts,
    });
    return allowed;
  });
};

/* -------------------------------------------------------------------------- */
/* TIER UTILITIES                                                             */
/* -------------------------------------------------------------------------- */

export const isHigherTier = (tier1: Tier | string, tier2: Tier | string): boolean => {
  const t1 = normalizeUserTier(tier1);
  const t2 = normalizeUserTier(tier2);
  return TIER_HIERARCHY[t1] > TIER_HIERARCHY[t2];
};

export const isSameOrHigherTier = (tier1: Tier | string, tier2: Tier | string): boolean => {
  const t1 = normalizeUserTier(tier1);
  const t2 = normalizeUserTier(tier2);
  return TIER_HIERARCHY[t1] >= TIER_HIERARCHY[t2];
};

export const getTierDescription = (tier: Tier | string): string => {
  const t = normalizeUserTier(tier);
  const descriptions: Record<Tier, string> = {
    public: "Public content accessible to all visitors",
    member: "Member-only content",
    "inner-circle": "Inner Circle membership content",
    client: "Client-tier content and resources",
    legacy: "Legacy-tier content and archives",
    architect: "Architect-tier administrative and privileged content",
    owner: "Owner-tier sovereign access",
  };
  return descriptions[t] || "Access level not defined";
};

/* -------------------------------------------------------------------------- */
/* EXPORT OBJECT                                                              */
/* -------------------------------------------------------------------------- */

const Gating = {
  getRequiredTier,
  normalizeTier,
  isTierAllowed,
  canAccessDoc,
  getAccessLevel,
  isPublicDoc,
  isDraftDoc,
  isPublishedDoc,

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

  TIER_HIERARCHY,
  TIER_NAME_MAP,
};

export default Gating;