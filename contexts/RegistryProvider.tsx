// contexts/RegistryProvider.tsx — HARDENED (Global Intelligence Orchestrator)
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAccess } from "@/hooks/useAccess";
import type { AccessTier } from "@/lib/access/tier-policy";

/**
 * REGISTRY CONTEXT SCHEMA
 * Centralized state management for the Abraham of London institutional interface.
 */
interface RegistryContextType {
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  userTier: AccessTier;
  isValidating: boolean;
  hasClearance: (required: AccessTier) => boolean;
  refreshClearance: () => Promise<string>;
}

const RegistryContext = createContext<RegistryContextType | undefined>(
  undefined,
);

export function RegistryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { tier, isValidating, hasClearance, verify } = useAccess();

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  const value = useMemo<RegistryContextType>(
    () => ({
      isSearchOpen,
      setSearchOpen: setIsSearchOpen,
      toggleSearch,
      userTier: tier as AccessTier,
      isValidating,
      hasClearance: (required: AccessTier) => hasClearance(required),
      refreshClearance: verify,
    }),
    [isSearchOpen, toggleSearch, tier, isValidating, hasClearance, verify],
  );

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
    throw new Error("useRegistry must be used within a RegistryProvider");
  }

  return context;
}

// Re-export canonical tier type for convenience
export type { AccessTier };