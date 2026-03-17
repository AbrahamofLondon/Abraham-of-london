// lib/auth/withAdminAuth.tsx — SSOT Admin Gate (Pages/Client helper)
import React, { ComponentType, useEffect, useRef, useState } from "react";
import Router from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

// SSOT: architect is the platform's admin-equivalent tier
const ADMIN_MIN_TIER: AccessTier = "architect";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  tier: AccessTier;
  role?: string;
  permissions: string[];
}

export interface WithAdminAuthProps {
  user?: AdminUser;
}

type ClientSessionResponse = {
  id?: string;
  tier?: AccessTier | string;
  aol?: {
    tier?: AccessTier | string;
  };
  user?: {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: string;
    tier?: AccessTier | string;
  };
};

function isClient(): boolean {
  return typeof window !== "undefined";
}

function safePush(href: string): void {
  if (!isClient()) return;

  Router.push(href).catch((error: unknown) => {
    console.error("[Router] Navigation failed:", error);
  });
}

const PERMISSIONS_MAP: Record<AccessTier, readonly string[]> = {
  public: ["content:view"],
  member: ["content:view", "content:download"],
  "inner-circle": [
    "content:view",
    "content:download",
    "content:create",
    "audit:view",
  ],
  restricted: [
    "content:view",
    "content:download",
    "content:create",
    "audit:view",
  ],
  client: [
    "content:view",
    "content:download",
    "content:create",
    "content:edit",
    "audit:view",
  ],
  legacy: [
    "content:view",
    "content:download",
    "content:create",
    "content:edit",
    "audit:view",
  ],
  architect: [
    "content:view",
    "content:download",
    "content:create",
    "content:edit",
    "content:manage",
    "admin:access",
    "audit:view",
    "users:view",
    "tokens:manage",
  ],
  owner: [
    "content:view",
    "content:download",
    "content:create",
    "content:edit",
    "content:delete",
    "content:manage",
    "admin:access",
    "audit:view",
    "audit:manage",
    "users:view",
    "users:manage",
    "tokens:manage",
    "system:view",
  ],
  "top-secret": [
    "content:view",
    "content:download",
    "content:create",
    "content:edit",
    "content:delete",
    "content:manage",
    "admin:access",
    "audit:view",
    "audit:manage",
    "users:view",
    "users:manage",
    "users:impersonate",
    "tokens:manage",
    "system:view",
    "system:configure",
    "vault:unseal",
  ],
} as const;

// Legacy/app-role mapping into AccessTier SSOT
const ROLE_TO_TIER: Record<string, AccessTier> = {
  admin: "architect",
  superadmin: "owner",
  editor: "architect",
  architect: "architect",
  owner: "owner",
  viewer: "member",
  user: "member",
  guest: "public",
};

export function isAdminTier(tier: unknown): boolean {
  const normalizedTier = normalizeUserTier(tier);
  return hasAccess(normalizedTier, ADMIN_MIN_TIER);
}

export function canAccessAdmin(roleOrTier: unknown): boolean {
  const roleStr = typeof roleOrTier === "string" ? roleOrTier : "";
  const mappedTier = ROLE_TO_TIER[roleStr] ?? roleOrTier;
  const tier = normalizeUserTier(mappedTier);
  return isAdminTier(tier);
}

function getPermissionsForTier(tier: AccessTier): string[] {
  return [...(PERMISSIONS_MAP[tier] ?? PERMISSIONS_MAP.member)];
}

function resolveTier(data: ClientSessionResponse): AccessTier {
  const rawTier =
    data.user?.tier ??
    data.tier ??
    data.aol?.tier ??
    data.user?.role ??
    "public";

  const mappedTier =
    typeof rawTier === "string" && rawTier in ROLE_TO_TIER
      ? ROLE_TO_TIER[rawTier]
      : rawTier;

  return normalizeUserTier(mappedTier);
}

export function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAdminAuthProps>,
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

      void (async () => {
        try {
          const res = await fetch("/api/auth/session", {
            signal: controller.signal,
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          });

          if (!res.ok) {
            throw new Error(`Session fetch failed: ${res.status}`);
          }

          const data = (await res.json()) as ClientSessionResponse;

          if (!data?.user) {
            throw new Error("No session found");
          }

          const tier = resolveTier(data);
          const isAllowed = isAdminTier(tier);

          if (!isAllowed) {
            const redirectUrl =
              "/admin/login?redirect=" +
              encodeURIComponent(window.location.pathname + window.location.search);
            safePush(redirectUrl);
            return;
          }

          const permissions = getPermissionsForTier(tier);

          const nextUser: AdminUser = {
            id: String(data.user.id ?? data.id ?? ""),
            email: String(data.user.email ?? ""),
            name: String(data.user.name ?? "Admin User"),
            tier,
            role: typeof data.user.role === "string" ? data.user.role : tier,
            permissions,
          };

          if (aliveRef.current) {
            setUser(nextUser);
          }
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          console.error("[withAdminAuth] Auth check failed:", error);

          if (aliveRef.current) {
            safePush("/admin/login");
          }
        } finally {
          if (aliveRef.current) {
            setLoading(false);
          }
        }
      })();

      return () => {
        controller.abort();
      };
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

export const adminHelpers = {
  isAdminTier,
  canAccessAdmin,
  getPermissionsForTier,
  ADMIN_MIN_TIER,
  PERMISSIONS_MAP,
  ROLE_TO_TIER,
};

export default withAdminAuth;