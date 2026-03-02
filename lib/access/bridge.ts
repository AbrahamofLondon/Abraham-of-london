// lib/access/bridge.ts - AoLTier compatibility layer (uses SSOT)
import tiers, { type AccessTier } from "./tiers";
import type { AoLTier } from "@/types/next-auth";

export type AnyTierInput = AccessTier | AoLTier | string | null | undefined;

/**
 * Legacy → New Relationship Ladder mapping
 *
 * New ladder (ascending):
 * public < member < inner-circle < client < legacy < architect < owner
 *
 * Design rule:
 * - Unknown REQUIRED must never create a paywall → default public (tiers.normalizeRequired)
 * - Unknown USER must never grant privilege → default public (tiers.normalizeUser)
 */
const AOL_TO_ACCESS: Record<string, AccessTier> = {
  // ─────────────────────────
  // Public / Free
  // ─────────────────────────
  public: "public",
  free: "public",
  open: "public",
  unclassified: "public",
  guest: "public",

  // ─────────────────────────
  // Member / Entry authenticated
  // ─────────────────────────
  member: "member",
  members: "member",
  basic: "member",
  "inner-circle": "inner-circle",
  innercircle: "inner-circle",
  inner_circle: "inner-circle",
  ic: "inner-circle",

  // “Plus/Pro” historically meant “above member”
  // In your new ladder, that belongs in inner-circle.
  "inner-circle-plus": "inner-circle",
  "inner-circle-pro": "inner-circle",

  // ─────────────────────────
  // Old “Verified” era
  // ─────────────────────────
  verified: "inner-circle",
  verification: "inner-circle",
  "verified-member": "inner-circle",

  // ─────────────────────────
  // Old “Restricted / Premium / Private” era
  // ─────────────────────────
  private: "client",      // private content is usually client-facing
  premium: "client",
  restricted: "client",
  confidential: "client",
  secret: "legacy",       // “secret” tends to be above client once relationship matures
  "session-expired": "public",

  // ─────────────────────────
  // Your new explicit relationship tiers
  // ─────────────────────────
  client: "client",
  legacy: "legacy",
  architect: "architect",
  owner: "owner",

  // ─────────────────────────
  // Old “top-secret” / “sovereign” / “hardened” era
  // ─────────────────────────
  "top-secret": "owner",
  "top secret": "owner",
  ts: "owner",
  sovereign: "owner",
  hardened: "owner",
  "inner-circle-elite": "legacy", // elite ≈ long-term inner ring; map to legacy unless you want owner
};

/**
 * Normalize any input to AccessTier (delegates to SSOT)
 * 
 * IMPORTANT:
 * - For REQUIRED context: we must NOT accidentally lock content → normalizeRequired
 * - For USER context: use normalizeUser (handled in hasAccessAny)
 */
export function normalizeAnyTier(input: AnyTierInput): AccessTier {
  if (input === null || input === undefined) return "public";
  
  const raw = String(input).trim().toLowerCase();
  if (!raw) return "public";

  const mapped = AOL_TO_ACCESS[raw];
  if (mapped) return mapped;

  // Unknown here should NOT create paywalls (safe default)
  return tiers.normalizeRequired(raw);
}

/**
 * Get label for any tier input
 */
export function getTierLabelAny(input: AnyTierInput): string {
  return tiers.getLabel(normalizeAnyTier(input));
}

/**
 * Check access with hybrid inputs
 * - userTier is normalized with normalizeUser (never elevates)
 * - requiredTier is normalized with normalizeRequired (never locks accidentally)
 */
export function hasAccessAny(userTier: AnyTierInput, requiredTier: AnyTierInput): boolean {
  const user = tiers.normalizeUser(userTier);
  const required = tiers.normalizeRequired(requiredTier);
  return tiers.hasAccess(user, required);
}

/**
 * Document tier extraction (delegates to SSOT)
 */
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