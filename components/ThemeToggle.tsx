// components/ThemeToggle.tsx
import * as React from "react";

interface ThemeToggleProps {
  className?: string;
}

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = React.useState(false);
  const [theme, setTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setMounted(true);
    const stored =
      (typeof window !== "undefined"
        ? (localStorage.getItem("theme") as "light" | "dark" | null)
        : null) || null;
    const systemDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial: "light" | "dark" = stored ?? (systemDark ? "dark" : "light");
    applyTheme(initial);
    setTheme(initial);
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    const root = document.documentElement;
    root.classList.toggle("dark", t === "dark");
    root.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  };

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md border border-lightGrey bg-white/80 text-deepCharcoal",
          className,
        )}
        disabled
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={
        theme === "dark" ? "Activate light theme" : "Activate dark theme"
      }
      aria-pressed={theme === "dark"}
      onClick={toggle}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-lightGrey bg-white/80 text-deepCharcoal hover:bg-white hover:shadow-cardHover transition",
        className,
      )}
    >
      {theme === "dark" ? (
        /* Sun icon */
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
        /* Moon icon */
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




