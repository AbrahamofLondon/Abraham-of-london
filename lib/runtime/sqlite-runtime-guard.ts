/**
 * lib/runtime/sqlite-runtime-guard.ts
 *
 * §2 production persistence doctrine — fail closed, do not silently fall back to a local
 * SQLite file in production. A local file store is not serverless-safe: on Netlify/Vercel
 * each invocation gets a fresh ephemeral filesystem, so writes are lost and never shared
 * across instances. Rather than silently create data/*.sqlite in production (and quietly
 * lose customer state), a runtime sqlite store must be IMPOSSIBLE to open in production.
 * There is NO environment escape hatch (§3): a misconfigured production process must not
 * be able to reactivate ephemeral filesystem customer persistence with a convenience
 * toggle. Local/test SQLite is selected purely on NODE_ENV !== "production".
 *
 * Tests bypass this: they inject an in-memory DB via each store's _setDbForTest(), which
 * sets the module singleton directly and never calls the guarded open path. NODE_ENV in
 * tests is "test", not "production", so the guard is inert there regardless.
 */

export class SqliteRuntimeDisallowedError extends Error {
  constructor(storeName: string) {
    super(
      `[SQLITE_RUNTIME_DISALLOWED] "${storeName}" is a local-file SQLite store and is not serverless-safe. ` +
      `It cannot run in NODE_ENV=production: canonical customer state must be backed by the ` +
      `Postgres/Prisma authority. There is no production opt-in — use a non-production environment for SQLite.`,
    );
    this.name = "SqliteRuntimeDisallowedError";
  }
}

/**
 * Call at the top of a runtime sqlite store's open() before touching the filesystem.
 * FAIL CLOSED in production with NO escape hatch.
 */
export function assertSqliteRuntimeAllowed(storeName: string): void {
  if (process.env.NODE_ENV === "production") {
    throw new SqliteRuntimeDisallowedError(storeName);
  }
}

export function isSqliteRuntimeAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
}
