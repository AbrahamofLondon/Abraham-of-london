/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth/withInnerCircleAuth.tsx — EXPORT-SAFE, ROUTER-SINGLETON (No useRouter, no SSR window leaks)

import React, { ComponentType, useEffect, useMemo, useRef, useState } from "react";
import Router from "next/router"; // ✅ Router singleton is fine (effects only)
import LoadingSpinner from "@/components/LoadingSpinner";
import type { UserRole } from "@/types/auth";
import { ROLE_HIERARCHY } from "@/types/auth";

// -----------------------------
// Types
// -----------------------------
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
  membershipDate?: string;
  lastAccess?: string;
}

interface WithInnerCircleAuthProps {
  user?: User;
  requiredRole?: UserRole;
}

type Options = {
  requiredRole?: UserRole;
  redirectTo?: string;
  fallbackComponent?: React.ComponentType;
};

type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  membershipDate?: string;
  lastAccess?: string;
};

type SessionPayload = { user?: SessionUser } | null;

type InnerCirclePayload = { hasAccess?: boolean } | null;

// -----------------------------
// Safety helpers (SSR + navigation + unmount guards)
// -----------------------------
const isClient = () => typeof window !== "undefined";

function safePathname(): string {
  if (!isClient()) return "";
  try {
    return window.location.pathname || "";
  } catch {
    return "";
  }
}

function safeRedirectDefault(requiredRole: UserRole): string {
  // Avoid `window` during SSR; compute a stable fallback.
  const path = safePathname();
  const resource = encodeURIComponent(path || "");
  return `/access/request?resource=${resource}&tier=${encodeURIComponent(requiredRole)}`;
}

async function safeNavigate(href: string): Promise<void> {
  if (!isClient()) return;

  // Prefer Next Router when available; hard fallback if router isn't ready.
  try {
    // Router.router exists when the singleton is initialised
    if ((Router as any)?.router) {
      await Router.push(href);
      return;
    }
  } catch {
    // fall through
  }

  try {
    window.location.assign(href);
  } catch {
    // last resort
    window.location.href = href;
  }
}

function roleAtLeast(userRole: UserRole, requiredRole: UserRole): boolean {
  const userHierarchy = ROLE_HIERARCHY[userRole] || 0;
  const requiredHierarchy = ROLE_HIERARCHY[requiredRole] || 0;
  return userHierarchy >= requiredHierarchy;
}

function toUserFromSession(sessionUser: SessionUser, role: UserRole): User {
  return {
    id: String(sessionUser.id || ""),
    email: String(sessionUser.email || ""),
    name: String(sessionUser.name || ""),
    role,
    permissions: getPermissionsForRole(role),
    membershipDate: sessionUser.membershipDate,
    lastAccess: sessionUser.lastAccess,
  };
}

function toInnerCircleSyntheticUser(seed?: Partial<User>): User {
  const nowIso = new Date().toISOString();
  return {
    id: seed?.id || `inner-circle-${seed?.id || "access"}`,
    email: seed?.email || "inner-circle@abrahamoflondon.org",
    name: seed?.name || "Inner Circle Member",
    role: "inner-circle" as UserRole,
    permissions: getPermissionsForRole("inner-circle"),
    membershipDate: seed?.membershipDate || nowIso,
    lastAccess: seed?.lastAccess || nowIso,
  };
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

// -----------------------------
// HOC
// -----------------------------
export function withInnerCircleAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithInnerCircleAuthProps>,
  options?: Options
) {
  const ComponentWithAuth = (props: P) => {
    const [user, setUser] = useState<User>();
    const [isLoading, setIsLoading] = useState(true);
    const [accessChecked, setAccessChecked] = useState(false);

    const mountedRef = useRef(false);

    const requiredRole = (options?.requiredRole || "inner-circle") as UserRole;

    // ✅ Compute redirectTo safely (SSR-safe). Memoized to avoid churn.
    const redirectTo = useMemo(() => {
      if (options?.redirectTo) return options.redirectTo;
      return safeRedirectDefault(requiredRole);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.redirectTo, requiredRole]);

    useEffect(() => {
      mountedRef.current = true;
      const controller = new AbortController();

      const finish = (fn?: () => void) => {
        if (!mountedRef.current) return;
        fn?.();
        setIsLoading(false);
      };

      const allowFallback = () => {
        if (!mountedRef.current) return;
        setAccessChecked(true);
      };

      const checkAuth = async () => {
        // This effect never runs during SSG prerender, so no router mounting errors.
        try {
          // 1) NextAuth session
          const sessionData = await fetchJson<SessionPayload>("/api/auth/session", controller.signal);

          if (sessionData?.user) {
            const sessionUser = sessionData.user;
            const userRole = (sessionUser.role || "guest") as UserRole;

            if (roleAtLeast(userRole, requiredRole)) {
              if (!mountedRef.current) return;
              setUser(toUserFromSession(sessionUser, userRole));
              setAccessChecked(true);
              return finish();
            }

            // 2) Inner-circle access as fallback if role too low
            const inner = await fetchJson<InnerCirclePayload>("/api/inner-circle/access", controller.signal);
            if (inner?.hasAccess) {
              if (!mountedRef.current) return;
              setUser(
                toInnerCircleSyntheticUser({
                  id: sessionUser.id ? `inner-circle-${sessionUser.id}` : "inner-circle-access",
                  email: sessionUser.email || "inner-circle@abrahamoflondon.org",
                  name: sessionUser.name || "Inner Circle Member",
                  membershipDate: sessionUser.membershipDate,
                  lastAccess: sessionUser.lastAccess,
                })
              );
              setAccessChecked(true);
              return finish();
            }

            // No access
            if (options?.fallbackComponent) {
              allowFallback();
              return finish();
            }

            await safeNavigate(redirectTo);
            return finish();
          }

          // 3) No session at all — try inner-circle standalone
          const inner = await fetchJson<InnerCirclePayload>("/api/inner-circle/access", controller.signal);
          if (inner?.hasAccess) {
            if (!mountedRef.current) return;
            setUser(toInnerCircleSyntheticUser({ id: "inner-circle-guest" }));
            setAccessChecked(true);
            return finish();
          }

          // 4) No access
          if (options?.fallbackComponent) {
            allowFallback();
            return finish();
          }

          await safeNavigate(redirectTo);
          return finish();
        } catch (error) {
          // Defensive: Even if something unexpected happens, never crash SSR.
          console.error("Auth check failed:", error);

          try {
            // last attempt: inner-circle access
            const inner = await fetchJson<InnerCirclePayload>("/api/inner-circle/access", controller.signal);
            if (inner?.hasAccess) {
              if (!mountedRef.current) return;
              setUser(toInnerCircleSyntheticUser({ id: "inner-circle-guest" }));
              setAccessChecked(true);
              return finish();
            }
          } catch {
            // ignore
          }

          // Redirect to login as last resort (client-only safe)
          const path = safePathname();
          const loginHref = `/login?redirect=${encodeURIComponent(path || "/")}&tier=${encodeURIComponent(requiredRole)}`;
          await safeNavigate(loginHref);
          return finish();
        }
      };

      void checkAuth();

      return () => {
        mountedRef.current = false;
        controller.abort();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requiredRole, redirectTo]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <LoadingSpinner message="Verifying access..." />
        </div>
      );
    }

    if (!accessChecked && options?.fallbackComponent) {
      const Fallback = options.fallbackComponent;
      return <Fallback />;
    }

    return <WrappedComponent {...props} user={user} requiredRole={requiredRole} />;
  };

  ComponentWithAuth.displayName = `withInnerCircleAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return ComponentWithAuth;
}

// -----------------------------
// Permissions
// -----------------------------
function getPermissionsForRole(role: UserRole): string[] {
  const basePermissions: Record<UserRole, string[]> = {
    guest: ["content:view:public"],
    viewer: ["content:view:public", "pdf:view"],
    editor: ["content:view:public", "pdf:view", "pdf:create", "pdf:edit"],
    admin: ["content:view:public", "pdf:view", "pdf:create", "pdf:edit", "pdf:delete", "pdf:manage", "admin:access"],
    member: ["content:view:public", "content:view:member", "pdf:view"],
    patron: ["content:view:public", "content:view:member", "content:view:patron", "pdf:view", "pdf:download"],
    "inner-circle": [
      "content:view:public",
      "content:view:member",
      "content:view:patron",
      "content:view:inner-circle",
      "pdf:view",
      "pdf:download",
      "strategic:view",
      "canon:full",
    ],
    founder: [
      "content:view:public",
      "content:view:member",
      "content:view:patron",
      "content:view:inner-circle",
      "content:view:founder",
      "pdf:view",
      "pdf:download",
      "strategic:view",
      "canon:full",
      "founder:access",
    ],
  };

  return basePermissions[role] || basePermissions.guest;
}

// -----------------------------
// Hook for functional components (router-free, export-safe)
// -----------------------------
export function useInnerCircleAuth(requiredRole?: UserRole) {
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    const reqRole = (requiredRole || "inner-circle") as UserRole;

    const run = async () => {
      try {
        const [sessionData, innerData] = await Promise.all([
          fetchJson<SessionPayload>("/api/auth/session", controller.signal),
          fetchJson<InnerCirclePayload>("/api/inner-circle/access", controller.signal),
        ]);

        let foundUser: User | undefined;
        let ok = false;

        if (sessionData?.user) {
          const su = sessionData.user;
          const userRole = (su.role || "guest") as UserRole;
          if (roleAtLeast(userRole, reqRole)) {
            foundUser = toUserFromSession(su, userRole);
            ok = true;
          }
        }

        if (!ok && innerData?.hasAccess) {
          // If session exists, preserve email/name if possible
          const su = sessionData?.user;
          foundUser = toInnerCircleSyntheticUser({
            id: su?.id ? `inner-circle-${su.id}` : "inner-circle-access",
            email: su?.email,
            name: su?.name,
            membershipDate: su?.membershipDate,
            lastAccess: su?.lastAccess,
          });
          ok = true;
        }

        if (!alive) return;
        setUser(foundUser);
        setHasAccess(ok);
      } catch (e) {
        console.error("Auth check failed:", e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    void run();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [requiredRole]);

  return {
    user,
    loading,
    hasAccess,
    checkPermission: (permission: string) => checkPermission(user, permission),
  };
}

// -----------------------------
// Permission util
// -----------------------------
export function checkPermission(user: User | undefined, permission: string): boolean {
  if (!user) return false;
  return Boolean(user.permissions?.includes(permission) || user.permissions?.includes("*"));
}

export default withInnerCircleAuth;