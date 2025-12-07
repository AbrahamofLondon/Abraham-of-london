// components/ThemeContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

import { getAllContent } from "@/lib/mdx";

// If these are still needed, keep them:
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";

// ---------------------------------------------------------------------------
// Enhanced Types with Luxury Aesthetics
// ---------------------------------------------------------------------------

type ContentKind =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon";

interface ThemeStats {
  totalContent: number;
  recentAdditions: number;
  featuredCount: number;
  byType: Record<ContentKind, number>;
}

interface ThemeState {
  isDarkMode: boolean;
  accentColor: string;
  typography: 'serif' | 'sans' | 'mono';
  spacing: 'compact' | 'comfortable' | 'expansive';
  stats: ThemeStats;
}

interface ThemeContextType {
  theme: ThemeState;
  toggleDarkMode: () => void;
  setAccentColor: (color: string) => void;
  setTypography: (type: 'serif' | 'sans' | 'mono') => void;
  setSpacing: (spacing: 'compact' | 'comfortable' | 'expansive') => void;
  refreshStats: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultTheme: ThemeState = {
  isDarkMode: true,
  accentColor: '#D4AF37',
  typography: 'serif',
  spacing: 'comfortable',
  stats: {
    totalContent: 0,
    recentAdditions: 0,
    featuredCount: 0,
    byType: {
      essay: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
      canon: 0,
    },
  },
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-settings');
      if (saved) {
        try {
          return { ...defaultTheme, ...JSON.parse(saved) };
        } catch (e) {
          console.warn('Failed to parse saved theme settings', e);
        }
      }
    }
    return defaultTheme;
  });

  // Calculate content stats
  const calculateStats = (): ThemeStats => {
    try {
      // Use getAllContent from content-utils
      const allContent = getAllContent();
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const byType: Record<ContentKind, number> = {
        essay: 0,
        book: 0,
        download: 0,
        event: 0,
        print: 0,
        resource: 0,
        canon: 0,
      };

      allContent.forEach(item => {
        const kind = item.category?.toLowerCase() as ContentKind;
        if (kind && byType.hasOwnProperty(kind)) {
          byType[kind]++;
        }
      });

      return {
        totalContent: allContent.length,
        recentAdditions: allContent.filter(item => {
          if (!item.date) return false;
          const itemDate = new Date(item.date);
          return itemDate > oneWeekAgo;
        }).length,
        featuredCount: allContent.filter(item => item.tags?.includes('featured')).length,
        byType,
      };
    } catch (error) {
      console.error('Failed to calculate content stats:', error);
      return defaultTheme.stats;
    }
  };

  // Update stats on mount and when theme changes
  useEffect(() => {
    const newStats = calculateStats();
    setTheme(prev => ({
      ...prev,
      stats: newStats,
    }));
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(theme));
  }, [theme]);

  const toggleDarkMode = () => {
    setTheme(prev => ({
      ...prev,
      isDarkMode: !prev.isDarkMode,
    }));
  };

  const setAccentColor = (color: string) => {
    setTheme(prev => ({
      ...prev,
      accentColor: color,
    }));
  };

  const setTypography = (type: 'serif' | 'sans' | 'mono') => {
    setTheme(prev => ({
      ...prev,
      typography: type,
    }));
  };

  const setSpacing = (spacing: 'compact' | 'comfortable' | 'expansive') => {
    setTheme(prev => ({
      ...prev,
      spacing,
    }));
  };

  const refreshStats = () => {
    const newStats = calculateStats();
    setTheme(prev => ({
      ...prev,
      stats: newStats,
    }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleDarkMode,
        setAccentColor,
        setTypography,
        setSpacing,
        refreshStats,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Utility hook for common theme operations
export const useThemeActions = () => {
  const { theme, toggleDarkMode, setAccentColor } = useTheme();
  
  return {
    isDarkMode: theme.isDarkMode,
    accentColor: theme.accentColor,
    toggleDarkMode,
    setAccentColor,
    stats: theme.stats,
  };
};

export default ThemeContext;