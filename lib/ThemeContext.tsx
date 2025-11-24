// lib/ThemeContext.tsx
import * as React from "react";

export type ThemeName = "light" | "dark";

export interface ThemeContextValue {
  theme: ThemeName;
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const defaultValue: ThemeContextValue = {
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {
    // no-op – theming is disabled for now
  },
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultValue);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}