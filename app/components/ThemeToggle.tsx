// app/components/ThemeToggle.tsx
"use client";

import * as React from "react";
import type { ButtonHTMLAttributes } from "react";

import { useTheme } from "@/lib/ThemeContext";
import type { ThemeName } from "@/lib/ThemeContext";

export type ThemeMode = ThemeName;

export interface ThemeToggleProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  variant?: "icon" | "button";
}

export function ThemeToggle({
  variant = "icon",
  className = "",
  ...buttonProps
}: ThemeToggleProps): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();

  // fall back to "dark" to match defaultTheme
  const theme: ThemeMode = (resolvedTheme as ThemeMode) || "dark";

  const toggleTheme = (): void => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const baseClasses =
    "inline-flex items-center justify-center rounded-full border border-slate-400 " +
    "bg-white px-2 py-2 text-sm text-slate-900 shadow-sm " +
    "transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 " +
    "focus:ring-forest focus:ring-offset-2 dark:bg-slate-900 " +
    "dark:text-slate-100 dark:border-slate-500 dark:hover:bg-slate-800";

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