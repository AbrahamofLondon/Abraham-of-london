// lib/access/db-tier-mapper.ts
import type { AccessTier } from "./tier-policy";

export type DbAccessTier =
  | "public"
  | "member"
  | "professional"
  | "inner_circle"  // Legacy DB value — still valid in Prisma enum
  | "client"
  | "legacy"
  | "architect"
  | "owner"
  | "top_secret";

export function toDbTier(tier: AccessTier): DbAccessTier {
  return tier as DbAccessTier;
}

export function fromDbTier(dbTier: DbAccessTier): AccessTier {
  return dbTier;
}