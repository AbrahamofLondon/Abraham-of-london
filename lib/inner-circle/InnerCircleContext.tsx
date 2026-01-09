// lib/inner-circle/InnerCircleContext.tsx
'use client';

import * as React from 'react';
import { getInnerCircleAccess, type InnerCircleAccess } from '@/lib/inner-circle';

interface InnerCircleContextType {
  access: InnerCircleAccess | null;
  isLoading: boolean;
  refreshAccess: () => Promise<void>;
  clearAccess: () => void;
}

const InnerCircleContext = React.createContext<InnerCircleContextType | undefined>(undefined);

export function InnerCircleProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = React.useState<InnerCircleAccess | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    refreshAccess();
  }, []);

  const refreshAccess = async () => {
    setIsLoading(true);
    try {
      const currentAccess = getInnerCircleAccess();
      setAccess(currentAccess);
    } catch (error) {
      console.error('Failed to refresh inner circle access:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAccess = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('innerCircleToken');
      localStorage.removeItem('innerCircleUser');
    }
    setAccess(null);
  };

  const value = {
    access,
    isLoading,
    refreshAccess,
    clearAccess
  };

  return (
    <InnerCircleContext.Provider value={value}>
      {children}
    </InnerCircleContext.Provider>
  );
}

export function useInnerCircle() {
  const context = React.useContext(InnerCircleContext);
  if (!context) {
    throw new Error('useInnerCircle must be used within InnerCircleProvider');
  }
  return context;
}