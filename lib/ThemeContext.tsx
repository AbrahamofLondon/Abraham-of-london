// lib/ThemeContext.tsx
"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
  theme: Theme;                     // user preference
  resolvedTheme: "light" | "dark";  // actual in-use theme
  setThemePref: (t: Theme) => void;
  toggle: () => void;
  mounted: boolean;
};

const ThemeContext = React.createContext<Ctx | null>(null);

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function applyThemeToDom(resolved: "light" | "dark", pref: Theme | null) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.setAttribute("data-theme", resolved);
  if (pref) root.setAttribute("data-user-theme", pref);
  else root.removeAttribute("data-user-theme");
}

function getInitialPref(): Theme {
  if (typeof document === "undefined") return "system";
  try {
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    if (stored === "light" || stored === "dark" || stored === "system") return stored;

    const hinted = document.documentElement.getAttribute("data-user-theme") as Theme | null;
    if (hinted === "light" || hinted === "dark" || hinted === "system") return hinted;
  } catch {}
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>(getInitialPref);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  // Mount & system listener (with legacy Safari support; no @ts-expect-error)
  React.useEffect(() => {
    setMounted(true);

    try {
      const hasMM = typeof window !== "undefined" && "matchMedia" in window;
      const mql = hasMM ? window.matchMedia(DARK_QUERY) : null;

      const sysDark = !!mql?.matches;
      const initialResolved: "light" | "dark" =
        theme === "dark" ? "dark" : theme === "light" ? "light" : sysDark ? "dark" : "light";

      setResolvedTheme(initialResolved);
      applyThemeToDom(initialResolved, theme);

      if (theme === "system" && mql) {
        const handler = (e: MediaQueryListEvent) => {
          const next = e.matches ? "dark" : "light";
          setResolvedTheme(next);
          applyThemeToDom(next, "system");
        };

        // Modern
        mql.addEventListener?.("change", handler);

        // Legacy (Safari)
        type LegacyMQL = MediaQueryList & {
          addListener?: (listener: (e: MediaQueryListEvent) => void) => void;
          removeListener?: (listener: (e: MediaQueryListEvent) => void) => void;
        };
        const legacy = mql as LegacyMQL;
        legacy.addListener?.(handler);

        return () => {
          mql.removeEventListener?.("change", handler);
          legacy.removeListener?.(handler);
        };
      }
    } catch {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist preference & recompute resolved mode when user changes pref
  React.useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}

    const hasMM = typeof window !== "undefined" && "matchMedia" in window;
    const sysDark = hasMM ? window.matchMedia(DARK_QUERY).matches : false;

    const nextResolved: "light" | "dark" =
      theme === "dark" ? "dark" : theme === "light" ? "light" : sysDark ? "dark" : "light";

    setResolvedTheme(nextResolved);
    applyThemeToDom(nextResolved, theme);
  }, [theme, mounted]);

  const setThemePref = React.useCallback((t: Theme) => setTheme(t), []);
  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "dark";
      // prev === "system": flip the current resolved
      return resolvedTheme === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const value: Ctx = { theme, resolvedTheme, setThemePref, toggle, mounted };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
