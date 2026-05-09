
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
} from "@/lib/prisma.pages";

export type { Prisma } from "@prisma/client";
export type { PrismaClientType } from "@/lib/prisma.pages";

export { default } from "@/lib/prisma.pages";
