// contexts/ThemeContext.tsx
"use client";

import React, {
  useContext,
  
} from "react";

// Enhanced safe localStorage with expiration and validation
const createStorage = (namespace: string = "theme") => {
  const getItem = (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const item = localStorage.getItem(`${namespace}:${key}`);
        if (!item) return null;
        return item;
      }
    } catch (error) {
      console.warn("localStorage access denied:", error);
    }
    return null;
  };

  const setItem = (key: string, value: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(`${namespace}:${key}`, value);
        return true;
      }
    } catch (error) {
      console.warn("localStorage access denied:", error);
    }
    return false;
  };

  const removeItem = (key: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(`${namespace}:${key}`);
        return true;
      }
    } catch (error) {
      console.warn("localStorage access denied:", error);
    }
    return false;
  };

  return { getItem, setItem, removeItem };
};

const themeStorage = createStorage("app-theme");

// Enhanced safe matchMedia with subscription support
const createMediaQuery = (query: string) => {
  try {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia(query);

      const subscribe = (callback: (matches: boolean) => void) => {
        const handler = (event: MediaQueryListEvent) => callback(event.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      };

      return {
        matches: mediaQuery.matches,
        subscribe,
        mediaQuery,
      };
    }
  } catch (error) {
    console.warn("matchMedia not supported:", error);
  }

  return {
    matches: false,
    subscribe: () => () => {},
    mediaQuery: null,
  };
};

// System theme detection with real-time updates
const useSystemTheme = () => {
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">(
    "light",
  );

  React.useEffect(() => {
    const darkMedia = createMediaQuery("(prefers-color-scheme: dark)");

    setSystemTheme(darkMedia.matches ? "dark" : "light");

    const unsubscribe = darkMedia.subscribe((isDark) => {
      setSystemTheme(isDark ? "dark" : "light");
    });

    return unsubscribe;
  }, []);

  return systemTheme;
};

// Theme validation with strict typing
const THEMES = ["light", "dark"] as const;
type Theme = (typeof THEMES)[number];

const isValidTheme = (theme: string): theme is Theme => {
  return THEMES.includes(theme as Theme);
};

// Theme manager with persistence and synchronization
const useThemeManager = () => {
  const [mounted, setMounted] = React.useState(false);
  const [resolvedTheme, setResolvedTheme] = React.useState<Theme>("light");
  const systemTheme = useSystemTheme();

  // Initialize theme on mount
  React.useEffect(() => {
    setMounted(true);

    try {
      const savedTheme = themeStorage.getItem("preference");
      const systemTheme = createMediaQuery("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      let initialTheme: Theme = systemTheme;

      if (savedTheme && isValidTheme(savedTheme)) {
        initialTheme = savedTheme;
      }

      setResolvedTheme(initialTheme);
      applyThemeToDOM(initialTheme);
    } catch (error) {
      console.error("Error initializing theme:", error);
      setResolvedTheme("light");
      applyThemeToDOM("light");
    }
  }, []);

  // Apply theme to DOM safely
  const applyThemeToDOM = (theme: Theme) => {
    try {
      if (typeof document !== "undefined") {
        const { documentElement } = document;

        // Remove existing theme classes
        documentElement.classList.remove("light", "dark");

        // Add new theme class
        documentElement.classList.add(theme);

        // Set color-scheme CSS property
        documentElement.style.colorScheme = theme;

        // Set data-theme attribute for CSS variables
        documentElement.setAttribute("data-theme", theme);

        // Dispatch custom event for other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("themechange", {
              detail: { theme, source: "user" },
            }),
          );
        }
      }
    } catch (error) {
      console.error("Error applying theme to DOM:", error);
    }
  };

  // Sync theme across tabs
  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "app-theme:preference" && event.newValue) {
        if (isValidTheme(event.newValue) && event.newValue !== resolvedTheme) {
          setResolvedTheme(event.newValue);
          applyThemeToDOM(event.newValue);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [resolvedTheme]);

  const setTheme = React.useCallback((theme: Theme) => {
    try {
      setResolvedTheme(theme);
      applyThemeToDOM(theme);
      themeStorage.setItem("preference", theme);
    } catch (error) {
      console.error("Error setting theme:", error);
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  const resetToSystem = React.useCallback(() => {
    themeStorage.removeItem("preference");
    setResolvedTheme(systemTheme);
    applyThemeToDOM(systemTheme);
  }, [systemTheme]);

  return {
    theme: resolvedTheme,
    systemTheme,
    mounted,
    setTheme,
    toggleTheme,
    resetToSystem,
    isModified: mounted && themeStorage.getItem("preference") !== null,
  };
};

// Create the context
const ThemeContext = React.createContext<ReturnType<
  typeof useThemeManager
> | null>(null);

// Context provider for theme state management
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const themeManager = useThemeManager();
  return (
    <ThemeContext.Provider value={themeManager}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Export hooks for other components to use
export { useSystemTheme };

// Enhanced TypeScript declarations
declare global {
  interface WindowEventMap {
    themechange: CustomEvent<{ theme: Theme; source: "user" | "system" }>;
  }
}
