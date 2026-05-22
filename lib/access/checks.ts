import type { AccessTier, EffectiveAccess } from "./types";
import { hasTier } from "./tier";

export function canAccessTier(
  access: EffectiveAccess,
  required: AccessTier,
): boolean {
  return hasTier(access.tier, required);
}

export function canAccessAdmin(access: EffectiveAccess): boolean {
  return access.permissions.isAdmin;
}

export function canAccessOwner(access: EffectiveAccess): boolean {
  return access.permissions.isOwner;
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
