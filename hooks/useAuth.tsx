"use client";

// hooks/useAuth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { AccessTier } from '@/lib/access/tier-policy';

/**
 * LOCAL TYPE OVERRIDE
 * Ensures the 'aol' property is recognized on the Session object
 * during strict build-time type checking.
 */
type ExtendedSession = Session & {
  aol?: {
    tier: AccessTier;
    innerCircleAccess: boolean;
    isInternal: boolean;
    allowPrivate: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  };
};

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  aol?: ExtendedSession['aol'];
  tier: AccessTier;
  innerCircleAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId?: string | null;
  emailHash?: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Explicitly cast the session to our ExtendedSession
  const { data, status } = useSession();
  const session = data as ExtendedSession | null;
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  /**
   * Institutional Claims Mapping
   * Local interface override ensures session.aol is accessible.
   */
  const aolClaims = session?.aol;

  const contextValue: AuthContextType = {
    user: session?.user || null,
    isLoading,
    isAuthenticated: !!session?.user,
    aol: aolClaims,
    tier: aolClaims?.tier || 'public',
    innerCircleAccess: aolClaims?.innerCircleAccess || false,
    isInternal: aolClaims?.isInternal || false,
    allowPrivate: aolClaims?.allowPrivate || false,
    memberId: aolClaims?.memberId || null,
    emailHash: aolClaims?.emailHash || null,
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

export const useTier = (): AccessTier => {
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