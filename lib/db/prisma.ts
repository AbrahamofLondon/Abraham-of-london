// lib/db/prisma.ts — BUILD-SAFE + NODE-ONLY + NEON ADAPTER (TYPE-CORRECT)
import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import WebSocket from "ws";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const isEdge = process.env.NEXT_RUNTIME === "edge";
const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

// Hard stop: Prisma must never be imported in Edge runtime
if (isEdge) {
  throw new Error(
    "[Prisma] Prisma client must not be imported in Edge runtime. Use runtime='nodejs' or a server-only path."
  );
}

// Neon serverless driver needs WS in Node/serverless
neonConfig.webSocketConstructor = WebSocket as any;
neonConfig.fetchConnectionCache = true;

const DATABASE_URL = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: any | undefined;
}

// Build-safe proxy: avoids touching DB during next build / typecheck side effects
function buildSafeProxy(): any {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        // allow promise-ish checks without exploding
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;

        // return async fn for any method access
        return async () => {
          // during build we always resolve harmlessly
          return {};
        };
      },
    }
  );
}

// Runtime proxy that throws if someone tries to use DB without config
function missingDbProxy(): any {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        return () => {
          throw new Error("[Prisma] DATABASE_URL missing. Prisma access attempted.");
        };
      },
    }
  );
}

function createPrisma(): any {
  if (isBuild) return buildSafeProxy();
  if (!DATABASE_URL) return missingDbProxy();

  // ✅ Type-correct usage for @prisma/adapter-neon:
  // Newer adapter typings expect a PoolConfig-like object, NOT an instantiated Pool.
  const adapter = new PrismaNeon({
    connectionString: DATABASE_URL,
    // Optional knobs (safe defaults). You can tune later.
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  } as any);

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client");

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      errorFormat: "pretty",
    });
  } catch (err) {
    console.error("[Prisma] Failed to require PrismaClient:", err);
    return new Proxy(
      {},
      {
        get(_t, prop) {
          if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
          return async () => {
            throw new Error(
              `[Prisma] PrismaClient not available at runtime. Attempted: ${String(prop)}`
            );
          };
        },
      }
    );
  }
}

export const prisma = globalThis.__prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (isBuild) return false;
  try {
    if (prisma && typeof prisma.$queryRaw === "function") {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    }
    return false;
  } catch (err) {
    console.error("[Prisma] Connection check failed:", err);
    return false;
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    if (!isBuild && prisma && typeof prisma.$disconnect === "function") {
      await prisma.$disconnect();
    }
  } catch {
    // ignore
  }
}

// Keep this type export if other modules import it (no @prisma/client imports needed)
export type PrismaTransactionClient = any;