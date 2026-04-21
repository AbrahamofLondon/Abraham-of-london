import {
  type AccessTier,
  hasAccess,
  normalizeUserTier,
} from "@/lib/access/tier-policy";
import type { PdfAssetIdentityResolved } from "@/lib/assets/pdf-identity";

export type UserEntitlementList =
  | string[]
  | {
      assets?: string[];
      artifacts?: string[];
      slugs?: string[];
      products?: string[];
    };

export type UserContext = {
  id?: string | null;
  userId?: string | null;
  authenticated?: boolean;
  tier?: AccessTier | string | null;
  flags?: string[];
  entitlements?: UserEntitlementList;
  entitlementSlugs?: string[];
};

export type PdfAccessDecision = {
  allowed: boolean;
  reason?: string;
  requiredTier?: AccessTier;
};

function entitlementValues(user: UserContext | null): string[] {
  if (!user) return [];

  const values: string[] = [];
  if (Array.isArray(user.entitlements)) {
    values.push(...user.entitlements);
  } else if (user.entitlements) {
    values.push(...(user.entitlements.assets || []));
    values.push(...(user.entitlements.artifacts || []));
    values.push(...(user.entitlements.slugs || []));
  }

  values.push(...(user.entitlementSlugs || []));
  values.push(...(user.flags || []).filter((flag) => flag.startsWith("entitlement:")));

  return values.map((value) =>
    value
      .replace(/^entitlement:/, "")
      .replace(/^asset:/, "")
      .replace(/^artifact:/, "")
      .trim()
      .toLowerCase(),
  );
}

export function hasExplicitPdfEntitlement(
  user: UserContext | null,
  slug: string,
): boolean {
  const wanted = slug.trim().toLowerCase();
  if (!wanted) return false;
  return entitlementValues(user).includes(wanted);
}

export function getUserContextId(user: UserContext | null): string | null {
  return user?.id || user?.userId || null;
}

export function canAccessPdfAsset(
  user: UserContext | null,
  asset: PdfAssetIdentityResolved,
): PdfAccessDecision {
  if (asset.access === "public") {
    return { allowed: true, reason: "Public asset" };
  }

  if (hasExplicitPdfEntitlement(user, asset.slug)) {
    return { allowed: true, reason: "Explicit asset entitlement" };
  }

  if (asset.access === "inner_circle") {
    const userTier = normalizeUserTier(user?.tier);
    if (hasAccess(userTier, "inner_circle")) {
      return { allowed: true, reason: "Inner Circle tier satisfied" };
    }

    return {
      allowed: false,
      reason: "Inner Circle tier required",
      requiredTier: "inner_circle",
    };
  }

  if (asset.access === "restricted") {
    return {
      allowed: false,
      reason: "Explicit entitlement required for restricted asset",
      requiredTier: "restricted",
    };
  }

  return {
    allowed: false,
    reason: "Purchase entitlement required",
    requiredTier: "client",
  };
}
