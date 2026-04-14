/* eslint-disable no-console */
/**
 * lib/db.ts — PRISMA-BACKED COMPATIBILITY BRIDGE
 *
 * Purpose:
 * - Preserve legacy imports: `import { prisma } from "@/lib/db"`
 * - Preserve legacy imports: `import { db } from "@/lib/db"` where `db` is used like PrismaClient
 * - Preserve helper methods used by newer recovery-safe routes
 */

import type { PrismaClient } from "@prisma/client";
import prismaSingleton, {
  prisma as prismaProxy,
  getPrisma,
} from "@/lib/prisma";

export let prisma: PrismaClient | null = null;

type DbHelpers = {
  initializeDb: () => Promise<void>;
  getPrismaClient: () => Promise<PrismaClient | null>;
  safePrismaQuery: <T>(query: (p: PrismaClient) => Promise<T>) => Promise<T | null>;
  checkDatabaseConnection: () => Promise<{
    connected: boolean;
    type: "prisma" | "unavailable";
    error?: string;
  }>;
};

function isServerRuntime() {
  return typeof window === "undefined";
}

function isEdgeRuntime() {
  return process.env.NEXT_RUNTIME === "edge";
}

function canUsePrisma() {
  return isServerRuntime() && !isEdgeRuntime();
}

/**
 * Initialize Prisma binding.
 * - Node server runtime: binds exported `prisma` to the canonical singleton.
 * - Edge/browser: leaves prisma null.
 */
export async function initializeDb(): Promise<void> {
  if (!canUsePrisma()) {
    prisma = null;
    return;
  }

  prisma = getPrisma();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    prisma = null;
    throw new Error(
      `[DB] Prisma connectivity check failed: ${e instanceof Error ? e.message : "UNKNOWN_ERROR"}`
    );
  }
}

/**
 * Get Prisma if available (Node only). Returns null on Edge/browser.
 */
export async function getPrismaClient(): Promise<PrismaClient | null> {
  if (!canUsePrisma()) return null;

  try {
    if (!prisma) {
      prisma = getPrisma();
    }
    return prisma;
  } catch {
    prisma = null;
    return null;
  }
}

/**
 * Safe query wrapper: runs only when Prisma is available.
 * - Returns null if Prisma unavailable or query fails.
 * - Does NOT fake success.
 */
export async function safePrismaQuery<T>(query: (p: PrismaClient) => Promise<T>): Promise<T | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    return await query(client);
  } catch (e) {
    console.error("[DB] Prisma query failed:", e);
    return null;
  }
}

/**
 * Health status helper
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  type: "prisma" | "unavailable";
  error?: string;
}> {
  try {
    const client = await getPrismaClient();
    if (!client) return { connected: false, type: "unavailable" };

    await client.$queryRaw`SELECT 1`;
    return { connected: true, type: "prisma" };
  } catch (e) {
    return {
      connected: false,
      type: "prisma",
      error: e instanceof Error ? e.message : "UNKNOWN_ERROR",
    };
  }
}

const helpers: DbHelpers = {
  initializeDb,
  getPrismaClient,
  safePrismaQuery,
  checkDatabaseConnection,
};

const db = Object.assign(prismaSingleton ?? prismaProxy, helpers) as PrismaClient & DbHelpers;

export default db;
export { db };
export type { PrismaClient };
