import * as React from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setThemePref: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

// SSR-safe: only touch DOM when available
function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.setAttribute("data-theme", t);
  try {
    localStorage.setItem("theme", t);
  } catch {}
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return !!window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
}

/**
 * Determine an initial theme without causing a flash:
 * 1) Respect localStorage if present
 * 2) Respect <html data-theme="..."> set by your _document bootstrap
 * 3) Fall back to system preference
 */
function getInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    try {
      const stored = (localStorage.getItem("theme") as Theme | null) ?? null;
      if (stored === "light" || stored === "dark") return stored;
      const htmlAttr = document.documentElement.getAttribute("data-theme");
      if (htmlAttr === "light" || htmlAttr === "dark") return htmlAttr;
      return getSystemPrefersDark() ? "dark" : "light";
    } catch {
      // ignore
    }
  }
  // SSR fallback (the _document bootstrap will set the class before hydration)
  return "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with a best guess to minimize hydration mismatch; we’ll sync in effect
  const [theme, setTheme] = React.useState<Theme>(getInitialTheme);
  const [userLocked, setUserLocked] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("theme");
      return stored === "light" || stored === "dark";
    } catch {
      return false;
    }
  });

  // Apply theme to DOM on mount and whenever it changes
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // If the user hasn't explicitly chosen a theme, follow system changes live
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (userLocked) return;

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;

    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? "dark" : "light");
    };

    // Older Safari uses addListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    } else {
      // @ts-ignore legacy
      mql.addListener?.(handler);
      // @ts-ignore legacy
      return () => mql.removeListener?.(handler);
    }
  }, [userLocked]);

  const setThemePref = React.useCallback((t: Theme) => {
    setUserLocked(true);
    setTheme(t);
  }, []);

  const toggle = React.useCallback(() => {
    setUserLocked(true);
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const value = React.useMemo(
    () => ({ theme, setThemePref, toggle }),
    [theme, setThemePref, toggle],
  );

  // Always render the provider (don’t render children outside the provider)
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
