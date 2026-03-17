// lib/server/prisma.ts — LEGACY COMPATIBILITY RE-EXPORT
//
// Old server imports may still point here.
// Keep this file thin so the project has one actual Prisma singleton path.

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