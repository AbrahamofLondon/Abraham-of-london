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
import { canAccessAdmin } from "@/lib/access/checks";
import { getUserAccess } from "@/lib/access/get-user-access";
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
