import * as React from "react";

export type ThemeName = "light" | "dark";
export type ThemeMode = ThemeName | "system";

export interface ThemeContextValue {
  theme: ThemeMode;
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
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyHtmlClass(resolved: ThemeName): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}

function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // ignore storage read failures
  }

  return "system";
}

export function ThemeScript(): React.ReactElement {
  const script = `
    (function () {
      try {
        var key = '${STORAGE_KEY}';
        var stored = localStorage.getItem(key);
        var theme = stored === 'light' || stored === 'dark' || stored === 'system'
          ? stored
          : 'system';
        var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var resolved = theme === 'system'
          ? (systemDark ? 'dark' : 'light')
          : theme;

        if (resolved === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
}): React.ReactElement {
  const [theme, setThemeState] = React.useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<ThemeName>("dark");

  React.useEffect(() => {
    const initialTheme = readStoredTheme();
    setThemeState(initialTheme);
  }, []);

  React.useEffect(() => {
    const resolveAndApply = (): void => {
      const resolved = theme === "system" ? getSystemTheme() : theme;
      setResolvedTheme(resolved);
      applyHtmlClass(resolved);
    };

    resolveAndApply();

    if (theme !== "system" || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (): void => resolveAndApply();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // ignore storage write failures
    }
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}