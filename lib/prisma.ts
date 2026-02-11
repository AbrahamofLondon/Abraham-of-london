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
 * Safe Build Proxy: Ensures Contentlayer doesn't hang on Netlify
 * if the database is unreachable during the build phase.
 */
function createBuildStub(): any {
  return new Proxy({} as any, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") return async () => undefined;
      return () => isBuild ? Promise.resolve([]) : Promise.reject(new Error("Vault Locked."));
    },
  });
}

export const prisma: PrismaClient = (() => {
  if (isBrowser || isEdge) return createBuildStub();
  
  // Allow Prisma during build ONLY if explicitly flagged, else use stub to prevent hangs
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

export const prisma = new PrismaClient();