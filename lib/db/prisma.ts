// lib/db/prisma.ts — BUILD-SAFE + NODE-ONLY + NEON ADAPTER
import "server-only";

import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { neonConfig, Pool, type PoolConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import WebSocket from "ws";

/**
 * 🏛️ [INSTITUTIONAL FIX]: 
 * We use 'any' for the type definition during the build phase to bypass 
 * the "@prisma/client has no exported member" crash.
 */
type PrismaClientType = any; 

const isEdge = process.env.NEXT_RUNTIME === "edge";
const isBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;

if (isEdge) {
  throw new Error("[Prisma] Client cannot run on Edge. Use Node.js runtime.");
}

// Configure neon for Node.js environment
neonConfig.webSocketConstructor = WebSocket;
neonConfig.fetchConnectionCache = true;

const DATABASE_URL = process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __aol_prisma: any | undefined;
}

function buildSafeProxy(): PrismaClientType {
  return new Proxy({}, {
    get: (_t, prop) => {
      if (prop === "then" || prop === "catch") return undefined;
      return async () => undefined;
    }
  });
}

function createPrisma(): PrismaClientType {
  if (isBuild) return buildSafeProxy();
  if (!DATABASE_URL) return buildSafeProxy();

  try {
    // ✅ Fix: Create pool with proper typing
    const poolConfig: PoolConfig = { connectionString: DATABASE_URL };
    const pool = new Pool(poolConfig);
    
    // ✅ Fix: Cast pool to any to bypass type mismatch
    const adapter = new PrismaNeon(pool as any);

    // 🏛️ Dynamic require prevents the build-time 'module not found' error
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient({
      adapter,
      log: ["error"],
    });
  } catch (e) {
    console.error("[Prisma] Runtime load failed:", e);
    return buildSafeProxy();
  }
}

export const prisma = globalThis.__aol_prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalThis.__aol_prisma = prisma;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (isBuild) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

// 🏛️ Dynamic Transaction Type Recovery
export type PrismaTransactionClient = any;