"use client";

import { useTheme } from "@/lib/ThemeContext";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggle, mounted } = useTheme();

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-md border transition " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 " +
    "border-black/10 bg-white/90 text-black hover:bg-white " +
    "dark:border-white/20 dark:bg-black/70 dark:text-white dark:hover:bg-black";

  // Hydration guard: render a stable placeholder until mounted
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme (loading)"
        className={`${base} ${className}`}
        disabled
      />
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      onClick={toggle}
      className={`${base} ${className} transition-transform duration-300`}
    >
      {dark ? (
        // Sun icon
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ) : (
        // Moon icon
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
