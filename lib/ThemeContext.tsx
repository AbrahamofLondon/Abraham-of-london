import * as React from "react";

type Theme = "light" | "dark";
type ThemeContextValue = {
  theme: Theme;
  setThemePref: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.setAttribute("data-theme", t);
  try {
    localStorage.setItem("theme", t);
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      const stored = (localStorage.getItem("theme") as Theme | null) ?? null;
      const prefersDark =
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
      const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
      setThemeState(initial);
      applyTheme(initial);
    } catch {
      setThemeState("light");
      applyTheme("light");
    }
  }, []);

  const setThemePref = React.useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggle = React.useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ theme, setThemePref, toggle }),
    [theme, setThemePref, toggle],
  );

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}




