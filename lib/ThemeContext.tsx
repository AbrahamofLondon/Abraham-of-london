// lib/ThemeContext.tsx
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
  storageKey?: string;
};

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

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: () => {
        // fallback no-op – should not be hit in normal flow
      },
    };
  }
  return ctx;
}