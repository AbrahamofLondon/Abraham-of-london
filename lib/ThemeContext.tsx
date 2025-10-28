// lib/ThemeContext.tsx
"use client";

import * as React from "react";
import { useCallback, useEffect, useState, createContext, useContext } from "react";

// --- Constants ---
export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// --- Context Definition ---

type Ctx = {
  theme: Theme; // User's set preference ('light', 'dark', 'system')
  resolvedTheme: "light" | "dark"; // The actual theme being rendered
  setThemePref: (t: Theme) => void;
  toggle: () => void;
  mounted: boolean; // Flag indicating if the component has hydrated
};

const ThemeContext = createContext<Ctx | null>(null);

// --- Utility Functions ---

/** Gets the current system dark mode preference. */
function getSystemPreference(): "light" | "dark" {
  if (typeof window !== "undefined" && "matchMedia" in window) {
    return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
  }
  return "light"; // Default to light during SSR/static generation
}

/** Gets the theme preference stored in localStorage or DOM attribute. */
function getInitialPref(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    // 1. Check localStorage for user preference
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }

    // 2. Check DOM for SSR hint (if passed via Next.js initial render)
    const hinted = document.documentElement.getAttribute("data-user-theme") as Theme | null;
    if (hinted === "light" || hinted === "dark" || hinted === "system") {
      return hinted;
    }
  } catch {
    // Fail silently if localStorage access is denied
  }
  return "system";
}

/** Applies the resolved theme and preference to the DOM for CSS/Tailwind use. */
function applyThemeToDom(resolved: "light" | "dark", pref: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  
  // Apply dark class for Tailwind
  root.classList.toggle("dark", resolved === "dark");
  
  // Set data-theme for CSS/SASS/LESS
  root.setAttribute("data-theme", resolved);
  
  // Set data-user-theme for user's persistent preference
  root.setAttribute("data-user-theme", pref);
}

// --- Theme Provider Component ---

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  // Initialize 'theme' preference from the safe client-side getter
  const [theme, setTheme] = useState<Theme>(getInitialPref); 
  
  // Initialize resolvedTheme based on initial preference *or* system preference
  // This helps prevent a flash of incorrect theme during hydration
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => 
    theme === 'dark' 
      ? 'dark' 
      : theme === 'light' 
        ? 'light' 
        : getSystemPreference()
  );

  // --- 1. Mount and System Listener Setup (Runs once, or when theme changes to/from 'system') ---
  useEffect(() => {
    setMounted(true);
    
    const mql = typeof window !== "undefined" ? window.matchMedia(DARK_QUERY) : null;
    
    // Only set up the listener if the user prefers "system"
    if (theme === "system" && mql) {
      // Use the modern addEventListener which is easier to clean up
      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setResolvedTheme(next);
        // Apply immediately to prevent layout shift
        applyThemeToDom(next, "system"); 
      };

      mql.addEventListener("change", handler);
      
      return () => mql.removeEventListener("change", handler);
    }

    // Cleanup for non-system themes is handled by subsequent effect if applicable
    return () => {};
  }, [theme]); 

  // --- 2. Resolve Theme, Persist Preference, & Apply to DOM (Runs on theme change or mount) ---
  useEffect(() => {
    if (!mounted) return;

    // 1. Persist the user's preference
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}

    // 2. Compute the resolved theme based on preference (if not 'system', use preference)
    let nextResolved: "light" | "dark";
    if (theme === "dark") {
      nextResolved = "dark";
    } else if (theme === "light") {
      nextResolved = "light";
    } else {
      // If 'system', use the current system preference
      nextResolved = getSystemPreference();
    }

    // 3. Apply and update state if a change is needed
    setResolvedTheme(nextResolved);
    applyThemeToDom(nextResolved, theme);
    
  }, [theme, mounted]);

  const setThemePref = useCallback((t: Theme) => setTheme(t), []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      // If current preference is 'dark' or 'system' which resolves to 'dark', flip to 'light'
      if (prev === "dark" || (prev === "system" && resolvedTheme === "dark")) {
        return "light";
      }
      // If current preference is 'light' or 'system' which resolves to 'light', flip to 'dark'
      return "dark";
    });
  }, [resolvedTheme]); // Dependency: resolvedTheme is used for the 'system' toggle flip

  const value: Ctx = { theme, resolvedTheme, setThemePref, toggle, mounted };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// --- Custom Hook ---

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}