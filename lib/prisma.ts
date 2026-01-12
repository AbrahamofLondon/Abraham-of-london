// lib/prisma.ts - UPDATED WITH AUDIT LOGGING
import { PrismaClient } from "@prisma/client";
import { initializeAuditLogger, ProductionAuditLogger } from "@/lib/audit/audit-logger";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __auditLogger: ProductionAuditLogger | undefined;
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
 * Return a safe stub for build/browser/edge so imports don't explode.
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
 * Lazy singleton getter for PrismaClient.
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

/**
 * Lazy singleton getter for AuditLogger.
 */
export function getAuditLogger(): ProductionAuditLogger {
  // Don't initialize in browser/edge/build-time
  if (isBrowser() || isEdgeRuntime() || isBuildTime()) {
    throw new Error("AuditLogger is server-side only");
  }

  if (!global.__auditLogger) {
    const prisma = getPrisma();
    
    // Check if we got a stub (shouldn't happen here but safe)
    if ((prisma as any)._isStub) {
      throw new Error("Cannot initialize AuditLogger with stub Prisma client");
    }

    global.__auditLogger = initializeAuditLogger({
      prisma,
      service: "abraham-of-london",
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION || "1.0.0",
    });
  }

  return global.__auditLogger!;
}

// Convenience named export (but still lazy via getter pattern)
export const prisma = new Proxy({} as PrismaClient, {
  get(_t, prop) {
    const client = getPrisma();
    // @ts-expect-error - dynamic proxy passthrough
    return client[prop];
  },
});

// Convenience named export for auditLogger
export const auditLogger = new Proxy({} as ProductionAuditLogger, {
  get(_t, prop) {
    const logger = getAuditLogger();
    // @ts-expect-error - dynamic proxy passthrough
    return logger[prop];
  },
});

// Safe query wrapper with audit logging
export async function safePrismaQuery<T>(
  fn: (p: PrismaClient) => Promise<T>,
  auditContext?: {
    action: string;
    actorId?: string;
    actorEmail?: string;
    resourceType?: string;
    resourceId?: string;
  }
): Promise<T | null> {
  const startTime = Date.now();
  
  try {
    const p = getPrisma();
    await p.$connect();
    const result = await fn(p);
    
    // Log successful query if audit context provided
    if (auditContext) {
      try {
        const logger = getAuditLogger();
        await logger.log({
          action: `DB_${auditContext.action}`,
          actorId: auditContext.actorId,
          actorEmail: auditContext.actorEmail,
          resourceType: auditContext.resourceType,
          resourceId: auditContext.resourceId,
          severity: "info",
          category: "database",
          durationMs: Date.now() - startTime,
          status: "success",
          metadata: {
            operation: auditContext.action,
            executionTime: `${Date.now() - startTime}ms`,
          },
        });
      } catch (auditError) {
        console.warn("[Audit] Failed to log query:", auditError);
      }
    }
    
    return result;
  } catch (e) {
    console.error("[Prisma] safePrismaQuery failed:", e);
    
    // Log failed query if audit context provided
    if (auditContext) {
      try {
        const logger = getAuditLogger();
        await logger.log({
          action: `DB_${auditContext.action}`,
          actorId: auditContext.actorId,
          actorEmail: auditContext.actorEmail,
          resourceType: auditContext.resourceType,
          resourceId: auditContext.resourceId,
          severity: "error",
          category: "database",
          durationMs: Date.now() - startTime,
          status: "failure",
          errorMessage: e instanceof Error ? e.message : "Database query failed",
          metadata: {
            operation: auditContext.action,
            error: e instanceof Error ? e.message : String(e),
          },
        });
      } catch (auditError) {
        console.warn("[Audit] Failed to log query error:", auditError);
      }
    }
    
    return null;
  }
}

// Export Prisma types
export { AdminUser, AdminSession, MfaChallenge } from '@prisma/client';

// Clean shutdown
export async function cleanup(): Promise<void> {
  if (global.__auditLogger) {
    await global.__auditLogger.destroy();
    global.__auditLogger = undefined;
  }
  
  if (global.__prisma) {
    await global.__prisma.$disconnect();
    global.__prisma = undefined;
  }
}

export default prisma;