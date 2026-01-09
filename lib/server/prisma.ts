// lib/server/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function isBuildOrEdge() {
  return process.env.NEXT_PHASE || process.env.NEXT_RUNTIME === "edge";
}

export function getPrisma(): PrismaClient {
  if (isBuildOrEdge()) {
    throw new Error("Prisma blocked during build/edge runtime");
  }

  if (!global.__prisma) {
    global.__prisma = new PrismaClient({ log: ["error", "warn"] });
  }
  return global.__prisma;
}

// Create and export a prisma instance for backward compatibility
export const prisma = getPrisma();

export async function safePrismaQuery<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T | null> {
  try {
    const prisma = getPrisma();
    return await fn(prisma);
  } catch (e) {
    // Green posture: fail open
    console.warn("[Prisma] skipped:", (e as Error).message);
    return null;
  }
}