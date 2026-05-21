import { describe, expect, it } from "vitest";

import {
  classifyAuthError,
  safeAuthClientMessage,
  sanitizeAuthErrorParam,
} from "./auth-error-classifier";

describe("auth error classifier", () => {
  it("maps Prisma connectivity errors to AUTH_DATABASE_UNAVAILABLE", () => {
    const error = new Error(
      "Invalid `prisma.user.upsert()` invocation: Can't reach database server at `ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech:5432`",
    );

    expect(classifyAuthError(error).code).toBe("AUTH_DATABASE_UNAVAILABLE");
  });

  it("prefers connectivity over generic Prisma initialization classification", () => {
    const error = Object.assign(
      new Error(
        "Can't reach database server at `ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech:5432`",
      ),
      { constructor: { name: "PrismaClientInitializationError" } },
    );

    expect(classifyAuthError(error).code).toBe("AUTH_DATABASE_UNAVAILABLE");
  });

  it("maps invalid DATABASE_URL errors to AUTH_DATABASE_CONFIGURATION_ERROR", () => {
    const error = Object.assign(
      new Error("DATABASE_URL must start with postgresql:// or postgres://"),
      { constructor: { name: "PrismaClientInitializationError" } },
    );

    expect(classifyAuthError(error).code).toBe("AUTH_DATABASE_CONFIGURATION_ERROR");
  });

  it("maps database credential failures to AUTH_DATABASE_AUTHENTICATION_FAILED", () => {
    const error = new Error(
      "Authentication failed against database server at ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech, the provided database credentials are not valid.",
    );

    expect(classifyAuthError(error).code).toBe("AUTH_DATABASE_AUTHENTICATION_FAILED");
  });

  it("maps Prisma P1000 to AUTH_DATABASE_AUTHENTICATION_FAILED", () => {
    expect(classifyAuthError(new Error("P1000: Authentication failed against database server")).code).toBe(
      "AUTH_DATABASE_AUTHENTICATION_FAILED",
    );
  });

  it("maps unknown errors to AUTH_SIGNIN_FAILED", () => {
    expect(classifyAuthError(new Error("provider returned invalid profile")).code).toBe(
      "AUTH_SIGNIN_FAILED",
    );
  });

  it("never returns raw database details in the client message", () => {
    const safe = classifyAuthError(new Error("Can't reach database server at ep-secret.neon.tech:5432"));

    expect(safe.clientMessage).toBe(safeAuthClientMessage());
    expect(safe.clientMessage).not.toContain("neon.tech");
    expect(safe.clientMessage).not.toContain("prisma.user.upsert");
  });

  it("sanitizes unknown client error params", () => {
    expect(sanitizeAuthErrorParam("Invalid prisma.user.upsert invocation")).toBe("AUTH_SIGNIN_FAILED");
  });
});
