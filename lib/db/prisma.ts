// lib/db/prisma.ts — BUILD-SAFE + NODE-ONLY + NEON ADAPTER (HARDENED)
import "server-only";

import { neonConfig, Pool, type PoolConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import WebSocket from "ws";
import { shouldUseDatabase } from "@/lib/db/db-gate";

type PrismaClientType = any;
export type PrismaTransactionClient = any;

const isEdge = process.env.NEXT_RUNTIME === "edge";
const canUseDb = shouldUseDatabase();
const DATABASE_URL = process.env.DATABASE_URL;

if (isEdge) {
  throw new Error("[Prisma] Client cannot run on Edge. Use Node.js runtime.");
}

neonConfig.webSocketConstructor = WebSocket;
neonConfig.fetchConnectionCache = true;

declare global {
  // eslint-disable-next-line no-var
  var __aol_prisma__: PrismaClientType | undefined;
}

function buildSafeProxy(): PrismaClientType {
  return new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => {
        if (prop === "then" || prop === "catch" || prop === "finally") {
          return undefined;
        }

        if (prop === "$disconnect" || prop === "$connect") {
          return async () => undefined;
        }

        if (prop === "$transaction") {
          return async (arg: unknown) => {
            if (typeof arg === "function") {
              return await arg(buildSafeProxy());
            }
            return Array.isArray(arg) ? [] : undefined;
          };
        }

        if (
          prop === "$queryRaw" ||
          prop === "$executeRaw" ||
          prop === "$queryRawUnsafe" ||
          prop === "$executeRawUnsafe"
        ) {
          return async () => undefined;
        }

        return new Proxy(
          {},
          {
            get: () => async () => undefined,
          },
        );
      },
    },
  );
}

function createPrisma(): PrismaClientType {
  if (!canUseDb) return buildSafeProxy();
  if (!DATABASE_URL) return buildSafeProxy();

  try {
    const poolConfig: PoolConfig = {
      connectionString: DATABASE_URL,
    };

    const pool = new Pool(poolConfig);
    const adapter = new PrismaNeon(pool as any);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client");

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch (error) {
    console.error("[Prisma] Runtime load failed:", error);
    return buildSafeProxy();
  }
}

export const prisma: PrismaClientType =
  globalThis.__aol_prisma__ ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
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
  } catch {
    return false;
  }
}

export default prisma;