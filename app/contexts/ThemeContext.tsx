// app/contexts/ThemeContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// Types
export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface ThemeContextType {
  theme: Theme; // current (light | dark | system)
  resolvedTheme: ResolvedTheme; // actual class applied
  mounted: boolean; // client mounted
  toggle: () => void; // toggle light/dark
  setTheme: (theme: Theme) => void; // set explicit
  systemTheme: ResolvedTheme; // system preference snapshot
}

// Constants
const THEME_STORAGE_KEY = "theme";
const COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

// Default context
const defaultContext: ThemeContextType = {
  theme: "system",
  resolvedTheme: "light",
  mounted: false,
  toggle: () => {},
  setTheme: () => {},
  systemTheme: "light",
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

// Helpers
function isValidTheme(theme: string): theme is Theme {
  return theme === "light" || theme === "dark" || theme === "system";
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  forcedTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
  enableSystem = true,
  forcedTheme,
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  // 1) Initial mount: read stored or forced theme
  useEffect(() => {
    setMounted(true);
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem(storageKey)
          : null;

      if (forcedTheme) {
        setThemeState(forcedTheme);
      } else if (stored && isValidTheme(stored)) {
        setThemeState(stored);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn("Failed to read theme from localStorage:", error);
    }
    // no cleanup required
  }, [storageKey, forcedTheme]);

  // 2) Listen for system theme changes (always return a cleanup, even if disabled)
  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {}; // SSR no-op cleanup
    }

    if (!enableSystem) {
      return () => {}; // no-op cleanup to satisfy noImplicitReturns
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);

    const handleChange = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    // prime current value
    handleChange();

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [enableSystem]);

  // 3) Sync theme across tabs (always returns cleanup)
  useEffect(() => {
    if (typeof window === "undefined") {
      return () => {};
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        if (isValidTheme(event.newValue) && event.newValue !== theme) {
          setThemeState(event.newValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [storageKey, theme]);

  // Resolved theme
  const resolvedTheme: ResolvedTheme = React.useMemo(() => {
    if (forcedTheme && forcedTheme !== "system") return forcedTheme;
    if (theme === "system") return enableSystem ? systemTheme : "light";
    return theme;
  }, [theme, systemTheme, forcedTheme, enableSystem]);

  // Update DOM + persist
  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;

    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);
    updateMetaThemeColor(resolvedTheme);

    if (theme !== "system" && !forcedTheme) {
      try {
        localStorage.setItem(storageKey, theme);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn("Failed to save theme to localStorage:", error);
      }
    }
    // no cleanup required
  }, [theme, resolvedTheme, mounted, storageKey, forcedTheme]);

  // Actions
  const setTheme = useCallback(
    (newTheme: Theme): void => {
      if (forcedTheme) {
        // eslint-disable-next-line no-console
        console.warn("Theme is forced and cannot be changed");
        return;
      }
      setThemeState(newTheme);
    },
    [forcedTheme],
  );

  const toggle = useCallback((): void => {
    if (forcedTheme) {
      // eslint-disable-next-line no-console
      console.warn("Theme is forced and cannot be changed");
      return;
    }
    setThemeState((current) => {
      if (current === "system") {
        return systemTheme === "dark" ? "light" : "dark";
      }
      return current === "light" ? "dark" : "light";
    });
  }, [forcedTheme, systemTheme]);

  // Meta theme-color
  const updateMetaThemeColor = (t: ResolvedTheme): void => {
    if (typeof document === "undefined") return;
    const meta = document.querySelector("meta[name='theme-color']");
    const color = t === "dark" ? "#1a1a1a" : "#ffffff";
    if (meta) meta.setAttribute("content", color);
  };

  const contextValue: ThemeContextType = {
    theme,
    resolvedTheme,
    mounted,
    toggle,
    setTheme,
    systemTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Convenience helpers
export function useThemeAwareValue<T>(lightValue: T, darkValue: T): T {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? darkValue : lightValue;
}

export function getThemeClass(
  theme: Theme,
  resolvedTheme: ResolvedTheme,
): string {
  return theme === "system" ? `system-${resolvedTheme}` : theme;
}

export function getThemeTransitionClass(): string {
  return "transition-colors duration-300 ease-in-out";
}

// SSR helper
export function getServerTheme(
  cookieHeader?: string | null,
  defaultTheme: Theme = "system",
): Theme {
  if (!cookieHeader) return defaultTheme;
  try {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [name, ...value] = c.trim().split("=");
        return [name, value.join("=")];
      }),
    );
    return (cookies[THEME_STORAGE_KEY] as Theme) || defaultTheme;
  } catch {
    return defaultTheme;
  }
}

// FOUC-prevention script
export function ThemeScript({
  storageKey = THEME_STORAGE_KEY,
  defaultTheme = "system",
  enableSystem = true,
}: {
  storageKey?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  try {
    var stored = localStorage.getItem('${storageKey}');
    var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = '${defaultTheme}';
    if (stored && ['light','dark','system'].includes(stored)) { theme = stored; }
    var resolved = theme;
    if (theme === 'system' && ${enableSystem}) { resolved = systemDark ? 'dark' : 'light'; }
    else if (theme === 'system') { resolved = 'light'; }
    document.documentElement.classList.add(resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) { /* noop */ }
})();`,
      }}
    />
  );
}
