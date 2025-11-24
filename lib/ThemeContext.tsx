// lib/ThemeContext.tsx
// Single source of truth theme context that wraps `next-themes`

import * as React from "react";
import {
  ThemeProvider as NextThemeProvider,
  useTheme as useNextTheme,
} from "next-themes";

export type ThemeName = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
  storageKey?: string; // kept for compatibility, not used directly
};

/**
 * Outer provider: lets `next-themes` manage <html class="dark"> etc.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
}) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={false}
    >
      <InnerThemeProvider>{children}</InnerThemeProvider>
    </NextThemeProvider>
  );
};

/**
 * Inner provider: exposes a clean, typed ThemeContext
 * to the rest of the app, backed by `next-themes`.
 */
const InnerThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme, resolvedTheme, setTheme } = useNextTheme();

  const value: ThemeContextValue = {
    theme: (theme as ThemeName) || "dark",
    resolvedTheme: (resolvedTheme as ThemeName) || "dark",
    setTheme: (t: ThemeName) => setTheme(t),
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

/**
 * Safe hook: if someone forgets the provider, we degrade
 * to a dark default instead of throwing during SSR.
 */
export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: () => {
        // no-op fallback – but in normal app flow this shouldn't run
      },
    };
  }
  return ctx;
}