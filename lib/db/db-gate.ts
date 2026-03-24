// lib/db/db-gate.ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Determines whether database access should be attempted in the current environment.
 * Intended to block build-time access and allow explicit overrides when needed.
 */
export function shouldUseDatabase(): boolean {
  const forceDb =
    process.env.FORCE_DB === "1" || process.env.FORCE_DB === "true";

  const skipDb =
    process.env.SKIP_DB === "1" || process.env.SKIP_DB === "true";

  const isProdBuild = process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const isCi = process.env.CI === "true";
  const isTest =
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    process.env.JEST_WORKER_ID != null;

  if (forceDb) return true;
  if (skipDb) return false;

  if (!hasDatabaseUrl) return false;
  if (isProdBuild) return false;

  // In CI, default to off unless explicitly forced.
  // But allow tests to opt in through FORCE_DB.
  if (isCi && !isTest) return false;

  return true;
}

/**
 * Inverse helper for readability in some call sites.
 */
export function shouldSkipDatabase(): boolean {
  return !shouldUseDatabase();
}