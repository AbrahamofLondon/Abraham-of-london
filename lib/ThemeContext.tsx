// lib/ThemeContext.tsx
"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

type Ctx = {
  theme: Theme; // user preference
  resolvedTheme: "light" | "dark"; // actual in-use theme
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
  // Apply dark class for Tailwind
  root.classList.toggle("dark", resolved === "dark");
  // Set data-theme for CSS/SASS/LESS
  root.setAttribute("data-theme", resolved);
  // Set data-user-theme for user's persistent preference
  if (pref) root.setAttribute("data-user-theme", pref);
  else root.removeAttribute("data-user-theme");
}

function getInitialPref(): Theme {
  if (typeof document === "undefined") return "system";
  try {
    // 1. Check localStorage for user preference
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? null;
    if (stored === "light" || stored === "dark" || stored === "system")
      return stored;

    // 2. Check DOM for SSR hint (if passed via Next.js initial render)
    const hinted = document.documentElement.getAttribute(
      "data-user-theme",
    ) as Theme | null;
    if (hinted === "light" || hinted === "dark" || hinted === "system")
      return hinted;
  } catch {}
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>(getInitialPref);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(
    "light",
  );

  // --- 1. Initial Mount & System Listener Setup ---
  React.useEffect(() => {
    setMounted(true);

    const hasMM = typeof window !== "undefined" && "matchMedia" in window;
    const mql = hasMM ? window.matchMedia(DARK_QUERY) : null;

    // Only set up the listener if the user prefers "system"
    if (theme === "system" && mql) {
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        applyThemeToDom(next, "system");
      };

      // Modern (Chrome, Firefox, etc.)
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

    // Cleanup if the theme changes from "system" to something else
    return () => {};
  }, [theme]); // Dependency: theme is needed to check if listener should be active

  // --- 2. Resolve Theme, Persist Preference, & Apply to DOM ---
  React.useEffect(() => {
    // Wait for the component to mount and the initial 'theme' state to settle
    if (!mounted) return;

    try {
      // 1. Persist the user's preference
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage may fail in private browsing mode
    }

    // 2. Compute the resolved theme based on preference and system setting
    const hasMM = typeof window !== "undefined" && "matchMedia" in window;
    const sysDark = hasMM ? window.matchMedia(DARK_QUERY).matches : false;

    const nextResolved: "light" | "dark" =
      theme === "dark"
        ? "dark"
        : theme === "light"
          ? "light"
          : sysDark
            ? "dark"
            : "light";

    // 3. Apply and update state
    setResolvedTheme(nextResolved);
    applyThemeToDom(nextResolved, theme);
  }, [theme, mounted]); // Dependency: Re-run whenever theme preference or mounted state changes

  const setThemePref = React.useCallback((t: Theme) => setTheme(t), []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      // Simple flip if we're currently dark or light
      if (prev === "dark") return "light";
      if (prev === "light") return "dark";

      // If prev === "system", flip the *resolved* theme to set a preference
      return resolvedTheme === "dark" ? "light" : "dark";
    });
  }, [resolvedTheme]);

  const value: Ctx = { theme, resolvedTheme, setThemePref, toggle, mounted };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
