// lib/prisma.ts — COMPAT BARREL (PAGES-SAFE DEFAULT)
export {
  prisma,
  getPrisma,
  safePrismaQuery,
  getVaultStatus,
  getStrategicContext,
  type PrismaClientType,
} from "./prisma.pages";

export type { Prisma } from "@prisma/client";
export { default } from "./prisma.pages";