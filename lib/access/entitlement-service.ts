import type { Prisma, PrismaClient } from "@prisma/client";
import { normalizeTier } from "./tier";
import { logAccessAudit } from "./audit";
import type { EntitlementGrant } from "./types";

type TxClient = Prisma.TransactionClient | PrismaClient;

function toEntitlementType(grant: EntitlementGrant) {
  if (grant.type === "tier") return "TIER" as const;
  if (grant.type === "product") return "PRODUCT" as const;
  return "ARTIFACT" as const;
}

function normalizeGrantKey(grant: EntitlementGrant): string {
  return grant.type === "tier" ? normalizeTier(grant.key) : grant.key.trim();
}

export async function grantEntitlements(
  tx: TxClient,
  params: {
    userId: string;
    grants: EntitlementGrant[];
    issuedBy: string;
    metadata?: Record<string, unknown>;
    startsAt?: Date | null;
    expiresAt?: Date | null;
  },
): Promise<EntitlementGrant[]> {
  const granted: EntitlementGrant[] = [];

  for (const grant of params.grants) {
    const key = normalizeGrantKey(grant);
    const type = toEntitlementType(grant);

    const existing = await tx.entitlement.findFirst({
      where: {
        userId: params.userId,
        type,
        key,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (existing) {
      await tx.entitlement.update({
        where: { id: existing.id },
        data: {
          status: "ACTIVE",
          startsAt: params.startsAt ?? null,
          expiresAt: params.expiresAt ?? null,
          revokedAt: null,
          revokedBy: null,
          reason: null,
          issuedBy: params.issuedBy,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonObject,
        },
      });
    } else {
      await tx.entitlement.create({
        data: {
          userId: params.userId,
          type,
          key,
          status: "ACTIVE",
          startsAt: params.startsAt ?? null,
          expiresAt: params.expiresAt ?? null,
          issuedBy: params.issuedBy,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonObject,
        },
      });
    }

    granted.push(
      grant.type === "tier"
        ? { type: "tier", key: normalizeTier(key) }
        : { type: grant.type, key },
    );
  }

  return granted;
}

export async function auditGrantedEntitlements(input: {
  actorType: "USER" | "SYSTEM" | "ADMIN";
  actorUserId?: string | null;
  actorEmail?: string | null;
  targetUserId: string;
  grants: EntitlementGrant[];
  source: string;
}) {
  await Promise.all(
    input.grants.map((grant) =>
      logAccessAudit({
        actorType: input.actorType,
        actorUserId: input.actorUserId ?? null,
        actorEmail: input.actorEmail ?? null,
        action: "entitlement.granted",
        targetType: "entitlement",
        targetKey: `${grant.type}:${grant.key}`,
        success: true,
        metadata: {
          targetUserId: input.targetUserId,
          source: input.source,
        },
      }),
    ),
  );
}
