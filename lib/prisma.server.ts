// lib/prisma.server.ts — SERVER-ONLY PRISMA BARREL (Node runtime)
//
// Exports required by App Router server actions/routes:
// - prisma
// - getPrisma
// - safePrismaQuery
// - checkDatabaseConnection
//
// Never import this from pages/** client bundles.

import "server-only";

import { prisma, checkDatabaseConnection } from "@/lib/db/prisma";

export { prisma, checkDatabaseConnection };

// Helper parity with prisma.pages.ts
export const getPrisma = () => prisma;

export async function safePrismaQuery<T>(query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[VAULT_PRISMA_ERROR]:", error);
    return null;
  }
}

// Types (safe to export)
export type { Prisma } from "@prisma/client";
export type PrismaClientType = typeof prisma;