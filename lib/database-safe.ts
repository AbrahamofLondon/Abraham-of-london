// lib/database-safe.ts
/**
 * Safe Prisma/Redis connections for builds + SSR.
 * - No Prisma import during build
 * - No Redis import during build
 * - Singleton Prisma in dev to avoid connection churn
 */

import { createBuildSafeClient, env, hasServiceEnv } from "@/lib/build-safe";

// ------------------------------
// Mock clients (build/SSR fallback)
// ------------------------------
type PrismaFrameworkModel = {
  findMany: (...args: any[]) => Promise<any[]>;
  findUnique: (...args: any[]) => Promise<any | null>;
};

type MockPrismaClient = {
  framework: PrismaFrameworkModel;
  // add other models you use:
  // post: { findMany: ... }
};

const mockPrismaClient: MockPrismaClient = {
  framework: {
    findMany: async () => [],
    findUnique: async () => null,
  },
};

type MockRedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ...rest: any[]) => Promise<"OK">;
  quit: () => Promise<void>;
};

const mockRedisClient: MockRedisClient = {
  get: async () => null,
  set: async () => "OK",
  quit: async () => {},
};

// ------------------------------
// Prisma (singleton in dev)
// ------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __AOL_PRISMA__: any | undefined;
}

function createPrismaRealClient() {
  // Avoid loading @prisma/client during build/SSR fallback
  // Only create when we actually have DATABASE_URL.
  if (!hasServiceEnv("database")) return null;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { PrismaClient } = require("@prisma/client");
  return new PrismaClient();
}

export const prisma = createBuildSafeClient({
  label: "Prisma",
  fallback: mockPrismaClient,
  create: () => {
    // Skip during build
    if (env.isBuildTime()) return mockPrismaClient;

    // In SSR runtime without DATABASE_URL, return mock
    const real = createPrismaRealClient();
    if (!real) return mockPrismaClient;

    // Singleton in development (hot reload)
    if (process.env.NODE_ENV !== "production") {
      if (!global.__AOL_PRISMA__) global.__AOL_PRISMA__ = real;
      return global.__AOL_PRISMA__;
    }

    return real;
  },
});

// ------------------------------
// Redis (conditional on REDIS_URL)
// ------------------------------
function createRedisRealClient() {
  if (!hasServiceEnv("redis")) return null;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Redis = require("ioredis");
  return new Redis(process.env.REDIS_URL);
}

export const redis = createBuildSafeClient({
  label: "Redis",
  fallback: mockRedisClient,
  create: () => {
    if (env.isBuildTime()) return mockRedisClient;

    const real = createRedisRealClient();
    if (!real) return mockRedisClient;

    return real;
  },
});

// ------------------------------
// Safe query wrapper
// ------------------------------
export async function safeDbQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  context = "database query"
): Promise<T> {
  if (env.isBuildTime()) {
    // Keep build logs quiet unless debugging
    if (process.env.DEBUG_BUILD_SAFE === "true") {
      // eslint-disable-next-line no-console
      console.log(`[DatabaseSafe] Skipping ${context} during build`);
    }
    return fallback;
  }

  try {
    return await queryFn();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[DatabaseSafe] ${context} failed:`, error);
    return fallback;
  }
}