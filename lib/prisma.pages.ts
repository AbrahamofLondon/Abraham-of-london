// lib/prisma.pages.ts — PAGES/LEGACY API SAFE PRISMA SINGLETON
//
// Canonical Prisma runtime for Pages Router, legacy API routes,
// and any shared server utilities that may be imported from pages/**.
// Do NOT add `server-only` here.

import { PrismaClient, type Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma_pages__: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: process.env.DATABASE_URL
      ? { db: { url: process.env.DATABASE_URL } }
      : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });
}

export const prisma: PrismaClient =
  global.__prisma_pages__ ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma_pages__ = prisma;
}

export const getPrisma = (): PrismaClient => prisma;

export async function safePrismaQuery<T>(
  label: string,
  fn: () => Promise<T>,
  fallback?: T,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[PRISMA:${label}]`, error);

    if (arguments.length >= 3) {
      return fallback as T;
    }

    throw error;
  }
}

export async function checkDatabaseConnection(): Promise<{
  ok: boolean;
  provider: string;
  timestamp: string;
  error?: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      provider: "prisma",
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return {
      ok: false,
      provider: "prisma",
      timestamp: new Date().toISOString(),
      error: error?.message || "DATABASE_CONNECTION_FAILED",
    };
  }
}

export async function getVaultStatus(): Promise<{
  ok: boolean;
  counts: {
    members: number;
    content: number;
    frameworks: number;
    downloads: number;
  };
  timestamp: string;
}> {
  const [members, content, frameworks, downloads] = await Promise.all([
    safePrismaQuery("vault.members.count", () => prisma.innerCircleMember.count(), 0),
    safePrismaQuery("vault.content.count", () => prisma.contentMetadata.count(), 0),
    safePrismaQuery("vault.frameworks.count", () => prisma.framework.count(), 0),
    safePrismaQuery("vault.downloads.count", () => prisma.downloadAuditEvent.count(), 0),
  ]);

  return {
    ok: true,
    counts: {
      members,
      content,
      frameworks,
      downloads,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function getStrategicContext(): Promise<{
  ok: boolean;
  metrics: {
    dealFlowSubmissions: number;
    strategyIntakes: number;
    inquiries: number;
    diagnostics: number;
  };
  timestamp: string;
}> {
  const diagnostics = await safePrismaQuery(
    "strategic.diagnostics.count",
    async () => {
      const p = prisma as any;

      if (p.diagnosticResult?.count) return await p.diagnosticResult.count();
      if (p.diagnosticRecord?.count) return await p.diagnosticRecord.count();
      return 0;
    },
    0,
  );

  const [dealFlowSubmissions, strategyIntakes, inquiries] = await Promise.all([
    safePrismaQuery("strategic.dealFlow.count", () => prisma.dealFlowSubmission.count(), 0),
    safePrismaQuery("strategic.strategyIntake.count", () => prisma.strategyIntake.count(), 0),
    safePrismaQuery("strategic.inquiries.count", () => prisma.strategyInquiry.count(), 0),
  ]);

  return {
    ok: true,
    metrics: {
      dealFlowSubmissions,
      strategyIntakes,
      inquiries,
      diagnostics,
    },
    timestamp: new Date().toISOString(),
  };
}

export default prisma;
export type { Prisma };
export type PrismaClientType = PrismaClient;