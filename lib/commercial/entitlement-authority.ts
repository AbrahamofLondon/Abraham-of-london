import { prisma } from "@/lib/prisma";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

export type CanonicalEntitlementSource =
  | "purchase"
  | "tier"
  | "manual"
  | "legacy_email"
  | "legacy_user";

export type CanonicalEntitlement = {
  granted: boolean;
  source?: CanonicalEntitlementSource;
  userId?: string | null;
  email?: string | null;
  slug: string;
  verified: boolean;
};

type CanonicalGrantSource = "purchase" | "tier" | "manual";

const canonicalMemory = new Map<string, CanonicalEntitlement>();

function normalizeSlug(slug: unknown): string {
  return String(slug ?? "").trim().replace(/\.pdf$/i, "").toLowerCase();
}

function normalizeEmail(email: unknown): string | null {
  const value = String(email ?? "").trim().toLowerCase();
  return value.includes("@") ? value : null;
}

function normalizeUserId(userId: unknown): string | null {
  const value = String(userId ?? "").trim();
  return value || null;
}

function canonicalEmailKey(input: {
  userId?: string | null;
  email?: string | null;
}): string | null {
  const email = normalizeEmail(input.email);
  if (email) return email;
  const userId = normalizeUserId(input.userId);
  return userId ? `user:${userId}` : null;
}

function isActiveDateWindow(entry: {
  startsAt?: Date | null;
  endsAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
}): boolean {
  const now = Date.now();
  if (entry.revokedAt) return false;
  if (entry.startsAt && entry.startsAt.getTime() > now) return false;
  const end = entry.endsAt ?? entry.expiresAt ?? null;
  if (end && end.getTime() <= now) return false;
  return true;
}

function sourceRank(source: CanonicalEntitlementSource | undefined): number {
  switch (source) {
    case "purchase":
      return 50;
    case "manual":
      return 40;
    case "tier":
      return 30;
    case "legacy_user":
      return 20;
    case "legacy_email":
      return 10;
    default:
      return 0;
  }
}

function winner(
  candidates: CanonicalEntitlement[],
  input: { userId?: string | null; email?: string | null; slug: string },
): CanonicalEntitlement {
  const granted = candidates
    .filter((candidate) => candidate.granted)
    .sort((a, b) => sourceRank(b.source) - sourceRank(a.source))[0];

  if (candidates.length > 1) {
    const states = candidates.map((candidate) => ({
      source: candidate.source,
      granted: candidate.granted,
      verified: candidate.verified,
    }));
    const diverged = new Set(states.map((state) => `${state.granted}:${state.verified}`)).size > 1;
    if (diverged) {
      console.warn("[CANONICAL_ENTITLEMENT_MISMATCH]", {
        userId: input.userId ?? null,
        email: input.email ?? null,
        slug: input.slug,
        candidates: states,
        winner: granted?.source ?? "none",
      });
    }
  }

  return (
    granted ?? {
      granted: false,
      userId: input.userId ?? null,
      email: input.email ?? null,
      slug: input.slug,
      verified: false,
    }
  );
}

function isCanonicalSource(source: string | null | undefined): source is CanonicalGrantSource {
  return source === "purchase" || source === "tier" || source === "manual";
}

async function readCanonicalEmailEntitlement(input: {
  userId?: string | null;
  email?: string | null;
  slug: string;
}): Promise<CanonicalEntitlement | null> {
  const key = canonicalEmailKey(input);
  if (!key) return null;

  const row = await prisma.clientEntitlement.findFirst({
    where: {
      email: key,
      productCode: input.slug,
      status: "active",
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row || !isActiveDateWindow(row)) return null;

  return {
    granted: true,
    source: isCanonicalSource(row.source) ? row.source : "legacy_email",
    userId: input.userId ?? null,
    email: normalizeEmail(input.email) ?? row.email,
    slug: input.slug,
    verified: isCanonicalSource(row.source),
  };
}

async function readLegacyUserEntitlement(input: {
  userId?: string | null;
  email?: string | null;
  slug: string;
}): Promise<CanonicalEntitlement | null> {
  const userId = normalizeUserId(input.userId);
  if (!userId) return null;

  const row = await prisma.entitlement.findFirst({
    where: {
      userId,
      type: "ARTIFACT",
      key: input.slug,
      status: "ACTIVE",
    },
    orderBy: { createdAt: "desc" },
    select: {
      startsAt: true,
      expiresAt: true,
      revokedAt: true,
      metadata: true,
    },
  });

  if (!row || !isActiveDateWindow(row)) return null;

  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const source = String(metadata.source || "");

  return {
    granted: true,
    source: isCanonicalSource(source) ? source : "legacy_user",
    userId,
    email: normalizeEmail(input.email),
    slug: input.slug,
    verified: isCanonicalSource(source),
  };
}

function tierEntitlement(input: {
  userId?: string | null;
  email?: string | null;
  slug: string;
  tier?: string | null;
  requiredTier?: string | null;
}): CanonicalEntitlement | null {
  if (!input.tier || !input.requiredTier) return null;
  const userTier = normalizeUserTier(input.tier);
  const requiredTier = normalizeUserTier(input.requiredTier);
  if (!hasAccess(userTier, requiredTier)) return null;
  return {
    granted: true,
    source: "tier",
    userId: normalizeUserId(input.userId),
    email: normalizeEmail(input.email),
    slug: input.slug,
    verified: true,
  };
}

export async function resolveCanonicalEntitlement(input: {
  userId?: string | null;
  email?: string | null;
  slug: string;
  tier?: string | null;
  requiredTier?: string | null;
}): Promise<CanonicalEntitlement> {
  const slug = normalizeSlug(input.slug);
  if (!slug) {
    return {
      granted: false,
      userId: normalizeUserId(input.userId),
      email: normalizeEmail(input.email),
      slug,
      verified: false,
    };
  }

  const memoryKey = `${canonicalEmailKey(input) ?? normalizeUserId(input.userId) ?? "anon"}:${slug}`;
  const candidates: CanonicalEntitlement[] = [];

  const tier = tierEntitlement({ ...input, slug });
  if (tier) candidates.push(tier);

  try {
    const [emailEntitlement, legacyUserEntitlement] = await Promise.all([
      readCanonicalEmailEntitlement({ ...input, slug }),
      readLegacyUserEntitlement({ ...input, slug }),
    ]);
    if (emailEntitlement) candidates.push(emailEntitlement);
    if (legacyUserEntitlement) candidates.push(legacyUserEntitlement);
  } catch (error) {
    console.warn("[CANONICAL_ENTITLEMENT_DB_READ_FAILED]", {
      slug,
      userId: input.userId ?? null,
      email: input.email ?? null,
      error,
    });
  }

  const memory = canonicalMemory.get(memoryKey);
  if (memory) candidates.push(memory);

  return winner(candidates, {
    userId: normalizeUserId(input.userId),
    email: normalizeEmail(input.email),
    slug,
  });
}

export async function grantCanonicalEntitlement(input: {
  userId?: string | null;
  email?: string | null;
  slug: string;
  source: CanonicalGrantSource;
}): Promise<CanonicalEntitlement> {
  const slug = normalizeSlug(input.slug);
  const userId = normalizeUserId(input.userId);
  const email = normalizeEmail(input.email);
  const key = canonicalEmailKey({ userId, email });

  if (!slug || !key) {
    throw new Error("slug and either email or userId are required to grant entitlement.");
  }

  const entitlement: CanonicalEntitlement = {
    granted: true,
    source: input.source,
    userId,
    email,
    slug,
    verified: true,
  };

  try {
    const existing = await prisma.clientEntitlement.findFirst({
      where: {
        email: key,
        productCode: slug,
        status: "active",
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      await prisma.clientEntitlement.update({
        where: { id: existing.id },
        data: {
          tier: "canonical",
          source: input.source,
          externalRef: userId,
          endsAt: null,
          status: "active",
        },
      });
    } else {
      await prisma.clientEntitlement.create({
        data: {
          email: key,
          productCode: slug,
          tier: "canonical",
          source: input.source,
          externalRef: userId,
          endsAt: null,
          status: "active",
        },
      });
    }
  } catch (error) {
    console.warn("[CANONICAL_ENTITLEMENT_DB_WRITE_FAILED]", {
      slug,
      userId,
      email,
      source: input.source,
      error,
    });
    canonicalMemory.set(`${key}:${slug}`, entitlement);
  }

  canonicalMemory.set(`${key}:${slug}`, entitlement);
  return entitlement;
}

export function resetCanonicalEntitlementsForTests(): void {
  canonicalMemory.clear();
}
