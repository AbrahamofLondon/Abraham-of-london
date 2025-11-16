// lib/ThemeContext.tsx
import * as React from "react";

export type ThemeName = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const defaultValue: ThemeContextValue = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {
    // no-op – theming is stubbed for now
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn("[ThemeContext] setTheme called, but theming is stubbed.");
    }
  },
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultValue);

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Kept for compatibility with previous usage (ignored) */
  defaultTheme?: string;
  /** Kept for compatibility with previous usage (ignored) */
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
}) => {
  // Always provide the safe default; no throwing, SSR-safe
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// CRITICAL: must never throw during SSR/prerender
export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}