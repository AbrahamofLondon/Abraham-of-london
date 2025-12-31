// lib/prisma.ts - Edge Runtime compatible version
import { PrismaClient } from "@prisma/client";

// Declare EdgeRuntime for TypeScript compatibility
declare const EdgeRuntime: string | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

/**
 * Check if we're running in Edge Runtime
 */
function isEdgeRuntime(): boolean {
  // Check for Edge Runtime in a TypeScript-safe way
  return (
    typeof EdgeRuntime !== 'undefined' ||
    process.env.NEXT_RUNTIME === 'edge' ||
    (typeof globalThis !== 'undefined' && 'edge' in globalThis && (globalThis as any).edge === true)
  );
}

/**
 * Enterprise-safe log config
 */
function resolvePrismaLog(): Array<"query" | "info" | "warn" | "error"> {
  const level = (process.env.PRISMA_LOG_LEVEL || "").toLowerCase();

  if (level === "debug") return ["query", "info", "warn", "error"];
  if (level === "info") return ["info", "warn", "error"];
  if (level === "warn") return ["warn", "error"];
  if (level === "error") return ["error"];

  // Default: production-safe noise level
  return process.env.NODE_ENV === "development"
    ? ["warn", "error"]
    : ["error"];
}

function makePrismaClient() {
  // Check if we're in Edge Runtime
  if (isEdgeRuntime()) {
    console.warn(
      "PrismaClient is being instantiated in Edge Runtime. " +
      "This is not recommended. Consider using a separate API route with Node.js runtime " +
      "or moving database operations to server components."
    );
    
    // Return a minimal client for Edge - some operations may fail
    return new PrismaClient({
      log: ["error"],
      errorFormat: "minimal",
    });
  }

  const datasourceUrl = process.env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error(
      "DATABASE_URL is missing. Set it in .env.local (dev) or provider env vars (prod)."
    );
  }

  const log = resolvePrismaLog();

  return new PrismaClient({
    datasourceUrl,
    log,
    errorFormat: process.env.NODE_ENV === "development" ? "pretty" : "minimal",
  });
}

// Use global in dev to avoid creating many clients during HMR.
const prisma = global.__prisma__ ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

/**
 * Optional: allow graceful shutdown in long-running Node processes.
 * Only register shutdown hooks in Node.js runtime (not Edge)
 */
if (process.env.PRISMA_ENABLE_SHUTDOWN_HOOKS === "true" && !isEdgeRuntime()) {
  const disconnect = async () => {
    try {
      await prisma.$disconnect();
      // eslint-disable-next-line no-console
      console.log("Prisma disconnected");
    } catch {
      // ignore
    }
  };

  // Check if process is available (Node.js only)
  if (typeof process !== 'undefined') {
    process.on("SIGINT", disconnect);
    process.on("SIGTERM", disconnect);
  }
}

export default prisma;