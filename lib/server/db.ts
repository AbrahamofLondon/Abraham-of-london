// lib/server/db.ts
import "server-only";
import { prisma } from "@/lib/prisma.server";
import type { PrismaClient } from "@prisma/client";

export async function withDb<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } finally {
    if (process.env.PRISMA_FORCE_DISCONNECT === "true") {
      try { await prisma.$disconnect(); } catch {}
    }
  }
}