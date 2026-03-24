// lib/prisma.pages.ts — PAGES ROUTER SAFE PRISMA (SSR / API only)

import { PrismaClient, type Prisma } from "@prisma/client";

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
        ? ["warn", "error"]
        : ["error"],
  });
}

const prismaClient = global.__prisma_pages__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma_pages__ = prismaClient;
}

export const prisma: PrismaClient = prismaClient;
export const getPrisma = (): PrismaClient => prisma;

/**
 * Safe query helper:
 * retries once on transient closed/connection issues, then rethrows.
 * Do not silently null out genuine application errors.
 */
export async function safePrismaQuery<T>(
  query: (client: PrismaClient) => Promise<T>
): Promise<T> {
  try {
    return await query(prisma);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const shouldRetry =
      /closed/i.test(message) ||
      /connection/i.test(message) ||
      /Can't reach database server/i.test(message) ||
      /Server has closed the connection/i.test(message);

    if (!shouldRetry) {
      throw error;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn("[PRISMA_RETRY] attempting one reconnect after transient failure");
    }

    await prisma.$disconnect().catch(() => {});
    await prisma.$connect();

    return await query(prisma);
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
  return safePrismaQuery((client) =>
    client.contentMetadata.findUnique({
      where: { slug },
      include: {
        dependencies: { include: { targetBrief: true } },
        dependents: { include: { sourceBrief: true } },
      },
    })
  );
}

export default prisma;

export type { Prisma };
export type PrismaClientType = PrismaClient;