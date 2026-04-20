CREATE TABLE IF NOT EXISTS "StrategyRoomSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "source" TEXT,
  "intake" TEXT,
  "canonicalSnapshot" TEXT,
  "route" TEXT,
  "readinessTier" TEXT,
  "authorityType" TEXT,
  "lastImpressionAt" DATETIME,
  "lastFollowupAt" DATETIME,
  "lastConversionAt" DATETIME,
  "lastConversionType" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "StrategyRoomSession_sessionKey_key"
  ON "StrategyRoomSession"("sessionKey");

CREATE TABLE IF NOT EXISTS "StrategyRoomRecommendationImpression" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionKey" TEXT NOT NULL,
  "recommendations" TEXT NOT NULL,
  "canonicalSnapshot" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StrategyRoomFollowup" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionKey" TEXT NOT NULL,
  "routeAfter" TEXT NOT NULL,
  "readinessTierAfter" TEXT NOT NULL,
  "authorityTypeAfter" TEXT NOT NULL,
  "clarityDelta" REAL NOT NULL,
  "authorityDelta" REAL NOT NULL,
  "convertedAfterGuidance" BOOLEAN NOT NULL,
  "metadata" TEXT,
  "canonicalSnapshot" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StrategyRoomConversion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionKey" TEXT NOT NULL,
  "conversionType" TEXT NOT NULL,
  "metadata" TEXT,
  "canonicalSnapshot" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
