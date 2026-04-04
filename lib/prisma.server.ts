// lib/prisma.server.ts — APP/SERVER SAFE PRISMA SINGLETON
//
// This file exists to provide a single server-side Prisma entrypoint
// for server-only consumers. It must never be imported in client code.

import "server-only";

import { PrismaClient, type Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_server__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma: PrismaClient = global.__prisma_server__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma_server__ = prisma;
}

export const getPrisma = (): PrismaClient => prisma;

export default prisma;
export type { Prisma };
export type PrismaClientType = PrismaClient;