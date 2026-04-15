console.log("[MODULE_INIT] lib/prisma");

// lib/prisma.ts — PAGES-SAFE COMPAT BARREL
//
// Use this from pages/** and legacy API routes.
// Do NOT add `server-only` here.

export {
  prisma,
  getPrisma,
  safePrismaQuery,
  checkDatabaseConnection,
  getVaultStatus,
  getStrategicContext,
} from "./prisma.pages";

export type { Prisma } from "@prisma/client";
export type { PrismaClientType } from "./prisma.pages";

export { default } from "./prisma.pages";