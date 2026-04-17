// lib/inner-circle/InnerCircleContext.tsx — AUTH-UNIFIED INNER CIRCLE CONTEXT
// Fetches from /api/auth/identity (canonical endpoint). No localStorage.
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import Router from "next/router";

import type { Tier } from "@/lib/auth/tiers";
import { hasAccess as tierHasAccess } from "@/lib/auth/tiers";
import type { ResolvedIdentity } from "@/lib/auth/resolve-identity";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type InnerCircleUser = {
  id: string;
  email: string;
  name: string;
  tier: Tier;
};

type InnerCircleContextType = {
  user: InnerCircleUser | null;
  isLoading: boolean;
  tier: Tier;
  innerCircleAccess: boolean;
  login: () => void;
  logout: () => void;
  checkAccess: (path: string) => boolean;
  refreshUser: () => Promise<void>;
};

const InnerCircleContext = createContext<InnerCircleContextType | undefined>(undefined);

export function useInnerCircle(): InnerCircleContextType {
  const ctx = useContext(InnerCircleContext);
  if (!ctx) throw new Error("useInnerCircle must be used within InnerCircleProvider");
  return ctx;
}

type Props = { children: ReactNode };

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function safeNavigate(path: string) {
  if (typeof window === "undefined") return;
  Router.replace(path);
}

function identityToUser(identity: ResolvedIdentity): InnerCircleUser | null {
  if (!identity.authenticated || !identity.subjectId) return null;
  return {
    id: identity.subjectId,
    email: identity.email || "",
    name: identity.name || "",
    tier: identity.tier,
  };
}

/* -------------------------------------------------------------------------- */
/*  PROTECTED ROUTE RULES                                                      */
/* -------------------------------------------------------------------------- */

const PROTECTED_RULES: ReadonlyArray<{ re: RegExp; required: Tier }> = [
  { re: /^\/canon(\/.*)?$/i, required: "member" },
  { re: /^\/vault(\/.*)?$/i, required: "member" },
  { re: /^\/resources\/strategic-frameworks(\/.*)?$/i, required: "member" },
  { re: /^\/resources\/surrender-framework(\/.*)?$/i, required: "member" },
];

/* -------------------------------------------------------------------------- */
/*  PROVIDER                                                                   */
/* -------------------------------------------------------------------------- */

export const InnerCircleProvider: React.FC<Props> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchIdentity = useCallback(async () => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/auth/identity", {
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) {
        setIdentity(null);
        return;
      }

      const data = (await res.json()) as ResolvedIdentity;
      if (!controller.signal.aborted) {
        setIdentity(data);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[InnerCircle] identity fetch failed:", err);
      setIdentity(null);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch identity on mount (client-side only)
  useEffect(() => {
    fetchIdentity();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchIdentity]);

  // Re-fetch on window focus
  useEffect(() => {
    const onFocus = () => {
      fetchIdentity();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchIdentity]);

  const user = identity ? identityToUser(identity) : null;
  const tier: Tier = identity?.tier ?? "public";
  const innerCircleAccess = identity?.innerCircleAccess ?? false;

  const login = () => {
    // Redirect to the activation / sign-in flow
    safeNavigate("/inner-circle");
  };

  const logout = () => {
    // Call signout to revoke the session, then clear state
    fetch("/api/auth/signout", { method: "POST", credentials: "include" })
      .catch(() => {})
      .finally(() => {
        setIdentity(null);
        safeNavigate("/");
      });
  };

  const checkAccess = (path: string): boolean => {
    const rule = PROTECTED_RULES.find((r) => r.re.test(path));
    if (!rule) return true;

    if (!identity?.authenticated) return false;

    return tierHasAccess(identity.tier, rule.required);
  };

  const refreshUser = async () => {
    await fetchIdentity();
  };

  // Always render the provider with the same structure
  // On server: uses default values (null user, "public" tier, false access)
  // On client: will update with fetched identity after mount
  return (
    <InnerCircleContext.Provider
      value={{
        user,
        isLoading,
        tier,
        innerCircleAccess,
        login,
        logout,
        checkAccess,
        refreshUser,
      }}
    >
      {children}
    </InnerCircleContext.Provider>
  );
};

export type { InnerCircleUser };
