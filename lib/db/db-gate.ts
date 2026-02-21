// lib/db/db-gate.ts
export function shouldUseDatabase() {
  // build workers (next build) should not require DB
  if (process.env.SKIP_DB === "1") return false;

  // no URL, no DB
  if (!process.env.DATABASE_URL) return false;

  // optional: disable in CI environments
  if (process.env.CI === "true") return false;

  return true;
}