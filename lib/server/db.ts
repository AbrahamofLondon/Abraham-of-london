// lib/server/db.ts
import prisma from "@/lib/prisma";

export async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    // you can add targeted error mapping here later (Prisma known codes)
    throw err;
  } finally {
    // In serverless, you generally do NOT want to disconnect on every request.
    // But you *do* want the option in rare cases:
    if (process.env.PRISMA_FORCE_DISCONNECT === "true") {
      await prisma.$disconnect().catch(() => null);
    }
  }
}