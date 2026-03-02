// lib/inner-circle/InnerCircleContext.tsx — SSOT INNER CIRCLE CONTEXT (CLIENT-SAFE)
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Router from "next/router";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

type InnerCircleUser = {
  id: string;
  email: string;
  name: string;

  /**
   * SSOT tier for access decisions.
   * Stored tokens/user payloads may carry legacy values — we normalize at read-time.
   */
  tier: AccessTier | string;

  /** epoch seconds */
  expiresAt: number;
  /** epoch seconds */
  createdAt: number;
};

type InnerCircleContextType = {
  user: (Omit<InnerCircleUser, "tier"> & { tier: AccessTier }) | null;
  isLoading: boolean;
  login: (token: string, userData: InnerCircleUser) => void;
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

const TOKEN_KEY = "innerCircleToken";
const USER_KEY = "innerCircleUser";

// Safe navigation helper (prevents server-side execution)
function safeNavigate(path: string) {
  if (typeof window === "undefined") return;
  Router.replace(path);
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function normalizeStoredUser(raw: any): (Omit<InnerCircleUser, "tier"> & { tier: AccessTier }) | null {
  if (!raw || typeof raw !== "object") return null;

  const id = String(raw.id || "").trim();
  const email = String(raw.email || "").trim();
  const name = String(raw.name || "").trim();

  const expiresAt = Number(raw.expiresAt);
  const createdAt = Number(raw.createdAt);

  if (!id || !email || !name) return null;
  if (!isFiniteNumber(expiresAt) || !isFiniteNumber(createdAt)) return null;

  // IMPORTANT: normalize legacy or non-SSOT tiers into SSOT.
  const tier = normalizeUserTier(raw.tier ?? "public");

  return { id, email, name, tier, expiresAt, createdAt };
}

export const InnerCircleProvider: React.FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<(Omit<InnerCircleUser, "tier"> & { tier: AccessTier }) | null>(null);

  useEffect(() => setMounted(true), []);

  // Initialize from localStorage on client
  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);

    if (!token || !userStr) {
      setIsLoading(false);
      return;
    }

    const parsed = safeJsonParse<any>(userStr);
    const normalized = normalizeStoredUser(parsed);

    // If user object is invalid or expired, clear.
    const nowSec = Math.floor(Date.now() / 1000);
    if (!normalized || normalized.expiresAt <= nowSec) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      setUser(null);
      setIsLoading(false);
      return;
    }

    setUser(normalized);
    setIsLoading(false);
  }, [mounted]);

  const login = (token: string, userData: InnerCircleUser) => {
    if (!mounted) return;

    // normalize on write
    const normalized = normalizeStoredUser(userData) || {
      id: String((userData as any)?.id || "unknown"),
      email: String((userData as any)?.email || ""),
      name: String((userData as any)?.name || ""),
      tier: normalizeUserTier((userData as any)?.tier ?? "member"),
      expiresAt: Number((userData as any)?.expiresAt || Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60),
      createdAt: Number((userData as any)?.createdAt || Math.floor(Date.now() / 1000)),
    };

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify({ ...normalized, tier: normalized.tier }));
    setUser(normalized);
  };

  const logout = () => {
    if (!mounted) return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    safeNavigate("/");
  };

  const refreshUser = async () => {
    if (!mounted) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      logout();
      return;
    }

    try {
      const res = await fetch("/api/inner-circle/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        logout();
        return;
      }

      const data = (await res.json()) as { token?: string; user?: any };
      const nextToken = String(data?.token || "").trim();
      const nextUser = normalizeStoredUser(data?.user);

      if (!nextToken || !nextUser) {
        logout();
        return;
      }

      localStorage.setItem(TOKEN_KEY, nextToken);
      localStorage.setItem(USER_KEY, JSON.stringify({ ...nextUser, tier: nextUser.tier }));
      setUser(nextUser);
    } catch (e) {
      // Don’t hard-logout on transient errors; just log.
      console.error("[InnerCircle] refreshUser failed:", e);
    }
  };

  /**
   * SSOT Access Map:
   * - Public pages: always true
   * - Protected corridors: require at least "member" by default
   * - You can tighten these later per-route to "inner-circle"/"client"/etc.
   */
  const protectedRules = useMemo(
    () =>
      [
        { re: /^\/canon(\/.*)?$/i, required: "member" as AccessTier },
        { re: /^\/vault(\/.*)?$/i, required: "member" as AccessTier },
        { re: /^\/resources\/strategic-frameworks(\/.*)?$/i, required: "member" as AccessTier },
        { re: /^\/resources\/surrender-framework(\/.*)?$/i, required: "member" as AccessTier },
        // add more here if you want the client gate to short-circuit UI
      ] as const,
    []
  );

  const checkAccess = (path: string): boolean => {
    // If not mounted yet, do not block render.
    if (!mounted) return true;

    // No rule matched => public corridor
    const rule = protectedRules.find((r) => r.re.test(path));
    if (!rule) return true;

    // No user => no access for protected zones
    if (!user) return false;

    // SSOT tier check
    const u = normalizeUserTier(user.tier);
    return hasAccess(u, rule.required);
  };

  // During SSR/prerender, return children without any logic
  if (!mounted) return <>{children}</>;

  return (
    <InnerCircleContext.Provider
      value={{
        user,
        isLoading,
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