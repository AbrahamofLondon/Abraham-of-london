// components/ThemeContext.tsx - FIXED (client-safe)
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllContent } from "@/lib/mdx";

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
  typography: "serif" | "sans" | "mono";
  spacing: "compact" | "comfortable" | "expansive";
  stats: ThemeStats;
}

interface ThemeContextType {
  theme: ThemeState;
  toggleDarkMode: () => void;
  setAccentColor: (color: string) => void;
  setTypography: (type: "serif" | "sans" | "mono") => void;
  setSpacing: (spacing: "compact" | "comfortable" | "expansive") => void;
  refreshStats: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const defaultTheme: ThemeState = {
  isDarkMode: true,
  accentColor: "#D4AF37",
  typography: "serif",
  spacing: "comfortable",
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

function safeTime(value?: string | null): number {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : 0;
}

function inferKind(item: any): ContentKind | null {
  // Prefer explicit type/kind fields if present
  const raw =
    String(item?.type || item?.kind || item?._type || "")
      .toLowerCase()
      .trim();

  if (!raw) return null;

  // Normalize common variants
  if (raw === "post" || raw === "blog" || raw === "essay") return "essay";
  if (raw === "books" || raw === "book") return "book";
  if (raw === "downloads" || raw === "download") return "download";
  if (raw === "events" || raw === "event") return "event";
  if (raw === "prints" || raw === "print") return "print";
  if (raw === "resources" || raw === "resource") return "resource";
  if (raw === "canons" || raw === "canon") return "canon";

  return null;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme-settings");
      if (saved) {
        try {
          return { ...defaultTheme, ...JSON.parse(saved) };
        } catch (e) {
          console.warn("Failed to parse saved theme settings", e);
        }
      }
    }
    return defaultTheme;
  });

  const calculateStats = async (): Promise<ThemeStats> => {
    try {
      const allContent = await getAllContent();

      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      const byType: Record<ContentKind, number> = {
        essay: 0,
        book: 0,
        download: 0,
        event: 0,
        print: 0,
        resource: 0,
        canon: 0,
      };

      allContent.forEach((item: any) => {
        const kind = inferKind(item);
        if (kind) byType[kind] += 1;
      });

      const recentAdditions = allContent.filter((item: any) => {
        const t = safeTime(item?.date);
        return t > oneWeekAgo;
      }).length;

      const featuredCount = allContent.filter((item: any) =>
        Array.isArray(item?.tags) ? item.tags.includes("featured") : false
      ).length;

      return {
        totalContent: allContent.length,
        recentAdditions,
        featuredCount,
        byType,
      };
    } catch (error) {
      console.error("Failed to calculate content stats:", error);
      return defaultTheme.stats;
    }
  };

  useEffect(() => {
    const updateStats = async () => {
      const newStats = await calculateStats();
      setTheme((prev) => ({ ...prev, stats: newStats }));
    };
    updateStats();
  }, []);

  useEffect(() => {
    localStorage.setItem("theme-settings", JSON.stringify(theme));
  }, [theme]);

  const toggleDarkMode = () => setTheme((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  const setAccentColor = (color: string) => setTheme((prev) => ({ ...prev, accentColor: color }));
  const setTypography = (type: "serif" | "sans" | "mono") =>
    setTheme((prev) => ({ ...prev, typography: type }));
  const setSpacing = (spacing: "compact" | "comfortable" | "expansive") =>
    setTheme((prev) => ({ ...prev, spacing }));

  const refreshStats = async () => {
    const newStats = await calculateStats();
    setTheme((prev) => ({ ...prev, stats: newStats }));
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