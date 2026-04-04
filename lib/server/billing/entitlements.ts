// lib/server/billing/entitlements.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";

export async function grantEntitlement(input: {
  email: string;
  productCode: string;
  tier: string;
  source?: string;
  externalRef?: string | null;
  endsAt?: Date | null;
}) {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.clientEntitlement.findFirst({
    where: {
      email,
      productCode: input.productCode,
      status: "active",
    },
  });

  if (existing) {
    return prisma.clientEntitlement.update({
      where: { id: existing.id },
      data: {
        tier: input.tier,
        source: input.source || existing.source,
        externalRef: input.externalRef || existing.externalRef,
        endsAt: input.endsAt ?? existing.endsAt,
        status: "active",
      },
    });
  }

  return prisma.clientEntitlement.create({
    data: {
      email,
      productCode: input.productCode,
      tier: input.tier,
      source: input.source || "manual",
      externalRef: input.externalRef || null,
      endsAt: input.endsAt || null,
      status: "active",
    },
  });
}

export async function revokeEntitlement(email: string, productCode: string) {
  return prisma.clientEntitlement.updateMany({
    where: {
      email: email.trim().toLowerCase(),
      productCode,
      status: "active",
    },
    data: {
      status: "revoked",
    },
  });
}

export async function hasEntitlement(email: string, productCode: string) {
  const now = new Date();

  const match = await prisma.clientEntitlement.findFirst({
    where: {
      email: email.trim().toLowerCase(),
      productCode,
      status: "active",
      OR: [
        { endsAt: null },
        { endsAt: { gt: now } },
      ],
    },
  });

  return !!match;
}