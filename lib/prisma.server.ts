// lib/prisma.server.ts — SERVER COMPAT ALIAS
//
// Keep this file for compatibility with older imports.
// In a Pages Router-heavy codebase, do NOT use `server-only` here.

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
