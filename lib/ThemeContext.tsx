// lib/ThemeContext.ts
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
  // No-op by default; real function is provided in the provider below
  setTheme: () => {
    // intentionally empty
  },
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultValue);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /** Optional initial theme; defaults to "dark" */
  defaultTheme?: ThemeName;
  /** Kept for compatibility with old API – currently unused */
  storageKey?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "dark",
}) => {
  const [theme, setTheme] = React.useState<ThemeName>(defaultTheme);

  // Apply the `dark` class to <html> – this is what Tailwind uses
  React.useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}
