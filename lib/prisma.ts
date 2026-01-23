// lib/prisma.ts - UPDATED IMPORT
import { PrismaClient } from ".prisma/client"; // CHANGED: Added dot

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Runtime detection
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isEdgeRuntime(): boolean {
  return (
    typeof (globalThis as any).EdgeRuntime !== "undefined" ||
    (typeof process !== "undefined" && process.env.NEXT_RUNTIME === "edge")
  );
}

/**
 * Build-phase detection
 */
function isBuildTime(): boolean {
  if (typeof process === "undefined") return false;
  const ev = process.env.npm_lifecycle_event || "";
  const phase = process.env.NEXT_PHASE || "";
  return ev.includes("build") || phase.toLowerCase().includes("build");
}

/**
 * Create a PrismaClient instance
 */
function createRealPrismaClient(): PrismaClient {
  // Hard-stop on unsupported runtimes
  if (isBrowser() || isEdgeRuntime()) {
    throw new Error("PrismaClient must not be created in Browser/Edge runtime.");
  }

  // For Prisma 7.2.0 with SQLite
  const log =
    process.env.NODE_ENV === "development"
      ? (["warn", "error"] as const)
      : (["error"] as const);

  return new PrismaClient({ 
    datasourceUrl: process.env.DATABASE_URL || "file:./dev.db",
    log
  });
}

/**
 * Return a safe stub for build/browser/edge
 */
function createStubPrisma(reason: string): PrismaClient {
  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (prop === "$connect" || prop === "$disconnect") {
        return async () => undefined;
      }
      return () => {
        throw new Error(`Prisma is unavailable (${reason}). Server-only.`);
      };
    },
  });
}

/**
 * Lazy singleton getter for PrismaClient
 */
export function getPrisma(): PrismaClient {
  // Never in browser/edge
  if (isBrowser()) return createStubPrisma("browser");
  if (isEdgeRuntime()) return createStubPrisma("edge-runtime");

  // Avoid build-time Prisma unless explicitly allowed
  const allowDuringBuild = process.env.PRISMA_ALLOW_DURING_BUILD === "1";
  if (isBuildTime() && !allowDuringBuild) {
    return createStubPrisma("build-time");
  }

  if (process.env.NODE_ENV !== "production") {
    if (!global.__prisma) global.__prisma = createRealPrismaClient();
    return global.__prisma;
  }

  // Production: create new instance
  return createRealPrismaClient();
}

// Convenience named export
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getPrisma();
    // @ts-expect-error - dynamic proxy passthrough
    return client[prop];
  },
});

// Safe query wrapper
export async function safePrismaQuery<T>(
  fn: (p: PrismaClient) => Promise<T>,
  context?: { operation: string }
): Promise<T | null> {
  const startTime = Date.now();
  
  try {
    const p = getPrisma();
    const result = await fn(p);
    
    if (context?.operation) {
      console.log(`[Prisma] ${context.operation} completed in ${Date.now() - startTime}ms`);
    }
    
    return result;
  } catch (e) {
    console.error("[Prisma] Query failed:", e);
    if (context?.operation) {
      console.error(`[Prisma] ${context.operation} failed after ${Date.now() - startTime}ms`);
    }
    return null;
  }
}

// Clean shutdown
export async function cleanup(): Promise<void> {
  if (global.__prisma) {
    await global.__prisma.$disconnect();
    global.__prisma = undefined;
  }
}

export default prisma;