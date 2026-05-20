import { describe, expect, it } from "vitest";

import { getSafeDatabaseEnvDiagnostics } from "./safe-database-env-diagnostics";

describe("safe database env diagnostics", () => {
  it("reports only safe DATABASE_URL shape metadata", () => {
    const result = getSafeDatabaseEnvDiagnostics({
      DATABASE_URL: "postgresql://user:secret@ep-example-pooler.eu-west-2.aws.neon.tech/db?sslmode=require",
      DIRECT_URL: "postgresql://user:secret@ep-example.eu-west-2.aws.neon.tech/db?sslmode=require",
    });

    expect(result).toEqual({
      hasDatabaseUrl: true,
      scheme: "postgresql",
      hostPresent: true,
      usesPoolerHost: true,
      hasDirectUrl: true,
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("ep-example");
  });

  it("classifies missing and non-Postgres schemes without exposing values", () => {
    expect(getSafeDatabaseEnvDiagnostics({}).scheme).toBe("missing");
    expect(getSafeDatabaseEnvDiagnostics({ DATABASE_URL: "file:./dev.db" }).scheme).toBe("other");
  });
});
