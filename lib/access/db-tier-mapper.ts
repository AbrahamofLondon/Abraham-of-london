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
  return tier as DbAccessTier;
}

export function fromDbTier(dbTier: DbAccessTier): AccessTier {
  return dbTier;
}