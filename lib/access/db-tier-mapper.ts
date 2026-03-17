// lib/access/db-tier-mapper.ts
import type { AccessTier } from "./tier-policy";

export type DbAccessTier = 
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner"
  | "top_secret";  // ✅ Added

export function toDbTier(tier: AccessTier): DbAccessTier {
  switch (tier) {
    case "inner-circle":
      return "inner_circle";
    case "top-secret":      // ✅ Now valid
      return "top_secret";
    default:
      return tier as DbAccessTier;
  }
}

export function fromDbTier(dbTier: DbAccessTier): AccessTier {
  switch (dbTier) {
    case "inner_circle":
      return "inner-circle";
    case "top_secret":       // ✅ Added
      return "top-secret";
    default:
      return dbTier;
  }
}