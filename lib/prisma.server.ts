// lib/prisma.server.ts — SERVER-SIDE PRISMA BARREL
//
// Single source of truth for database access.
// Directives like "server-only" are removed to support the Pages Router 
// while keeping DB logic isolated from the client bundle.

export {
  prisma,
  getPrisma,
  safePrismaQuery,
  checkDatabaseConnection,
} from "@/lib/db/prisma";

export { default } from "@/lib/db/prisma";

export type PrismaClientType = import("@/lib/db/prisma").PrismaTransactionClient;
export type { Prisma } from "@prisma/client";