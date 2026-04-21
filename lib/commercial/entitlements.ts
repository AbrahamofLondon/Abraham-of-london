import { prisma } from "@/lib/prisma";

export type AssetEntitlement = {
  userId: string;
  slug: string;
  source: string;
  grantedAt: string;
};

const memoryEntitlements = new Map<string, AssetEntitlement>();

function normalizeSlug(slug: unknown): string {
  return String(slug ?? "").trim().toLowerCase();
}

function memoryKey(userId: string, slug: string): string {
  return `${userId}:${normalizeSlug(slug)}`;
}

function isActiveEntitlement(entry: {
  startsAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
}): boolean {
  const now = Date.now();
  if (entry.revokedAt) return false;
  if (entry.startsAt && entry.startsAt.getTime() > now) return false;
  if (entry.expiresAt && entry.expiresAt.getTime() <= now) return false;
  return true;
}

export async function getUserEntitlements(
  userId: string | null | undefined,
): Promise<AssetEntitlement[]> {
  if (!userId) return [];

  try {
    const rows = await prisma.entitlement.findMany({
      where: {
        userId,
        type: "ARTIFACT",
        status: "ACTIVE",
      },
      select: {
        key: true,
        metadata: true,
        issuedAt: true,
        startsAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    return rows
      .filter(isActiveEntitlement)
      .map((row) => ({
        userId,
        slug: normalizeSlug(row.key),
        source:
          typeof row.metadata === "object" &&
          row.metadata &&
          "source" in row.metadata
            ? String(row.metadata.source)
            : "db",
        grantedAt: row.issuedAt.toISOString(),
      }));
  } catch {
    return Array.from(memoryEntitlements.values()).filter(
      (entry) => entry.userId === userId,
    );
  }
}

export async function hasAssetEntitlement(
  userId: string | null | undefined,
  slug: string,
): Promise<boolean> {
  if (!userId) return false;
  const normalized = normalizeSlug(slug);
  if (!normalized) return false;

  const entitlements = await getUserEntitlements(userId);
  return entitlements.some((entry) => entry.slug === normalized);
}

export async function grantEntitlement(
  userId: string,
  slug: string,
  source: string,
): Promise<AssetEntitlement> {
  const normalized = normalizeSlug(slug);
  if (!userId || !normalized) {
    throw new Error("userId and slug are required to grant an entitlement.");
  }

  const grantedAt = new Date();
  const entitlement: AssetEntitlement = {
    userId,
    slug: normalized,
    source,
    grantedAt: grantedAt.toISOString(),
  };

  try {
    const existing = await prisma.entitlement.findFirst({
      where: {
        userId,
        type: "ARTIFACT",
        key: normalized,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      await prisma.entitlement.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          startsAt: null,
          expiresAt: null,
          revokedAt: null,
          revokedBy: null,
          reason: null,
          issuedBy: source,
          metadata: { source },
        },
      });
    } else {
      await prisma.entitlement.create({
        data: {
          userId,
          type: "ARTIFACT",
          key: normalized,
          status: "ACTIVE",
          issuedBy: source,
          metadata: { source },
        },
      });
    }
  } catch {
    memoryEntitlements.set(memoryKey(userId, normalized), entitlement);
  }

  return entitlement;
}

export function resetInMemoryEntitlementsForTests(): void {
  memoryEntitlements.clear();
}
