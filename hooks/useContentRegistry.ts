// hooks/useContentRegistry.ts — HARDENED (Performance & Cache)
"use client"; 

import { useState, useEffect, useMemo } from 'react';

export interface RegistryItem {
  slug: string;
  title: string;
  type: 'canon' | 'download' | 'book' | 'short' | 'event' | 'resource' | 'lexicon' | 'blog' | 'print';
  date: string | null;
  excerpt: string | null;
  accessLevel: string;
  category?: string | null;
  image?: string;
}

interface RegistryState {
  content: RegistryItem[];
  isLoading: boolean;
  error: string | null;
}

const CACHE_KEY = 'abraham_registry_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 Minutes

export function useContentRegistry(filterType?: string) {
  const [state, setState] = useState<RegistryState>({
    content: [],
    isLoading: true,
    error: null,
  });

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function syncRegistry() {
      // 1. Check Institutional Cache
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setState({ content: data, isLoading: false, error: null });
          return;
        }
      }

      try {
        const response = await fetch('/api/content/initialize');
        if (!response.ok) throw new Error("Registry Synchronisation Failed");
        
        const result = await response.json();
        
        if (result.success) {
          // 2. Commit to Session Storage
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: result.content,
            timestamp: Date.now()
          }));

          setState({ content: result.content, isLoading: false, error: null });
        }
      } catch (err: any) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message }));
      }
    }

    syncRegistry();
  }, []);

  // 3. High-Performance Filtering Logic
  const filteredContent = useMemo(() => {
    return state.content.filter((item) => {
      const matchesType = !filterType || item.type === filterType;
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesType && matchesSearch;
    });
  }, [state.content, filterType, searchQuery]);

  return {
    ...state,
    content: filteredContent,
    setSearchQuery,
    searchQuery,
    totalCount: state.content.length,
    filteredCount: filteredContent.length
  };
}