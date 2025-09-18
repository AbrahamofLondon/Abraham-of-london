// lib/ThemeContext.tsx
"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setThemePref: (t: Theme) => void;
  toggle: () => void;
  mounted: boolean;
};

const ThemeContext = React.createContext<Ctx | null>(null);

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function detectSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(DARK_QUERY).matches ?? false;
}

function safeGetInitial(): Theme {
  if (typeof window === "undefined") return "system";

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    const hinted = document.documentElement.getAttribute("data-user-theme") as Theme | null;
    if (hinted === "light" || hinted === "dark" || hinted === "system") {
      return hinted;
    }
  } catch {
    // ignore
  }
  return "system";
}

function resolveTheme(pref: Theme): "light" | "dark" {
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return detectSystemDark() ? "dark" : "light";
}

function applyThemeToDom(resolved: "light" | "dark", pref: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-user-theme", pref);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>(() => safeGetInitial());
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    resolveTheme(safeGetInitial())
  );

  // On mount, sync with DOM + listen to system changes
  React.useEffect(() => {
    setMounted(true);

    const mql = window.matchMedia?.(DARK_QUERY);
    const update = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyThemeToDom(next, theme);
      }
    };

    if (theme === "system" && mql) {
      mql.addEventListener?.("change", update);
      mql.addListener?.(update); // Safari
    }

    return () => {
      mql?.removeEventListener?.("change", update);
      mql?.removeListener?.(update);
    };
  }, [theme]);

  // When theme changes, recompute + persist
  React.useEffect(() => {
    const next = resolveTheme(theme);
    setResolvedTheme(next);

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }

    applyThemeToDom(next, theme);
  }, [theme]);

  const setThemePref = React.useCallback((t: Theme) => setTheme(t), []);
  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "dark";
      return detectSystemDark() ? "light" : "dark";
    });
  }, []);

  const value: Ctx = { theme, resolvedTheme, setThemePref, toggle, mounted };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
