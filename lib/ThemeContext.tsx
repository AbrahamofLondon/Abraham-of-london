// lib/ThemeContext.ts
import * as React from "react";

export type ThemeName = "light" | "dark";
export type ThemeMode = ThemeName | "system";

export interface ThemeContextValue {
  /** user-selected mode */
  theme: ThemeMode;
  /** resolved effective theme */
  resolvedTheme: ThemeName;
  setTheme: (theme: ThemeMode) => void;
}

const STORAGE_KEY = "aol-theme";

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
});

function getSystemTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ThemeName {
  return mode === "system" ? getSystemTheme() : mode;
}

function applyHtmlClass(resolved: ThemeName) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {}
  return "system";
}

function writeStoredTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey, // kept for compat (ignored)
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}) {
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    // client will use stored value; server falls back to defaultTheme
    return typeof window === "undefined" ? defaultTheme : readStoredTheme();
  });

  const [resolvedTheme, setResolvedTheme] = React.useState<ThemeName>(() => resolveTheme(theme));

  // Keep resolved theme in sync (and track system changes when mode=system)
  React.useEffect(() => {
    const update = () => {
      const resolved = resolveTheme(theme);
      setResolvedTheme(resolved);
      applyHtmlClass(resolved);
    };

    update();

    if (theme !== "system") return;

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;

    const handler = () => update();
    // Safari compat:
    if (typeof mql.addEventListener === "function") mql.addEventListener("change", handler);
    else mql.addListener(handler);

    return () => {
      if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [theme]);

  const setTheme = React.useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    writeStoredTheme(mode);
    const resolved = resolveTheme(mode);
    setResolvedTheme(resolved);
    applyHtmlClass(resolved);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

export const AOL_THEME_STORAGE_KEY = STORAGE_KEY;