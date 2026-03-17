// lib/db/db-gate.ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Determines whether database access should be attempted in the current environment.
 * Prevents build-time or explicitly disabled environments from touching the database.
 */
export function shouldUseDatabase(): boolean {
  const forceDb =
    process.env.FORCE_DB === "1" || process.env.FORCE_DB === "true";

  const skipDb =
    process.env.SKIP_DB === "1" || process.env.SKIP_DB === "true";

  if (forceDb) return true;

  // Next.js production build phase
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return false;
  }

  // Manual override for build workers / deployments
  if (skipDb) {
    return false;
  }

  // No connection string available
  if (!process.env.DATABASE_URL?.trim()) {
    return false;
  }

  // CI commonly should not touch DB unless explicitly forced
  if (process.env.CI === "true") {
    return false;
  }

  return true;
}

/**
 * Inverse helper for readability in some call sites.
 */
export function shouldSkipDatabase(): boolean {
  return !shouldUseDatabase();
}