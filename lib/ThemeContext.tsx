// Generic, SSR-safe theme context stub
// app/contexts/ThemeContext.tsx (and any other ThemeContext entry points)

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
  // No-op: theming is intentionally stubbed for now.
  // Kept side-effect free to stay SSR-safe and lint-friendly.
  setTheme: () => {
    // intentionally empty
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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Always provide the static default; no throwing, no browser-only APIs
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// CRITICAL: must never throw during SSR / prerender
export function useTheme(): ThemeContextValue {
  // If no provider is mounted, React will still return `defaultValue`
  return React.useContext(ThemeContext);
}