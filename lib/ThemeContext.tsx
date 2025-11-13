// lib/themeContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";

export interface ThemeContextValue {
  theme: Theme;                    // user preference: light | dark | system
  resolvedTheme: "light" | "dark"; // actual applied
  setTheme: (value: Theme) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] =
    useState<"light" | "dark">("light");

  const applyTheme = useCallback(
    (value: Theme) => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;
      const effective =
        value === "system" ? resolveSystemTheme() : (value as "light" | "dark");

      // data-attributes for CSS hooks
      root.dataset.theme = effective;
      root.dataset.userTheme = value;

      // persist choice
      try {
        if (storageKey) {
          window.localStorage.setItem(storageKey, value);
        }
      } catch {
        // ignore storage failures
      }

      setThemeState(value);
      setResolvedTheme(effective);
    },
    [storageKey]
  );

  // initial load
  useEffect(() => {
    try {
      const stored = storageKey
        ? (window.localStorage.getItem(storageKey) as Theme | null)
        : null;
      applyTheme(stored || defaultTheme);
    } catch {
      applyTheme(defaultTheme);
    }
  }, [applyTheme, defaultTheme, storageKey]);

  // react to OS theme change if user is on "system"
  useEffect(() => {
    if (typeof window === "undefined" || theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      applyTheme("system");
    };

    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme, applyTheme]);

  const setTheme = (value: Theme) => {
    applyTheme(value);
  };

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}