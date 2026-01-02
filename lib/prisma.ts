import { PrismaClient } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* 1. RUNTIME DETECTION & POLYFILLS                                           */
/* -------------------------------------------------------------------------- */

// Safe access to global scope to avoid linter errors about "setImmediate"
const globalAny = globalThis as any;

// Polyfill setImmediate for Edge/Wasm environments if missing
// We access it via string index to hide it from Next.js static analysis
if (typeof globalAny['setImmediate'] === 'undefined') {
  globalAny['setImmediate'] = (cb: (...args: any[]) => void, ...args: any[]) => {
    return setTimeout(cb, 0, ...args);
  };
}

const isEdge = process.env.NEXT_RUNTIME === 'edge';

/* -------------------------------------------------------------------------- */
/* 2. CLIENT FACTORY                                                          */
/* -------------------------------------------------------------------------- */

// Declare global extension for development mode
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function makePrismaClient() {
  // PREVENT EDGE INSTANTIATION: 
  // If this runs in Edge, we return undefined or a dummy to prevent crashes.
  // Real database calls will fail, which is expected (Edge shouldn't touch SQLite).
  if (isEdge) {
    return new Proxy({} as PrismaClient, {
      get: () => {
        throw new Error("PrismaClient cannot be used in Edge Runtime with SQLite.");
      }
    });
  }

  const datasourceUrl = process.env.DATABASE_URL;
  
  return new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    errorFormat: "minimal",
  });
}

/* -------------------------------------------------------------------------- */
/* 3. SINGLETON INSTANCE                                                      */
/* -------------------------------------------------------------------------- */

// Use global singleton in development
const prisma = globalAny.__prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production" && !isEdge) {
  globalAny.__prisma = prisma;
}

export default prisma;