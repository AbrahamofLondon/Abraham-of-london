import { describe, expect, it } from "vitest";

import {
  ADMIN_EMAILS as AUTH_ADMIN_EMAILS,
  isAdminEmail,
  isAuthorizedAdminSubject,
} from "@/lib/auth/admin-authority";
import {
  ADMIN_EMAILS,
  BOOTSTRAP_ADMIN_EMAILS,
  getBootstrapAdminEmails,
  isBootstrapAdminEmail,
} from "@/lib/access/admin-emails";
import { getResolvedAdminEmails } from "@/lib/access/admin-email-resolver";
import { canAccessAdmin } from "@/lib/access/checks";
import { getUserAccess, getUserAccessFromSession } from "@/lib/access/get-user-access";
import type { EffectiveAccess } from "@/lib/access/types";

type FakeUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN" | "OWNER";
};

function fakePrisma(user: FakeUser | null) {
  return {
    user: {
      findUnique: async () => user,
    },
    entitlement: {
      findMany: async () => [],
    },
  } as any;
}

describe("admin authority single source of truth", () => {
  it("allows a bootstrap admin email even when the DB role is stale", async () => {
    const access = await getUserAccess(fakePrisma({
      id: "user_1",
      email: "seunadaramola@gmail.com",
      role: "USER",
    }), "user_1");

    expect(access.permissions.isAdmin).toBe(true);
    expect(canAccessAdmin(access)).toBe(true);
  });

  it("rejects a non-admin email with USER role", async () => {
    const access = await getUserAccess(fakePrisma({
      id: "user_2",
      email: "reader@example.com",
      role: "USER",
    }), "user_2");

    expect(access.permissions.isAdmin).toBe(false);
    expect(canAccessAdmin(access)).toBe(false);
  });

  it("allows a DB ADMIN role when policy grants DB admins", async () => {
    const access = await getUserAccess(fakePrisma({
      id: "user_3",
      email: "operator@example.com",
      role: "ADMIN",
    }), "user_3");

    expect(access.permissions.isAdmin).toBe(true);
    expect(canAccessAdmin(access)).toBe(true);
  });

  it("keeps page and API guard decisions on the same resolved access predicate", () => {
    const access = {
      permissions: {
        isAuthenticated: true,
        isAdmin: true,
        isOwner: false,
      },
    } as EffectiveAccess;

    const pageGuardDecision = canAccessAdmin(access);
    const apiGuardDecision = canAccessAdmin(access);

    expect(pageGuardDecision).toBe(true);
    expect(apiGuardDecision).toBe(pageGuardDecision);
  });

  it("prevents admin email list divergence by re-exporting the canonical bootstrap list", () => {
    expect(AUTH_ADMIN_EMAILS).toEqual(ADMIN_EMAILS);
    expect(AUTH_ADMIN_EMAILS).toEqual(getBootstrapAdminEmails());
    expect(new Set(AUTH_ADMIN_EMAILS)).toEqual(BOOTSTRAP_ADMIN_EMAILS);
    expect(isAdminEmail("INFO@ABRAHAMOFLONDON.ORG")).toBe(true);
    expect(isBootstrapAdminEmail("INFO@ABRAHAMOFLONDON.ORG")).toBe(true);
  });

  it("uses the same lockout-protected subject semantics for session/edge helpers", () => {
    expect(isAuthorizedAdminSubject({
      email: "abrahamadaramola@outlook.com",
      role: "USER",
    })).toBe(true);
    expect(isAuthorizedAdminSubject({
      email: "operator@example.com",
      role: "ADMIN",
    })).toBe(true);
    expect(isAuthorizedAdminSubject({
      email: "reader@example.com",
      role: "USER",
    })).toBe(false);
  });
});

// ── Bootstrap admin recovery tests ────────────────────────────────────────────

function prismaNoUser() {
  return {
    user: { findUnique: async () => null },
    entitlement: { findMany: async () => [] },
  } as any;
}

function prismaDbDown() {
  return {
    user: {
      findUnique: async () => {
        throw new Error("Connection refused");
      },
    },
    entitlement: { findMany: async () => [] },
  } as any;
}

describe("bootstrap admin recovery — getUserAccess", () => {
  it("bootstrap admin email + no DB user ID → canAccessAdmin true", async () => {
    const access = await getUserAccess(prismaNoUser(), null, "seunadaramola@gmail.com");
    expect(access.permissions.isAuthenticated).toBe(true);
    expect(access.permissions.isAdmin).toBe(true);
    expect(canAccessAdmin(access)).toBe(true);
  });

  it("bootstrap admin email + DB unavailable → canAccessAdmin true", async () => {
    const access = await getUserAccess(prismaDbDown(), "some-uuid", "info@abrahamoflondon.org");
    expect(access.permissions.isAuthenticated).toBe(true);
    expect(access.permissions.isAdmin).toBe(true);
    expect(canAccessAdmin(access)).toBe(true);
  });

  it("bootstrap owner email → isOwner true", async () => {
    const access = await getUserAccess(prismaNoUser(), null, "info@abrahamoflondon.org");
    expect(access.permissions.isOwner).toBe(true);
    expect(access.permissions.isAdmin).toBe(true);
  });

  it("non-bootstrap email + no DB user ID → denied", async () => {
    const access = await getUserAccess(prismaNoUser(), null, "random@example.com");
    expect(access.permissions.isAuthenticated).toBe(false);
    expect(access.permissions.isAdmin).toBe(false);
    expect(canAccessAdmin(access)).toBe(false);
  });

  it("non-bootstrap email + DB unavailable → denied", async () => {
    const access = await getUserAccess(prismaDbDown(), "some-uuid", "random@example.com");
    expect(access.permissions.isAdmin).toBe(false);
    expect(canAccessAdmin(access)).toBe(false);
  });

  it("getUserAccessFromSession with bootstrap email and no id → admin", async () => {
    const access = await getUserAccessFromSession(prismaNoUser(), {
      user: { id: "", email: "admin@abrahamoflondon.org" },
    });
    expect(access.permissions.isAdmin).toBe(true);
    expect(canAccessAdmin(access)).toBe(true);
  });

  it("getUserAccessFromSession with non-admin email → denied", async () => {
    const access = await getUserAccessFromSession(prismaNoUser(), {
      user: { id: null, email: "visitor@example.com" },
    });
    expect(access.permissions.isAdmin).toBe(false);
  });
});

describe("ADMIN_USER_EMAILS parser", () => {
  it("accepts comma-separated list and normalises case", () => {
    const emails = getResolvedAdminEmails({
      ADMIN_USER_EMAILS: "Alpha@Example.com,beta@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(emails).toContain("alpha@example.com");
    expect(emails).toContain("beta@example.com");
  });

  it("accepts semicolon-separated list", () => {
    const emails = getResolvedAdminEmails({
      ADMIN_USER_EMAILS: "a@example.com;b@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(emails).toContain("a@example.com");
    expect(emails).toContain("b@example.com");
  });

  it("accepts space-separated list", () => {
    const emails = getResolvedAdminEmails({
      ADMIN_USER_EMAILS: "x@example.com y@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(emails).toContain("x@example.com");
    expect(emails).toContain("y@example.com");
  });

  it("strips whitespace from individual addresses", () => {
    const emails = getResolvedAdminEmails({
      ADMIN_USER_EMAILS: "  spaced@example.com  ",
    } as unknown as NodeJS.ProcessEnv);
    expect(emails).toContain("spaced@example.com");
  });

  it("always includes hardcoded bootstrap addresses regardless of env", () => {
    const emails = getResolvedAdminEmails({} as unknown as NodeJS.ProcessEnv);
    expect(emails).toContain("seunadaramola@gmail.com");
    expect(emails).toContain("info@abrahamoflondon.org");
    expect(emails).toContain("admin@abrahamoflondon.org");
    expect(emails).toContain("abrahamadaramola@outlook.com");
  });
});
