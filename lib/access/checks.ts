import type { AccessTier, EffectiveAccess } from "./types";
import { hasTier } from "./tier";

export function canAccessTier(
  access: EffectiveAccess,
  required: AccessTier,
): boolean {
  return hasTier(access.tier, required);
}

export function canAccessProduct(
  access: EffectiveAccess,
  key: string,
): boolean {
  return access.permissions.isAdmin || access.entitlements.products.includes(key);
}

export function canAccessArtifact(
  access: EffectiveAccess,
  key: string,
): boolean {
  return access.permissions.isAdmin || access.entitlements.artifacts.includes(key);
}
