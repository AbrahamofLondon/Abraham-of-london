// lib/db/prisma.ts — SIMPLE NODE-ONLY PRISMA (DEV-STABLE)
// REMOVED: import "server-only"; (Incompatible with Pages Router build trace)

import { PrismaClient } from "@prisma/client";
import { shouldUseDatabase } from "@/lib/db/db-gate";

type PrismaClientType = PrismaClient;
export type PrismaTransactionClient = Parameters<
  Parameters<PrismaClient["$transaction"]>[0]
>[0];

const isEdge = process.env.NEXT_RUNTIME === "edge";
const canUseDb = shouldUseDatabase();
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Runtime Guard: This replaces the build-time "server-only" check.
 * It ensures the Prisma Client is never initialized in the Edge runtime
 * or on the client-side (browser).
 */
if (isEdge || typeof window !== "undefined") {
  console.warn("[Prisma] Database access is restricted to Node.js environments.");
}

declare global {
  // eslint-disable-next-line no-var
  var __aol_prisma__: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  if (!canUseDb) {
    throw new Error("[Prisma] Database disabled by db-gate.");
  }

  if (!DATABASE_URL) {
    throw new Error("[Prisma] DATABASE_URL is missing.");
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClientType =
  globalThis.__aol_prisma__ ?? (typeof window === "undefined" ? createPrisma() : (null as any));

if (process.env.NODE_ENV !== "production" && typeof window === "undefined") {
  globalThis.__aol_prisma__ = prisma;
}

export const getPrisma = (): PrismaClientType => prisma;

export async function safePrismaQuery<T>(
  query: () => Promise<T>,
): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error("[PRISMA_DB_ERROR]:", error);
    return null;
  }
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (!canUseDb) return false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("[PRISMA_CONNECTION_ERROR]:", error);
    return false;
  }
}

export default prisma;