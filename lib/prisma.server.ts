// lib/prisma.server.ts — SERVER-ONLY PRISMA BARREL (Node runtime)
//
// Single source of truth for App Router server actions/routes.
// Delegates to the hardened Neon-backed server Prisma implementation.

import "server-only";

export {
  prisma,
  getPrisma,
  safePrismaQuery,
  checkDatabaseConnection,
} from "@/lib/db/prisma";

export { default } from "@/lib/db/prisma";

export type PrismaClientType = import("@/lib/db/prisma").PrismaTransactionClient;
export type { Prisma } from "@prisma/client";