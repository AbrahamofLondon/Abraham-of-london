/**
 * lib/admin/access-diagnostics.ts
 *
 * Read-only diagnostic helper for the View-As admin surface.
 *
 * Loads a user by email and runs every access check in one pass.
 * Nothing here mutates data or issues sessions — it is a diagnostic
 * snapshot only.
 *
 * Exports:
 *   Pure (testable):
 *     diagnosePermissions(role) → PermissionCheck[]
 *     diagnoseSurfaces(role)    → SurfaceCheck[]
 *     diagnoseTiers(access)     → TierCheck[]
 *     diagnoseAdminNav(access)  → AdminNavSection[] (visible sections)
 *
 *   Server (requires Prisma + network):
 *     loadUserDiagnostics(email) → Promise<AccessDiagnosticResult>
 */

import type { EffectiveAccess, AccessTier } from "@/lib/access/types";
import type { DecisionRole, DecisionPermission } from "@/lib/access/role-contract";
import {
  ROLE_PERMISSIONS,
  SURFACE_PERMISSIONS,
  hasPermission,
} from "@/lib/access/role-contract";
import { canAccessTier } from "@/lib/access/checks";
import { getNavItemsForRole, type AdminNavSection } from "@/lib/admin/admin-navigation";

// ─── Result types ─────────────────────────────────────────────────────────────

export type PermissionCheck = {
  permission: DecisionPermission;
  granted: boolean;
};

export type SurfaceCheck = {
  surface: string;
  requiredPermission: DecisionPermission;
  granted: boolean;
};

export type TierCheck = {
  tier: AccessTier;
  granted: boolean;
};

export type AccessDiagnosticResult = {
  found: boolean;
  email: string;
  userId: string | null;
  effectiveRole: DecisionRole | null;
  roleSource: string | null;
  access: EffectiveAccess;
  permissionChecks: PermissionCheck[];
  surfaceChecks: SurfaceCheck[];
  tierChecks: TierCheck[];
  visibleAdminNav: AdminNavSection[];
  entitlements: {
    tiers: AccessTier[];
    products: string[];
    artifacts: string[];
  };
  notFoundReason?: string;
};

// ─── Ordered tier list (ascending privilege) ─────────────────────────────────

export const ALL_TIERS: AccessTier[] = [
  "public",
  "member",
  "inner-circle",
  "restricted",
  "client",
  "legacy",
  "architect",
  "owner",
  "top-secret",
];

// ─── Pure diagnostic functions ────────────────────────────────────────────────

export function diagnosePermissions(role: DecisionRole): PermissionCheck[] {
  const allPermissions = Object.keys(ROLE_PERMISSIONS).flatMap(
    (r) => ROLE_PERMISSIONS[r as DecisionRole],
  );
  // De-duplicate, preserve stable order from ALL_PERMISSIONS
  const seen = new Set<DecisionPermission>();
  const ordered: DecisionPermission[] = [];
  for (const p of allPermissions) {
    if (!seen.has(p)) {
      seen.add(p);
      ordered.push(p);
    }
  }
  return ordered.map((permission) => ({
    permission,
    granted: hasPermission(role, permission),
  }));
}

export function diagnoseSurfaces(role: DecisionRole): SurfaceCheck[] {
  return Object.entries(SURFACE_PERMISSIONS).map(([surface, required]) => ({
    surface,
    requiredPermission: required,
    granted: hasPermission(role, required),
  }));
}

export function diagnoseTiers(access: EffectiveAccess): TierCheck[] {
  return ALL_TIERS.map((tier) => ({
    tier,
    granted: canAccessTier(access, tier),
  }));
}

export function diagnoseAdminNav(access: EffectiveAccess): AdminNavSection[] {
  if (access.permissions.isOwner) return getNavItemsForRole("admin");
  if (access.permissions.isAdmin) return getNavItemsForRole("admin");
  // Check for operator-level role via role field
  if (access.role === "ADMIN") return getNavItemsForRole("operator");
  return getNavItemsForRole("sponsor_safe");
}

// ─── Server-side loader ───────────────────────────────────────────────────────

export async function loadUserDiagnostics(email: string): Promise<AccessDiagnosticResult> {
  const { prisma } = await import("@/lib/prisma.server");
  const { getUserAccess } = await import("@/lib/access/get-user-access");
  const { resolveDecisionRole } = await import("@/lib/access/role-resolver.server");

  const trimmed = email.trim().toLowerCase();

  // Look up user by email
  const user = await prisma.user.findUnique({
    where: { email: trimmed },
    select: { id: true, email: true },
  });

  if (!user) {
    const emptyAccess: EffectiveAccess = {
      userId: null,
      email: trimmed,
      role: null,
      tier: "public",
      entitlements: { tiers: [], products: [], artifacts: [] },
      permissions: { isAuthenticated: false, isAdmin: false, isOwner: false },
    };
    return {
      found: false,
      email: trimmed,
      userId: null,
      effectiveRole: null,
      roleSource: null,
      access: emptyAccess,
      permissionChecks: [],
      surfaceChecks: [],
      tierChecks: diagnoseTiers(emptyAccess),
      visibleAdminNav: [],
      entitlements: { tiers: [], products: [], artifacts: [] },
      notFoundReason: `No user found with email "${trimmed}".`,
    };
  }

  const [access, roleResolution] = await Promise.all([
    getUserAccess(prisma, user.id),
    resolveDecisionRole({ userId: user.id, email: user.email }),
  ]);

  return {
    found: true,
    email: user.email ?? trimmed,
    userId: user.id,
    effectiveRole: roleResolution.role,
    roleSource: roleResolution.source,
    access,
    permissionChecks: diagnosePermissions(roleResolution.role),
    surfaceChecks: diagnoseSurfaces(roleResolution.role),
    tierChecks: diagnoseTiers(access),
    visibleAdminNav: diagnoseAdminNav(access),
    entitlements: {
      tiers: access.entitlements.tiers,
      products: access.entitlements.products,
      artifacts: access.entitlements.artifacts,
    },
  };
}
