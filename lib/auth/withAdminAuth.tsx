// lib/auth/withAdminAuth.tsx
import React, { ComponentType, useEffect, useRef, useState } from "react";
import Router from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
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

// ✅ single source of truth; immutable arrays help TS stay sharp
const PERMISSIONS_MAP = {
  admin: ["pdf:view", "pdf:create", "pdf:edit", "pdf:delete", "pdf:manage", "admin:access", "audit:view"],
  editor: ["pdf:view", "pdf:create", "pdf:edit", "audit:view"],
  viewer: ["pdf:view"],
} as const;

type RoleKey = keyof typeof PERMISSIONS_MAP;

// ✅ Always returns a concrete string[]
function getPermissionsForRole(role: string): string[] {
  const fallback: readonly string[] = PERMISSIONS_MAP.viewer;

  // If role matches known keys, use it; otherwise use fallback.
  const perms = (PERMISSIONS_MAP as Record<string, readonly string[]>)[role] ?? fallback;

  // return mutable string[] to match AdminUser type
  return [...perms];
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

          const role = data?.user?.role as string | undefined;
          const isAllowed = role === "admin" || role === "editor";

          if (!isAllowed) {
            safePush("/admin/login?redirect=" + encodeURIComponent(window.location.pathname));
            return;
          }

          const nextUser: AdminUser = {
            id: String(data.user.id),
            email: String(data.user.email),
            name: String(data.user.name),
            role,
            permissions: getPermissionsForRole(role),
          };

          if (aliveRef.current) setUser(nextUser);
        } catch {
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

export default withAdminAuth;