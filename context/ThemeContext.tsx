// context/ThemeContext.tsx
"use client";

import * as React from "react";

type Theme = "light" | "dark";
type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<Ctx | null>(null);

function getInitialTheme(): Theme {
  // During SSR, always return "light" as default
  if (typeof window === "undefined") return "light";
  
  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light"); // Start with light for SSR
  const [mounted, setMounted] = React.useState(false);

  const apply = React.useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    window.localStorage.setItem("theme", t);
  }, []);

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t);
      if (typeof document !== "undefined") apply(t);
    },
    [apply],
  );

  const toggle = React.useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, [setTheme]);

  // Initialize theme after mount
  React.useEffect(() => {
    const initialTheme = getInitialTheme();
    setThemeState(initialTheme);
    apply(initialTheme);
    setMounted(true);
  }, [apply]);

  // Prevent flash of unstyled content by only rendering after mount
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "light", setTheme, toggle }}>
        <div className="flex min-h-screen flex-col bg-warmWhite text-deepCharcoal">
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  const value = React.useMemo(
    () => ({ theme, setTheme, toggle }),
    [theme, setTheme, toggle],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className={`flex min-h-screen flex-col ${theme === 'dark' ? 'dark' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}