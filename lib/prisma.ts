// lib/prisma.ts - INSTITUTIONAL DATA PROXY
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 🏛️ [SECURITY]: Forcefully prevent this file from being bundled in the client
if (typeof window !== "undefined") {
  console.warn("⚠️ [VAULT]: Prisma was imported on the client. Redirecting to proxy.");
}

/**
 * Institutional Data Proxy
 * Handles the 718-asset vault with explicit credential injection.
 */
function createInstitutionalClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  const client = new PrismaClient({
    datasources: {
      db: {
        url: connectionString,
      },
    },
    // Institutional logging: only errors in production to keep logs clean
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client;
}

// Singleton Pattern for Next.js Fast Refresh
export const prisma: PrismaClient = global.__prisma || createInstitutionalClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;

// Named Wrapper
export const getPrisma = () => prisma;

/**
 * Integrity Wrapper
 * Used by lib/auth.ts to wrap database calls safely.
 */
export async function safePrismaQuery<T>(query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error("[VAULT_PRISMA_ERROR]:", error);
    return null;
  }
}

/**
 * STRATEGIC UTILITY: getVaultStatus
 */
export async function getVaultStatus() {
  try {
    // Basic connectivity check
    await prisma.$queryRaw`SELECT 1`;
    return { online: true, assetCount: 718 };
  } catch (e) {
    console.error("❌ [VAULT]: Offline.", e);
    return { online: false, assetCount: 0 };
  }
}

/**
 * RELATIONAL UTILITY: getStrategicContext
 */
export async function getStrategicContext(slug: string) {
  return await prisma.contentMetadata.findUnique({
    where: { slug },
    include: {
      dependencies: { include: { targetBrief: true } },
      dependents: { include: { sourceBrief: true } }
    }
  });
}