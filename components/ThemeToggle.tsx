// lib/ThemeContext.tsx
import * as React from "react";

export type ThemeName = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {
    // noop default
  },
});

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string;
}

const STORAGE_KEY_FALLBACK = "aol-theme";

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
  storageKey = STORAGE_KEY_FALLBACK,
}) => {
  const [theme, setThemeState] = React.useState<ThemeName>(defaultTheme);

  // On mount: read from localStorage, or use defaultTheme
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const stored = window.localStorage.getItem(storageKey);
    let initial: ThemeName = defaultTheme;

    if (stored === "light" || stored === "dark") {
      initial = stored;
    }

    setThemeState(initial);

    const root = document.documentElement;
    if (initial === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [defaultTheme, storageKey]);

  const setTheme = React.useCallback(
    (next: ThemeName) => {
      setThemeState(next);
      if (typeof window === "undefined" || typeof document === "undefined") return;

      const root = document.documentElement;
      if (next === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      window.localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  const value: ThemeContextValue = {
    theme,
    resolvedTheme: theme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}