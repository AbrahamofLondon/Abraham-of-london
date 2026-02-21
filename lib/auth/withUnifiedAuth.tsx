// lib/auth/withUnifiedAuth.tsx
import React, { ComponentType, useEffect, useMemo, useRef, useState } from "react";
import Router from "next/router";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { UserRole } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
}

export interface WithUnifiedAuthProps {
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  requiredRole?: UserRole | "inner-circle";
}

function isClient() {
  return typeof window !== "undefined";
}

function safePush(href: string) {
  if (!isClient()) return;
  Router.push(href).catch(() => {});
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  viewer: 1,
  editor: 2,
  admin: 3,
  member: 4,
  patron: 5,
  "inner-circle": 6,
  founder: 7,
};

export function withUnifiedAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithUnifiedAuthProps>,
  options?: {
    requiredRole?: UserRole | "inner-circle";
    redirectTo?: string;
    fallbackComponent?: React.ComponentType<{ requiredRole?: string }>;
    publicFallback?: boolean;
  }
) {
  const ComponentWithAuth = (props: P) => {
    const requiredRole = options?.requiredRole || "inner-circle";

    const redirectTo = useMemo(() => {
      if (options?.redirectTo) return options.redirectTo;
      const path = isClient() ? window.location.pathname : "/";
      return requiredRole === "inner-circle"
        ? `/inner-circle/locked?returnTo=${encodeURIComponent(path)}`
        : `/login?redirect=${encodeURIComponent(path)}`;
    }, [options?.redirectTo, requiredRole]);

    const [user, setUser] = useState<User | undefined>(undefined);
    const [innerCircleAccess, setInnerCircleAccess] = useState<InnerCircleAccess | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);

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
          const [session, ic] = await Promise.all([
            fetchJson<{ user?: any }>("/api/auth/session", controller.signal),
            fetchJson<InnerCircleAccess>("/api/inner-circle/access", controller.signal),
          ]);

          const nextUser: User | undefined = session?.user
            ? {
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: session.user.role as UserRole,
                permissions: session.user.permissions || [],
              }
            : undefined;

          const nextIc = ic || undefined;

          const allowed =
            requiredRole === "inner-circle"
              ? Boolean(nextIc?.hasAccess)
              : nextUser
                ? (ROLE_HIERARCHY[nextUser.role] || 0) >= (ROLE_HIERARCHY[requiredRole as UserRole] || 0)
                : false;

          if (!aliveRef.current) return;

          setUser(nextUser);
          setInnerCircleAccess(nextIc);
          setHasAccess(allowed);

          if (!allowed && !options?.publicFallback) {
            if (!options?.fallbackComponent) safePush(redirectTo);
          }
        } finally {
          if (aliveRef.current) setLoading(false);
        }
      })();

      return () => controller.abort();
    }, [requiredRole, redirectTo, options?.publicFallback, options?.fallbackComponent]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <LoadingSpinner message="Verifying access..." />
        </div>
      );
    }

    if (!hasAccess && options?.fallbackComponent) {
      const Fallback = options.fallbackComponent;
      return <Fallback requiredRole={String(requiredRole)} />;
    }

    return (
      <WrappedComponent
        {...props}
        user={user}
        innerCircleAccess={innerCircleAccess}
        requiredRole={requiredRole}
      />
    );
  };

  ComponentWithAuth.displayName = `withUnifiedAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return ComponentWithAuth;
}

export default withUnifiedAuth;