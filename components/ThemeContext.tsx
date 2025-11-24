// components/ThemeContext.tsx
import * as React from "react";
import {
  ThemeProvider as InternalThemeProvider,
  useTheme as useThemeInternal,
  type ThemeName,
  type ThemeContextValue,
} from "@/lib/ThemeContext";

export type { ThemeName, ThemeContextValue };

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeName;
}

/**
 * UI-layer ThemeProvider wrapper.
 * Delegates to lib/ThemeContext but keeps existing imports working.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
}) => {
  return (
    <InternalThemeProvider defaultTheme={defaultTheme}>
      {children}
    </InternalThemeProvider>
  );
};

export const useTheme = useThemeInternal;

// Optional default export for any legacy imports
export default ThemeProvider;