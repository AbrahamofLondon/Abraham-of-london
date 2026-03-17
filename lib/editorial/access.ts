// lib/editorial/access.ts

import type { PublicationRecord } from "./types";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

export function canAccessPublication(
  item: PublicationRecord,
  userTier: string | null | undefined,
): boolean {
  const tier = normalizeUserTier(userTier || "public");

  // Publication tier defaults to public
  const requiredTier = normalizeUserTier(item.tier || "public");

  return hasAccess(tier, requiredTier);
}