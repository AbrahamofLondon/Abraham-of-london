/* eslint-disable no-console */
/**
 * lib/db.ts — COMPATIBILITY BRIDGE (Deterministic, Build-Safe)
 *
 * Purpose:
 * - Preserve legacy imports: `import { prisma } from "@/lib/db"`
 * - Provide optional helpers for health checks / safe queries
 *
 * HARD RULES:
 * - Never fake "success" with empty results.
 * - Never silently fall back to a Memory DB in production pathways.
 * - Prisma runs ONLY on Node server runtime (not browser, not Edge).
 */

import type { PrismaClient } from "@prisma/client";

// Live binding: available only after init on Node runtime.
export let prisma: PrismaClient | null = null;

function isServerRuntime() {
  return typeof window === "undefined";
}

function isEdgeRuntime() {
  return process.env.NEXT_RUNTIME === "edge";
}

function canUsePrisma() {
  return isServerRuntime() && !isEdgeRuntime();
}

async function loadServerPrisma(): Promise<PrismaClient> {
  // Prefer your canonical server Prisma singleton.
  // This avoids multiple client instances and keeps logging consistent.
  const mod: any = await import("@/lib/prisma");
  if (!mod?.prisma) throw new Error("[DB] Failed to load @/lib/prisma singleton");
  return mod.prisma as PrismaClient;
}

/**
 * Initialize Prisma binding.
 * - Node server runtime: loads @/lib/prisma and sets exported `prisma`.
 * - Edge/browser: leaves prisma null.
 */
export async function initializeDb(): Promise<void> {
  if (prisma) return;

  if (!canUsePrisma()) {
    prisma = null;
    return;
  }

  prisma = await loadServerPrisma();

  // Lightweight connectivity check (optional but valuable)
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    // Do not fall back to memory: fail loudly to protect integrity.
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
  await initializeDb().catch(() => {});
  return prisma;
}

/**
 * Safe query wrapper: runs only when Prisma is available.
 * - Returns null if Prisma unavailable or query fails.
 * - Does NOT fake success.
 */
export async function safePrismaQuery<T>(query: (p: PrismaClient) => Promise<T>): Promise<T | null> {
  const p = await getPrismaClient();
  if (!p) return null;

  try {
    return await query(p);
  } catch (e) {
    console.error("[DB] Prisma query failed:", e);
    return null;
  }
}

/**
 * Health status helper
 */
export async function checkDatabaseConnection(): Promise<{ connected: boolean; type: "prisma" | "unavailable"; error?: string }> {
  try {
    const p = await getPrismaClient();
    if (!p) return { connected: false, type: "unavailable" };

    await p.$queryRaw`SELECT 1`;
    return { connected: true, type: "prisma" };
  } catch (e) {
    return {
      connected: false,
      type: "prisma",
      error: e instanceof Error ? e.message : "UNKNOWN_ERROR",
    };
  }
}

/**
 * Default export kept for backward compatibility (some modules may import default db).
 * We expose a tiny façade rather than a pretend multi-db abstraction.
 */
const db = {
  initializeDb,
  getPrismaClient,
  safePrismaQuery,
  checkDatabaseConnection,
};

export default db;
export { db };
export type { PrismaClient };