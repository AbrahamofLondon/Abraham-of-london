"use client";

// hooks/useAuth.tsx — AUTH-UNIFIED (fetches from /api/auth/identity)
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import type { Tier } from '@/lib/auth/tiers';
import type { ResolvedIdentity } from '@/lib/auth/resolve-identity';

interface AuthContextType {
  identity: ResolvedIdentity | null;
  user: { id: string; email: string; name: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tier: Tier;
  innerCircleAccess: boolean;
  adminAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId: string | null;
  emailHash: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [identity, setIdentity] = useState<ResolvedIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const fetchIdentity = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/auth/identity', {
        credentials: 'include',
        signal: controller.signal,
      });

      if (!res.ok) {
        if (!controller.signal.aborted) setIdentity(null);
        return;
      }

      const data = (await res.json()) as ResolvedIdentity;
      if (!controller.signal.aborted) {
        setIdentity(data);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[useAuth] identity fetch failed:', err);
      if (!controller.signal.aborted) setIdentity(null);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch on mount
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
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchIdentity]);

  // Re-fetch on route change (next/router)
  useEffect(() => {
    // Dynamic import to avoid issues if next/router not ready
    let unsubscribe: (() => void) | undefined;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Router = require('next/router').default;
      const handler = () => {
        fetchIdentity();
      };
      Router.events.on('routeChangeComplete', handler);
      unsubscribe = () => Router.events.off('routeChangeComplete', handler);
    } catch {
      // next/router not available (e.g. app router only)
    }
    return () => {
      unsubscribe?.();
    };
  }, [fetchIdentity]);

  const user = identity?.authenticated
    ? {
        id: identity.subjectId || '',
        email: identity.email || '',
        name: identity.name || '',
      }
    : null;

  const contextValue: AuthContextType = {
    identity,
    user,
    isLoading,
    isAuthenticated: identity?.authenticated ?? false,
    tier: identity?.tier ?? 'public',
    innerCircleAccess: identity?.innerCircleAccess ?? false,
    adminAccess: identity?.adminAccess ?? false,
    isInternal: identity?.isInternal ?? false,
    allowPrivate: identity?.adminAccess ?? false,
    memberId: identity?.subjectId ?? null,
    emailHash: null,
    login: () => {
      window.location.href = '/api/auth/signin';
    },
    logout: () => {
      window.location.href = '/api/auth/signout';
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// --- Strategic Helper Hooks ---

export const useTier = (): Tier => {
  const { tier } = useAuth();
  return tier;
};

export const useInnerCircleAccess = (): boolean => {
  const { innerCircleAccess } = useAuth();
  return innerCircleAccess;
};

export const useIsInternal = (): boolean => {
  const { isInternal } = useAuth();
  return isInternal;
};

export const useAllowPrivate = (): boolean => {
  const { allowPrivate } = useAuth();
  return allowPrivate;
};

export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
};
