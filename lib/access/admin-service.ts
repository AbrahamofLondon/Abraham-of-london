import { prisma } from "@/lib/prisma.server";
import type { EntitlementGrant } from "./types";
import { generateAccessKey, hashAccessKey, previewAccessKey } from "./access-key";

export async function issueAccessKey(input: {
  label?: string;
  grants: EntitlementGrant[];
  maxUses?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  issuedBy: string;
  metadata?: Record<string, unknown>;
}) {
  const code = generateAccessKey();
  const codeHash = hashAccessKey(code);

  const record = await prisma.accessKey.create({
    data: {
      codeHash,
      codePreview: previewAccessKey(code),
      label: input.label ?? null,
      grants: input.grants,
      maxUses: input.maxUses ?? 1,
      startsAt: input.startsAt ?? null,
      expiresAt: input.expiresAt ?? null,
      issuedBy: input.issuedBy,
      metadata: input.metadata ?? {},
    },
  });

  return {
    id: record.id,
    code, // show once, never persist raw
    preview: record.codePreview,
  };
}

export async function revokeEntitlement(input: {
  entitlementId: string;
  revokedBy: string;
  reason?: string;
}) {
  return prisma.entitlement.update({
    where: { id: input.entitlementId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedBy: input.revokedBy,
      reason: input.reason ?? "revoked",
    },
  });
}