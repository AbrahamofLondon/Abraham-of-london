// Generic, SSR-safe theme context stub
// app/contexts/ThemeContext.tsx  (and the other ThemeContext files)

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
    // no-op - theming disabled for now
    if (process.env.NODE_ENV === "development") {
      console.warn("[ThemeContext] setTheme called, but theming is stubbed.");
    }
  },
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultValue);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // We always just use the default value; no throwing, no dependency
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// CRITICAL: This hook must NEVER throw in SSR/prerender
export function useTheme(): ThemeContextValue {
  // Even if no provider is present, React will fall back to `defaultValue`
  return React.useContext(ThemeContext);
}
