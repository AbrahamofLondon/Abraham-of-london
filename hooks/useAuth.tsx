// hooks/useAuth.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

// Types based on your aol-claims.ts
type AoLTier = "public" | "inner-circle" | "inner-circle-plus" | "inner-circle-elite" | "private";

interface AoLClaims {
  aol?: {
    tier: AoLTier;
    innerCircleAccess: boolean;
    isInternal: boolean;
    allowPrivate: boolean;
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[];
  };
}

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  aol?: AoLClaims['aol'];
  tier: AoLTier;
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
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status]);

  const aolClaims = session?.aol as AoLClaims['aol'] | undefined;

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
      // Implement login logic
      window.location.href = '/api/auth/signin';
    },
    logout: () => {
      // Implement logout logic
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

// Helper hooks
export const useTier = (): AoLTier => {
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