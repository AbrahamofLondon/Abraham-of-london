import { describe, expect, it } from "vitest";

import type { EffectiveAccess } from "@/lib/access/types";
import {
  assertProvenanceOperationAllowed,
  canAccessProvenanceOperation,
  type ProvenancePolicyAction,
} from "./provenance-access-policy";

const ACTIONS: ProvenancePolicyAction[] = [
  "VIEW_FULL_PROVENANCE",
  "VIEW_CLIENT_SAFE_PROVENANCE",
  "VERIFY_PROVENANCE_HASH",
  "CREATE_PROVENANCE_ANCHOR",
  "EXPORT_PROVENANCE",
];

function access(overrides: Partial<EffectiveAccess["permissions"]> = {}): EffectiveAccess {
  return {
    userId: "user_1",
    email: "admin@example.com",
    role: "ADMIN",
    tier: "owner",
    entitlements: {
      tiers: [],
      products: [],
      artifacts: [],
    },
    permissions: {
      isAuthenticated: true,
      isAdmin: true,
      isOwner: false,
      ...overrides,
    },
  };
}

describe("canAccessProvenanceOperation", () => {
  it("allows admins to perform every v1 provenance action", () => {
    for (const action of ACTIONS) {
      expect(canAccessProvenanceOperation({ access: access() }, action)).toEqual({
        allowed: true,
        reason: "ALLOWED_ADMIN_OR_OWNER",
      });
    }
  });

  it("allows owners to perform every v1 provenance action", () => {
    for (const action of ACTIONS) {
      expect(canAccessProvenanceOperation({
        access: access({ isAdmin: false, isOwner: true }),
      }, action).allowed).toBe(true);
    }
  });

  it("denies unauthenticated subjects", () => {
    const decision = canAccessProvenanceOperation({
      access: access({ isAuthenticated: false, isAdmin: false, isOwner: false }),
    }, "VIEW_FULL_PROVENANCE");
    expect(decision).toEqual({
      allowed: false,
      reason: "AUTHENTICATION_REQUIRED",
    });
  });

  it("denies unknown subjects", () => {
    expect(canAccessProvenanceOperation(null, "VERIFY_PROVENANCE_HASH")).toEqual({
      allowed: false,
      reason: "AUTHENTICATION_REQUIRED",
    });
  });

  it("denies authenticated non-admin users", () => {
    const decision = canAccessProvenanceOperation({
      access: access({ isAdmin: false, isOwner: false }),
    }, "VIEW_CLIENT_SAFE_PROVENANCE");
    expect(decision).toEqual({
      allowed: false,
      reason: "ADMIN_OR_OWNER_REQUIRED",
    });
  });

  it("denies unknown actions", () => {
    expect(canAccessProvenanceOperation({ access: access() }, "DELETE_PROVENANCE")).toEqual({
      allowed: false,
      reason: "UNKNOWN_ACTION",
    });
  });

  it("assert helper returns boolean allow result", () => {
    expect(assertProvenanceOperationAllowed({ access: access() }, "EXPORT_PROVENANCE")).toBe(true);
    expect(assertProvenanceOperationAllowed({
      access: access({ isAdmin: false, isOwner: false }),
    }, "EXPORT_PROVENANCE")).toBe(false);
  });
});
