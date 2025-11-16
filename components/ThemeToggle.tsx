// components/ThemeToggle.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const stored = window.localStorage.getItem("theme");
  if (stored === "dark" || stored === "light") return stored as Theme;

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = React.useState<Theme>("light");

  // Initialise from localStorage / system preference, and sync to <html> class
  React.useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);

    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.toggle("dark", initial === "dark");
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.classList.toggle("dark", next === "dark");
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme", next);
      }

      return next;
    });
  }, []);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white shadow-sm transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
};

export default ThemeToggle;