// lib/access/vault-policy.ts — VAULT PATH → REQUIRED TIER
import tiers, { type AccessTier } from "@/lib/access/tiers";

function norm(p: string) {
  return String(p || "").replace(/\\/g, "/").toLowerCase();
}

/**
 * Convention-based policy:
 * private/vault/frameworks/<bucket>/... determines required tier.
 */
export function requiredTierFromVaultPath(filePath: string): AccessTier {
  const p = norm(filePath);

  if (p.includes("/frameworks/public-teasers/")) return "public";
  if (p.includes("/frameworks/inner-circle/")) return "inner-circle";
  if (p.includes("/frameworks/client/")) return "client";
  if (p.includes("/frameworks/legacy/")) return "legacy";      // optional bucket if you add later
  if (p.includes("/frameworks/architect/")) return "architect";
  if (p.includes("/frameworks/owner/")) return "owner";

  // For other private/vault areas, default to member (authenticated)
  return "member";
}