// contexts/RegistryContext.tsx
"use client";

import * as React from "react";

interface RegistryContextType {
  content: any[];
  categories: string[];
  isLoading: boolean;
  error: Error | null;
}

const RegistryContext = React.createContext<RegistryContextType | undefined>(undefined);

export function useContentRegistry() {
  const context = React.useContext(RegistryContext);
  if (!context) {
    throw new Error('useContentRegistry must be used within a RegistryProvider');
  }
  return context;
}

interface RegistryProviderProps {
  children: React.ReactNode;
  initialDocs: any[];
  categories: string[];
}

export function RegistryProvider({ children, initialDocs, categories }: RegistryProviderProps) {
  const [content] = React.useState(initialDocs);
  const [isLoading] = React.useState(false);
  const [error] = React.useState<Error | null>(null);

  return (
    <RegistryContext.Provider value={{ content, categories, isLoading, error }}>
      {children}
    </RegistryContext.Provider>
  );
}