// lib/db/prisma.ts
import "server-only";

import { PrismaClient } from "@prisma/client";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import WebSocket from "ws";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const isEdge = process.env.NEXT_RUNTIME === "edge";
const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

// If anything tries to import Prisma in Edge runtime, fail fast (and loudly)
if (isEdge) {
  throw new Error("[Prisma] Prisma client must not be imported in Edge runtime. Use runtime='nodejs' or server-only path.");
}

neonConfig.webSocketConstructor = WebSocket;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // Don’t explode builds that don’t need DB, but do block runtime use.
  console.warn("[Prisma] DATABASE_URL missing. Prisma will be unavailable.");
}

const pool =
  DATABASE_URL
    ? new Pool({
        connectionString: DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      })
    : null;

if (pool) {
  pool.on("error", (err: unknown) => {
    console.error("[Prisma] Pool error:", err);
  });
}

const adapter = pool ? new PrismaNeon(pool) : null;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrisma(): PrismaClient {
  if (!DATABASE_URL || !adapter) {
    // Create a proxy that throws only when USED (not on import)
    return new Proxy(
      {},
      {
        get() {
          throw new Error("[Prisma] DATABASE_URL missing or adapter not ready. Prisma access attempted.");
        },
      }
    ) as unknown as PrismaClient;
  }

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });
}

export const prisma = globalThis.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

/**
 * Build-safe check: during `next build`, DO NOT touch the DB.
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  if (isBuild) return false; // absolutely no DB calls during collect page data
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    console.error("[Prisma] Connection check failed:", err);
    return false;
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    // avoid touching DB during build
    if (!isBuild) await prisma.$disconnect();
  } catch {
    // ignore
  }
  try {
    await pool?.end();
  } catch {
    // ignore
  }
}