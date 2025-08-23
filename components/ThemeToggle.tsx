"use client";

import * as React from "react";

interface ThemeToggleProps {
  className?: string;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

type Theme = "light" | "dark";

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<Theme>("light");

  const applyTheme = React.useCallback((t: Theme) => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.setAttribute("data-theme", t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, []);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("theme") as Theme | null) || null;
      const systemDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial: Theme = stored || (systemDark ? "dark" : "light");
      setTheme(initial);
      applyTheme(initial);
    } catch {
      // best-effort
    }
  }, [applyTheme]);

  // Follow system changes ONLY if user hasn’t explicitly set a theme
  React.useEffect(() => {
    const hasUserPref = !!localStorage.getItem("theme");
    if (hasUserPref || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const t: Theme = mql.matches ? "dark" : "light";
      setTheme(t);
      applyTheme(t);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [applyTheme]);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-md transition " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles =
    "border border-lightGrey bg-white/90 text-deepCharcoal hover:bg-white " +
    "dark:border-white/20 dark:bg-deepCharcoal/70 dark:text-cream dark:hover:bg-deepCharcoal";

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(base, styles, className)}
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={theme === "dark"}
      onClick={toggle}
      className={cn(base, styles, className, "transition-transform duration-300")}
    >
      {theme === "dark" ? (
        // Sun icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="animate-pulse">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
