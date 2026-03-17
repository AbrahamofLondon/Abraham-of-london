// lib/prisma.pages.ts — PAGES ROUTER SAFE PRISMA (SSR / API only)
//
// IMPORTANT:
// - Safe for pages/** server execution (SSR / API routes).
// - Must never be imported into client-side code.
// - Do NOT add `server-only` here.

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_pages__: PrismaClient | undefined;
}

if (typeof window !== "undefined") {
  throw new Error("⛔ Prisma client was imported into a browser bundle. Check your imports.");
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  global.__prisma_pages__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma_pages__ = prisma;
}

export const getPrisma = (): PrismaClient => prisma;

export async function safePrismaQuery<T>(
  query: () => Promise<T>,
): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error("[PRISMA_PAGES_ERROR]", error);
    return null;
  }
}

export async function checkDatabaseConnection(): Promise<{
  online: boolean;
  error: string | null;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { online: true, error: null };
  } catch (error) {
    return {
      online: false,
      error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
    };
  }
}

export async function getVaultStatus() {
  return checkDatabaseConnection();
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
  } catch (error) {
    console.error("[VAULT_CONTEXT_ERROR]", error);
    return null;
  }
}

export default prisma;

export type { Prisma } from "@prisma/client";
export type PrismaClientType = PrismaClient;