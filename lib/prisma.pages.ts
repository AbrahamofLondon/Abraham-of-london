// lib/prisma.pages.ts — PAGES ROUTER SAFE (no server-only)
//
// IMPORTANT:
// - Pages Router cannot import `server-only`.
// - This module is still SERVER-EXECUTED (SSR / API routes), but must be pages-safe.
// - It must NOT re-export itself or other barrels (avoid circular exports).

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_pages: PrismaClient | undefined;
}

if (typeof window !== "undefined") {
  throw new Error("⛔ [VAULT]: Prisma detected on client side - check your imports");
}

export const prisma: PrismaClient =
  global.__prisma_pages ??
  new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__prisma_pages = prisma;

export const getPrisma = () => prisma;

export async function safePrismaQuery<T>(query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error("[VAULT_PRISMA_ERROR]:", error);
    return null;
  }
}

/**
 * Helpers exposed for Pages Router usage
 */
export async function getVaultStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { online: true, error: null as string | null };
  } catch (e) {
    return { online: false, error: e instanceof Error ? e.message : "UNKNOWN_ERROR" };
  }
}

export async function getStrategicContext(slug: string) {
  try {
    return await prisma.contentMetadata.findUnique({
      where: { slug },
      include: {
        dependencies: { include: { targetBrief: true } },
        dependents: { include: { sourceBrief: true } },
      },
    });
  } catch (e) {
    console.error("[VAULT_CONTEXT_ERROR]:", e);
    return null;
  }
}

export default prisma;
export type { Prisma } from "@prisma/client";
export type PrismaClientType = PrismaClient;