// lib/access/tier-map.ts — Canonical tier mapping between UI strings and Prisma enum
import { AccessTier as DbTier } from "@prisma/client";

/**
 * Normalize any legacy/app tier input (including hyphenated) into Prisma enum.
 */
export function toDbTier(input: unknown): DbTier {
  const key = String(input ?? "").trim().toLowerCase();
  if (!key) return DbTier.public;

  // direct enum values already
  if (Object.prototype.hasOwnProperty.call(DbTier, key as any)) {
    return (DbTier as any)[key];
  }

  // normalize hyphen variants + aliases
  switch (key) {
    case "public":
    case "open":
    case "free":
    case "guest":
      return DbTier.public;

    case "member":
    case "basic":
    case "standard":
      return DbTier.member;

    case "inner-circle":
    case "inner_circle":
    case "innercircle":
    case "ic":
    case "premium":
    case "verified":
    case "verification":
    case "verified-member":
      return DbTier.inner_circle;

    case "client":
    case "paid":
    case "private":
    case "restricted":
    case "plus":
    case "inner-circle-plus":
    case "inner-circle-pro":
      return DbTier.client;

    case "legacy":
    case "elite":
    case "enterprise":
    case "secret":
    case "inner-circle-elite":
      return DbTier.legacy;

    case "architect":
    case "founder":
    case "partner":
    case "director":
    case "confidential":
      return DbTier.architect;

    case "owner":
    case "admin":
    case "root":
    case "superadmin":
    case "sovereign":
    case "hardened":
    case "top-secret":
    case "top secret":
    case "ts":
      return DbTier.owner;

    default:
      return DbTier.public;
  }
}

/**
 * Convert DB enum tier back to UI string (hyphenated where preferred).
 */
export function toUiTier(tier: DbTier | string | null | undefined): string {
  const t = String(tier ?? "public");
  if (t === "inner_circle") return "inner-circle";
  return t;
}

/**
 * Hierarchy check using DB enum (safe, stable).
 */
export function dbTierAtLeast(userTier: DbTier | unknown, requiredTier: DbTier | unknown): boolean {
  const u = toDbTier(userTier);
  const r = toDbTier(requiredTier);
  const order: DbTier[] = [
    DbTier.public,
    DbTier.member,
    DbTier.inner_circle,
    DbTier.client,
    DbTier.legacy,
    DbTier.architect,
    DbTier.owner,
  ];
  return order.indexOf(u) >= order.indexOf(r);
}