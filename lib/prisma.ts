import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const isBrowser = typeof window !== "undefined";
const isEdge = typeof (globalThis as any).EdgeRuntime !== "undefined";
const isBuild = process.env.NEXT_PHASE === 'phase-production-build' || 
                (process.env.npm_lifecycle_event || "").includes("build");

function createRealPrismaClient(): PrismaClient {
  if (isBrowser || isEdge) {
    throw new Error("Institutional Security: Prisma restricted to Node.js Runtime.");
  }
  return new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });
}

/**
 * Safe Build Proxy: Ensures Contentlayer doesn't hang
 */
function createBuildStub(): any {
  return new Proxy({} as any, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") return async () => undefined;
      return () => isBuild ? Promise.resolve([]) : Promise.reject(new Error("Vault Locked."));
    },
  });
}

// 1. Primary Named Export
export const prisma: PrismaClient = (() => {
  if (isBrowser || isEdge) return createBuildStub();
  
  if (isBuild && process.env.PRISMA_ALLOW_DURING_BUILD !== "1") {
    return createBuildStub();
  }

  if (process.env.NODE_ENV === "production") {
    if (!global.__prisma) global.__prisma = createRealPrismaClient();
    return global.__prisma;
  }

  if (!global.__prisma) global.__prisma = createRealPrismaClient();
  return global.__prisma;
})();

// 2. Default Export (Resolves: '@/lib/prisma' does not contain a default export)
export default prisma;

// 3. Named Wrapper (Resolves: 'getPrisma' is not exported)
export const getPrisma = () => prisma;

// 4. Integrity Wrapper (Resolves: 'safePrismaQuery' is not exported)
export async function safePrismaQuery<T>(query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error("[VAULT_PRISMA_ERROR]:", error);
    return null;
  }
}