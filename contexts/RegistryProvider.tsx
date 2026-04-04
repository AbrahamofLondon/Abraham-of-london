// contexts/RegistryProvider.tsx — HARDENED (Global Intelligence Orchestrator)
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useAccess } from "@/hooks/useAccess";
import type { AccessTier } from "@/lib/access/tier-policy";

/**
 * REGISTRY CONTEXT SCHEMA
 * Centralized state management for the Abraham of London institutional interface.
 */

// Content item type for registry
export interface RegistryItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  description?: string;
  date?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  category?: string;
  tags?: string[];
  accessLevel?: AccessTier;
  status?: "draft" | "published" | "archived";
  [key: string]: any;
}

interface RegistryContextType {
  // UI State
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
  
  // Access Control
  userTier: AccessTier;
  isValidating: boolean;
  hasClearance: (required: AccessTier) => boolean;
  refreshClearance: () => Promise<string>;
  
  // Content Registry (New)
  content: RegistryItem[];
  categories: string[];
  isLoadingContent: boolean;
  contentError: Error | null;
  getItemBySlug: (slug: string) => RegistryItem | undefined;
  getItemsByCategory: (category: string) => RegistryItem[];
  getFeaturedItems: (limit?: number) => RegistryItem[];
  getRecentItems: (limit?: number) => RegistryItem[];
  refreshContent: () => Promise<void>;
  setContent: React.Dispatch<React.SetStateAction<RegistryItem[]>>;
}

const RegistryContext = createContext<RegistryContextType | undefined>(
  undefined,
);

interface RegistryProviderProps {
  children: React.ReactNode;
  initialContent?: RegistryItem[];
  initialCategories?: string[];
  contentFetchUrl?: string;
}

export function RegistryProvider({
  children,
  initialContent = [],
  initialCategories = [],
  contentFetchUrl,
}: RegistryProviderProps) {
  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Content Registry State
  const [content, setContent] = useState<RegistryItem[]>(initialContent);
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [contentError, setContentError] = useState<Error | null>(null);
  
  // Access Control
  const { tier, isValidating, hasClearance, verify } = useAccess();

  const toggleSearch = useCallback(() => {
    setIsSearchOpen((prev) => !prev);
  }, []);

  // Content Helpers
  const getItemBySlug = useCallback((slug: string) => {
    return content.find(item => item.slug === slug);
  }, [content]);

  const getItemsByCategory = useCallback((category: string) => {
    return content.filter(item => item.category === category);
  }, [content]);

  const getFeaturedItems = useCallback((limit: number = 3) => {
    const featured = content.filter(item => 
      item.status === "published" && 
      (item.tags?.includes("featured") || item.category === "Featured")
    );
    return featured.slice(0, limit);
  }, [content]);

  const getRecentItems = useCallback((limit: number = 6) => {
    const published = content.filter(item => item.status === "published");
    const sorted = [...published].sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    return sorted.slice(0, limit);
  }, [content]);

  // Refresh content from API
  const refreshContent = useCallback(async () => {
    if (!contentFetchUrl) return;
    
    setIsLoadingContent(true);
    setContentError(null);
    
    try {
      const response = await fetch(contentFetchUrl);
      if (!response.ok) throw new Error(`Failed to fetch content: ${response.status}`);
      
      const data = await response.json();
      const docs = data.docs || data;
      setContent(docs);
      
      // Extract categories if provided
      if (data.categories) {
        setCategories(data.categories);
      } else if (docs?.length > 0) {
        const extractedCategories = Array.from(
          new Set(docs.map((doc: RegistryItem) => doc.category).filter(Boolean))
        );
        setCategories(extractedCategories as string[]);
      }
    } catch (err) {
      setContentError(err instanceof Error ? err : new Error("Unknown error"));
      console.error("[RegistryProvider] Content refresh failed:", err);
    } finally {
      setIsLoadingContent(false);
    }
  }, [contentFetchUrl]);

  // Auto-fetch content on mount if URL provided and no initial content
  useEffect(() => {
    if (contentFetchUrl && initialContent.length === 0 && !isLoadingContent) {
      refreshContent();
    }
  }, [contentFetchUrl, initialContent.length, isLoadingContent, refreshContent]);

  const value = useMemo<RegistryContextType>(
    () => ({
      // UI State
      isSearchOpen,
      setSearchOpen: setIsSearchOpen,
      toggleSearch,
      
      // Access Control
      userTier: tier as AccessTier,
      isValidating,
      hasClearance: (required: AccessTier) => hasClearance(required),
      refreshClearance: verify,
      
      // Content Registry
      content,
      categories,
      isLoadingContent,
      contentError,
      getItemBySlug,
      getItemsByCategory,
      getFeaturedItems,
      getRecentItems,
      refreshContent,
      setContent,
    }),
    [
      isSearchOpen,
      toggleSearch,
      tier,
      isValidating,
      hasClearance,
      verify,
      content,
      categories,
      isLoadingContent,
      contentError,
      getItemBySlug,
      getItemsByCategory,
      getFeaturedItems,
      getRecentItems,
      refreshContent,
    ],
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