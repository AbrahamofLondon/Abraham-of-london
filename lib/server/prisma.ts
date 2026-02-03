// lib/server/prisma.ts — HARDENED SINGLETON
import { PrismaClient } from "@prisma/client";

/**
 * INSTITUTIONAL PRISMA WRAPPER
 * * Prevents multiple instances of Prisma Client in development (Hot Reload) 
 * and optimizes connection pooling in Serverless (Netlify/Neon).
 */

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;