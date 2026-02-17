"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Use the built-in props type from the component itself
type NextThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: NextThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}