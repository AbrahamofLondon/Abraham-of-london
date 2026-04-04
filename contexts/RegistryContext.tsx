"use client";

import * as React from "react";

// Enhanced types for better type safety
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
  accessLevel?: "public" | "member" | "restricted";
  status?: "draft" | "published" | "archived";
  [key: string]: any; // Allow additional fields for flexibility
}

export interface RegistryContextType {
  content: RegistryItem[];
  categories: string[];
  isLoading: boolean;
  error: Error | null;
  // Additional useful utilities
  getItemBySlug: (slug: string) => RegistryItem | undefined;
  getItemsByCategory: (category: string) => RegistryItem[];
  getFeaturedItems: (limit?: number) => RegistryItem[];
  getRecentItems: (limit?: number) => RegistryItem[];
  refresh: () => Promise<void>;
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
  initialDocs: RegistryItem[];
  categories: string[];
  fetchUrl?: string; // Optional URL for dynamic fetching
}

export function RegistryProvider({ 
  children, 
  initialDocs, 
  categories,
  fetchUrl 
}: RegistryProviderProps) {
  const [content, setContent] = React.useState<RegistryItem[]>(initialDocs);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [localCategories, setLocalCategories] = React.useState<string[]>(categories);

  // Helper: Get item by slug
  const getItemBySlug = React.useCallback((slug: string) => {
    return content.find(item => item.slug === slug);
  }, [content]);

  // Helper: Get items by category
  const getItemsByCategory = React.useCallback((category: string) => {
    return content.filter(item => item.category === category);
  }, [content]);

  // Helper: Get featured items
  const getFeaturedItems = React.useCallback((limit: number = 3) => {
    const featured = content.filter(item => 
      item.status === "published" && 
      (item.tags?.includes("featured") || item.category === "Featured")
    );
    return featured.slice(0, limit);
  }, [content]);

  // Helper: Get recent items
  const getRecentItems = React.useCallback((limit: number = 6) => {
    const published = content.filter(item => item.status === "published");
    const sorted = [...published].sort((a, b) => {
      const dateA = a.date || a.createdAt;
      const dateB = b.date || b.createdAt;
      if (!dateA || !dateB) return 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    return sorted.slice(0, limit);
  }, [content]);

  // Refresh function to fetch new data
  const refresh = React.useCallback(async () => {
    if (!fetchUrl) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error("Failed to fetch registry data");
      
      const data = await response.json();
      setContent(data.docs || data);
      
      // Extract categories from new data if not provided
      if (data.categories) {
        setLocalCategories(data.categories);
      } else if (data.docs) {
        const extractedCategories = Array.from(new Set(data.docs.map((doc: RegistryItem) => doc.category).filter(Boolean)));
        setLocalCategories(extractedCategories as string[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      console.error("[RegistryContext] Refresh failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUrl]);

  // Auto-refresh on mount if fetchUrl provided
  React.useEffect(() => {
    if (fetchUrl && initialDocs.length === 0) {
      refresh();
    }
  }, [fetchUrl, initialDocs.length, refresh]);

  const value = React.useMemo<RegistryContextType>(() => ({
    content,
    categories: localCategories,
    isLoading,
    error,
    getItemBySlug,
    getItemsByCategory,
    getFeaturedItems,
    getRecentItems,
    refresh,
  }), [
    content, 
    localCategories, 
    isLoading, 
    error, 
    getItemBySlug, 
    getItemsByCategory, 
    getFeaturedItems, 
    getRecentItems, 
    refresh
  ]);

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}