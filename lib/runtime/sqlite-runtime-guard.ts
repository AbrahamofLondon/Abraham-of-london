/**
 * lib/runtime/sqlite-runtime-guard.ts
 *
 * §2 production persistence doctrine — fail closed, do not silently fall back to a local
 * SQLite file in production. A local file store is not serverless-safe: on Netlify/Vercel
 * each invocation gets a fresh ephemeral filesystem, so writes are lost and never shared
 * across instances. Rather than silently create data/*.sqlite in production (and quietly
 * lose customer state), a runtime sqlite store must refuse to open in production unless
 * the operator has EXPLICITLY opted in via ALLOW_SQLITE_RUNTIME=1 (e.g. a single-instance
 * VPS with a persistent volume, where the operator accepts the single-writer constraint).
 *
 * Tests bypass this: they inject an in-memory DB via each store's _setDbForTest(), which
 * sets the module singleton directly and never calls the guarded open path. NODE_ENV in
 * tests is "test", not "production", so the guard is inert there regardless.
 */

export class SqliteRuntimeDisallowedError extends Error {
  constructor(storeName: string) {
    super(
      `[SQLITE_RUNTIME_DISALLOWED] "${storeName}" is a local-file SQLite store and is not serverless-safe. ` +
      `In production it must be backed by the canonical Postgres/Prisma authority. ` +
      `To run it on a persistent single-instance host, set ALLOW_SQLITE_RUNTIME=1 to opt in explicitly.`,
    );
    this.name = "SqliteRuntimeDisallowedError";
  }
}

/** Call at the top of a runtime sqlite store's open() before touching the filesystem. */
export function assertSqliteRuntimeAllowed(storeName: string): void {
  const isProd = process.env.NODE_ENV === "production";
  const optedIn = process.env.ALLOW_SQLITE_RUNTIME === "1" || process.env.ALLOW_SQLITE_RUNTIME === "true";
  if (isProd && !optedIn) {
    throw new SqliteRuntimeDisallowedError(storeName);
  }
}

export function isSqliteRuntimeAllowed(): boolean {
  const isProd = process.env.NODE_ENV === "production";
  const optedIn = process.env.ALLOW_SQLITE_RUNTIME === "1" || process.env.ALLOW_SQLITE_RUNTIME === "true";
  return !isProd || optedIn;
}
