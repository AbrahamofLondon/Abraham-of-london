// lib/downloads/audit.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function logDownloadEvent(input: {
  eventType: string;
  slug: string;
  requiredTier: string;
  userTier: string;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
  tokenExp?: number | null;
  note?: string | null;
}) {
  try {
    await prisma.downloadAuditEvent.create({
      data: {
        eventType: input.eventType,
        slug: input.slug,
        requiredTier: input.requiredTier,
        userTier: input.userTier,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        referrer: input.referrer ?? null,
        tokenExp: input.tokenExp ?? null,
        note: input.note ?? null,
      },
    });
  } catch {
    // Never break downloads due to logging
  }
}