/**
 * tests/demo-journey/sqlite-runtime-guard.test.ts
 *
 * §2/§33 — the runtime sqlite doctrine fails closed in production. A local-file SQLite
 * store must refuse to open in NODE_ENV=production unless ALLOW_SQLITE_RUNTIME is set,
 * rather than silently create data/*.sqlite and lose customer state on serverless.
 */

import { describe, it, expect, afterEach } from "vitest";
import { assertSqliteRuntimeAllowed, isSqliteRuntimeAllowed, SqliteRuntimeDisallowedError } from "@/lib/runtime/sqlite-runtime-guard";

const originalEnv = process.env.NODE_ENV;
const originalOptIn = process.env.ALLOW_SQLITE_RUNTIME;
afterEach(() => {
  (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  if (originalOptIn === undefined) delete process.env.ALLOW_SQLITE_RUNTIME; else process.env.ALLOW_SQLITE_RUNTIME = originalOptIn;
});

describe("§3 sqlite runtime guard — fail closed in production, NO escape hatch", () => {
  it("throws in production", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    delete process.env.ALLOW_SQLITE_RUNTIME;
    expect(() => assertSqliteRuntimeAllowed("pilot-intake-store")).toThrow(SqliteRuntimeDisallowedError);
    expect(isSqliteRuntimeAllowed()).toBe(false);
  });

  it("STILL throws in production even with a legacy opt-in variable set (no backdoor)", () => {
    (process.env as Record<string, string>).NODE_ENV = "production";
    process.env.ALLOW_SQLITE_RUNTIME = "1";
    expect(() => assertSqliteRuntimeAllowed("pilot-intake-store")).toThrow(SqliteRuntimeDisallowedError);
    expect(isSqliteRuntimeAllowed()).toBe(false);
  });

  it("is inert outside production (dev/test)", () => {
    (process.env as Record<string, string>).NODE_ENV = "test";
    delete process.env.ALLOW_SQLITE_RUNTIME;
    expect(() => assertSqliteRuntimeAllowed("funnel-event-store")).not.toThrow();
    expect(isSqliteRuntimeAllowed()).toBe(true);
  });
});
