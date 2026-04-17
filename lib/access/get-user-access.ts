import type { PrismaClient, EntitlementType, EntitlementStatus } from "@prisma/client";
import type { AccessTier, EffectiveAccess } from "./types";
import { maxTier } from "./tier";

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

export async function getUserAccess(
  prisma: MinimalPrisma,
  userId: string | null | undefined,
): Promise<EffectiveAccess> {
  if (!userId) {
    return {
      userId: null,
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

  const [user, entitlements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    }),
    prisma.entitlement.findMany({
      where: {
        userId,
        status: ACTIVE_STATUS,
      },
      select: {
        type: true,
        key: true,
        startsAt: true,
        expiresAt: true,
      },
    }),
  ]);

  if (!user) {
    return {
      userId: null,
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

  const tiers: AccessTier[] = [];
  const products: string[] = [];
  const artifacts: string[] = [];

  for (const entitlement of entitlements) {
    if (!isCurrentlyValid(entitlement.startsAt, entitlement.expiresAt, now)) {
      continue;
    }

    switch (entitlement.type as EntitlementType) {
      case "TIER":
        tiers.push(entitlement.key as AccessTier);
        break;
      case "PRODUCT":
        products.push(entitlement.key);
        break;
      case "ARTIFACT":
        artifacts.push(entitlement.key);
        break;
      default:
        break;
    }
  }

  const adminRole = user.role === "ADMIN";
  const ownerRole = user.role === "OWNER";

  if (ownerRole) {
    tiers.push("owner");
  } else if (adminRole) {
    tiers.push("architect");
  }

  return {
    userId: user.id,
    role: user.role,
    tier: maxTier(tiers),
    entitlements: {
      tiers: Array.from(new Set(tiers)),
      products: Array.from(new Set(products)),
      artifacts: Array.from(new Set(artifacts)),
    },
    permissions: {
      isAuthenticated: true,
      isAdmin: adminRole || ownerRole,
      isOwner: ownerRole,
    },
  };
}