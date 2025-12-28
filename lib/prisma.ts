// lib/prisma.ts
import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

/**
 * Prisma is Node-runtime only (not Edge).
 * If an Edge route imports Prisma by mistake, fail fast with a clear error.
 */
function assertNodeRuntime() {
  if (process.env.NEXT_RUNTIME === "edge") {
    throw new Error(
      "PrismaClient cannot run in the Edge Runtime. " +
        "Move this code to a Node.js runtime route or set `export const runtime = 'nodejs'`."
    );
  }
}

/**
 * Enterprise-safe log config:
 * - No readonly tuples (Prisma expects a mutable array)
 * - Uses string literals instead of Prisma.LogLevel type
 */
function resolvePrismaLog(): Array<"query" | "info" | "warn" | "error"> {
  const level = (process.env.PRISMA_LOG_LEVEL || "").toLowerCase();

  if (level === "debug") return ["query", "info", "warn", "error"];
  if (level === "info") return ["info", "warn", "error"];
  if (level === "warn") return ["warn", "error"];
  if (level === "error") return ["error"];

  // Default: production-safe noise level
  return process.env.NODE_ENV === "development"
    ? ["info", "warn", "error"]
    : ["warn", "error"];
}

function makePrismaClient() {
  assertNodeRuntime();

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
 * (Serverless functions typically don't need this, but it doesn't hurt.)
 */
if (process.env.PRISMA_ENABLE_SHUTDOWN_HOOKS === "true") {
  const disconnect = async () => {
    try {
      await prisma.$disconnect();
      // eslint-disable-next-line no-console
      console.log("Prisma disconnected");
    } catch {
      // ignore
    }
  };

  process.on("SIGINT", disconnect);
  process.on("SIGTERM", disconnect);
}

export default prisma;