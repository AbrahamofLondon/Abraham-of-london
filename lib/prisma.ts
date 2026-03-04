// lib/prisma.ts — COMPAT BARREL (PAGES-SAFE DEFAULT)
//
// IMPORTANT:
// - This file MUST remain pages-safe because pages/** imports it.
// - Do NOT add `import "server-only"` here.
// - Server-only code should import from "@/lib/prisma.server" instead.

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