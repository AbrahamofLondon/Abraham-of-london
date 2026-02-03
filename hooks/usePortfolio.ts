/* hooks/usePortfolio.ts — PERFORMANCE SEARCH ENGINE */
import { useState, useEffect, useMemo } from 'react';

export interface RegistryAsset {
  id: string;   // File ID
  t: string;    // Title
  type: string; // Content Type (INTEL_BRIEF, etc.)
  tier: string; // Access Level
  d: string;    // Date
  w: number;    // Word Count
}

export function usePortfolio(query: string = '', category: string = 'all') {
  const [registry, setRegistry] = useState<RegistryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRegistry() {
      try {
        const response = await fetch('/system/content-registry.json');
        const data = await response.json();
        setRegistry(data.index);
      } catch (error) {
        console.error("❌ Failed to load portfolio registry:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadRegistry();
  }, []);

  // Use useMemo for "Sub-millisecond" filtering performance
  const filteredAssets = useMemo(() => {
    return registry.filter((asset) => {
      const matchesQuery = asset.t.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === 'all' || asset.type === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category, registry]);

  return { assets: filteredAssets, isLoading, total: registry.length };
}