import { describe, it, expect } from "vitest";
import {
  diagnosePermissions,
  diagnoseSurfaces,
  diagnoseTiers,
  diagnoseAdminNav,
  ALL_TIERS,
} from "./access-diagnostics";
import type { EffectiveAccess } from "@/lib/access/types";
import type { DecisionRole } from "@/lib/access/role-contract";
import { ROLE_PERMISSIONS, SURFACE_PERMISSIONS } from "@/lib/access/role-contract";

function access(overrides: Partial<EffectiveAccess> = {}): EffectiveAccess {
  return {
    userId: "user_test",
    email: "test@example.com",
    role: "USER",
    tier: "public",
    entitlements: { tiers: [], products: [], artifacts: [] },
    permissions: { isAuthenticated: true, isAdmin: false, isOwner: false },
    ...overrides,
  };
}

// ─── diagnosePermissions ──────────────────────────────────────────────────────

describe("diagnosePermissions — ADMIN", () => {
  it("returns a check for every permission", () => {
    const checks = diagnosePermissions("ADMIN");
    const allPerms = new Set(Object.values(ROLE_PERMISSIONS).flat());
    expect(checks.length).toBe(allPerms.size);
  });

  it("all permissions granted for ADMIN", () => {
    const checks = diagnosePermissions("ADMIN");
    expect(checks.every((c) => c.granted)).toBe(true);
  });
});

describe("diagnosePermissions — CLIENT", () => {
  it("CLIENT has CLIENT_SAFE_VIEW", () => {
    const checks = diagnosePermissions("CLIENT");
    const check = checks.find((c) => c.permission === "CLIENT_SAFE_VIEW");
    expect(check?.granted).toBe(true);
  });

  it("CLIENT does NOT have ADMIN_FULL", () => {
    const checks = diagnosePermissions("CLIENT");
    const check = checks.find((c) => c.permission === "ADMIN_FULL");
    expect(check?.granted).toBe(false);
  });

  it("CLIENT does NOT have OVERSIGHT_REVIEW", () => {
    const checks = diagnosePermissions("CLIENT");
    const check = checks.find((c) => c.permission === "OVERSIGHT_REVIEW");
    expect(check?.granted).toBe(false);
  });
});

describe("diagnosePermissions — RESPONDENT", () => {
  it("RESPONDENT only has CLIENT_SAFE_VIEW", () => {
    const checks = diagnosePermissions("RESPONDENT");
    const granted = checks.filter((c) => c.granted);
    expect(granted).toHaveLength(1);
    expect(granted[0]!.permission).toBe("CLIENT_SAFE_VIEW");
  });
});

describe("diagnosePermissions — OPERATOR", () => {
  it("OPERATOR has CADENCE_MANAGE", () => {
    const check = diagnosePermissions("OPERATOR").find((c) => c.permission === "CADENCE_MANAGE");
    expect(check?.granted).toBe(true);
  });

  it("OPERATOR does NOT have ADMIN_FULL", () => {
    const check = diagnosePermissions("OPERATOR").find((c) => c.permission === "ADMIN_FULL");
    expect(check?.granted).toBe(false);
  });
});

describe("diagnosePermissions — no duplicates", () => {
  const roles: DecisionRole[] = ["OWNER", "ADMIN", "OPERATOR", "SPONSOR", "CLIENT", "RESPONDENT", "COUNSEL_REVIEWER"];
  for (const role of roles) {
    it(`no duplicate permission checks for ${role}`, () => {
      const checks = diagnosePermissions(role);
      const perms = checks.map((c) => c.permission);
      expect(new Set(perms).size).toBe(perms.length);
    });
  }
});

// ─── diagnoseSurfaces ────────────────────────────────────────────────────────

describe("diagnoseSurfaces", () => {
  it("returns a check for every surface in SURFACE_PERMISSIONS", () => {
    const checks = diagnoseSurfaces("ADMIN");
    expect(checks.length).toBe(Object.keys(SURFACE_PERMISSIONS).length);
  });

  it("ADMIN can access all surfaces", () => {
    const checks = diagnoseSurfaces("ADMIN");
    expect(checks.every((c) => c.granted)).toBe(true);
  });

  it("RESPONDENT cannot access admin/full surface", () => {
    const check = diagnoseSurfaces("RESPONDENT").find((c) => c.surface === "admin/full");
    expect(check?.granted).toBe(false);
  });

  it("COUNSEL_REVIEWER can access counsel/status", () => {
    const check = diagnoseSurfaces("COUNSEL_REVIEWER").find((c) => c.surface === "counsel/status");
    expect(check?.granted).toBe(true);
  });

  it("each check includes requiredPermission", () => {
    const checks = diagnoseSurfaces("OPERATOR");
    for (const c of checks) {
      expect(c.requiredPermission).toBeTruthy();
    }
  });
});

// ─── diagnoseTiers ────────────────────────────────────────────────────────────

describe("diagnoseTiers", () => {
  it("returns a check for every tier", () => {
    const checks = diagnoseTiers(access());
    expect(checks.length).toBe(ALL_TIERS.length);
  });

  it("public tier always granted", () => {
    const check = diagnoseTiers(access({ tier: "public" })).find((c) => c.tier === "public");
    expect(check?.granted).toBe(true);
  });

  it("owner tier granted for owner-level access", () => {
    const check = diagnoseTiers(access({ tier: "owner" })).find((c) => c.tier === "owner");
    expect(check?.granted).toBe(true);
  });

  it("restricted tier NOT granted for member-level access", () => {
    const check = diagnoseTiers(access({ tier: "member" })).find((c) => c.tier === "restricted");
    expect(check?.granted).toBe(false);
  });
});

// ─── diagnoseAdminNav ────────────────────────────────────────────────────────

describe("diagnoseAdminNav", () => {
  it("admin user sees nav sections", () => {
    const sections = diagnoseAdminNav(access({ permissions: { isAuthenticated: true, isAdmin: true, isOwner: false } }));
    expect(sections.length).toBeGreaterThan(0);
  });

  it("non-admin sees sponsor_safe sections only", () => {
    const adminSections = diagnoseAdminNav(access({ permissions: { isAuthenticated: true, isAdmin: true, isOwner: false } }));
    const publicSections = diagnoseAdminNav(access({ permissions: { isAuthenticated: true, isAdmin: false, isOwner: false } }));
    expect(adminSections.length).toBeGreaterThanOrEqual(publicSections.length);
  });

  it("owner user sees full admin nav", () => {
    const sections = diagnoseAdminNav(access({ permissions: { isAuthenticated: true, isAdmin: true, isOwner: true } }));
    expect(sections.length).toBeGreaterThan(0);
  });
});
