// app/components/ThemeToggle.tsx
"use client";

import * as React from "react";
import type { ButtonHTMLAttributes } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  variant?: "icon" | "button";
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeToggle({
  variant = "icon",
  className = "",
  ...buttonProps
}: ThemeToggleProps): JSX.Element {
  const [theme, setTheme] = React.useState<ThemeMode>(() => getInitialTheme());

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const baseClasses =
    "inline-flex items-center justify-center rounded-full border border-lightGrey " +
    "bg-warmWhite px-2 py-2 text-sm text-deepCharcoal shadow-sm " +
    "transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 " +
    "focus:ring-forest focus:ring-offset-2";

  const icon = theme === "light" ? "☀️" : "🌙";
  const label = theme === "light" ? "Use dark theme" : "Use light theme";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={toggleTheme}
      className={[baseClasses, className].filter(Boolean).join(" ")}
      {...buttonProps}
    >
      {variant === "icon" ? (
        <span aria-hidden="true">{icon}</span>
      ) : (
        <span className="flex items-center gap-2">
          <span aria-hidden="true">{icon}</span>
          <span>{theme === "light" ? "Light mode" : "Dark mode"}</span>
        </span>
      )}
    </button>
  );
}

export default ThemeToggle;