import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma.server";

type NullableString = string | null;

type StrategyRoomSessionData = {
  sessionKey: string;
  status: string;
  source: NullableString;
  intake: NullableString;
  canonicalSnapshot: NullableString;
  route: NullableString;
  readinessTier: NullableString;
  authorityType: NullableString;
};

type StrategyRoomImpressionData = {
  sessionKey: string;
  recommendations: string;
  canonicalSnapshot: NullableString;
};

type StrategyRoomFollowupData = {
  sessionKey: string;
  routeAfter: string;
  readinessTierAfter: string;
  authorityTypeAfter: string;
  clarityDelta: number;
  authorityDelta: number;
  convertedAfterGuidance: boolean;
  metadata: NullableString;
  canonicalSnapshot: NullableString;
};

type StrategyRoomConversionData = {
  sessionKey: string;
  conversionType: string;
  metadata: NullableString;
  canonicalSnapshot: NullableString;
};

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || "";
}

function isPostgresDatabaseUrl(): boolean {
  const url = getDatabaseUrl();
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function getStrategyRoomPersistenceBranch():
  | "sqlite_prisma"
  | "postgres_neon"
  | "missing_database_url"
  | "unsupported_database_url" {
  const url = getDatabaseUrl();
  if (!url) {
    return "missing_database_url";
  }
  if (url.startsWith("file:")) {
    return "sqlite_prisma";
  }
  if (isPostgresDatabaseUrl()) {
    return "postgres_neon";
  }
  return "unsupported_database_url";
}

function makePersistenceId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

function getSql() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required for Strategy Room persistence.");
  }

  return neon(url);
}

async function ensurePostgresStrategyRoomTables(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS "StrategyRoomSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionKey" TEXT NOT NULL UNIQUE,
      "status" TEXT NOT NULL,
      "source" TEXT,
      "intake" TEXT,
      "canonicalSnapshot" TEXT,
      "route" TEXT,
      "readinessTier" TEXT,
      "authorityType" TEXT,
      "lastImpressionAt" TIMESTAMPTZ,
      "lastFollowupAt" TIMESTAMPTZ,
      "lastConversionAt" TIMESTAMPTZ,
      "lastConversionType" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "StrategyRoomRecommendationImpression" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionKey" TEXT NOT NULL,
      "recommendations" TEXT NOT NULL,
      "canonicalSnapshot" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "StrategyRoomFollowup" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionKey" TEXT NOT NULL,
      "routeAfter" TEXT NOT NULL,
      "readinessTierAfter" TEXT NOT NULL,
      "authorityTypeAfter" TEXT NOT NULL,
      "clarityDelta" DOUBLE PRECISION NOT NULL,
      "authorityDelta" DOUBLE PRECISION NOT NULL,
      "convertedAfterGuidance" BOOLEAN NOT NULL,
      "metadata" TEXT,
      "canonicalSnapshot" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "StrategyRoomConversion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionKey" TEXT NOT NULL,
      "conversionType" TEXT NOT NULL,
      "metadata" TEXT,
      "canonicalSnapshot" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function createStrategyRoomSession(
  data: StrategyRoomSessionData
): Promise<void> {
  const branch = getStrategyRoomPersistenceBranch();

  if (branch === "sqlite_prisma") {
    await prisma.strategyRoomSession.create({ data });
    return;
  }

  if (branch !== "postgres_neon") {
    throw new Error(`Strategy Room persistence unsupported branch: ${branch}`);
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    INSERT INTO "StrategyRoomSession" (
      "id",
      "sessionKey",
      "status",
      "source",
      "intake",
      "canonicalSnapshot",
      "route",
      "readinessTier",
      "authorityType"
    )
    VALUES (
      ${makePersistenceId("srs")},
      ${data.sessionKey},
      ${data.status},
      ${data.source},
      ${data.intake},
      ${data.canonicalSnapshot},
      ${data.route},
      ${data.readinessTier},
      ${data.authorityType}
    );
  `;
}

export async function createStrategyRoomImpression(
  data: StrategyRoomImpressionData
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomRecommendationImpression.create({ data });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    INSERT INTO "StrategyRoomRecommendationImpression" (
      "id",
      "sessionKey",
      "recommendations",
      "canonicalSnapshot"
    )
    VALUES (
      ${makePersistenceId("sri")},
      ${data.sessionKey},
      ${data.recommendations},
      ${data.canonicalSnapshot}
    );
  `;
}

export async function markStrategyRoomImpression(
  sessionKey: string,
  canonicalSnapshot: NullableString
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot,
        lastImpressionAt: new Date(),
      },
    });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    UPDATE "StrategyRoomSession"
    SET
      "canonicalSnapshot" = ${canonicalSnapshot},
      "lastImpressionAt" = CURRENT_TIMESTAMP,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "sessionKey" = ${sessionKey};
  `;
}

export async function createStrategyRoomFollowup(
  data: StrategyRoomFollowupData
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomFollowup.create({ data });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    INSERT INTO "StrategyRoomFollowup" (
      "id",
      "sessionKey",
      "routeAfter",
      "readinessTierAfter",
      "authorityTypeAfter",
      "clarityDelta",
      "authorityDelta",
      "convertedAfterGuidance",
      "metadata",
      "canonicalSnapshot"
    )
    VALUES (
      ${makePersistenceId("srf")},
      ${data.sessionKey},
      ${data.routeAfter},
      ${data.readinessTierAfter},
      ${data.authorityTypeAfter},
      ${data.clarityDelta},
      ${data.authorityDelta},
      ${data.convertedAfterGuidance},
      ${data.metadata},
      ${data.canonicalSnapshot}
    );
  `;
}

export async function markStrategyRoomFollowup(
  sessionKey: string,
  canonicalSnapshot: NullableString
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot,
        lastFollowupAt: new Date(),
      },
    });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    UPDATE "StrategyRoomSession"
    SET
      "canonicalSnapshot" = ${canonicalSnapshot},
      "lastFollowupAt" = CURRENT_TIMESTAMP,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "sessionKey" = ${sessionKey};
  `;
}

export async function createStrategyRoomConversion(
  data: StrategyRoomConversionData
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomConversion.create({ data });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    INSERT INTO "StrategyRoomConversion" (
      "id",
      "sessionKey",
      "conversionType",
      "metadata",
      "canonicalSnapshot"
    )
    VALUES (
      ${makePersistenceId("src")},
      ${data.sessionKey},
      ${data.conversionType},
      ${data.metadata},
      ${data.canonicalSnapshot}
    );
  `;
}

export async function markStrategyRoomConversion(
  sessionKey: string,
  conversionType: string,
  canonicalSnapshot: NullableString
): Promise<void> {
  if (!isPostgresDatabaseUrl()) {
    await prisma.strategyRoomSession.updateMany({
      where: { sessionKey },
      data: {
        canonicalSnapshot,
        lastConversionAt: new Date(),
        lastConversionType: conversionType,
      },
    });
    return;
  }

  await ensurePostgresStrategyRoomTables();
  const sql = getSql();

  await sql`
    UPDATE "StrategyRoomSession"
    SET
      "canonicalSnapshot" = ${canonicalSnapshot},
      "lastConversionAt" = CURRENT_TIMESTAMP,
      "lastConversionType" = ${conversionType},
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE "sessionKey" = ${sessionKey};
  `;
}
