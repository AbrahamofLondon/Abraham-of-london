import type { EntitlementStatus, EntitlementType, PrismaClient, UserRole } from "@prisma/client";
import type { AccessTier, EffectiveAccess } from "./types";
import { maxTier, normalizeTier } from "./tier";
import { isBootstrapAdminEmail, normalizeAdminEmail } from "./admin-emails";

type MinimalPrisma = Pick<PrismaClient, "user" | "entitlement">;

const ACTIVE_STATUS: EntitlementStatus = "ACTIVE";

function isCurrentlyValid(
  startsAt: Date | null,
  expiresAt: Date | null,
  now: Date,
): boolean {
  if (startsAt && startsAt > now) return false;
  if (expiresAt && expiresAt <= now) return false;
  return true;
}

function roleTier(role: UserRole | null): AccessTier | null {
  if (role === "OWNER") return "owner";
  if (role === "ADMIN") return "architect";
  return null;
}

function bootstrapAccessForEmail(email: string): EffectiveAccess | null {
  const normalized = normalizeAdminEmail(email);
  if (!normalized || !isBootstrapAdminEmail(normalized)) return null;

  const isOwner = normalized === "info@abrahamoflondon.org";
  return {
    userId: null,
    email: normalized,
    role: isOwner ? "OWNER" as UserRole : "ADMIN" as UserRole,
    tier: isOwner ? "owner" as AccessTier : "architect" as AccessTier,
    entitlements: { tiers: [], products: [], artifacts: [] },
    permissions: {
      isAuthenticated: true,
      isAdmin: true,
      isOwner,
    },
  };
}

/**
 * Convenience wrapper for use in NextAuth callbacks and server guards.
 *
 * Accepts a partial session-shaped object and calls getUserAccess with both
 * userId and email, ensuring bootstrap admin emails are authorised even when
 * the DB user ID is not yet set (e.g. when DB was unavailable at JWT time).
 */
export async function getUserAccessFromSession(
  prisma: MinimalPrisma,
  session: {
    user?: {
      id?: string | null;
      email?: string | null;
    };
  } | null | undefined,
): Promise<EffectiveAccess> {
  const userId =
    typeof session?.user?.id === "string" && session.user.id
      ? session.user.id
      : null;
  const email =
    typeof session?.user?.email === "string" ? session.user.email : null;

  return getUserAccess(prisma, userId, email);
}

export async function getUserAccess(
  prisma: MinimalPrisma,
  userId: string | null | undefined,
  email?: string | null | undefined,
): Promise<EffectiveAccess> {
  // If no userId is provided, try bootstrap by email
  if (!userId) {
    if (email) {
      const bootstrapAccess = bootstrapAccessForEmail(email);
      if (bootstrapAccess) return bootstrapAccess;
    }
    return {
      userId: null,
      email: null,
      role: null,
      tier: "public",
      entitlements: { tiers: [], products: [], artifacts: [] },
      permissions: {
        isAuthenticated: false,
        isAdmin: false,
        isOwner: false,
      },
    };
  }

  const now = new Date();

  let user: { id: string; email: string | null; role: UserRole | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
  } catch {
    // DB unavailable — try bootstrap by email if available
    if (email) {
      const bootstrapAccess = bootstrapAccessForEmail(email);
      if (bootstrapAccess) return bootstrapAccess;
    }
    // Fall through to return denied access
  }

  if (!user) {
    // User not found in DB — try bootstrap by email if available
    if (email) {
      const bootstrapAccess = bootstrapAccessForEmail(email);
      if (bootstrapAccess) return bootstrapAccess;
    }
    return {
      userId: null,
      email: null,
      role: null,
      tier: "public",
      entitlements: { tiers: [], products: [], artifacts: [] },
      permissions: {
        isAuthenticated: false,
        isAdmin: false,
        isOwner: false,
      },
    };
  }

  const [entitlements] = await Promise.all([
    prisma.entitlement.findMany({
      where: {
        userId,
        status: ACTIVE_STATUS,
      },
      select: {
        id: true,
        type: true,
        key: true,
        startsAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    }).catch(() => []),
  ]);

  const tiers = new Set<AccessTier>();
  const products = new Set<string>();
  const artifacts = new Set<string>();

  for (const entitlement of entitlements) {
    if (entitlement.revokedAt) continue;
    if (!isCurrentlyValid(entitlement.startsAt, entitlement.expiresAt, now)) {
      continue;
    }

    switch (entitlement.type as EntitlementType) {
      case "TIER":
        tiers.add(normalizeTier(entitlement.key));
        break;
      case "PRODUCT":
        products.add(entitlement.key);
        break;
      case "ARTIFACT":
        artifacts.add(entitlement.key);
        break;
      default:
        break;
    }
  }

  const elevatedTier = roleTier(user.role);
  if (elevatedTier) {
    tiers.add(elevatedTier);
  }

  const ownerRole = user.role === "OWNER";
  const adminRole = user.role === "ADMIN";

  // Hard override: bootstrap admin emails always get admin access
  // regardless of database role state (prevents lockout from role sync issues)
  const normalizedEmail = normalizeAdminEmail(user.email);
  const emailOverride = isBootstrapAdminEmail(normalizedEmail);
  const effectiveAdmin = adminRole || ownerRole || emailOverride;
  const effectiveOwner = ownerRole || (emailOverride && normalizedEmail === "info@abrahamoflondon.org");

  return {
    userId: user.id,
    email: user.email ?? null,
    role: user.role,
    tier: maxTier(Array.from(tiers)),
    entitlements: {
      tiers: Array.from(tiers),
      products: Array.from(products),
      artifacts: Array.from(artifacts),
    },
    permissions: {
      isAuthenticated: true,
      isAdmin: effectiveAdmin,
      isOwner: effectiveOwner,
    },
  };
}
