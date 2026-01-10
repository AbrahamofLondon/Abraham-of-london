// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

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
 * Build-phase detection (best-effort).
 * We avoid creating Prisma during Next build page-data collection by default.
 */
function isBuildTime(): boolean {
  if (typeof process === "undefined") return false;
  const ev = process.env.npm_lifecycle_event || "";
  const phase = process.env.NEXT_PHASE || "";
  const netlifyBuild = process.env.NETLIFY === "true" && !!process.env.BUILD_ID;
  return (
    ev.includes("build") ||
    phase.toLowerCase().includes("build") ||
    netlifyBuild
  );
}

/**
 * Create a PrismaClient instance (Node runtime only).
 * NOTE: Prisma must NOT be forced into engine type "client" unless you provide adapter/accelerateUrl.
 */
function createRealPrismaClient(): PrismaClient {
  // Hard-stop on unsupported runtimes
  if (isBrowser() || isEdgeRuntime()) {
    throw new Error("PrismaClient must not be created in Browser/Edge runtime.");
  }

  // Guard against missing DB config
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Prisma cannot connect.");
  }

  // Root-cause guard: client engine requires adapter or accelerateUrl
  const engineType = process.env.PRISMA_CLIENT_ENGINE_TYPE;
  const accelerateUrl =
    process.env.PRISMA_ACCELERATE_URL || process.env.ACCELERATE_URL;

  if (engineType === "client" && !accelerateUrl) {
    throw new Error(
      [
        "Prisma is running with PRISMA_CLIENT_ENGINE_TYPE=client.",
        "That engine requires either:",
        "- a Prisma Driver Adapter (adapter: ...), or",
        "- Prisma Accelerate (PRISMA_ACCELERATE_URL).",
        "",
        "Fix: remove PRISMA_CLIENT_ENGINE_TYPE (recommended) unless you are using adapters/Accelerate.",
      ].join("\n")
    );
  }

  const log =
    process.env.NODE_ENV === "development"
      ? (["warn", "error"] as const)
      : (["error"] as const);

  return new PrismaClient({ log });
}

/**
 * Return a safe stub for build/browser/edge so imports don’t explode.
 * Any attempt to use it will throw clearly.
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
 * Lazy singleton getter.
 * - During build: returns stub by default (prevents "collect page data" crashes).
 * - At runtime (Node): returns real PrismaClient.
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

  // Production: no global caching issues across lambdas beyond module scope
  return global.__prisma ?? (global.__prisma = createRealPrismaClient());
}

// Convenience named export (but still lazy via getter pattern)
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getPrisma();
    // @ts-expect-error - dynamic proxy passthrough
    return client[prop];
  },
});

export async function safePrismaQuery<T>(fn: (p: PrismaClient) => Promise<T>): Promise<T | null> {
  try {
    // If stubbed, this will throw with a clear reason.
    const p = getPrisma();
    await p.$connect();
    const result = await fn(p);
    return result;
  } catch (e) {
    console.error("[Prisma] safePrismaQuery failed:", e);
    return null;
  }
}

export default prisma;
