// lib/access/aol-tier-bridge.ts — HYBRID COMPAT (AoLTier → AccessTier SSOT)

import tiers, { type AccessTier } from "@/lib/access/tiers";
import type { AoLTier } from "@/types/next-auth";

export type AnyTierInput = AccessTier | AoLTier | string | null | undefined;

/**
 * normalizeAnyTier()
 * - uses REQUIRED normalization (unknown -> public) to avoid accidental paywalls
 */
export function normalizeAnyTier(input: AnyTierInput): AccessTier {
  return tiers.normalizeRequired(input);
}

export function getTierLabelAny(input: AnyTierInput): string {
  return tiers.getLabel(normalizeAnyTier(input));
}

export function hasAccessAny(userTier: AnyTierInput, requiredTier: AnyTierInput): boolean {
  return tiers.hasAccess(tiers.normalizeUser(userTier), tiers.normalizeRequired(requiredTier));
}

export function requiredTierFromDoc(doc: any): AccessTier {
  return tiers.fromDoc(doc);
}

export const tierBridge = {
  normalize: normalizeAnyTier,
  getLabel: getTierLabelAny,
  hasAccess: hasAccessAny,
  fromDoc: requiredTierFromDoc,
};

export default tierBridge;