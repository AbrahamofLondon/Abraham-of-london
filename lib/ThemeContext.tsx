// lib/ThemeContext.tsx
import * as React from "react";

export type ThemeName = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const STORAGE_KEY_DEFAULT = "theme";

/**
 * Apply theme to <html> root safely (no-op on server)
 */
function applyThemeToDom(theme: ThemeName): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

const defaultValue: ThemeContextValue = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {
    // noop placeholder – will be replaced by provider
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "[ThemeContext] setTheme called outside of ThemeProvider; using default.",
      );
    }
  },
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultValue);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional initial theme; defaults to "dark" for your brand */
  defaultTheme?: ThemeName;
  /** Optional storage key for localStorage */
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
  storageKey = STORAGE_KEY_DEFAULT,
}) => {
  // SSR-friendly initial state – no window/document access here
  const [theme, setThemeState] = React.useState<ThemeName>(
    defaultTheme === "light" ? "light" : "dark",
  );

  const resolvedTheme: ThemeName = theme;

  // Hydrate from localStorage / system preference on client
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = window.localStorage.getItem(storageKey);

      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        applyThemeToDom(stored);
        return;
      }

      // Fall back to system preference if nothing stored
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      const initial: ThemeName = prefersDark ? "dark" : defaultTheme;
      setThemeState(initial);
      applyThemeToDom(initial);
    } catch {
      // Swallow any storage/DOM errors – never break render
      applyThemeToDom(defaultTheme);
    }
  }, [defaultTheme, storageKey]);

  const setTheme = React.useCallback(
    (value: ThemeName) => {
      setThemeState(value);
      applyThemeToDom(value);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageKey, value);
        } catch {
          // ignore storage failures gracefully
        }
      }
    },
    [storageKey],
  );

  const ctxValue: ThemeContextValue = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeContext.Provider value={ctxValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// CRITICAL: must never throw during SSR/prerender
export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}