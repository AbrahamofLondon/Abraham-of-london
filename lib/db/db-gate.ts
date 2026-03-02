// lib/db/db-gate.ts
import { PHASE_PRODUCTION_BUILD } from "next/constants";

/**
 * Determines if database access should be attempted in the current environment.
 * Critical for preventing build-time database connections that would cause failures.
 */
export function shouldUseDatabase(): boolean {
  // Build-time detection (most reliable for Next.js)
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) {
    return false;
  }

  // Manual override for build workers
  if (process.env.SKIP_DB === "1" || process.env.SKIP_DB === "true") {
    return false;
  }

  // No connection string available
  if (!process.env.DATABASE_URL) {
    return false;
  }

  // CI environments (GitHub Actions, etc.) often don't need DB access
  if (process.env.CI === "true") {
    return false;
  }

  // Safe to attempt database connection
  return true;
}