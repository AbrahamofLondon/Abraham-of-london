// lib/auth/withAdminAuth.tsx — SSOT Admin Gate (Pages/Client helper)
import React, { ComponentType, useEffect, useRef, useState } from "react";
import Router from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

// SSOT: Minimum tier for admin access
const ADMIN_MIN_TIER: AccessTier = "architect";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  tier: AccessTier;        // Use SSOT tier instead of role string
  role?: string;           // Keep for backward compatibility
  permissions: string[];
}

export interface WithAdminAuthProps {
  user?: AdminUser;
}

function isClient() {
  return typeof window !== "undefined";
}

function safePush(href: string) {
  if (!isClient()) return;
  Router.push(href).catch(() => {});
}

// Permissions mapped by SSOT tier level
const PERMISSIONS_MAP: Record<AccessTier, readonly string[]> = {
  public: ["pdf:view"],
  member: ["pdf:view"],
  "inner-circle": ["pdf:view", "pdf:create", "audit:view"],
  client: ["pdf:view", "pdf:create", "pdf:edit", "audit:view"],
  legacy: ["pdf:view", "pdf:create", "pdf:edit", "audit:view"],
  architect: ["pdf:view", "pdf:create", "pdf:edit", "pdf:manage", "admin:access", "audit:view"],
  owner: ["pdf:view", "pdf:create", "pdf:edit", "pdf:delete", "pdf:manage", "admin:access", "audit:view"],
} as const;

// Legacy role mapping for backward compatibility
const ROLE_TO_TIER: Record<string, AccessTier> = {
  admin: "owner",
  superadmin: "owner",
  editor: "architect",
  viewer: "member",
  user: "member",
};

/**
 * Check if a tier has admin access (architect+)
 */
export function isAdminTier(tier: unknown): boolean {
  return hasAccess(normalizeUserTier(tier), ADMIN_MIN_TIER);
}

/**
 * Backward-compatible helper for UI components
 */
export function canAccessAdmin(roleOrTier: unknown): boolean {
  const tier = normalizeUserTier(roleOrTier);
  return isAdminTier(tier);
}

/**
 * Get permissions for a given tier
 */
function getPermissionsForTier(tier: AccessTier): string[] {
  return [...(PERMISSIONS_MAP[tier] ?? PERMISSIONS_MAP.member)];
}

/**
 * Map legacy role to SSOT tier
 */
function mapRoleToTier(role: string | undefined): AccessTier {
  if (!role) return "member";
  const lowerRole = role.toLowerCase();
  return ROLE_TO_TIER[lowerRole] ?? normalizeUserTier(lowerRole);
}

export function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAdminAuthProps>
) {
  const ComponentWithAuth = (props: P) => {
    const [user, setUser] = useState<AdminUser | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const aliveRef = useRef(true);

    useEffect(() => {
      aliveRef.current = true;
      return () => {
        aliveRef.current = false;
      };
    }, []);

    useEffect(() => {
      if (!isClient()) return;

      const controller = new AbortController();

      (async () => {
        try {
          const res = await fetch("/api/auth/session", { signal: controller.signal });
          const data = await res.json().catch(() => null);

          // Extract tier from session (handles both tier and role fields)
          const rawTier = data?.user?.tier ?? data?.user?.role ?? "public";
          const tier = normalizeUserTier(rawTier);
          
          // Check if user has admin access (architect+)
          const isAllowed = isAdminTier(tier);

          if (!isAllowed) {
            safePush("/admin/login?redirect=" + encodeURIComponent(window.location.pathname));
            return;
          }

          // Get permissions based on tier
          const permissions = getPermissionsForTier(tier);

          // Build user object with SSOT tier
          const nextUser: AdminUser = {
            id: String(data.user.id || ""),
            email: String(data.user.email || ""),
            name: String(data.user.name || "Admin User"),
            tier,
            role: data.user?.role || tier, // Keep original role if present
            permissions,
          };

          if (aliveRef.current) setUser(nextUser);
        } catch (error) {
          console.error("[withAdminAuth] Auth check failed:", error);
          safePush("/admin/login");
        } finally {
          if (aliveRef.current) setLoading(false);
        }
      })();

      return () => controller.abort();
    }, []);

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center">
          <LoadingSpinner message="Verifying institutional credentials..." />
        </div>
      );
    }

    return <WrappedComponent {...props} user={user} />;
  };

  ComponentWithAuth.displayName = `withAdminAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return ComponentWithAuth;
}

// Export helper functions for direct use
export const adminHelpers = {
  isAdminTier,
  canAccessAdmin,
  getPermissionsForTier,
  ADMIN_MIN_TIER,
};

export default withAdminAuth;