/**
 * Entitlement System — Server-side SSOT for access resolution.
 *
 * This module is the single authority for determining what a user can access.
 * Every page, API route, and download endpoint must use getUserAccess() —
 * no ad-hoc tier checks, no client-side-only gates.
 */

import { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntitlementGrant = {
  type: "tier" | "artifact" | "product";
  key: string;
};

export type UserAccess = {
  /** Highest active tier entitlement (e.g. "inner_circle") */
  tier: string;
  /** All active entitlements by type */
  entitlements: {
    tiers: string[];
    artifacts: string[];
    products: string[];
  };
  /** Flat permission checks */
  permissions: {
    isAdmin: boolean;
    isInternal: boolean;
    canAccessInnerCircle: boolean;
    canAccessVault: boolean;
  };
};

// Tier hierarchy — higher number = more access
const TIER_RANK: Record<string, number> = {
  public: 0,
  member: 1,
  inner_circle: 2,
  restricted: 3,
  client: 4,
  legacy: 5,
  architect: 6,
  owner: 7,
  top_secret: 8,
};

// ---------------------------------------------------------------------------
// Prisma singleton
// ---------------------------------------------------------------------------

let _prisma: PrismaClient | null = null;

function prisma(): PrismaClient {
  if (!_prisma) {
    _prisma = new PrismaClient();
  }
  return _prisma;
}

// ---------------------------------------------------------------------------
// Core access resolution
// ---------------------------------------------------------------------------

/**
 * getUserAccess — the SSOT for all access decisions.
 *
 * Loads the user's active entitlements from the database, computes
 * their effective tier (highest active tier entitlement), and returns
 * a structured access object.
 *
 * Call this from getServerSideProps, API routes, and middleware.
 * Never duplicate this logic.
 */
export async function getUserAccess(userId: string): Promise<UserAccess> {
  const db = prisma();

  const [member, entitlements] = await Promise.all([
    db.innerCircleMember.findUnique({
      where: { id: userId },
      select: { role: true, tier: true, flags: true },
    }),
    db.entitlement.findMany({
      where: {
        userId,
        status: "active",
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { issuedAt: "desc" },
    }),
  ]);

  // Partition entitlements by type
  const tiers: string[] = [];
  const artifacts: string[] = [];
  const products: string[] = [];

  for (const e of entitlements) {
    switch (e.type) {
      case "tier":
        tiers.push(e.key);
        break;
      case "artifact":
        artifacts.push(e.key);
        break;
      case "product":
        products.push(e.key);
        break;
    }
  }

  // Include the user's base tier from their member record
  const baseTier = member?.tier ?? "public";
  if (!tiers.includes(baseTier)) {
    tiers.push(baseTier);
  }

  // Compute effective tier — highest ranked active tier
  const effectiveTier = tiers.reduce((best, t) => {
    return (TIER_RANK[t] ?? 0) > (TIER_RANK[best] ?? 0) ? t : best;
  }, "public");

  // Parse flags
  const flags = parseFlags(member?.flags);
  const isInternal = flags.includes("internal");
  const role = member?.role ?? "MEMBER";
  const isAdmin = role === "ADMIN" || isInternal;

  return {
    tier: effectiveTier,
    entitlements: { tiers, artifacts, products },
    permissions: {
      isAdmin,
      isInternal,
      canAccessInnerCircle: (TIER_RANK[effectiveTier] ?? 0) >= TIER_RANK.inner_circle,
      canAccessVault: (TIER_RANK[effectiveTier] ?? 0) >= TIER_RANK.member,
    },
  };
}

// ---------------------------------------------------------------------------
// Access checks
// ---------------------------------------------------------------------------

/**
 * Check if a user's access level meets the required tier.
 */
export function hasTierAccess(access: UserAccess, requiredTier: string): boolean {
  return (TIER_RANK[access.tier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

/**
 * Check if a user has a specific artifact entitlement.
 */
export function hasArtifactAccess(access: UserAccess, artifactKey: string): boolean {
  // Owner/admin bypass
  if (access.permissions.isAdmin) return true;
  return access.entitlements.artifacts.includes(artifactKey);
}

/**
 * Check if a user has a specific product entitlement.
 */
export function hasProductAccess(access: UserAccess, productKey: string): boolean {
  if (access.permissions.isAdmin) return true;
  return access.entitlements.products.includes(productKey);
}

// ---------------------------------------------------------------------------
// Access key redemption
// ---------------------------------------------------------------------------

/**
 * Redeem an access key — validates the key, issues entitlements, increments usage.
 *
 * Returns the list of grants if successful, or an error string if not.
 */
export async function redeemAccessKey(
  userId: string,
  code: string,
): Promise<{ ok: true; grants: EntitlementGrant[] } | { ok: false; error: string }> {
  const db = prisma();

  const key = await db.accessKey.findUnique({ where: { code } });

  if (!key) {
    return { ok: false, error: "INVALID_KEY" };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { ok: false, error: "KEY_EXPIRED" };
  }

  if (key.uses >= key.maxUses) {
    return { ok: false, error: "KEY_EXHAUSTED" };
  }

  // Parse grants
  let grants: EntitlementGrant[];
  try {
    grants = JSON.parse(key.grants) as EntitlementGrant[];
  } catch {
    return { ok: false, error: "INVALID_KEY_FORMAT" };
  }

  // Issue entitlements + increment usage in a transaction
  await db.$transaction(async (tx) => {
    for (const grant of grants) {
      await tx.entitlement.upsert({
        where: {
          userId_type_key: { userId, type: grant.type as any, key: grant.key },
        },
        create: {
          userId,
          type: grant.type as any,
          key: grant.key,
          status: "active",
          issuedBy: `access_key:${key.code}`,
        },
        update: {
          status: "active",
          issuedBy: `access_key:${key.code}`,
          issuedAt: new Date(),
        },
      });
    }

    await tx.accessKey.update({
      where: { code },
      data: { uses: { increment: 1 } },
    });
  });

  return { ok: true, grants };
}

// ---------------------------------------------------------------------------
// Admin utilities
// ---------------------------------------------------------------------------

const ADMIN_SEED_EMAILS = (process.env.ADMIN_SEED_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);

/**
 * Check if an email is in the admin seed list.
 */
export function isAdminEmail(email: string): boolean {
  return ADMIN_SEED_EMAILS.includes(email.toLowerCase());
}

/**
 * Ensure admin role for seed emails. Call during app startup or seed.
 */
export async function seedAdminRoles(): Promise<void> {
  if (ADMIN_SEED_EMAILS.length === 0) return;
  const db = prisma();

  for (const email of ADMIN_SEED_EMAILS) {
    await db.innerCircleMember.updateMany({
      where: { email },
      data: { role: "ADMIN" },
    });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseFlags(flags: string | null | undefined): string[] {
  if (!flags) return [];
  try {
    const parsed = JSON.parse(flags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
