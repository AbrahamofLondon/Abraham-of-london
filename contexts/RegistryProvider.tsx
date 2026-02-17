// contexts/RegistryProvider.tsx — HARDENED (Global Intelligence Orchestrator)
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useAccess } from '@/hooks/useAccess';

// Import the Tier type from useAccess to ensure consistency
import type { Tier } from '@/hooks/useAccess';

/**
 * REGISTRY CONTEXT SCHEMA
 * Centralized state management for the Abraham of London institutional interface.
 */
interface RegistryContextType {
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  userTier: Tier; // Now using the imported Tier type
  isValidating: boolean;
  hasClearance: (required: Tier) => boolean; // Using imported Tier type
  refreshClearance: () => Promise<void>;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export function RegistryProvider({ children }: { children: React.ReactNode }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Connect to the PostgreSQL-backed access hook
  const { tier, isValidating, hasClearance, verify } = useAccess();

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  const value = useMemo(() => ({
    isSearchOpen,
    setSearchOpen: setIsSearchOpen,
    toggleSearch,
    userTier: tier,
    isValidating,
    hasClearance,
    refreshClearance: verify,
  }), [isSearchOpen, toggleSearch, tier, isValidating, hasClearance, verify]);

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}

/**
 * useRegistry - Hook to access institutional state from any component.
 */
export function useRegistry() {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
}

// Re-export Tier type for convenience
export type { Tier };